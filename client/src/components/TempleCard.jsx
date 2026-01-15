import { useState } from 'react'
import { MapPin, Clock, Cloud, Info, Users, ArrowRight, Thermometer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, getCrowdColor } from '@/lib/utils'
import { TempleWikiSheet } from './TempleWikiSheet'

export function TempleCard({ temple }) {
  const [showWiki, setShowWiki] = useState(false)
  const crowd = temple.crowd || {}
  const crowdColor = getCrowdColor(crowd.crowdLevel)

  // Safe access to weather
  const weather = crowd.weather || {}
  const hasWeather = weather && weather.temp

  return (
    <>
      <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
        {/* Full Image Hero */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={temple.imageUrl}
            alt={temple.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop'
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          {/* Top Right: Weather Widget (Floating) */}
          {hasWeather && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-white/50 rounded-full px-3 py-1 text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              {weather.condition?.toLowerCase().includes('rain') ? (
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
              ) : (
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              )}
              <span>{weather.temp}°C</span>
            </div>
          )}

          {/* Bottom Content within Image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white mb-0.5 shadow-sm leading-tight">{temple.name}</h3>
            <div className="flex items-center text-white/80 text-xs mb-3">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{temple.location}</span>
            </div>

            {/* Live Metrics Strip */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {/* Wait Time */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Est. Wait</p>
                <div className="flex items-center gap-1.5 text-white font-semibold">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {crowd.waitTime || '30 mins'}
                </div>
              </div>

              {/* Crowd Level */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Crowd</p>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className={cn("w-2 h-2 rounded-full", crowdColor.bg, crowdColor.pulse)} />
                  <span className={cn(crowdColor.text === 'text-green-700' ? 'text-green-400' : 'text-white')}>
                    {crowd.crowdLevel?.toUpperCase() || 'NORMAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-3 bg-white border-t flex justify-between items-center">
          <div className="text-xs text-slate-500 font-medium">
            Confidence: <span className="text-slate-900">{crowd.confidence}%</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWiki(true)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-semibold text-xs flex items-center gap-1"
          >
            Know More <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>

      {/* The Wiki Sheet */}
      <TempleWikiSheet
        temple={temple}
        isOpen={showWiki}
        onClose={setShowWiki}
      />
    </>
  )
}

