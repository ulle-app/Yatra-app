import React, { useEffect, useState } from 'react'
import { format, addDays, isToday, isTomorrow } from 'date-fns'
import { useTempleStore } from '../store/useStore'
import { getCrowdColor } from '../lib/utils'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  MapPin, Clock, Sun, CloudRain, Thermometer, Users,
  Calendar, ChevronRight, CheckCircle2, AlertCircle,
  Shirt, Camera, Volume2, Share2, BookmarkPlus, Sparkles
} from 'lucide-react'
import axios from 'axios'

const API_URL = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://yatra-app-1-kx78.onrender.com/api'

function PlanVisit() {
  const { temples, fetchTemples, isLoading: templesLoading } = useTempleStore()
  const [selectedTempleId, setSelectedTempleId] = useState('')
  const [selectedDate, setSelectedDate] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (temples.length === 0) {
      fetchTemples()
    }
  }, [temples.length, fetchTemples])

  const selectedTemple = temples.find(t => t._id === selectedTempleId)

  // Generate date options
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
      const dateStr = format(targetDate, 'yyyy-MM-dd')

      const response = await axios.get(`${API_URL}/temples/${selectedTempleId}/forecast`, {
        params: { date: dateStr }
      })

      setResult({
        temple: selectedTemple,
        date: targetDate,
        forecast: response.data
      })
      setStep(3)
    } catch (error) {
      console.error('Failed to get forecast:', error)
      // Use temple's current crowd data as fallback
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
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    if (!result) return
    const text = `Planning to visit ${result.temple.name} on ${format(result.date, 'MMMM d, yyyy')}. Best time: ${result.forecast.bestTime}. Expected wait: ${result.forecast.waitTime}.`

    if (navigator.share) {
      navigator.share({ title: 'My Temple Visit Plan', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Plan copied to clipboard!')
    }
  }

  const resetPlan = () => {
    setStep(1)
    setResult(null)
    setSelectedTempleId('')
    setSelectedDate('today')
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl pb-20">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Plan My Visit</h1>
        <p className="text-gray-600">
          Get the best time to visit any temple
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

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="space-y-4">
          {/* Main Result Card */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white overflow-hidden">
            <CardContent className="p-0">
              {/* Temple Header */}
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

              {/* Best Time - Hero */}
              <div className="p-6 text-center border-b">
                <p className="text-sm text-gray-500 mb-1">Best time to visit</p>
                <p className="text-4xl font-bold text-green-600">{result.forecast.bestTime || '6:00 AM'}</p>
                <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-100">
                  Recommended
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 divide-x">
                <div className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Expected Crowd</p>
                  <p className={`font-bold capitalize ${
                    result.forecast.crowdLevel === 'low' ? 'text-green-600' :
                    result.forecast.crowdLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {result.forecast.crowdLevel || 'Medium'}
                  </p>
                </div>
                <div className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs text-gray-500">Wait Time</p>
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

          {/* Tips Card */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Tips for your visit
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>Temple timings: {result.temple.timings || '6:00 AM - 9:00 PM'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Shirt className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>Dress conservatively, remove footwear before entering</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Camera className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>Photography may be restricted in sanctum</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Volume2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>Maintain silence and respect customs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleShare} className="flex-1 h-12">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button
              className="flex-1 h-12 bg-orange-500 hover:bg-orange-600"
              onClick={resetPlan}
            >
              Plan Another Visit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanVisit
