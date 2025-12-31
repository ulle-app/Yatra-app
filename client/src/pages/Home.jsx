import { useEffect } from 'react'
import { RefreshCw, Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TempleCard } from '@/components/TempleCard'
import { useTempleStore } from '@/store/useStore'
import { formatTime } from '@/lib/utils'

export function Home() {
  const {
    filteredTemples,
    isLoading,
    lastUpdated,
    searchQuery,
    crowdFilter,
    fetchTemples,
    setSearchQuery,
    setCrowdFilter,
    refreshCrowdData,
  } = useTempleStore()

  useEffect(() => {
    fetchTemples()
    // Auto-refresh every 60 seconds
    const interval = setInterval(refreshCrowdData, 60000)
    return () => clearInterval(interval)
  }, [fetchTemples, refreshCrowdData])

  return (
    <div className="container py-4 sm:py-8">
      {/* Live Status Banner */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="live-dot shrink-0"></span>
            <div>
              <p className="text-sm font-medium">Live Crowd Predictions</p>
              <p className="text-xs text-muted-foreground">
                Based on time, day, and festival patterns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs overflow-x-auto hide-scrollbar pb-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="text-muted-foreground whitespace-nowrap">Time Analysis</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-muted-foreground whitespace-nowrap">Historical Data</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="text-muted-foreground whitespace-nowrap">Festival Calendar</span>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-muted-foreground shrink-0">
              Updated: {formatTime(lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-8 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search temples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={crowdFilter} onValueChange={setCrowdFilter}>
              <SelectTrigger className="flex-1 sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crowds</SelectItem>
                <SelectItem value="low">Low Crowd</SelectItem>
                <SelectItem value="medium">Medium Crowd</SelectItem>
                <SelectItem value="high">High Crowd</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={refreshCrowdData}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Crowd Legend */}
      <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-6 text-xs sm:text-sm flex-wrap">
        <span className="text-muted-foreground hidden sm:inline">Crowd Levels:</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></span>
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
          <span className="text-muted-foreground">High</span>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <Badge variant="secondary">
          {filteredTemples.length} temple{filteredTemples.length !== 1 ? 's' : ''} found
        </Badge>
      </div>

      {/* Temples Grid */}
      {isLoading && filteredTemples.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card animate-pulse">
              <div className="h-40 sm:h-48 bg-muted"></div>
              <div className="p-4 sm:p-5 space-y-3">
                <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemples.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <p className="text-base sm:text-lg font-medium">No temples found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTemples.map((temple) => (
            <TempleCard key={temple._id} temple={temple} />
          ))}
        </div>
      )}
    </div>
  )
}
