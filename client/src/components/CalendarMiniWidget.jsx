import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { format, addDays, subDays } from 'date-fns'
import { getCrowdColor } from '../lib/utils'
import { Badge } from './ui/badge'
import { Loader2 } from 'lucide-react'

export function CalendarMiniWidget({ templeIds, selectedDate }) {
  const [weekData, setWeekData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!templeIds || templeIds.length === 0) return

    const fetchWeekData = async () => {
      setIsLoading(true)
      try {
        const startDate = subDays(selectedDate, 3)
        const endDate = addDays(selectedDate, 3)

        const response = await axios.get('/api/temples/calendar', {
          params: {
            templeIds: templeIds.slice(0, 3).join(','),
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd')
          }
        })

        setWeekData(response.data)
      } catch (error) {
        console.error('Failed to load week data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeekData()
  }, [templeIds, selectedDate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">Loading crowd forecast...</p>
        </div>
      </div>
    )
  }

  if (!weekData) return null

  // Generate 7-day range (3 days before to 3 days after selected date)
  const days = []
  for (let i = -3; i <= 3; i++) {
    days.push(addDays(selectedDate, i))
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-4 border border-blue-100">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const crowdData = weekData.comparison[dateStr]
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          const colors = crowdData ? getCrowdColor(crowdData.maxCrowdLevel) : { bg: 'bg-gray-200' }

          return (
            <div
              key={idx}
              className={`p-2 rounded-lg text-center transition-all ${colors.bg} ${
                isSelected ? 'ring-2 ring-blue-600 shadow-md' : ''
              } hover:shadow-sm`}
            >
              <div className="text-xs font-semibold text-gray-700">{format(day, 'EEE')}</div>
              <div className="text-lg font-bold text-white">{format(day, 'd')}</div>
              {crowdData && (
                <Badge variant="secondary" className="text-xs mt-1 block w-full justify-center">
                  {crowdData.avgCrowdPercentage}%
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      {weekData.comparison[format(selectedDate, 'yyyy-MM-dd')]?.crowdedTemples?.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-700 mb-1">⚠️ High Crowd Alert</p>
          <p className="text-xs text-red-600">
            High crowds expected at: <span className="font-medium">{weekData.comparison[format(selectedDate, 'yyyy-MM-dd')].crowdedTemples.join(', ')}</span>
          </p>
        </div>
      )}

      {weekData.comparison[format(selectedDate, 'yyyy-MM-dd')]?.maxCrowdLevel === 'low' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-semibold text-green-700">✓ Great Day to Visit</p>
          <p className="text-xs text-green-600">Low crowds forecasted for your selected date!</p>
        </div>
      )}
    </div>
  )
}
