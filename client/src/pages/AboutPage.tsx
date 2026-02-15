import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, ArrowLeft, Shield, Database, Clock, Mail, Users, Globe, Award, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";

export default function AboutPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="About Scholar.name - Our Mission & Team"
        description="Learn about Scholar.name, our mission to help researchers showcase their work, how we source data, and our commitment to accuracy and privacy."
        url="https://scholar.name/about"
      />
      
      <nav className="sticky top-0 z-50 nav-premium">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex items-center">
              <BookOpen className="h-7 w-7 text-white mr-2" />
              <span className="text-lg font-semibold text-white">Scholar.name</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="text-white/80 hover:text-white text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Mission Section */}
        <section className="mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary">Our Mission</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">
            Helping Researchers Showcase Their Work
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Scholar.name was built to solve a simple problem: researchers deserve better than a bare 
            Google Scholar listing or an outdated faculty page. Your work matters, and how you present 
            it should too.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We believe every researcher should have a professional, up-to-date portfolio that reflects 
            their contributions to science — without spending hours maintaining it manually.
          </p>
        </section>

        {/* Who Built This */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <Badge className="mb-3">Built by Researchers, for Researchers</Badge>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Scholar.name was created by academics who were frustrated with the lack of good 
                    options for presenting research online. We understand the academic world because 
                    we live it — the pressure to publish, the need to stand out for grants and positions, 
                    and the desire to have your work recognized.
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    We're a small, focused team committed to building the best research portfolio platform in the world.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Sources Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Where Your Data Comes From</h2>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  OpenAlex — Our Primary Data Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  All publication data on Scholar.name comes from{" "}
                  <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    OpenAlex <ExternalLink className="w-3 h-3" />
                  </a>, 
                  a free and open catalog of the world's scholarly papers, researchers, and institutions.
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>250+ million works</strong> indexed from major publishers and databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Updated daily</strong> with new publications and citations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Open and transparent</strong> — anyone can verify the source data</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  What's Automated vs. What You Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">✅ Automated (from OpenAlex)</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Publication list & metadata</li>
                      <li>• Citation counts & metrics</li>
                      <li>• Co-author networks</li>
                      <li>• Research topics</li>
                      <li>• Affiliation history</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">🎨 You Control</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Bio & profile description</li>
                      <li>• Profile photo</li>
                      <li>• Which publications to feature</li>
                      <li>• Custom sections (awards, grants)</li>
                      <li>• Theme & visual design</li>
                      <li>• Privacy (public/private)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Data Accuracy Commitment
                </h4>
                <p className="text-muted-foreground text-sm mb-4">
                  We know data accuracy is crucial. Publication matching — especially for common names, 
                  name variations, and transliterated names — is an ongoing challenge in bibliometrics. 
                  We sync directly from OpenAlex and show you exactly when data was last updated.
                </p>
                <p className="text-muted-foreground text-sm">
                  <strong>If something looks wrong:</strong> You can report issues directly from your profile, 
                  and we'll investigate. Some issues may need to be corrected at the source (OpenAlex), 
                  and we'll guide you through that process.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact & Support */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold">Contact & Support</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Support</CardTitle>
                <CardDescription>Best for detailed questions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  <a href="mailto:support@scholar.name" className="text-primary hover:underline">
                    support@scholar.name
                  </a>
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Response time: 24-48 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Chat</CardTitle>
                <CardDescription>Quick questions & help</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  Available via the chat widget in the bottom-right corner of the page.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Usually responds within minutes during business hours</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>
              <strong>For urgent issues</strong> affecting your published profile (broken links, incorrect data showing publicly), 
              please mark your message as urgent and we'll prioritize it.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 bg-gradient-to-br from-primary/5 to-background rounded-2xl border">
          <h2 className="text-2xl font-bold mb-4">Ready to Create Your Portfolio?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join researchers from leading institutions who trust Scholar.name to showcase their work.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/signup")}>
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/")}>
              Learn More
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Scholar.name. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
