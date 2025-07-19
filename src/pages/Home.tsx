import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Heart, Sparkles, ArrowRight } from "lucide-react";

interface HomeProps {
  isAuthenticated: boolean;
}

const Home = ({ isAuthenticated }: HomeProps) => {
  const howItWorksSteps = [
    {
      icon: Users,
      title: "Create Your Cultural Profile",
      description: "Tell us about your favorite music, movies, books, and travel destinations. Your unique tastes are the foundation of your cultural identity."
    },
    {
      icon: Heart,
      title: "Form a Group",
      description: "Connect with friends or meet new people who share similar cultural interests. Groups work better when everyone's on the same wavelength."
    },
    {
      icon: Sparkles,
      title: "Get AI-Powered Recommendations",
      description: "Receive personalized suggestions for trips, playlists, restaurants, and experiences tailored to your group's collective preferences."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary to-accent py-24 px-6">
        <div className="container mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-warm-yellow" />
              <span className="text-sm font-medium text-foreground">AI-Powered Cultural Recommendations</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold text-foreground mb-8 leading-tight">
            Culture<span className="bg-button-gradient bg-clip-text text-transparent">Circle</span>
          </h1>
          
          <p className="text-xl md:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Where shared tastes turn into <span className="text-primary font-semibold">unforgettable journeys</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group shadow-2xl">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link to={isAuthenticated ? "/dashboard" : "#"}>
              <Button 
                variant={isAuthenticated ? "warm-outline" : "outline"} 
                size="xl"
                disabled={!isAuthenticated}
                className={`shadow-lg ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Users className="mr-2 h-5 w-5" />
                Explore Dashboard
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto text-center">
            <div>
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Cultural Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">25K+</div>
              <div className="text-sm text-muted-foreground">Happy Users</div>
            </div>
          </div>
          
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-8 opacity-75">
              * Dashboard access requires authentication
            </p>
          )}
        </div>
        
        {/* Enhanced background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-warm-red rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-warm-orange rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-warm-yellow rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-primary rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-32 left-1/4 opacity-30">
          <Heart className="h-8 w-8 text-warm-red animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-32 right-1/4 opacity-30">
          <Users className="h-10 w-10 text-warm-orange animate-bounce" style={{ animationDelay: '1.5s' }} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to discover amazing experiences with your cultural community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <Card key={index} className="bg-card p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 border-0 relative overflow-hidden group">
                <CardContent className="text-center p-0 relative z-10">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-button-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="h-10 w-10 text-white" />
                    </div>
                    <span className="text-sm font-bold text-primary bg-accent px-4 py-2 rounded-full shadow-sm">
                      Step {index + 1}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {step.description}
                  </p>
                </CardContent>
                
                {/* Card background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Connection line */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent transform -translate-y-1/2"></div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-secondary to-accent">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to build your cultural community?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have discovered amazing experiences through shared cultural interests.
          </p>
          <Link to="/signup">
            <Button variant="warm" size="xl" className="group">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 px-6 border-t">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">CultureCircle</span>
              </div>
              <p className="text-muted-foreground">
                Connecting cultures, creating experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4">Product</h4>
              <div className="space-y-2">
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">Features</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">API</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4">Company</h4>
              <div className="space-y-2">
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">About</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">Blog</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">Careers</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4">Resources</h4>
              <div className="space-y-2">
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">Documentation</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">GitHub</Link>
                <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">Support</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CultureCircle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;