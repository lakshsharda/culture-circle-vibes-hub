import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] flex items-center justify-center py-10 px-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-primary via-warm-orange to-warm-yellow rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
            <Users className="h-16 w-16 text-white animate-pulse" />
          </div>
          <h1 className="text-6xl font-extrabold text-primary mb-6 drop-shadow-lg animate-fade-in-up">
            Welcome to <span className="bg-gradient-to-r from-primary via-warm-orange to-warm-yellow bg-clip-text text-transparent">CultureCircle</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in-up">
            Your cultural journey starts here! Connect with like-minded people and discover amazing experiences together.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
          <Link to="/signup">
            <Button variant="warm" size="lg" className="font-bold shadow-lg hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="warm-outline" size="lg" className="font-bold shadow-lg hover:scale-105 transition-transform">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
