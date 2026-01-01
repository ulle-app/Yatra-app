import { Link } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Terms() {
  const lastUpdated = 'January 1, 2026'

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Temple-Yatra ("the Service"), you agree to be bound by these Terms
              of Service ("Terms"). If you disagree with any part of the terms, you may not access the
              Service.
            </p>
            <p className="text-muted-foreground mt-4">
              These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Temple-Yatra provides crowd prediction information for temples across India to help users
              plan their visits. Our Service includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li>Live crowd level predictions for temples</li>
              <li>Festival and holiday calendar integration</li>
              <li>Trip planning and itinerary management tools</li>
              <li>Hourly crowd forecasts</li>
              <li>Visit history tracking and ratings</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              The Service is provided for informational purposes only. Actual crowd conditions may vary
              from our predictions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground">
              When you create an account with us, you must provide accurate, complete, and current
              information. Failure to do so constitutes a breach of the Terms.
            </p>
            <p className="text-muted-foreground mt-4">
              You are responsible for safeguarding the password that you use to access the Service and
              for any activities or actions under your password. You agree not to disclose your password
              to any third party.
            </p>
            <p className="text-muted-foreground mt-4">
              You must notify us immediately upon becoming aware of any breach of security or
              unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to use the Service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To collect or track the personal information of others</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>To interfere with or circumvent the security features of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality are and will remain the
              exclusive property of Temple-Yatra and its licensors. The Service is protected by copyright,
              trademark, and other laws.
            </p>
            <p className="text-muted-foreground mt-4">
              Our trademarks and trade dress may not be used in connection with any product or service
              without the prior written consent of Temple-Yatra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. User Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of any content you submit to the Service, including trip plans,
              ratings, and notes. By submitting content, you grant us a worldwide, non-exclusive,
              royalty-free license to use, reproduce, modify, and display such content in connection
              with providing the Service.
            </p>
            <p className="text-muted-foreground mt-4">
              You represent and warrant that you own or have the necessary rights to submit the content
              and that the content does not violate any third party's rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TEMPLE-YATRA EXPRESSLY
              DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
              TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground mt-4">
              We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.
              Crowd predictions are estimates based on historical data and may not reflect actual
              conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              IN NO EVENT SHALL TEMPLE-YATRA, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR
              AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account immediately, without prior notice or liability,
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="text-muted-foreground mt-4">
              Upon termination, your right to use the Service will immediately cease. If you wish to
              terminate your account, you may simply discontinue using the Service or contact us to
              delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
              If a revision is material, we will try to provide at least 30 days notice prior to any new
              terms taking effect.
            </p>
            <p className="text-muted-foreground mt-4">
              By continuing to access or use our Service after those revisions become effective, you
              agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed and construed in accordance with the laws of India, without
              regard to its conflict of law provisions.
            </p>
            <p className="text-muted-foreground mt-4">
              Our failure to enforce any right or provision of these Terms will not be considered a
              waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li>By email: support@temple-yatra.com</li>
              <li>By visiting our <Link to="/contact" className="text-primary hover:underline">Contact page</Link></li>
            </ul>
          </section>
        </div>

        <Separator className="my-8" />

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            By using Temple-Yatra, you agree to these Terms of Service.
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
