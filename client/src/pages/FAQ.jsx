import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown, ChevronUp, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function FAQ() {
  const [openItems, setOpenItems] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'crowd', label: 'Crowd Predictions' },
    { id: 'planning', label: 'Trip Planning' },
    { id: 'account', label: 'Account & Data' },
    { id: 'technical', label: 'Technical' },
  ]

  const faqs = [
    {
      category: 'getting-started',
      question: 'What is Temple-Yatra?',
      answer: 'Temple-Yatra is a web application that helps you plan temple visits by providing real-time crowd predictions. We analyze historical data, festival calendars, and time patterns to forecast crowd levels, helping you choose the best time for a peaceful darshan.'
    },
    {
      category: 'getting-started',
      question: 'Do I need an account to use Temple-Yatra?',
      answer: 'No, you can browse temples and view crowd predictions without an account. However, creating a free account allows you to save trip plans, track your visit history, mark favorite temples, and receive notifications about your saved trips.'
    },
    {
      category: 'getting-started',
      question: 'Is Temple-Yatra free to use?',
      answer: 'Yes, Temple-Yatra is completely free to use. All features including crowd predictions, trip planning, and visit tracking are available at no cost.'
    },
    {
      category: 'crowd',
      question: 'How are crowd levels calculated?',
      answer: 'Our crowd predictions are based on multiple factors including: historical visitor patterns, day of the week (weekends tend to be busier), time of day (morning and evening aartis are peak times), festival and holiday calendar, seasonal variations, and special events. Our algorithm combines these factors to provide an estimated crowd percentage and level (Low, Medium, High).'
    },
    {
      category: 'crowd',
      question: 'How accurate are the crowd predictions?',
      answer: 'Our predictions are estimates based on historical patterns and data analysis. While we strive for accuracy, actual conditions may vary due to unexpected events, weather, or other factors. We recommend using our predictions as a planning guide rather than absolute values.'
    },
    {
      category: 'crowd',
      question: 'What do the crowd level colors mean?',
      answer: 'We use a color-coded system: Green (Low, 0-40%) indicates the best time to visit with minimal crowds and short wait times. Yellow (Medium, 41-70%) means moderate crowds with some waiting expected. Red (High, 71-100%) indicates peak times with heavy crowds and longer wait times.'
    },
    {
      category: 'crowd',
      question: 'How often is the crowd data updated?',
      answer: 'Crowd predictions are calculated in real-time based on the current date and time. The data refreshes automatically every 60 seconds when you have the app open. You can also manually refresh by clicking the refresh button.'
    },
    {
      category: 'planning',
      question: 'How do I plan a temple trip?',
      answer: 'To plan a trip: 1) Browse temples on the home page, 2) Click "Add to Plan" on temples you want to visit, 3) Go to the Plan Trip page, 4) Set your trip name and date, 5) Reorder temples as needed, 6) Use "Optimize by Crowd" to automatically arrange temples by lowest crowd levels, 7) Save your plan if you have an account.'
    },
    {
      category: 'planning',
      question: 'Can I save multiple trip plans?',
      answer: 'Yes, if you have an account, you can save multiple trip plans. Each plan can have a unique name and date. You can view all your saved plans in the "My Plans" section and load them back for editing.'
    },
    {
      category: 'planning',
      question: 'What does "Optimize by Crowd" do?',
      answer: 'The "Optimize by Crowd" feature automatically reorders temples in your plan to visit the least crowded temples first. This helps you maximize your time at temples with lower crowds early in the day.'
    },
    {
      category: 'planning',
      question: 'How does the Crowd Calendar work?',
      answer: 'The Crowd Calendar shows color-coded crowd predictions for entire months. You can select up to 3 temples to compare. Click on any date to see an hourly breakdown showing the best times to visit. This helps you choose the best day and time for your visit.'
    },
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click "Sign Up" in the top navigation. Enter your name, email, and create a password (minimum 6 characters). You\'ll be logged in immediately after registration.'
    },
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Currently, password reset is done by contacting our support team at support@temple-yatra.com. We\'re working on adding a self-service password reset feature.'
    },
    {
      category: 'account',
      question: 'Can I delete my account?',
      answer: 'Yes, you can delete your account from the Profile page. This will permanently remove all your data including saved plans, visit history, and favorites. This action cannot be undone.'
    },
    {
      category: 'account',
      question: 'Is my data secure?',
      answer: 'Yes, we take data security seriously. Your password is encrypted and never stored in plain text. We use secure connections (HTTPS) for all data transmission. We do not share your personal information with third parties. See our Privacy Policy for more details.'
    },
    {
      category: 'technical',
      question: 'Which browsers are supported?',
      answer: 'Temple-Yatra works best on modern browsers including Chrome (version 90+), Firefox (version 90+), Safari (version 14+), and Edge (version 90+). We recommend keeping your browser updated for the best experience.'
    },
    {
      category: 'technical',
      question: 'Does Temple-Yatra work on mobile devices?',
      answer: 'Yes, Temple-Yatra is fully responsive and works on smartphones and tablets. The interface adapts to your screen size for optimal viewing. You can access it through your mobile browser.'
    },
    {
      category: 'technical',
      question: 'Does the app work offline?',
      answer: 'Currently, Temple-Yatra requires an internet connection to fetch temple data and crowd predictions. Offline support is on our roadmap for future updates.'
    },
    {
      category: 'technical',
      question: 'How do I report a bug or suggest a feature?',
      answer: 'We welcome your feedback! You can report bugs or suggest features through our Contact page. Please include as much detail as possible, such as what you were doing when the issue occurred and any error messages you saw.'
    },
  ]

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted-foreground">
            Find answers to common questions about Temple-Yatra
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No questions found matching your search.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('')
                    setActiveCategory('all')
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredFaqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">
                      {categories.find(c => c.id === faq.category)?.label}
                    </Badge>
                    <span className="font-medium">{faq.question}</span>
                  </div>
                  {openItems[index] ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openItems[index] && (
                  <CardContent className="pt-0 pb-4 px-6 animate-fadeIn">
                    <p className="text-muted-foreground pl-[calc(theme(spacing.3)+4rem)]">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Still Need Help */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find what you're looking for? We're here to help.
            </p>
            <Button asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
