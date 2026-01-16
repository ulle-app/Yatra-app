import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays, isPast } from 'date-fns'
import {
  Trash2, MapPin, Calendar, ChevronDown, ChevronUp, Navigation,
  Clock, Car, Train, Plane, Share2, Route, Eye, Plus, Bookmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSavedPlansStore, useAuthStore } from '@/store/useStore'

// Calculate distance between two points using Haversine formula
const getDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Get travel mode suggestion
const getTravelInfo = (distanceKm) => {
  if (distanceKm < 10) return { icon: Car, mode: 'Auto', time: '15-30 min', cost: '₹50-150' }
  if (distanceKm < 50) return { icon: Car, mode: 'Taxi', time: '1-2 hrs', cost: '₹200-500' }
  if (distanceKm < 200) return { icon: Train, mode: 'Train', time: '2-4 hrs', cost: '₹200-800' }
  return { icon: Plane, mode: 'Flight', time: '1-2 hrs', cost: '₹2000+' }
}

// Calculate total trip distance
const calculateTotalDistance = (temples) => {
  if (!temples || temples.length < 2) return 0
  let total = 0
  for (let i = 1; i < temples.length; i++) {
    total += getDistance(
      temples[i-1].lat, temples[i-1].lng,
      temples[i].lat, temples[i].lng
    )
  }
  return total
}

function TripCard({ plan, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()

  const tripDate = new Date(plan.date)
  const isUpcoming = !isPast(tripDate)
  const daysUntil = differenceInDays(tripDate, new Date())
  const temples = plan.temples || []
  const totalDistance = calculateTotalDistance(temples)
  const mainTemple = temples[0]

  const handleShare = async () => {
    const text = `My Temple Trip - ${plan.name}\n` +
      `Date: ${format(tripDate, 'MMMM d, yyyy')}\n\n` +
      `Itinerary:\n` +
      temples.map((t, i) => `${i+1}. ${t.name} (${t.location})`).join('\n') +
      `\n\nTotal: ${temples.length} temples, ${totalDistance.toFixed(0)} km\n\nPlanned with Tirtha Yatra`

    if (navigator.share) {
      try {
        await navigator.share({ title: plan.name, text })
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Trip details copied to clipboard!')
    }
  }

  return (
    <Card className={`overflow-hidden transition-all ${isUpcoming ? 'border-orange-200' : 'border-gray-200 opacity-80'}`}>
      {/* Hero Image Section */}
      <div className="relative h-40">
        <img
          src={mainTemple?.imageUrl || 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800'}
          alt={mainTemple?.name || plan.name}
          className="w-full h-full object-cover"
          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {isUpcoming ? (
            <Badge className="bg-green-500 text-white">
              {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
            </Badge>
          ) : (
            <Badge variant="secondary">Completed</Badge>
          )}
        </div>

        {/* Trip Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg line-clamp-1">{plan.name}</h3>
          <div className="flex items-center gap-2 text-sm opacity-90 mt-1">
            <Calendar className="w-4 h-4" />
            <span>{format(tripDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 divide-x border-b bg-gray-50">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-orange-600">{temples.length}</p>
          <p className="text-xs text-gray-500">Places</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-orange-600">{totalDistance.toFixed(0)}</p>
          <p className="text-xs text-gray-500">km Total</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-orange-600">
            {totalDistance < 100 ? '1' : totalDistance < 300 ? '1-2' : '2+'}
          </p>
          <p className="text-xs text-gray-500">Day(s)</p>
        </div>
      </div>

      {/* Route Preview */}
      <CardContent className="p-4">
        <div className="space-y-2">
          {temples.slice(0, expanded ? temples.length : 3).map((temple, idx) => {
            const nextTemple = temples[idx + 1]
            const distToNext = nextTemple
              ? getDistance(temple.lat, temple.lng, nextTemple.lat, nextTemple.lng)
              : 0
            const travelInfo = nextTemple ? getTravelInfo(distToNext) : null
            const TravelIcon = travelInfo?.icon || Car

            return (
              <div key={temple._id || idx}>
                {/* Temple Stop */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0 ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {idx + 1}
                    </div>
                    {idx < temples.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start gap-2">
                      <img
                        src={temple.imageUrl}
                        alt={temple.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=100'}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{temple.name}</p>
                        <p className="text-xs text-gray-500 truncate">{temple.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Travel Info Between Stops */}
                {nextTemple && idx < (expanded ? temples.length : 2) && (
                  <div className="flex items-center gap-3 ml-3 -mt-1">
                    <div className="w-7 flex justify-center">
                      <TravelIcon className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="flex-1 text-xs text-gray-400 flex items-center gap-2">
                      <span>{distToNext.toFixed(0)} km</span>
                      <span>•</span>
                      <span>{travelInfo?.mode}</span>
                      <span>•</span>
                      <span className="text-green-600">{travelInfo?.cost}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Expand/Collapse */}
        {temples.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-orange-600"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
            ) : (
              <>Show All {temples.length} Places <ChevronDown className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(plan._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SavedPlans() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { savedPlans, isLoading, fetchSavedPlans, deleteSavedPlan } = useSavedPlansStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchSavedPlans()
  }, [isAuthenticated, navigate, fetchSavedPlans])

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      const result = await deleteSavedPlan(planId)
      if (!result.success) {
        alert(`Error: ${result.error}`)
      }
    }
  }

  const sortedPlans = [...savedPlans].sort((a, b) => new Date(b.date) - new Date(a.date))
  const upcomingPlans = sortedPlans.filter((plan) => !isPast(new Date(plan.date)))
  const pastPlans = sortedPlans.filter((plan) => isPast(new Date(plan.date)))

  if (!isAuthenticated) return null

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-orange-500" />
            My Trips
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {savedPlans.length} saved {savedPlans.length === 1 ? 'itinerary' : 'itineraries'}
          </p>
        </div>
        <Button onClick={() => navigate('/plan-visit')} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-1" /> Plan New Trip
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : savedPlans.length === 0 ? (
        <Card className="border-2 border-dashed border-orange-200 bg-orange-50/50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Route className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Trips Saved Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Plan your temple pilgrimage and save the itinerary here for easy access.
              Get optimized routes, travel estimates, and more!
            </p>
            <Button onClick={() => navigate('/plan-visit')} size="lg" className="bg-orange-500 hover:bg-orange-600">
              <MapPin className="w-4 h-4 mr-2" /> Plan Your First Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Trips */}
          {upcomingPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Upcoming Trips ({upcomingPlans.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingPlans.map((plan) => (
                  <TripCard key={plan._id} plan={plan} onDelete={handleDeletePlan} />
                ))}
              </div>
            </div>
          )}

          {/* Past Trips */}
          {pastPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                Past Trips ({pastPlans.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pastPlans.map((plan) => (
                  <TripCard key={plan._id} plan={plan} onDelete={handleDeletePlan} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
