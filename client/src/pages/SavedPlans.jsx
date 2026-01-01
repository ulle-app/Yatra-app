import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Edit2, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSavedPlansStore, usePlanStore, useAuthStore } from '@/store/useStore'
import { formatDate } from '@/lib/utils'

export function SavedPlans() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { savedPlans, isLoading, fetchSavedPlans, deleteSavedPlan, loadPlanToEditor } = useSavedPlansStore()
  const [sortBy, setSortBy] = useState('date') // 'date' or 'name'

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchSavedPlans()
  }, [isAuthenticated, navigate, fetchSavedPlans])

  const handleLoadPlan = (plan) => {
    loadPlanToEditor(plan)
    navigate('/plan')
  }

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      const result = await deleteSavedPlan(planId)
      if (!result.success) {
        alert(`Error: ${result.error}`)
      }
    }
  }

  const sortedPlans = [...savedPlans].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date)
    }
    return a.name.localeCompare(b.name)
  })

  const upcomingPlans = sortedPlans.filter((plan) => new Date(plan.date) >= new Date())
  const pastPlans = sortedPlans.filter((plan) => new Date(plan.date) < new Date())

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container py-4 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Saved Plans</h1>
        <p className="text-muted-foreground">
          View and manage all your saved temple visit itineraries
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('date')}
          >
            Sort by Date
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Sort by Name
          </Button>
        </div>
        <Button onClick={() => navigate('/plan')}>
          Create New Plan
        </Button>
      </div>

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
      ) : savedPlans.length === 0 ? (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-orange-400 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Saved Plans Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start planning your temple visits! Create your first itinerary to save it for later.
            </p>
            <Button onClick={() => navigate('/plan')} size="lg">
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Plans */}
          {upcomingPlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingPlans.map((plan) => (
                  <Card key={plan._id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{plan.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(plan.date)}</span>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 shrink-0">Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {/* Temples Preview */}
                      <div className="mb-4 flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {plan.temples?.length || 0} {plan.temples?.length === 1 ? 'temple' : 'temples'}
                        </p>
                        {plan.temples && plan.temples.length > 0 && (
                          <div className="space-y-1">
                            {plan.temples.slice(0, 3).map((temple, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{temple.name}</span>
                              </div>
                            ))}
                            {plan.temples.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{plan.temples.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleLoadPlan(plan)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePlan(plan._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Plans */}
          {pastPlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Trips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                {pastPlans.map((plan) => (
                  <Card key={plan._id} className="hover:shadow-lg transition-shadow flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{plan.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(plan.date)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          Past
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {/* Temples Preview */}
                      <div className="mb-4 flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {plan.temples?.length || 0} {plan.temples?.length === 1 ? 'temple' : 'temples'}
                        </p>
                        {plan.temples && plan.temples.length > 0 && (
                          <div className="space-y-1">
                            {plan.temples.slice(0, 3).map((temple, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{temple.name}</span>
                              </div>
                            ))}
                            {plan.temples.length > 3 && (
                              <div className="text-sm text-muted-foreground">
                                +{plan.temples.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleLoadPlan(plan)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Reuse
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeletePlan(plan._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
