import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Clock, Star, BookOpen, FlaskConical, Map, History } from "lucide-react"

export function TempleWikiSheet({ temple, isOpen, onClose }) {
    if (!temple) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
                <ScrollArea className="h-full w-full">
                    {/* Hero Image Header */}
                    <div className="relative h-64 w-full">
                        <img
                            src={temple.imageUrl}
                            alt={temple.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop'
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                            <Badge className="mb-2 bg-purple-600 hover:bg-purple-700 border-none">
                                {temple.deity}
                            </Badge>
                            <h2 className="text-2xl font-bold leading-tight shadow-md">{temple.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-200 mt-1">
                                <MapPin className="w-4 h-4" />
                                {temple.location}
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="w-full grid grid-cols-4 mb-6">
                                <TabsTrigger value="overview">Info</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                                <TabsTrigger value="science">Science</TabsTrigger>
                                <TabsTrigger value="spiritual">Spiritual</TabsTrigger>
                            </TabsList>

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">About the Temple</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm">
                                        {temple.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2 text-primary">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-semibold text-sm">Timings</span>
                                        </div>
                                        <p className="text-sm text-slate-700">{temple.timings}</p>
                                        {temple.timingDetails && temple.timingDetails.length > 0 && (
                                            <p className="text-xs text-slate-500 mt-1">{temple.timingDetails[0]}</p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2 text-amber-600">
                                            <Star className="w-4 h-4" />
                                            <span className="font-semibold text-sm">Best Time</span>
                                        </div>
                                        <p className="text-sm text-slate-700">{temple.bestTimeToVisit}</p>
                                        <p className="text-xs text-slate-500 mt-1">Avoid weekends if possible</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                        <Map className="w-4 h-4" />
                                        Geography & Context
                                    </h4>
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        Located in <strong>{temple.state}</strong>, this temple is a significant landmark.
                                        {temple.lat && temple.lng ? ` Geographically situated at ${temple.lat.toFixed(2)}°N, ${temple.lng.toFixed(2)}°E.` : ''}
                                    </p>
                                </div>
                            </TabsContent>

                            {/* HISTORY TAB */}
                            <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-amber-100 rounded-lg shrink-0 text-amber-700">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">Historical Origins</h3>
                                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                            {temple.uniqueness?.history || "Historical records for this temple are being digitized."}
                                        </p>
                                    </div>
                                </div>
                                <div className="border-l-2 border-slate-200 ml-5 pl-8 py-2 md:py-4 space-y-6 relative">
                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 bg-white border-2 border-slate-300 w-5 h-5 rounded-full" />
                                        <h4 className="font-medium text-sm">Origins</h4>
                                        <p className="text-xs text-gray-500">Ancient roots tracing back centuries.</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 bg-primary border-2 border-primary w-5 h-5 rounded-full" />
                                        <h4 className="font-medium text-sm">Current Structure</h4>
                                        <p className="text-xs text-gray-500">Renovations and major architectural updates.</p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SCIENCE TAB */}
                            <TabsContent value="science" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <FlaskConical className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-indigo-900">Scientific Marvels</h3>
                                    </div>
                                    <p className="text-sm text-indigo-800 leading-relaxed">
                                        {temple.uniqueness?.scientific || "Ancient engineering often incorporated advanced acoustics, astronomy, and structural stability that modern science is still exploring."}
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-tighter ml-1">Key Observations</h4>
                                    <div className="bg-white border rounded-lg p-3 shadow-sm">
                                        <h5 className="font-medium text-sm mb-1">Architecture & Engineering</h5>
                                        <p className="text-xs text-gray-500">
                                            {temple.description.includes('architect') ? "Known for its distinctive architectural style and structural integrity." : "Built using traditional methods that have withstood the test of time."}
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* SPIRITUAL TAB */}
                            <TabsContent value="spiritual" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-orange-900">Spiritual Significance</h3>
                                    </div>
                                    <p className="text-sm text-orange-800 leading-relaxed">
                                        {temple.uniqueness?.spiritual || "A place of immense spiritual energy and devotion."}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Star className="w-4 h-4 text-yellow-500 mt-1" />
                                        <div>
                                            <h4 className="text-sm font-medium">Deity: {temple.deity}</h4>
                                            <p className="text-xs text-gray-500">The primary cosmic energy worshipped here.</p>
                                        </div>
                                    </div>
                                    {temple.crowdPattern?.type === 'pilgrimage' && (
                                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                            <UsersIcon className="w-4 h-4 text-blue-500 mt-1" />
                                            <div>
                                                <h4 className="text-sm font-medium">Pilgrimage Site</h4>
                                                <p className="text-xs text-gray-500">Millions of devotees visit annually for seeking blessings.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                        </Tabs>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}

function UsersIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
