import React, { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, addDays, parseISO } from 'date-fns'
import 'react-day-picker/dist/style.css'
import { useCalendarStore } from '../store/useStore'
import { useTempleStore } from '../store/useStore'
import { getCrowdColor } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react'

function HourlyBreakdown({ dateStr, temples }) {
  const { calendarData } = useCalendarStore()

  if (!calendarData) return null

  // Get hourly data for all selected temples
  const hourlyData = calendarData.temples.map((temple) => ({
    name: temple.templeName,
    hourly: temple.predictions[dateStr]?.hourly || []
  }))

  return (
    <div className="mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-300 col-span-full">
      <h4 className="font-semibold text-sm mb-2">
        Hourly Breakdown - {format(parseISO(dateStr), 'MMM d, yyyy')}
      </h4>

      {hourlyData.map((temple, idx) => (
        <div key={idx} className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-1">{temple.name}</p>
          <div className="grid grid-cols-12 gap-0.5">
            {temple.hourly.slice(6, 22).map((hour, i) => {
              const colors = getCrowdColor(hour.crowdLevel)
              return (
                <div
                  key={i}
                  className={`h-8 ${colors.bg} rounded flex flex-col items-center justify-center text-xs transition-all hover:shadow-md`}
                  title={`${hour.displayHour}: ${hour.crowdPercentage}% (${hour.waitTime})`}
                >
                  <span className="text-white font-bold text-[10px]">{hour.hour}</span>
                  <span className="text-white text-[8px]">{hour.crowdPercentage}%</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Best time:{' '}
            {temple.hourly
              .reduce(
                (best, hour) =>
                  hour.crowdPercentage < best.crowdPercentage ? hour : best,
                temple.hourly[0]
              )
              .displayHour || 'N/A'}
          </p>
        </div>
      ))}
    </div>
  )
}

function CrowdCalendar() {
  const { temples, fetchTemples } = useTempleStore()
  const {
    selectedTemples,
    currentMonth,
    calendarData,
    expandedDate,
    isLoading,
    addTemple,
    removeTemple,
    setCurrentMonth,
    toggleDateExpansion,
    getCrowdForDate
  } = useCalendarStore()

  const [templeSearch, setTempleSearch] = useState('')

  useEffect(() => {
    fetchTemples()
  }, [fetchTemples])

  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
  }

  const filteredTemples = temples.filter(
    (t) =>
      !selectedTemples.find((st) => st._id === t._id) &&
      t.name.toLowerCase().includes(templeSearch.toLowerCase())
  )

  // Custom day cell renderer with color coding
  const renderDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const crowdData = getCrowdForDate(dateStr)
    const isExpanded = expandedDate === dateStr

    if (!crowdData) {
      return (
        <div className="calendar-day bg-gray-100 text-gray-600">
          <div className="text-sm font-semibold">{format(date, 'd')}</div>
        </div>
      )
    }

    const colors = getCrowdColor(crowdData.maxCrowdLevel)

    return (
      <div
        onClick={() => toggleDateExpansion(dateStr)}
        className={`calendar-day ${colors.bg} cursor-pointer hover:opacity-90 transition-all ${isExpanded ? 'ring-2 ring-blue-500' : ''
          }`}
      >
        <div className="text-sm font-semibold">{format(date, 'd')}</div>
        <div className="text-xs">{crowdData.avgCrowdPercentage}%</div>

        {isExpanded && <HourlyBreakdown dateStr={dateStr} temples={selectedTemples} />}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Crowd Calendar</h1>
        <p className="text-gray-600">
          Plan your temple visits with color-coded crowd predictions for the year
        </p>
      </header>

      {/* Temple Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Temples (Max 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Temples Pills */}
            {selectedTemples.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTemples.map((temple) => (
                  <Badge key={temple._id} variant="default" className="px-3 py-1.5 flex items-center gap-1">
                    {temple.name}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:opacity-70"
                      onClick={() => removeTemple(temple._id)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Temple Selector */}
            {selectedTemples.length < 3 && (
              <Select
                value=""
                onValueChange={(value) => {
                  const temple = temples.find((t) => t._id === value)
                  if (temple) addTemple(temple)
                  setTempleSearch('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add a temple..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemples.slice(0, 15).map((temple) => (
                    <SelectItem key={temple._id} value={temple._id}>
                      {temple.name} - {temple.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-md"></div>
              <div>
                <p className="font-medium text-sm">Low Crowd</p>
                <p className="text-xs text-gray-500">0-40%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-md"></div>
              <div>
                <p className="font-medium text-sm">Medium Crowd</p>
                <p className="text-xs text-gray-500">41-70%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-md"></div>
              <div>
                <p className="font-medium text-sm">High Crowd</p>
                <p className="text-xs text-gray-500">71-100%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Card */}
      {selectedTemples.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <CardTitle className="text-center flex-1">{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange(1)}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="mt-2">Loading calendar...</p>
              </div>
            ) : (
              <div className="min-w-full">
                <DayPicker
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  components={{
                    Day: ({ date }) => renderDay(date)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-600 mb-4">No temples selected</p>
            <p className="text-sm text-gray-500">
              Select at least one temple above to view crowd calendar and plan your visits
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CrowdCalendar
