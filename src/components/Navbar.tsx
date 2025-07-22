import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Users } from "lucide-react";

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Navbar = ({ isAuthenticated, onLogout }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: "Home", path: "/", public: true },
    { name: "Signup", path: "/signup", public: true, hideWhenAuth: true },
    { name: "Login", path: "/login", public: true, hideWhenAuth: true },
    { name: "Dashboard", path: "/dashboard", public: false },
    { name: "Recommendations", path: "/recommendations", public: false },
  ];

  const visibleItems = navItems.filter(item =>
    (item.public || isAuthenticated) && !(isAuthenticated && item.hideWhenAuth)
  );

  // Remove private nav items after logout by clearing isAuthenticated immediately
  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 px-6 py-3 bg-white/60 dark:bg-card/80 backdrop-blur-md shadow-lg border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="p-2 bg-button-gradient rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Users className="h-6 w-6 text-white animate-float group-hover:animate-bounce" />
          </div>
          <span className="text-2xl font-extrabold bg-button-gradient bg-clip-text text-transparent group-hover:drop-shadow-lg transition-all duration-300">
            CultureCircle
          </span>
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-semibold text-lg transition-colors duration-200 px-3 py-1 rounded-full ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary shadow-md"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Button
              variant="warm-outline"
              size="sm"
              onClick={handleLogout}
              className="ml-4 px-6 py-2 rounded-full font-bold shadow-md hover:scale-105 transition-transform"
            >
              Logout
            </Button>
          )}
        </div>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/90 dark:bg-card/90 shadow-lg border-t border-border backdrop-blur-md">
          <div className="px-6 py-4 space-y-3">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block font-semibold text-lg transition-colors duration-200 px-3 py-2 rounded-full ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary shadow-md"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Button
                variant="warm-outline"
                size="sm"
                onClick={handleLogout}
                className="w-full px-6 py-2 rounded-full font-bold shadow-md mt-2"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;