import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] flex items-center justify-center py-10 px-6">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary via-warm-orange to-warm-yellow rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
            <AlertTriangle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-6xl font-extrabold text-primary mb-4 drop-shadow-lg">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link to="/">
          <Button variant="warm" className="font-bold shadow-lg hover:scale-105 transition-transform">
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
