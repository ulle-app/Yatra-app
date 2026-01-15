import { useEffect } from 'react'
import { Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFestivalStore } from '@/store/useStore'
import { formatDate } from '@/lib/utils'
import { differenceInCalendarDays } from 'date-fns'

export function Festivals() {
  const { festivals, isLoading, fetchFestivals } = useFestivalStore()

  useEffect(() => {
    fetchFestivals()
  }, [fetchFestivals])

  const getImpactLevel = (multiplier) => {
    if (multiplier >= 1.8) return { label: 'Very High', variant: 'danger' }
    if (multiplier >= 1.5) return { label: 'High', variant: 'warning' }
    if (multiplier >= 1.3) return { label: 'Moderate', variant: 'secondary' }
    return { label: 'Low', variant: 'outline' }
  }

  const getDaysUntil = (date) => {
    const today = new Date()
    const festDate = new Date(date)
    return differenceInCalendarDays(festDate, today)
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Festival Calendar</h1>
        <p className="text-muted-foreground">
          Plan your temple visits around major Indian festivals to avoid crowds or experience festivities
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900">Festival Crowd Impact</h3>
              <p className="text-sm text-orange-800 mt-1">
                During major festivals, temple crowds can increase by 50-100%. Our crowd predictions
                automatically factor in these festivals to give you accurate wait time estimates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Festivals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : festivals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No upcoming festivals found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {festivals.map((festival) => {
            const impact = getImpactLevel(festival.multiplier)
            const daysUntil = getDaysUntil(festival.date)
            const isToday = daysUntil === 0
            const isTomorrow = daysUntil === 1
            const isPast = daysUntil < 0

            return (
              <Card
                key={festival.date}
                className={`transition-all hover:shadow-md ${isToday ? 'ring-2 ring-primary' : ''
                  } ${isPast ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{festival.name}</CardTitle>
                    <Badge variant={impact.variant}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {impact.label}
                    </Badge>
                  </div>
                  <CardDescription>{formatDate(festival.date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {isToday
                          ? 'Today'
                          : isTomorrow
                            ? 'Tomorrow'
                            : isPast
                              ? 'Passed'
                              : `In ${daysUntil} days`}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Crowd: +{Math.round((festival.multiplier - 1) * 100)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Understanding Crowd Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Low</Badge>
              <span className="text-muted-foreground">+10-30% crowds</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Moderate</Badge>
              <span className="text-muted-foreground">+30-50% crowds</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning">High</Badge>
              <span className="text-muted-foreground">+50-80% crowds</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="danger">Very High</Badge>
              <span className="text-muted-foreground">+80-100% crowds</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
