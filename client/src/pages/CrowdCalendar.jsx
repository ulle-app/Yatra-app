import React, { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth } from 'date-fns'
import { useCalendarStore, useTempleStore } from '../store/useStore'
import { getCrowdColor } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { X, ChevronLeft, ChevronRight, Info, Calendar, Clock } from 'lucide-react'

function HourlyBreakdown({ dateStr, onClose }) {
  const { calendarData } = useCalendarStore()

  if (!calendarData) return null

  const hourlyData = calendarData.temples.map((temple) => ({
    name: temple.templeName,
    hourly: temple.predictions[dateStr]?.hourly || []
  }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-bold text-lg">
            {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {hourlyData.map((temple, idx) => (
            <div key={idx}>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                {temple.name}
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {temple.hourly.slice(5, 21).map((hour, i) => {
                  const colors = getCrowdColor(hour.crowdLevel)
                  return (
                    <div
                      key={i}
                      className={`${colors.bg} rounded-lg p-2 text-center transition-transform hover:scale-105`}
                      title={`${hour.displayHour}: ${hour.crowdPercentage}%`}
                    >
                      <div className="text-white text-xs font-medium">{hour.hour || (5 + i)}</div>
                      <div className="text-white text-[10px] opacity-90">{hour.crowdPercentage}%</div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                <span>Best time: </span>
                <span className="font-medium text-green-600">
                  {temple.hourly.length > 0
                    ? temple.hourly.reduce((best, hour) =>
                        hour.crowdPercentage < best.crowdPercentage ? hour : best
                      ).displayHour
                    : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CalendarGrid({ month, getCrowdForDate, onDateClick, selectedDate }) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = getDay(start)

  // Create empty cells for days before the month starts
  const emptyCells = Array(startDayOfWeek).fill(null)

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="w-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before month starts */}
        {emptyCells.map((_, idx) => (
          <div key={`empty-${idx}`} className="h-16 md:h-20 bg-gray-50 rounded-lg" />
        ))}

        {/* Actual days */}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const crowdData = getCrowdForDate(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

          if (!crowdData) {
            return (
              <div
                key={dateStr}
                className={`h-16 md:h-20 rounded-lg border flex flex-col items-center justify-center
                  ${isToday ? 'border-orange-400 border-2' : 'border-gray-200'}
                  bg-gray-50 text-gray-400`}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                <span className="text-[10px]">No data</span>
              </div>
            )
          }

          const colors = getCrowdColor(crowdData.maxCrowdLevel)

          return (
            <div
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={`h-16 md:h-20 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg
                flex flex-col items-center justify-center
                ${colors.bg} text-white
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                ${isToday ? 'ring-2 ring-orange-400' : ''}`}
            >
              <span className="text-sm font-bold">{format(day, 'd')}</span>
              <span className="text-xs font-medium opacity-90">{crowdData.avgCrowdPercentage}%</span>
              <span className="text-[10px] opacity-75 hidden md:block capitalize">{crowdData.maxCrowdLevel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CrowdCalendar() {
  const { temples, fetchTemples } = useTempleStore()
  const {
    selectedTemples,
    currentMonth,
    calendarData,
    isLoading,
    error,
    addTemple,
    removeTemple,
    setCurrentMonth,
    getCrowdForDate
  } = useCalendarStore()

  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchTemples()
  }, [fetchTemples])

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const filteredTemples = temples.filter(
    (t) => !selectedTemples.find((st) => st._id === t._id)
  )

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-12">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Crowd Calendar</h1>
        <p className="text-gray-600">
          Plan your temple visits with color-coded crowd predictions
        </p>
      </header>

      {/* Temple Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Temples (Max 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedTemples.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTemples.map((temple) => (
                  <Badge
                    key={temple._id}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 flex items-center gap-1"
                  >
                    {temple.name}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => removeTemple(temple._id)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {selectedTemples.length < 3 && (
              <Select
                value=""
                onValueChange={(value) => {
                  const temple = temples.find((t) => t._id === value)
                  if (temple) addTemple(temple)
                }}
              >
                <SelectTrigger className="w-full">
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

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded"></div>
              <span className="text-sm">Low (0-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded"></div>
              <span className="text-sm">Medium (41-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-500 rounded"></div>
              <span className="text-sm">High (71-100%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {selectedTemples.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Prev</span>
              </Button>
              <CardTitle className="text-xl">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <span className="hidden sm:inline mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-3 text-gray-500">Loading calendar data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <CalendarGrid
                month={currentMonth}
                getCrowdForDate={getCrowdForDate}
                onDateClick={setSelectedDate}
                selectedDate={selectedDate}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg text-gray-600 mb-2">No temples selected</p>
            <p className="text-sm text-gray-500">
              Select at least one temple above to view crowd predictions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Hourly Breakdown Modal */}
      {selectedDate && calendarData && (
        <HourlyBreakdown
          dateStr={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}

export default CrowdCalendar
