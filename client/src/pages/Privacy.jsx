import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Privacy() {
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
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Temple-Yatra ("we," "our," or "us"). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our website and services.
            </p>
            <p className="text-muted-foreground mt-4">
              Please read this privacy policy carefully. If you do not agree with the terms of this
              privacy policy, please do not access the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you register</li>
              <li><strong>Trip Plans:</strong> Temple selections, trip dates, and itinerary preferences</li>
              <li><strong>Visit History:</strong> Records of temples visited, ratings, and notes you provide</li>
              <li><strong>Favorites:</strong> Temples you've marked as favorites</li>
              <li><strong>Usage Data:</strong> How you interact with our service, pages visited, features used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and maintain our service</li>
              <li>To personalize your experience with crowd predictions</li>
              <li>To save and sync your trip plans across devices</li>
              <li>To send you notifications about your saved trips</li>
              <li>To improve our crowd prediction algorithms</li>
              <li>To respond to your inquiries and provide support</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Data Storage & Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational security measures to protect your
              personal information. Your data is stored on secure servers and we use industry-standard
              encryption for data transmission.
            </p>
            <p className="text-muted-foreground mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Cookies & Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to track activity on our service and
              hold certain information. Cookies are files with a small amount of data that are stored
              on your device.
            </p>
            <p className="text-muted-foreground mt-4">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being
              sent. However, if you do not accept cookies, you may not be able to use some portions of
              our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Third-Party Services</h2>
            <p className="text-muted-foreground">
              We may employ third-party companies and individuals to facilitate our service, provide
              the service on our behalf, or assist us in analyzing how our service is used. These third
              parties have access to your personal information only to perform these tasks on our behalf
              and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise any of these rights, please contact us at support@temple-yatra.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and you are
              aware that your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update our Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date at the
              top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us:
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
            By using Temple-Yatra, you agree to this Privacy Policy.
          </p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
