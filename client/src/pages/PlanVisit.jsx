import React, { useEffect, useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTempleStore, useAuthStore } from '../store/useStore'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  MapPin, Clock, Thermometer, Users, Calendar, ChevronRight, CheckCircle2,
  AlertCircle, Shirt, Camera, Volume2, Share2, Sparkles, Plus, Check,
  Route, Navigation, Car, Train, Plane, LogIn, Lock, ChevronDown, ChevronUp,
  Heart, Wallet, Timer, TrendingDown, Bus
} from 'lucide-react'
import axios from 'axios'

const API_URL = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://yatra-app-1-kx78.onrender.com/api'

// Major Indian cities with coordinates
const INDIAN_CITIES = [
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
]

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

// Get all transport options with estimated costs
const getTransportOptions = (distanceKm) => {
  const options = []

  // Local transport (Auto/Taxi) - always available for short distances
  if (distanceKm < 100) {
    options.push({
      mode: 'Auto/Taxi',
      icon: Car,
      time: distanceKm < 20 ? '30-45 min' : `${Math.ceil(distanceKm / 40)} hrs`,
      cost: Math.round(distanceKm * 15), // ~₹15/km
      costRange: `₹${Math.round(distanceKm * 12)}-${Math.round(distanceKm * 18)}`,
      recommended: distanceKm < 50
    })
  }

  // Bus - available for medium distances
  if (distanceKm > 20 && distanceKm < 800) {
    options.push({
      mode: 'Bus',
      icon: Bus,
      time: `${Math.ceil(distanceKm / 50)} hrs`,
      cost: Math.round(distanceKm * 1.5), // ~₹1.5/km
      costRange: `₹${Math.round(distanceKm * 1)}-${Math.round(distanceKm * 2)}`,
      recommended: distanceKm >= 50 && distanceKm < 200
    })
  }

  // Train - available for longer distances
  if (distanceKm > 50) {
    const trainHours = Math.ceil(distanceKm / 60) // ~60km/h average
    options.push({
      mode: 'Train',
      icon: Train,
      time: trainHours < 24 ? `${trainHours} hrs` : `${Math.ceil(trainHours/24)} day(s)`,
      cost: Math.round(distanceKm * 1.2), // ~₹1.2/km (Sleeper class)
      costRange: `₹${Math.round(distanceKm * 0.8)}-${Math.round(distanceKm * 2.5)}`,
      recommended: distanceKm >= 200 && distanceKm < 1000
    })
  }

  // Flight - available for long distances
  if (distanceKm > 300) {
    options.push({
      mode: 'Flight',
      icon: Plane,
      time: `${Math.ceil(distanceKm / 700 + 2)} hrs`, // Including airport time
      cost: Math.round(2500 + distanceKm * 3), // Base + per km
      costRange: `₹${Math.round(2000 + distanceKm * 2)}-${Math.round(4000 + distanceKm * 5)}`,
      recommended: distanceKm >= 1000
    })
  }

  return options.length > 0 ? options : [{
    mode: 'Walk/Local',
    icon: MapPin,
    time: '15-30 min',
    cost: 0,
    costRange: 'Free',
    recommended: true
  }]
}

// Get cheapest option
const getCheapestOption = (options) => {
  return options.reduce((min, opt) => opt.cost < min.cost ? opt : min, options[0])
}

// Get fastest option
const getFastestOption = (options) => {
  const parseTime = (timeStr) => {
    if (timeStr.includes('day')) return parseInt(timeStr) * 24
    if (timeStr.includes('hr')) return parseInt(timeStr)
    return 0.5 // minutes converted to hours fraction
  }
  return options.reduce((min, opt) =>
    parseTime(opt.time) < parseTime(min.time) ? opt : min, options[0])
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
  const options = getTransportOptions(distance)
  const cheapest = getCheapestOption(options)

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

          {/* Crowd indicator */}
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${
              place.crowd?.crowdLevel === 'low' ? 'bg-green-100 text-green-700' :
              place.crowd?.crowdLevel === 'high' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {place.crowd?.crowdLevel || 'medium'} crowd
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-blue-600">
              <Navigation className="w-3 h-3" /> {distance.toFixed(0)} km
            </span>
            <span className="text-green-600 font-medium">from {cheapest.costRange}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TransportOptionCard({ option, isSelected, onSelect }) {
  const Icon = option.icon
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{option.mode}</p>
          <p className="text-xs text-gray-500">{option.time}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">{option.costRange}</p>
          {option.recommended && (
            <Badge className="text-xs bg-blue-100 text-blue-700">Best</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function OptimizedItinerary({ sourceCity, mainTemple, selectedPlaces, date, optimizeBy, onBack, onSave, isSaving, isSaved }) {
  // Optimize route based on user preference
  const optimizedRoute = useMemo(() => {
    const allPlaces = [mainTemple, ...selectedPlaces]

    if (optimizeBy === 'crowd') {
      // Sort by crowd level (low first)
      const crowdOrder = { low: 0, medium: 1, high: 2 }
      return [...allPlaces].sort((a, b) => {
        const levelA = crowdOrder[a.crowd?.crowdLevel] ?? 1
        const levelB = crowdOrder[b.crowd?.crowdLevel] ?? 1
        return levelA - levelB
      })
    }

    if (optimizeBy === 'cost' || optimizeBy === 'time') {
      // Greedy nearest neighbor for distance optimization (affects both cost and time)
      const route = []
      const remaining = [...allPlaces]
      let current = sourceCity

      while (remaining.length > 0) {
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
        current = remaining[nearestIdx]
        remaining.splice(nearestIdx, 1)
      }
      return route
    }

    return allPlaces
  }, [sourceCity, mainTemple, selectedPlaces, optimizeBy])

  // Calculate total costs
  const tripStats = useMemo(() => {
    let totalDistance = 0
    let totalCostMin = 0
    let totalCostMax = 0
    let totalTimeHrs = 0

    // From source to first temple
    const distToFirst = getDistance(sourceCity.lat, sourceCity.lng, optimizedRoute[0].lat, optimizedRoute[0].lng)
    const firstOptions = getTransportOptions(distToFirst)
    const firstChoice = optimizeBy === 'cost' ? getCheapestOption(firstOptions) : getFastestOption(firstOptions)
    totalDistance += distToFirst
    totalCostMin += parseInt(firstChoice.costRange.split('-')[0].replace(/[₹,]/g, '')) || 0
    totalCostMax += parseInt(firstChoice.costRange.split('-')[1]?.replace(/[₹,]/g, '')) || totalCostMin

    // Between temples
    for (let i = 1; i < optimizedRoute.length; i++) {
      const dist = getDistance(
        optimizedRoute[i-1].lat, optimizedRoute[i-1].lng,
        optimizedRoute[i].lat, optimizedRoute[i].lng
      )
      const options = getTransportOptions(dist)
      const choice = optimizeBy === 'cost' ? getCheapestOption(options) : getFastestOption(options)
      totalDistance += dist
      totalCostMin += parseInt(choice.costRange.split('-')[0].replace(/[₹,]/g, '')) || 0
      totalCostMax += parseInt(choice.costRange.split('-')[1]?.replace(/[₹,]/g, '')) || totalCostMin
    }

    return {
      distance: totalDistance,
      costRange: `₹${totalCostMin.toLocaleString()}-${totalCostMax.toLocaleString()}`,
      places: optimizedRoute.length,
      days: totalDistance < 200 ? 1 : totalDistance < 500 ? 2 : Math.ceil(totalDistance / 400)
    }
  }, [sourceCity, optimizedRoute, optimizeBy])

  const handleShare = async () => {
    const text = `My Temple Trip from ${sourceCity.name}\n` +
      `Date: ${format(date, 'MMMM d, yyyy')}\n` +
      `Optimized for: ${optimizeBy === 'cost' ? 'Lowest Cost' : optimizeBy === 'time' ? 'Fastest Route' : 'Least Crowded'}\n\n` +
      `Itinerary:\n` +
      optimizedRoute.map((p, i) => `${i+1}. ${p.name} (${p.location})`).join('\n') +
      `\n\nEstimated: ${tripStats.distance.toFixed(0)} km | ${tripStats.costRange}\n\nPlanned with Tirtha Yatra`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Temple Trip', text })
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      }
    } else {
      await navigator.clipboard.writeText(text)
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
            <span className="text-sm opacity-90">
              {optimizeBy === 'cost' ? 'Cost-Optimized' : optimizeBy === 'time' ? 'Time-Optimized' : 'Crowd-Optimized'} Route
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-1">{format(date, 'EEEE, MMMM d, yyyy')}</h2>
          <p className="text-sm opacity-90">Starting from {sourceCity.name}</p>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{tripStats.places}</p>
              <p className="text-xs opacity-75">Places</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{tripStats.distance.toFixed(0)}</p>
              <p className="text-xs opacity-75">km Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{tripStats.days}</p>
              <p className="text-xs opacity-75">Day(s)</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/20 rounded-lg text-center">
            <p className="text-sm">Estimated Total Cost</p>
            <p className="text-2xl font-bold">{tripStats.costRange}</p>
          </div>
        </CardContent>
      </Card>

      {/* Route */}
      <Card>
        <CardContent className="p-4">
          {/* From Source */}
          <div className="flex gap-3 py-3 border-b border-dashed">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="w-0.5 flex-1 bg-gray-200 my-1" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Start: {sourceCity.name}</p>
              <p className="text-sm text-gray-500">{sourceCity.state}</p>

              {/* Transport options to first temple */}
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Travel options to first stop:</p>
                <div className="flex flex-wrap gap-2">
                  {getTransportOptions(getDistance(sourceCity.lat, sourceCity.lng, optimizedRoute[0].lat, optimizedRoute[0].lng))
                    .map((opt, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <opt.icon className="w-3 h-3 mr-1" />
                        {opt.mode}: {opt.costRange}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Temple Stops */}
          {optimizedRoute.map((place, idx) => {
            const isLast = idx === optimizedRoute.length - 1
            const nextPlace = optimizedRoute[idx + 1]
            const distToNext = nextPlace
              ? getDistance(place.lat, place.lng, nextPlace.lat, nextPlace.lng)
              : 0
            const transportOptions = nextPlace ? getTransportOptions(distToNext) : []

            return (
              <div key={place._id || idx}>
                <div className="flex gap-3 py-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {idx + 1}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-14 h-14 rounded-lg object-cover"
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=200'}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{place.name}</p>
                        <p className="text-sm text-gray-500">{place.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${
                            place.crowd?.crowdLevel === 'low' ? 'bg-green-100 text-green-700' :
                            place.crowd?.crowdLevel === 'high' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {place.crowd?.crowdLevel || 'medium'} crowd
                          </Badge>
                          {place.crowd?.waitTime && (
                            <span className="text-xs text-gray-500">{place.crowd.waitTime} wait</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Transport options to next temple */}
                    {!isLast && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2">
                          {distToNext.toFixed(0)} km to next stop:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {transportOptions.map((opt, i) => (
                            <Badge key={i} variant="outline" className={`text-xs ${opt.recommended ? 'border-green-500 bg-green-50' : ''}`}>
                              <opt.icon className="w-3 h-3 mr-1" />
                              {opt.mode}: {opt.costRange}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
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
              <Wallet className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Book train tickets in advance on IRCTC for best prices</span>
            </li>
            <li className="flex items-start gap-2">
              <Plane className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Flight prices vary - book 2-3 weeks ahead for savings</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Start early to avoid crowds and travel in cooler hours</span>
            </li>
            <li className="flex items-start gap-2">
              <Shirt className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>Carry modest clothing for temple visits</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onSave}
          disabled={isSaving || isSaved}
          className={`w-full h-12 text-base ${
            isSaved ? 'bg-green-500 hover:bg-green-500' : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : isSaved ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Saved to My Trips
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Heart className="w-5 h-5" /> Save to My Trips
            </span>
          )}
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Modify Plan
          </Button>
          <Button variant="outline" onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlanVisit() {
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuthStore()
  const { temples, fetchTemples, isLoading: templesLoading } = useTempleStore()

  const [step, setStep] = useState(1)
  const [selectedTempleId, setSelectedTempleId] = useState('')
  const [selectedDate, setSelectedDate] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [sourceCity, setSourceCity] = useState(null)
  const [optimizeBy, setOptimizeBy] = useState('cost') // 'cost', 'time', 'crowd'
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNearby, setSelectedNearby] = useState([])
  const [showItinerary, setShowItinerary] = useState(false)
  const [showAllNearby, setShowAllNearby] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (temples.length === 0) {
      fetchTemples()
    }
  }, [temples.length, fetchTemples])

  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  const selectedTemple = temples.find(t => t._id === selectedTempleId)

  // Calculate nearby places
  const nearbyPlaces = useMemo(() => {
    if (!result?.temple) return []

    const withDistance = temples
      .filter(t => t._id !== result.temple._id)
      .map(t => ({
        ...t,
        distance: getDistance(result.temple.lat, result.temple.lng, t.lat, t.lng)
      }))
      .sort((a, b) => a.distance - b.distance)

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

  const optimizationOptions = [
    { value: 'cost', label: 'Lowest Cost', icon: Wallet, description: 'Cheapest transport options' },
    { value: 'time', label: 'Fastest Route', icon: Timer, description: 'Minimize travel time' },
    { value: 'crowd', label: 'Least Crowded', icon: TrendingDown, description: 'Visit low-crowd temples first' }
  ]

  const getTargetDate = () => {
    if (selectedDate === 'today') return new Date()
    if (selectedDate === 'tomorrow') return addDays(new Date(), 1)
    if (selectedDate === 'custom' && customDate) return new Date(customDate)
    return new Date()
  }

  const handleGetPlan = async () => {
    if (!selectedTempleId || !sourceCity) return

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
      setStep(4)
      setSelectedNearby([])
    } catch (error) {
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
        setStep(4)
        setSelectedNearby([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleNearbyPlace = (place) => {
    setSelectedNearby(prev => {
      const exists = prev.find(p => p._id === place._id)
      if (exists) return prev.filter(p => p._id !== place._id)
      return [...prev, place]
    })
  }

  const resetPlan = () => {
    setStep(1)
    setResult(null)
    setSelectedTempleId('')
    setSelectedDate('today')
    setSourceCity(null)
    setOptimizeBy('cost')
    setSelectedNearby([])
    setShowItinerary(false)
    setIsSaved(false)
  }

  const saveItinerary = async () => {
    if (!result) return

    setIsSaving(true)
    try {
      const allTemples = [result.temple, ...selectedNearby]

      await axios.post(`${API_URL}/plans`, {
        name: `Trip to ${result.temple.name}`,
        date: result.date.toISOString(),
        templeIds: allTemples.map(t => t._id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setIsSaved(true)
    } catch (error) {
      console.error('Failed to save itinerary:', error)
      alert('Failed to save itinerary. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Show optimized itinerary
  if (showItinerary && result && sourceCity) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl pb-20">
        <OptimizedItinerary
          sourceCity={sourceCity}
          mainTemple={result.temple}
          selectedPlaces={selectedNearby}
          date={result.date}
          optimizeBy={optimizeBy}
          onBack={() => setShowItinerary(false)}
          onSave={saveItinerary}
          isSaving={isSaving}
          isSaved={isSaved}
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
          Get personalized travel recommendations with cost estimates
        </p>
      </header>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-8 h-1 rounded ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />
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
                <p className="text-sm text-gray-500">Select your destination temple</p>
              </div>
            </div>

            {templesLoading ? (
              <div className="h-12 flex items-center justify-center border rounded-md bg-gray-50">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
                <span className="text-gray-500">Loading temples...</span>
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
                <p className="text-sm text-gray-500">Select your travel date</p>
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
                onClick={() => setStep(3)}
                disabled={selectedDate === 'custom' && !customDate}
              >
                Continue <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Source Location & Optimization */}
      {step === 3 && (
        <Card className="border-2 border-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Where are you traveling from?</h2>
                <p className="text-sm text-gray-500">Select your starting city</p>
              </div>
            </div>

            <Select value={sourceCity?.name || ''} onValueChange={(name) => setSourceCity(INDIAN_CITIES.find(c => c.name === name))}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select your city..." />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {INDIAN_CITIES.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    <div className="flex items-center gap-2">
                      <span>{city.name}</span>
                      <span className="text-gray-400 text-sm">• {city.state}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {sourceCity && selectedTemple && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                <p className="text-blue-800">
                  <Navigation className="w-4 h-4 inline mr-1" />
                  Distance: {getDistance(sourceCity.lat, sourceCity.lng, selectedTemple.lat, selectedTemple.lng).toFixed(0)} km from {sourceCity.name}
                </p>
              </div>
            )}

            {/* Optimization Preference */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">How should we optimize?</h2>
                  <p className="text-sm text-gray-500">Choose your priority</p>
                </div>
              </div>

              <div className="space-y-3">
                {optimizationOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <div
                      key={option.value}
                      onClick={() => setOptimizeBy(option.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${optimizeBy === option.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          optimizeBy === option.value ? 'bg-orange-500 text-white' : 'bg-gray-100'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        {optimizeBy === option.value && (
                          <CheckCircle2 className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                Back
              </Button>
              <Button
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
                onClick={handleGetPlan}
                disabled={isLoading || !sourceCity}
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

      {/* Step 4: Results + Nearby Recommendations */}
      {step === 4 && result && (
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

              <div className="p-4 border-b">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Navigation className="w-4 h-4" />
                  <span>From {sourceCity.name}: {getDistance(sourceCity.lat, sourceCity.lng, result.temple.lat, result.temple.lng).toFixed(0)} km</span>
                </div>
                <p className="text-sm text-gray-500">Best time to visit</p>
                <p className="text-3xl font-bold text-green-600">{result.forecast.bestTime || '6:00 AM'}</p>
              </div>

              <div className="grid grid-cols-3 divide-x">
                <div className="p-3 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Crowd</p>
                  <p className={`font-bold capitalize ${
                    result.forecast.crowdLevel === 'low' ? 'text-green-600' :
                    result.forecast.crowdLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {result.forecast.crowdLevel || 'Medium'}
                  </p>
                </div>
                <div className="p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Wait</p>
                  <p className="font-bold">{result.forecast.waitTime || '30 mins'}</p>
                </div>
                <div className="p-3 text-center">
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
                    <h3 className="font-bold text-lg">Add More Places</h3>
                    <p className="text-sm text-gray-500">Nearby temples to include in your trip</p>
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
