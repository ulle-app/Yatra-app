import React, { useEffect, useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTempleStore, useAuthStore } from '../store/useStore'
import { getCrowdColor } from '../lib/utils'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  MapPin, Clock, Thermometer, Users, Calendar, ChevronRight, CheckCircle2,
  AlertCircle, Shirt, Camera, Volume2, Share2, Sparkles, Plus, Check,
  Route, Navigation, Car, Train, Plane, LogIn, Lock, ChevronDown, ChevronUp
} from 'lucide-react'
import axios from 'axios'

const API_URL = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://yatra-app-1-kx78.onrender.com/api'

// Calculate distance between two points using Haversine formula
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Estimate travel time based on distance
const getTravelTime = (distanceKm) => {
  if (distanceKm < 5) return '10-15 mins'
  if (distanceKm < 20) return '30-45 mins'
  if (distanceKm < 50) return '1-1.5 hrs'
  if (distanceKm < 100) return '2-3 hrs'
  if (distanceKm < 300) return '4-6 hrs'
  return '6+ hrs (consider flight)'
}

// Get travel mode suggestion
const getTravelMode = (distanceKm) => {
  if (distanceKm < 10) return { icon: Car, mode: 'Auto/Taxi', cost: '₹50-150' }
  if (distanceKm < 50) return { icon: Car, mode: 'Taxi/Bus', cost: '₹150-500' }
  if (distanceKm < 200) return { icon: Train, mode: 'Train/Bus', cost: '₹200-800' }
  return { icon: Plane, mode: 'Train/Flight', cost: '₹500-3000' }
}

function LoginPrompt() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl pb-20">
      <Card className="border-2 border-orange-100">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please login to plan your temple visit and get personalized recommendations.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Browse Temples
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/login')}>
              <LogIn className="w-4 h-4 mr-2" /> Login
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Don't have an account? <a href="/register" className="text-orange-600 hover:underline">Sign up</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function NearbyPlaceCard({ place, distance, isSelected, onToggle }) {
  const travel = getTravelMode(distance)
  const TravelIcon = travel.icon

  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 hover:border-orange-300'
      }`}
    >
      <div className="flex gap-3">
        <img
          src={place.imageUrl}
          alt={place.name}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=200'}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm truncate">{place.name}</h4>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              isSelected ? 'bg-orange-500 text-white' : 'bg-gray-200'
            }`}>
              {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{place.location}</p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{place.description?.slice(0, 80)}...</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-blue-600">
              <Navigation className="w-3 h-3" /> {distance.toFixed(0)} km
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <TravelIcon className="w-3 h-3" /> {travel.mode}
            </span>
            <span className="text-green-600">{travel.cost}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function OptimizedItinerary({ mainTemple, selectedPlaces, date, onBack }) {
  // Simple greedy optimization - start from main temple, always go to nearest unvisited
  const optimizedRoute = useMemo(() => {
    if (selectedPlaces.length === 0) return [mainTemple]

    const route = [mainTemple]
    const remaining = [...selectedPlaces]

    while (remaining.length > 0) {
      const current = route[route.length - 1]
      let nearestIdx = 0
      let nearestDist = Infinity

      remaining.forEach((place, idx) => {
        const dist = getDistance(current.lat, current.lng, place.lat, place.lng)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIdx = idx
        }
      })

      route.push(remaining[nearestIdx])
      remaining.splice(nearestIdx, 1)
    }

    return route
  }, [mainTemple, selectedPlaces])

  const totalDistance = useMemo(() => {
    let total = 0
    for (let i = 1; i < optimizedRoute.length; i++) {
      total += getDistance(
        optimizedRoute[i-1].lat, optimizedRoute[i-1].lng,
        optimizedRoute[i].lat, optimizedRoute[i].lng
      )
    }
    return total
  }, [optimizedRoute])

  const handleShare = () => {
    const text = `My Temple Trip Plan for ${format(date, 'MMMM d, yyyy')}:\n\n` +
      optimizedRoute.map((p, i) => `${i+1}. ${p.name} (${p.location})`).join('\n') +
      `\n\nTotal distance: ${totalDistance.toFixed(0)} km`

    if (navigator.share) {
      navigator.share({ title: 'My Temple Trip', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Itinerary copied to clipboard!')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-5 h-5" />
            <span className="text-sm opacity-90">Optimized Itinerary</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{format(date, 'EEEE, MMMM d, yyyy')}</h2>
          <div className="flex gap-4 mt-3 text-sm">
            <span>{optimizedRoute.length} places</span>
            <span>•</span>
            <span>{totalDistance.toFixed(0)} km total</span>
          </div>
        </CardContent>
      </Card>

      {/* Route */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-0">
            {optimizedRoute.map((place, idx) => {
              const isLast = idx === optimizedRoute.length - 1
              const nextPlace = optimizedRoute[idx + 1]
              const distToNext = nextPlace
                ? getDistance(place.lat, place.lng, nextPlace.lat, nextPlace.lng)
                : 0
              const travel = nextPlace ? getTravelMode(distToNext) : null
              const TravelIcon = travel?.icon || Car

              return (
                <div key={place._id || idx}>
                  {/* Place */}
                  <div className="flex gap-3 py-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {idx + 1}
                      </div>
                      {!isLast && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-start gap-3">
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=200'}
                        />
                        <div>
                          <h4 className="font-semibold">{place.name}</h4>
                          <p className="text-sm text-gray-500">{place.location}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{place.timings || '6:00 AM - 9:00 PM'}</span>
                          </div>
                          {place.crowd && (
                            <Badge className={`mt-1 text-xs ${
                              place.crowd.crowdLevel === 'low' ? 'bg-green-100 text-green-700' :
                              place.crowd.crowdLevel === 'high' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {place.crowd.crowdLevel} crowd • {place.crowd.waitTime}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Travel info between places */}
                  {!isLast && (
                    <div className="flex gap-3 py-2 ml-4">
                      <div className="w-8 flex justify-center">
                        <TravelIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        <span className="font-medium">{distToNext.toFixed(0)} km</span>
                        <span className="mx-2">•</span>
                        <span>{getTravelTime(distToNext)}</span>
                        <span className="mx-2">•</span>
                        <span className="text-green-600">{travel?.cost}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Travel Tips
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Shirt className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Carry comfortable clothes and footwear for temple visits</span>
            </li>
            <li className="flex items-start gap-2">
              <Camera className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Photography may be restricted inside sanctums</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Start early to avoid crowds and heat</span>
            </li>
            <li className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Maintain silence and respect local customs</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Modify Plan
        </Button>
        <Button onClick={handleShare} className="flex-1 bg-orange-500 hover:bg-orange-600">
          <Share2 className="w-4 h-4 mr-2" /> Share Itinerary
        </Button>
      </div>
    </div>
  )
}

function PlanVisit() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { temples, fetchTemples, isLoading: templesLoading } = useTempleStore()

  const [selectedTempleId, setSelectedTempleId] = useState('')
  const [selectedDate, setSelectedDate] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedNearby, setSelectedNearby] = useState([])
  const [showItinerary, setShowItinerary] = useState(false)
  const [showAllNearby, setShowAllNearby] = useState(false)

  useEffect(() => {
    if (temples.length === 0) {
      fetchTemples()
    }
  }, [temples.length, fetchTemples])

  // Require login
  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  const selectedTemple = temples.find(t => t._id === selectedTempleId)

  // Calculate nearby places - show closest temples (prioritize within 500km, but always show at least 6)
  const nearbyPlaces = useMemo(() => {
    if (!result?.temple) return []

    const withDistance = temples
      .filter(t => t._id !== result.temple._id)
      .map(t => ({
        ...t,
        distance: getDistance(result.temple.lat, result.temple.lng, t.lat, t.lng)
      }))
      .sort((a, b) => a.distance - b.distance)

    // Show temples within 500km, or at least 6 closest temples
    const nearby = withDistance.filter(t => t.distance <= 500)
    if (nearby.length >= 6) return nearby
    return withDistance.slice(0, Math.max(6, nearby.length))
  }, [result, temples])

  const displayedNearby = showAllNearby ? nearbyPlaces : nearbyPlaces.slice(0, 4)

  const dateOptions = [
    { value: 'today', label: `Today (${format(new Date(), 'MMM d')})` },
    { value: 'tomorrow', label: `Tomorrow (${format(addDays(new Date(), 1), 'MMM d')})` },
    { value: 'custom', label: 'Pick a date...' }
  ]

  const getTargetDate = () => {
    if (selectedDate === 'today') return new Date()
    if (selectedDate === 'tomorrow') return addDays(new Date(), 1)
    if (selectedDate === 'custom' && customDate) return new Date(customDate)
    return new Date()
  }

  const handleGetPlan = async () => {
    if (!selectedTempleId) return

    setIsLoading(true)
    try {
      const targetDate = getTargetDate()
      const response = await axios.get(`${API_URL}/temples/${selectedTempleId}/forecast`, {
        params: { date: format(targetDate, 'yyyy-MM-dd') }
      })

      setResult({
        temple: selectedTemple,
        date: targetDate,
        forecast: response.data
      })
      setStep(3)
      setSelectedNearby([])
    } catch (error) {
      // Fallback to temple's current crowd data
      if (selectedTemple?.crowd) {
        setResult({
          temple: selectedTemple,
          date: getTargetDate(),
          forecast: {
            bestTime: selectedTemple.crowd.bestTimeToday || '6:00 AM',
            crowdLevel: selectedTemple.crowd.crowdLevel || 'medium',
            crowdPercentage: selectedTemple.crowd.crowdPercentage || 50,
            waitTime: selectedTemple.crowd.waitTime || '30 mins',
            weather: selectedTemple.crowd.weather || { temp: 25, condition: 'Clear' }
          }
        })
        setStep(3)
        setSelectedNearby([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleNearbyPlace = (place) => {
    setSelectedNearby(prev => {
      const exists = prev.find(p => p._id === place._id)
      if (exists) {
        return prev.filter(p => p._id !== place._id)
      }
      return [...prev, place]
    })
  }

  const resetPlan = () => {
    setStep(1)
    setResult(null)
    setSelectedTempleId('')
    setSelectedDate('today')
    setSelectedNearby([])
    setShowItinerary(false)
  }

  // Show optimized itinerary
  if (showItinerary && result) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl pb-20">
        <OptimizedItinerary
          mainTemple={result.temple}
          selectedPlaces={selectedNearby}
          date={result.date}
          onBack={() => setShowItinerary(false)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl pb-20">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Plan My Visit</h1>
        <p className="text-gray-600">
          Get the best time to visit and discover nearby heritage sites
        </p>
      </header>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 rounded ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select Temple */}
      {step === 1 && (
        <Card className="border-2 border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Where do you want to go?</h2>
                <p className="text-sm text-gray-500">Select a temple</p>
              </div>
            </div>

            {templesLoading ? (
              <div className="h-12 flex items-center justify-center border rounded-md bg-gray-50">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-gray-500">Loading temples...</span>
              </div>
            ) : temples.length === 0 ? (
              <div className="h-12 flex items-center justify-center border rounded-md bg-gray-50">
                <span className="text-gray-500">No temples available. Please refresh.</span>
              </div>
            ) : (
              <Select value={selectedTempleId} onValueChange={setSelectedTempleId}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Choose a temple..." />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {temples.map((temple) => (
                    <SelectItem key={temple._id} value={temple._id}>
                      <div className="flex items-center gap-2">
                        <span>{temple.name}</span>
                        <span className="text-gray-400 text-sm">• {temple.state}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedTemple && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <img
                  src={selectedTemple.imageUrl}
                  alt={selectedTemple.name}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=200'}
                />
                <div>
                  <p className="font-semibold">{selectedTemple.name}</p>
                  <p className="text-sm text-gray-500">{selectedTemple.location}</p>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-6 h-12 text-base bg-orange-500 hover:bg-orange-600"
              disabled={!selectedTempleId}
              onClick={() => setStep(2)}
            >
              Continue <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Date */}
      {step === 2 && (
        <Card className="border-2 border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg">When do you want to visit?</h2>
                <p className="text-sm text-gray-500">Select a date</p>
              </div>
            </div>

            <div className="space-y-3">
              {dateOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setSelectedDate(option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedDate === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {selectedDate === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                </div>
              ))}

              {selectedDate === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none"
                />
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                Back
              </Button>
              <Button
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
                onClick={handleGetPlan}
                disabled={isLoading || (selectedDate === 'custom' && !customDate)}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>Get My Plan <Sparkles className="ml-2 w-5 h-5" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results + Nearby Recommendations */}
      {step === 3 && result && (
        <div className="space-y-4">
          {/* Main Result Card */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-32">
                <img
                  src={result.temple.imageUrl}
                  alt={result.temple.name}
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <h3 className="font-bold text-lg">{result.temple.name}</h3>
                  <p className="text-sm opacity-90">{format(result.date, 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="p-6 text-center border-b">
                <p className="text-sm text-gray-500 mb-1">Best time to visit</p>
                <p className="text-4xl font-bold text-green-600">{result.forecast.bestTime || '6:00 AM'}</p>
                <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-100">
                  Recommended
                </Badge>
              </div>

              <div className="grid grid-cols-3 divide-x">
                <div className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Crowd</p>
                  <p className={`font-bold capitalize ${
                    result.forecast.crowdLevel === 'low' ? 'text-green-600' :
                    result.forecast.crowdLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {result.forecast.crowdLevel || 'Medium'}
                  </p>
                </div>
                <div className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Wait</p>
                  <p className="font-bold">{result.forecast.waitTime || '30 mins'}</p>
                </div>
                <div className="p-4 text-center">
                  <Thermometer className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Weather</p>
                  <p className="font-bold">{result.forecast.weather?.temp || 25}°C</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nearby Heritage Sites */}
          {nearbyPlaces.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Explore More Heritage Sites</h3>
                    <p className="text-sm text-gray-500">Add nearby temples to your pilgrimage</p>
                  </div>
                  {selectedNearby.length > 0 && (
                    <Badge className="bg-orange-100 text-orange-700">
                      {selectedNearby.length} selected
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {displayedNearby.map((place) => (
                    <NearbyPlaceCard
                      key={place._id}
                      place={place}
                      distance={place.distance}
                      isSelected={selectedNearby.some(p => p._id === place._id)}
                      onToggle={() => toggleNearbyPlace(place)}
                    />
                  ))}
                </div>

                {nearbyPlaces.length > 4 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-3 text-orange-600"
                    onClick={() => setShowAllNearby(!showAllNearby)}
                  >
                    {showAllNearby ? (
                      <>Show Less <ChevronUp className="ml-1 w-4 h-4" /></>
                    ) : (
                      <>Show {nearbyPlaces.length - 4} More <ChevronDown className="ml-1 w-4 h-4" /></>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetPlan} className="flex-1 h-12">
              Start Over
            </Button>
            <Button
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowItinerary(true)}
            >
              <Route className="w-4 h-4 mr-2" />
              {selectedNearby.length > 0 ? 'Optimize Trip' : 'View Plan'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanVisit
