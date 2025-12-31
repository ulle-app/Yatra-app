import { useNavigate } from 'react-router-dom'
import {
  ChevronUp,
  ChevronDown,
  X,
  Zap,
  RefreshCw,
  Trash2,
  Save,
  MapPin,
  Clock,
  ClipboardList,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePlanStore, useTempleStore, useAuthStore } from '@/store/useStore'
import { cn, getCrowdColor, getCrowdLabel } from '@/lib/utils'

export function Plan() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { refreshCrowdData, isLoading } = useTempleStore()
  const {
    plan,
    tripName,
    tripDate,
    setTripName,
    setTripDate,
    removeTemple,
    moveTemple,
    clearPlan,
    optimizeByCrowd,
    getCrowdSummary,
    savePlan,
  } = usePlanStore()

  const summary = getCrowdSummary()

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const result = await savePlan()
    if (result.success) {
      alert('Plan saved successfully!')
    } else {
      alert(result.error)
    }
  }

  const getRecommendation = () => {
    if (plan.length === 0) {
      return 'Add temples to see recommendations'
    }
    if (summary.high > 0) {
      return `${summary.high} temple(s) have high crowd. Consider visiting early morning or choosing alternatives.`
    }
    if (summary.medium > 0) {
      return `Moderate crowd expected at ${summary.medium} temple(s). Plan extra time for these visits.`
    }
    return 'Perfect timing! All temples have low crowd levels.'
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle>Your Temple Trip Plan</CardTitle>
              <CardDescription>
                Organize your temple visits with real-time crowd predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trip-name">Trip Name</Label>
                  <Input
                    id="trip-name"
                    placeholder="My Temple Trip"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trip-date">Travel Date</Label>
                  <Input
                    id="trip-date"
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Itinerary</CardTitle>
                <CardDescription>Reorder your temple visits</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="live-dot"></span>
                <Badge variant="secondary">{plan.length} temples</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No temples in your plan</p>
                  <p className="text-sm mb-4">Browse temples and add them to your itinerary</p>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Browse Temples
                  </Button>
                </div>
              ) : (
                plan.map((temple, index) => {
                  const crowdColor = getCrowdColor(temple.crowd?.crowdLevel)
                  return (
                    <div
                      key={temple._id}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors animate-fadeIn"
                    >
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-background rounded-full text-sm font-semibold border">
                        {index + 1}
                      </span>
                      <img
                        src={temple.imageUrl}
                        alt={temple.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=100&h=100&fit=crop'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{temple.name}</h4>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {temple.location}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-xs", crowdColor.badge)}>
                            {getCrowdLabel(temple.crowd?.crowdLevel)} ({temple.crowd?.crowdPercentage}%)
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {temple.crowd?.waitTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveTemple(index, index - 1)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moveTemple(index, index + 1)}
                          disabled={index === plan.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeTemple(temple._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Crowd Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Live Crowd Summary</CardTitle>
                  <CardDescription>Based on your plan</CardDescription>
                </div>
                <span className="live-dot"></span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Low Crowd</span>
                <Badge variant="success">{summary.low}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Moderate</span>
                <Badge variant="warning">{summary.medium}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">High Crowd</span>
                <Badge variant="danger">{summary.high}</Badge>
              </div>
              <Separator />
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Smart Recommendation</p>
                <p className="text-sm text-muted-foreground">{getRecommendation()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={optimizeByCrowd} disabled={plan.length === 0}>
                <Zap className="w-4 h-4 mr-2" />
                Optimize by Crowd
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={refreshCrowdData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Live Data
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSave}
                disabled={plan.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                {isAuthenticated ? 'Save Plan' : 'Login to Save'}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (confirm('Are you sure you want to clear your plan?')) {
                    clearPlan()
                  }
                }}
                disabled={plan.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
