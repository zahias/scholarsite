import { Link } from "wouter";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center">
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">ScholarSite</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and ScholarSite ("Company", "we", "our", or "us") governing your access to and use of our research portfolio website service.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access or use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ScholarSite provides a platform for researchers and academics to create professional portfolio websites that showcase their publications, research impact, and academic achievements. Our service integrates with OpenAlex to automatically retrieve and display publicly available academic data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The service includes website hosting, publication analytics, automatic data synchronization, and customization features as described in our pricing plans.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use certain features of our service, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate.
            </p>

            <h3 className="text-xl font-medium mb-3">3.2 Account Security</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-medium mb-3">3.3 Account Termination</h3>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in activities that may harm the service or other users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Billing</h2>
            
            <h3 className="text-xl font-medium mb-3">4.1 Pricing Plans</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our service is offered through various subscription plans with different features and pricing. Current pricing is displayed on our website and is subject to change with reasonable notice.
            </p>

            <h3 className="text-xl font-medium mb-3">4.2 Payment</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Subscription fees are billed in advance on a monthly or annual basis. All payments are non-refundable except as required by law or as explicitly stated in these Terms.
            </p>

            <h3 className="text-xl font-medium mb-3">4.3 Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You may cancel your subscription at any time. Upon cancellation, you will retain access to the service until the end of your current billing period. After that, your profile may be deactivated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use the service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the intellectual property rights of others</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Create profiles for researchers without their authorization</li>
              <li>Upload false, misleading, or fabricated academic information</li>
              <li>Interfere with or disrupt the service or its infrastructure</li>
              <li>Attempt to gain unauthorized access to any systems or data</li>
              <li>Use automated means to access the service without our permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-3">6.1 Our Content</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The service, including its original content, features, and functionality, is owned by ScholarSite and is protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-medium mb-3">6.2 Your Content</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain ownership of any content you submit to the service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute such content in connection with providing the service.
            </p>

            <h3 className="text-xl font-medium mb-3">6.3 Third-Party Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              Academic data displayed on your profile is sourced from OpenAlex and other third-party providers. Such data remains subject to the terms and conditions of its original sources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              While we strive to ensure the accuracy of academic data displayed on our platform, we rely on third-party sources such as OpenAlex. We make no warranties regarding the accuracy, completeness, or reliability of such data.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you notice any inaccuracies in your profile data, you may request corrections through our support channels. However, some corrections may require updates at the original data source.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We do not warrant that the service will be uninterrupted, secure, or error-free, or that any defects will be corrected.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SCHOLARSITE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless ScholarSite and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Modifications to Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may revise these Terms from time to time. We will provide notice of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ScholarSite operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us through{" "}
              <Link href="/contact" className="text-primary hover:underline">our contact page</Link>.
            </p>
          </section>
        </article>
      </div>

      <footer className="bg-muted/50 border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ScholarSite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
