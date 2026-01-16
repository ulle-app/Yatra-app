import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Calendar,
  Clock,
  Heart,
  Star,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function About() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Live Crowd Predictions',
      description: 'Real-time crowd level forecasts powered by advanced algorithms analyzing historical patterns.',
    },
    {
      icon: Calendar,
      title: 'Festival Calendar',
      description: 'Integrated festival calendar showing crowd impact for major Indian religious events.',
    },
    {
      icon: Clock,
      title: 'Hourly Forecasts',
      description: 'Detailed hour-by-hour predictions to help you find the perfect time to visit.',
    },
    {
      icon: MapPin,
      title: 'Trip Planning',
      description: 'Plan multi-temple trips with optimized itineraries based on crowd levels.',
    },
    {
      icon: Heart,
      title: 'Favorites & History',
      description: 'Save favorite temples and track your visit history with personal ratings.',
    },
    {
      icon: Shield,
      title: 'Accurate Data',
      description: 'Predictions based on government holiday calendars, festival dates, and seasonal patterns.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Browse Temples',
      description: 'Explore temples across India with live crowd status indicators.',
    },
    {
      number: '02',
      title: 'Check Calendar',
      description: 'View the crowd calendar to find the best dates for your visit.',
    },
    {
      number: '03',
      title: 'Plan Your Trip',
      description: 'Add temples to your plan and optimize your itinerary.',
    },
    {
      number: '04',
      title: 'Visit Peacefully',
      description: 'Arrive at the right time and enjoy a peaceful darshan.',
    },
  ]

  const stats = [
    { value: '50+', label: 'Temples' },
    { value: '24/7', label: 'Live Updates' },
    { value: '20+', label: 'Festivals Tracked' },
    { value: '16', label: 'Hours Forecast' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Smart Algorithms
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              About <span className="text-primary">Temple-Yatra</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Plan smarter pilgrimages with real-time crowd predictions.
              We help millions of devotees find the perfect time to visit their favorite temples.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link to="/">
                  Explore Temples
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/plan-visit">View Crowd Calendar</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              Every year, millions of devotees travel to temples across India seeking spiritual fulfillment.
              However, overcrowded temples can turn a peaceful pilgrimage into a stressful experience.
            </p>
            <p className="text-lg text-muted-foreground">
              <strong>Temple-Yatra</strong> was created to solve this problem. We use data-driven predictions
              to help you plan your temple visits during less crowded times, ensuring a more peaceful
              and meaningful spiritual experience.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">
              Four simple steps to a peaceful pilgrimage
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={step.number} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <span className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                    {step.number}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Key Features</h2>
            <p className="text-muted-foreground mt-2">
              Everything you need to plan the perfect temple visit
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Data Sources Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">How We Predict Crowds</h2>
              <p className="text-muted-foreground mt-2">
                Our predictions are based on multiple data sources
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <h4 className="font-medium">Historical Crowd Patterns</h4>
                  <p className="text-sm text-muted-foreground">
                    Analysis of visitor trends over time to identify busy and quiet periods.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                <div>
                  <h4 className="font-medium">Festival Calendar</h4>
                  <p className="text-sm text-muted-foreground">
                    Government holiday calendar and major religious festival dates integrated into predictions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <h4 className="font-medium">Time-of-Day Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Hourly patterns showing peak and off-peak times throughout the day.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <div>
                  <h4 className="font-medium">Day & Season Factors</h4>
                  <p className="text-sm text-muted-foreground">
                    Weekends, special days, and seasonal variations factored into forecasts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <Building2 className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-3xl font-bold">Ready to Plan Your Pilgrimage?</h2>
            <p className="text-muted-foreground">
              Join thousands of devotees who use Temple-Yatra to plan peaceful temple visits.
              Start exploring temples and find the perfect time for your next darshan.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link to="/">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
