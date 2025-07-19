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
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary to-accent py-20 px-6">
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 leading-tight">
            Culture<span className="bg-button-gradient bg-clip-text text-transparent">Circle</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Where shared tastes turn into unforgettable journeys.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group">
                Sign Up Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link to={isAuthenticated ? "/dashboard" : "#"}>
              <Button 
                variant={isAuthenticated ? "warm-outline" : "outline"} 
                size="xl"
                disabled={!isAuthenticated}
                className={!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}
              >
                Explore Dashboard
              </Button>
            </Link>
          </div>
          
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-4">
              * Dashboard access requires authentication
            </p>
          )}
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-warm-red rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-warm-orange rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-warm-yellow rounded-full blur-3xl"></div>
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
              <Card key={index} className="bg-card p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 border-0">
                <CardContent className="text-center p-0">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-button-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-bold text-primary bg-accent px-3 py-1 rounded-full">
                      Step {index + 1}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
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