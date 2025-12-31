import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Star, Plus, Minus, TrendingUp, TrendingDown, Minus as TrendMid, LogIn, Info, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, getCrowdColor, getCrowdLabel } from '@/lib/utils'
import { usePlanStore, useAuthStore } from '@/store/useStore'

export function TempleCard({ temple }) {
  const navigate = useNavigate()
  const { plan, addTemple, removeTemple } = usePlanStore()
  const { isAuthenticated } = useAuthStore()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const isInPlan = plan.some((t) => t._id === temple._id)
  const crowd = temple.crowd || {}
  const crowdColor = getCrowdColor(crowd.crowdLevel)

  const handleToggle = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    if (isInPlan) {
      removeTemple(temple._id)
    } else {
      addTemple(temple)
    }
  }

  const TrendIcon = crowd.trend === 'above_average' ? TrendingUp :
    crowd.trend === 'below_average' ? TrendingDown : TrendMid

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fadeIn">
      <div className="relative">
        <img
          src={temple.imageUrl}
          alt={temple.name}
          className="w-full h-40 sm:h-48 object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop'
          }}
        />
        {temple.imageCredit && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px] p-2 pt-4">
            {temple.imageCredit}
          </div>
        )}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
            <span className={cn("w-2 h-2 rounded-full", crowdColor.bg, crowdColor.pulse)}></span>
            <span className="text-[10px] sm:text-xs font-medium text-slate-700">
              {getCrowdLabel(crowd.crowdLevel)}
            </span>
          </div>
        </div>
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-2">
          <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-xs">
            <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
            {temple.rating}
          </Badge>
          {crowd.festival && (
            <Badge variant="warning" className="bg-yellow-100/90 backdrop-blur-sm text-yellow-800 border-yellow-300 text-[10px] sm:text-xs hidden sm:inline-flex">
              {crowd.festival}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-1">{temple.name}</h3>
          <Badge variant="outline" className="text-[10px] sm:text-xs ml-2 shrink-0">
            {crowd.trend === 'above_average' ? (
              <TrendingUp className="w-3 h-3 mr-0.5 sm:mr-1 text-red-500" />
            ) : crowd.trend === 'below_average' ? (
              <TrendingDown className="w-3 h-3 mr-0.5 sm:mr-1 text-green-500" />
            ) : (
              <TrendMid className="w-3 h-3 mr-0.5 sm:mr-1 text-yellow-500" />
            )}
            <span className="hidden sm:inline">Trend</span>
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{temple.location}</span>
        </p>

        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
          {temple.description}
        </p>

        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Current Crowd</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Progress
                value={crowd.crowdPercentage}
                className="w-16 sm:w-20 h-2"
                indicatorClassName={crowdColor.bg}
              />
              <Badge className={cn("text-[10px] sm:text-xs", crowdColor.badge)}>
                {crowd.crowdPercentage}%
              </Badge>
            </div>
          </div>

          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Wait
            </span>
            <span className="font-medium">{crowd.waitTime}</span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Best Time</span>
            <span className="font-medium text-green-600">{crowd.bestTimeToday}</span>
          </div>

          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Timings</span>
            <span className="font-medium text-[10px] sm:text-xs truncate max-w-[50%]">{temple.timings}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowDetails(true)}
            variant="outline"
            className="flex-1"
          >
            <Info className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Button
            onClick={handleToggle}
            variant={isInPlan ? "destructive" : "default"}
            className="flex-1"
          >
            {isInPlan ? (
              <>
                <Minus className="w-4 h-4 mr-2" />
                Remove
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Plan
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary" />
              Login Required
            </DialogTitle>
            <DialogDescription>
              Please login or create an account to add temples to your trip plan and save your itinerary.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={() => {
                setShowLoginPrompt(false)
                navigate('/login')
              }}
              className="flex-1"
            >
              Login
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowLoginPrompt(false)
                navigate('/register')
              }}
              className="flex-1"
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Temple Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{temple.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {temple.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Temple Image with Credit */}
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={temple.imageUrl}
                alt={temple.name}
                className="w-full h-48 sm:h-64 object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop'
                }}
              />
              {temple.imageCredit && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                  Photo: {temple.imageCredit}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground text-xs">Deity</p>
                <p className="font-medium">{temple.deity}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground text-xs">Significance</p>
                <p className="font-medium text-xs">{temple.significance}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground text-xs">Darshan Time</p>
                <p className="font-medium">{temple.darshanTime}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground text-xs">Best Time</p>
                <p className="font-medium">{temple.bestTimeToVisit}</p>
              </div>
            </div>

            {/* Temple Timings */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                Temple Timings
              </h4>
              <p className="text-sm mb-2">{temple.timings}</p>
              {temple.timingDetails && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {temple.timingDetails.map((detail, idx) => (
                    <p key={idx}>{detail}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Do's and Don'ts */}
            {(temple.dos?.length > 0 || temple.donts?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {temple.dos?.length > 0 && (
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4" />
                      Do's
                    </h4>
                    <ul className="text-sm text-green-900 space-y-2">
                      {temple.dos.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {temple.donts?.length > 0 && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4" />
                      Don'ts
                    </h4>
                    <ul className="text-sm text-red-900 space-y-2">
                      {temple.donts.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Uniqueness Section */}
            {temple.uniqueness && (
              <div className="border border-purple-100 bg-purple-50/50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-purple-600" />
                  Temple Uniqueness
                </h4>
                <div className="space-y-3 text-sm">
                  {temple.uniqueness.spiritual && (
                    <div className="grid gap-1">
                      <span className="font-medium text-purple-700 block">Spiritual Significance</span>
                      <p className="text-slate-700">{temple.uniqueness.spiritual}</p>
                    </div>
                  )}
                  {temple.uniqueness.scientific && (
                    <div className="grid gap-1">
                      <span className="font-medium text-blue-700 block">Scientific Wonder</span>
                      <p className="text-slate-700">{temple.uniqueness.scientific}</p>
                    </div>
                  )}
                  {temple.uniqueness.history && (
                    <div className="grid gap-1">
                      <span className="font-medium text-amber-700 block">Historical Context</span>
                      <p className="text-slate-700">{temple.uniqueness.history}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-sm text-muted-foreground">{temple.description}</p>
            </div>

            {/* Add to Plan Button */}
            <Button
              onClick={() => {
                handleToggle()
                if (isAuthenticated) setShowDetails(false)
              }}
              variant={isInPlan ? "destructive" : "default"}
              className="w-full"
            >
              {isInPlan ? (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Remove from Plan
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Plan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
