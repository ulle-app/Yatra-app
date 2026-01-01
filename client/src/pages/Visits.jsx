import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, MapPin, Calendar, Star, MessageSquare, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVisitsStore, useAuthStore } from '@/store/useStore'
import { formatDate } from '@/lib/utils'

export function Visits() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { visits, isLoading, fetchVisits, deleteVisit, getStats } = useVisitsStore()
  const [sortBy, setSortBy] = useState('date') // 'date' or 'rating'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchVisits()
  }, [isAuthenticated, navigate, fetchVisits])

  if (!isAuthenticated) {
    return null
  }

  const stats = getStats()
  const sortedVisits = [...visits].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.visitDate) - new Date(a.visitDate)
    }
    return (b.rating || 0) - (a.rating || 0)
  })

  const handleDeleteVisit = async (visitId) => {
    if (window.confirm('Are you sure you want to delete this visit?')) {
      await deleteVisit(visitId)
    }
  }

  return (
    <div className="container py-4 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Temple Visits</h1>
        <p className="text-muted-foreground">
          Track your spiritual journey and temple visits across India
        </p>
      </div>

      {isLoading && visits.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Temples Visited</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalVisits}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">States Covered</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">{stats.statesCovered}</p>
                  </div>
                  <MapPin className="w-12 h-12 text-green-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Avg Rating</p>
                    <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.avgRating}</p>
                  </div>
                  <Star className="w-12 h-12 text-yellow-300 fill-yellow-300" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sorting Controls */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              Sort by Date
            </Button>
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              Sort by Rating
            </Button>
          </div>

          {/* Visits List */}
          {visits.length === 0 ? (
            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-orange-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Visits Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start marking your temple visits! Click "Mark as Visited" on any temple to log your pilgrimage.
                </p>
                <Button onClick={() => navigate('/')} size="lg">
                  Browse Temples
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedVisits.map((visit) => (
                <Card key={visit._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Temple Name and Location */}
                        <div className="flex items-start gap-3 mb-3">
                          <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold">{visit.temple?.name || 'Unknown Temple'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {visit.temple?.location}, {visit.temple?.state}
                            </p>
                          </div>
                        </div>

                        {/* Visit Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(visit.visitDate)}</span>
                          </div>

                          {visit.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < visit.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          {visit.crowdLevel && (
                            <Badge variant="outline" className="w-fit">
                              {visit.crowdLevel === 'low'
                                ? '🟢 Low Crowd'
                                : visit.crowdLevel === 'medium'
                                ? '🟡 Medium Crowd'
                                : '🔴 High Crowd'}
                            </Badge>
                          )}
                        </div>

                        {/* Notes */}
                        {visit.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="flex gap-2 text-sm">
                              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <p className="text-muted-foreground">{visit.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDeleteVisit(visit._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Achievement Section */}
      {visits.length > 0 && (
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {stats.totalVisits >= 1 && (
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border">
                  <span className="text-2xl mb-2">🏛️</span>
                  <span className="font-semibold text-sm">First Visit</span>
                  <span className="text-xs text-muted-foreground">Visited 1 temple</span>
                </div>
              )}
              {stats.totalVisits >= 5 && (
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border">
                  <span className="text-2xl mb-2">🗺️</span>
                  <span className="font-semibold text-sm">Explorer</span>
                  <span className="text-xs text-muted-foreground">Visited 5 temples</span>
                </div>
              )}
              {stats.totalVisits >= 10 && (
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border">
                  <span className="text-2xl mb-2">🙏</span>
                  <span className="font-semibold text-sm">Pilgrim</span>
                  <span className="text-xs text-muted-foreground">Visited 10 temples</span>
                </div>
              )}
              {stats.totalVisits >= 20 && (
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border">
                  <span className="text-2xl mb-2">✨</span>
                  <span className="font-semibold text-sm">Devotee</span>
                  <span className="text-xs text-muted-foreground">Visited 20 temples</span>
                </div>
              )}
              {stats.statesCovered >= 5 && (
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border">
                  <span className="text-2xl mb-2">🌏</span>
                  <span className="font-semibold text-sm">Traveler</span>
                  <span className="text-xs text-muted-foreground">Visited 5 states</span>
                </div>
              )}
              {stats.avgRating >= 4.5 && stats.totalVisits >= 5 && (
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border">
                  <span className="text-2xl mb-2">⭐</span>
                  <span className="font-semibold text-sm">Enthusiast</span>
                  <span className="text-xs text-muted-foreground">Avg rating 4.5+</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
