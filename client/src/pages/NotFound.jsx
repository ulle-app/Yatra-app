import { Link } from 'react-router-dom'
import { Home, Search, HelpCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="container max-w-2xl text-center space-y-8 py-16">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-[150px] md:text-[200px] font-bold text-primary/10 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🛕</div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Oops! It seems like this temple path doesn't exist.
            The page you're looking for might have been moved or doesn't exist.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/contact">
              <HelpCircle className="mr-2 h-4 w-4" />
              Get Help
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Or try one of these:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="text-sm text-primary hover:underline"
            >
              Browse Temples
            </Link>
            <Link
              to="/crowd-calendar"
              className="text-sm text-primary hover:underline"
            >
              Crowd Calendar
            </Link>
            <Link
              to="/festivals"
              className="text-sm text-primary hover:underline"
            >
              Festivals
            </Link>
            <Link
              to="/faq"
              className="text-sm text-primary hover:underline"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
