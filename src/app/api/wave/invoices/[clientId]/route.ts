// GET /api/wave/invoices/[clientId]
// Returns invoice history for a client from our local InvoiceRecord mirror

import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/auth/api-permissions'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(req, 'manage_payments')
  if (permissionError) return permissionError

  const { clientId: clientIdStr } = await params
  const clientId = parseInt(clientIdStr)
  if (isNaN(clientId)) {
    return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 })
  }

  const [invoices, client] = await Promise.all([
    prisma.invoiceRecord.findMany({
      where: { clientId },
      orderBy: { issuedDate: 'desc' },
    }),
    prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: {
        id: true, businessName: true, retainerAmount: true,
        paymentStatus: true, lastInvoiceDate: true, lastPaymentDate: true,
        invoiceDay: true, paymentTermsDays: true, waveCustomerId: true,
      },
    }),
  ])

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.paidAmount ?? i.amount), 0)
  const outstanding = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((sum, i) => sum + Number(i.amount), 0)

  return NextResponse.json({
    client,
    invoices,
    summary: { totalInvoiced, totalPaid, outstanding, count: invoices.length },
  })
}
