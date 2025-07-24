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
    <nav className="fixed top-0 left-0 w-full z-50 px-8 py-3 bg-white/70 dark:bg-[#23272f]/80 backdrop-blur-xl shadow-2xl border-b border-primary/20 glassy transition-all duration-500">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group select-none">
          <div className="p-2 bg-gradient-to-br from-primary via-warm-yellow to-accent rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300 animate-float">
            <Users className="h-7 w-7 text-white animate-float group-hover:animate-bounce" />
          </div>
          <span className="text-3xl font-extrabold bg-gradient-to-r from-primary via-warm-yellow to-accent bg-clip-text text-transparent group-hover:drop-shadow-lg transition-all duration-300 tracking-tight">
            CultureCircle
          </span>
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-semibold text-lg px-5 py-2 rounded-full transition-all duration-200 shadow-sm border-2 border-transparent hover:border-primary/40 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/40 outline-none ${
                isActive(item.path)
                  ? "bg-gradient-to-r from-primary/20 via-warm-yellow/20 to-accent/20 text-primary border-primary/60 shadow-lg"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
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
              className="ml-4 px-7 py-2 rounded-full font-bold shadow-lg hover:scale-110 transition-transform bg-gradient-to-r from-primary/20 via-warm-yellow/20 to-accent/20 border-2 border-primary/30 text-primary"
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
        <div className="md:hidden fixed top-[64px] left-0 right-0 bg-white/95 dark:bg-[#23272f]/95 shadow-2xl border-t border-primary/20 backdrop-blur-xl z-50 animate-fade-in-down">
          <div className="px-8 py-6 space-y-3">
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block font-semibold text-lg px-5 py-3 rounded-full transition-all duration-200 shadow-sm border-2 border-transparent hover:border-primary/40 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/40 outline-none ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-primary/20 via-warm-yellow/20 to-accent/20 text-primary border-primary/60 shadow-lg"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
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
                className="w-full px-7 py-3 rounded-full font-bold shadow-lg mt-2 bg-gradient-to-r from-primary/20 via-warm-yellow/20 to-accent/20 border-2 border-primary/30 text-primary"
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