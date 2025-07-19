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
    { name: "Signup", path: "/signup", public: true },
    { name: "Login", path: "/login", public: true },
    { name: "Dashboard", path: "/dashboard", public: false },
    { name: "Recommendations", path: "/recommendations", public: false },
  ];

  const visibleItems = navItems.filter(item => 
    item.public || isAuthenticated
  );

  return (
    <nav className="sticky top-0 bg-card shadow-md z-50 px-6 py-3">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 bg-button-gradient rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold bg-button-gradient bg-clip-text text-transparent">
            CultureCircle
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-medium transition-colors duration-200 ${
                isActive(item.path)
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {isAuthenticated && (
            <Button
              variant="warm-outline"
              size="sm"
              onClick={onLogout}
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-card shadow-lg border-t">
          <div className="px-6 py-4 space-y-3">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-primary"
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
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full"
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