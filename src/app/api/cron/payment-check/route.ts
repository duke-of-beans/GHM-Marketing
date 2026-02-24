// GET /api/cron/payment-check
// Vercel cron: runs daily at 14:00 UTC (9 AM ET)
// Scans overdue invoices and escalates client payment status per contract terms

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { log } from '@/lib/logger'
import { differenceInDays } from 'date-fns'
import { sendPushToUser } from '@/lib/push'
import { PAYMENT_STATUS } from '@/lib/wave/constants'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const overdueInvoices = await prisma.invoiceRecord.findMany({
    where: {
      status: { in: ['sent', 'viewed', 'overdue'] },
      dueDate: { lt: now },
    },
    include: {
      client: { select: { id: true, businessName: true, paymentStatus: true } },
    },
  })

  const results = { checked: overdueInvoices.length, escalated: 0, unchanged: 0 }
  const escalations: string[] = []

  for (const invoice of overdueInvoices) {
    const daysPastDue = differenceInDays(now, invoice.dueDate)
    const client = invoice.client

    let newPaymentStatus: string
    let shouldCreateTask = false
    let taskTitle = ''
    let taskPriority = 'P2'

    if (daysPastDue >= 30) {
      newPaymentStatus = PAYMENT_STATUS.COLLECTIONS
      shouldCreateTask = client.paymentStatus !== PAYMENT_STATUS.COLLECTIONS
      taskTitle = `COLLECTIONS: ${client.businessName} — ${daysPastDue}d overdue. Review for termination.`
      taskPriority = 'P1'
    } else if (daysPastDue >= 15) {
      newPaymentStatus = PAYMENT_STATUS.PAUSED
      shouldCreateTask = client.paymentStatus !== PAYMENT_STATUS.PAUSED
      taskTitle = `Service PAUSED: ${client.businessName} — ${daysPastDue}d overdue. Suspend content delivery.`
      taskPriority = 'P1'
    } else if (daysPastDue >= 8) {
      newPaymentStatus = PAYMENT_STATUS.OVERDUE
      shouldCreateTask = client.paymentStatus !== PAYMENT_STATUS.OVERDUE
      taskTitle = `Overdue: ${client.businessName} — ${daysPastDue}d past due. Client outreach required.`
      taskPriority = 'P2'
    } else {
      newPaymentStatus = PAYMENT_STATUS.GRACE
      shouldCreateTask = false
    }

    // Mark invoice overdue
    if (invoice.status !== 'overdue') {
      await prisma.invoiceRecord.update({ where: { id: invoice.id }, data: { status: 'overdue' } })
    }

    if (newPaymentStatus !== client.paymentStatus) {
      await prisma.clientProfile.update({
        where: { id: client.id },
        data: { paymentStatus: newPaymentStatus },
      })

      // Alert engine hook — evaluate payment rules on status change
      try {
        const { evaluatePaymentAlert } = await import('@/lib/ops/alert-engine')
        await evaluatePaymentAlert(client.id, invoice.id, newPaymentStatus, client.paymentStatus)
      } catch (err) {
        log.error({ cron: 'payment-check', clientId: client.id, error: err }, 'Alert engine failed')
      }

      if (shouldCreateTask && taskTitle) {
        await prisma.clientTask.create({
          data: {
            clientId: client.id,
            title: taskTitle,
            category: 'payment',
            priority: taskPriority,
            status: 'queued',
            source: 'system',
          },
        }).catch(err => log.error({ cron: 'payment-check', clientId: client.id, error: err }, 'Task creation failed'))
      }

      const escalatedStatuses = [PAYMENT_STATUS.PAUSED, PAYMENT_STATUS.COLLECTIONS] as string[]
      if (escalatedStatuses.includes(newPaymentStatus)) {
        const admins = await prisma.user.findMany({
          where: { role: { in: ['admin', 'manager'] }, isActive: true },
          select: { id: true },
        })
        for (const admin of admins) {
          await sendPushToUser(admin.id, {
            title: newPaymentStatus === PAYMENT_STATUS.COLLECTIONS ? '🚨 Collections escalation' : '🔴 Service paused',
            body: `${client.businessName} — ${daysPastDue}d past due`,
          }).catch(() => {})
        }
      }

      escalations.push(`${client.businessName}: ${client.paymentStatus} → ${newPaymentStatus} (${daysPastDue}d)`)
      results.escalated++
    } else {
      results.unchanged++
    }
  }

  log.info({ cron: 'payment-check', ...results, escalations }, 'Payment check complete')
  return NextResponse.json({ ok: true, results, escalations })
}
