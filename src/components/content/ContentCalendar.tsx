"use client"

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

interface ContentCalendarProps {
  clientId: number
}

interface ScheduledContent {
  id: number
  contentType: string
  title: string | null
  scheduledFor: Date
}

export function ContentCalendar({ clientId }: ContentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([])
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    loadScheduledContent()
  }, [clientId, currentMonth])

  const loadScheduledContent = async () => {
    setLoading(true)
    try {
      // For now, return empty array - in production, fetch from API
      // This would be an API call like:
      // const response = await fetch(`/api/content/schedule?clientId=${clientId}&month=${format(currentMonth, 'yyyy-MM')}`)
      setScheduledContent([])
    } catch (error) {
      console.error('Failed to load scheduled content:', error)
    } finally {
      setLoading(false)
    }
  }

  const getContentForDay = (day: Date) => {
    return scheduledContent.filter(content => 
      isSameDay(new Date(content.scheduledFor), day)
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog':
        return 'bg-blue-100 text-blue-800'
      case 'social':
        return 'bg-purple-100 text-purple-800'
      case 'meta':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Content Calendar
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {daysInMonth.map(day => {
              const dayContent = getContentForDay(day)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[100px] p-2 border rounded-lg
                    ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-background'}
                    ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayContent.map(content => (
                      <Badge
                        key={content.id}
                        variant="outline"
                        className={`text-xs w-full justify-start ${getTypeColor(content.contentType)}`}
                      >
                        {content.title || content.contentType}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {scheduledContent.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No content scheduled for this month</p>
              <p className="text-xs mt-1">Content scheduling feature coming soon!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
