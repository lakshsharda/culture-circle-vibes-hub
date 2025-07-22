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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent relative overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 px-6 flex flex-col items-center justify-center">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/30 via-warm-yellow/20 to-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s'}} />
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tr from-warm-orange/30 via-warm-red/20 to-primary/20 rounded-full blur-2xl animate-pulse" style={{animationDuration: '8s'}} />
          <div className="absolute top-1/2 left-1/3 w-1/4 h-1/4 bg-gradient-to-br from-warm-yellow/30 to-primary/10 rounded-full blur-2xl animate-pulse" style={{animationDuration: '7s'}} />
        </div>
        {/* Floating Icons */}
        <div className="absolute top-24 left-12 opacity-40 animate-bounce-slow">
          <Heart className="h-10 w-10 text-warm-red" />
        </div>
        <div className="absolute bottom-24 right-16 opacity-40 animate-bounce-slow" style={{animationDelay: '1.5s'}}>
          <Users className="h-12 w-12 text-warm-orange" />
        </div>
        <div className="container mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6 shadow-lg">
              <Sparkles className="h-4 w-4 text-warm-yellow animate-spin-slow" />
              <span className="text-sm font-medium text-foreground">AI-Powered Cultural Recommendations</span>
            </div>
          </div>
          <h1 className="text-7xl md:text-8xl font-extrabold text-foreground mb-8 leading-tight drop-shadow-xl">
            Culture<span className="bg-button-gradient bg-clip-text text-transparent animate-gradient-x">Circle</span>
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Where shared tastes turn into <span className="text-primary font-semibold">unforgettable journeys</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group shadow-2xl text-lg px-8 py-4 rounded-full font-bold">
                <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={isAuthenticated ? "/dashboard" : "#"}>
              <Button 
                variant={isAuthenticated ? "warm-outline" : "outline"} 
                size="xl"
                disabled={!isAuthenticated}
                className={`shadow-lg text-lg px-8 py-4 rounded-full font-bold ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Users className="mr-2 h-5 w-5" />
                Explore Dashboard
              </Button>
            </Link>
          </div>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-8 opacity-75">
              * Dashboard access requires authentication
            </p>
          )}
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 drop-shadow-lg">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to discover amazing experiences with your cultural community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <Card key={index} className="bg-gradient-to-br from-card via-secondary/30 to-accent/20 p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border-0 relative overflow-hidden group">
                <CardContent className="text-center p-0 relative z-10">
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-button-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 animate-float">
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
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
          <h3 className="text-3xl font-bold text-foreground mb-6 drop-shadow-lg">
            Ready to build your cultural community?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have discovered amazing experiences through shared cultural interests.
          </p>
          <Link to="/signup">
            <Button variant="warm" size="xl" className="group text-lg px-8 py-4 rounded-full font-bold shadow-xl">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-card py-12 px-6 border-t mt-12">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-6 w-6 text-primary animate-float" />
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