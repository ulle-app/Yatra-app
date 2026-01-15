import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, ChevronRight, Star } from 'lucide-react'
import { useRecommendationStore, useAuthStore } from '@/store/useStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

export function Recommendations() {
    const { isAuthenticated } = useAuthStore()
    const { recommendations, isLoading, fetchRecommendations } = useRecommendationStore()

    useEffect(() => {
        if (isAuthenticated) {
            fetchRecommendations()
        }
    }, [isAuthenticated, fetchRecommendations])

    if (!isAuthenticated || recommendations.length === 0) return null

    return (
        <section className="py-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600 fill-purple-100" />
                    <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        AI Picked
                    </Badge>
                </div>
                <Link to="/temples" className="text-sm text-purple-600 font-medium hover:underline flex items-center">
                    View All <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                <div className="flex w-max space-x-4 pb-4">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="w-[280px]">
                                <Skeleton className="h-[200px] w-full rounded-xl" />
                                <div className="space-y-2 mt-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ))
                    ) : (
                        recommendations.map((temple) => (
                            <RecommendationCard key={temple._id} temple={temple} />
                        ))
                    )}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </section>
    )
}

function RecommendationCard({ temple }) {
    return (
        <Link to={`/temples/${temple._id}`} className="block select-none group">
            <Card className="w-[280px] overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-40">
                    <img
                        src={temple.imageUrl}
                        alt={temple.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 text-gray-800 hover:bg-white text-xs backdrop-blur-sm">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                            {temple.rating}
                        </Badge>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3">
                        <h3 className="text-white font-bold truncate text-lg shadow-black/50 drop-shadow-md">
                            {temple.name}
                        </h3>
                        <p className="text-white/90 text-xs flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />
                            {temple.location}
                        </p>
                    </div>
                </div>
                <CardContent className="p-3 bg-white">
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                            {temple.reason || 'Popular Choice'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Wait: <b className="text-slate-700">{temple.crowd?.waitTime || '30 mins'}</b></span>
                        <span>Crowd: <b className={temple.crowd?.crowdLevel === 'high' ? 'text-red-500' : 'text-green-600'}>
                            {temple.crowd?.crowdLevel?.toUpperCase()}
                        </b></span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
