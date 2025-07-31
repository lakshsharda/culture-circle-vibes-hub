import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Recommendations from "./pages/Recommendations";
import NotFound from "./pages/NotFound";
import EditProfile from "./pages/EditProfile";

const queryClient = new QueryClient();

const App = () => {
  // Dummy authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleSignup = (userData: any) => {
    // TODO: Handle user registration logic here
    console.log("User signed up:", userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen">
            <Navbar 
              isAuthenticated={isAuthenticated} 
              onLogout={handleLogout} 
            />
            <Routes>
              <Route 
                path="/" 
                element={<Home isAuthenticated={isAuthenticated} />} 
              />
              <Route 
                path="/signup" 
                element={<Signup onSignup={handleSignup} />} 
              />
              <Route 
                path="/login" 
                element={<Login onLogin={handleLogin} />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  isAuthenticated ? (
                    <Dashboard />
                  ) : (
                    <NotFound />
                  )
                } 
              />
              <Route 
                path="/groups" 
                element={
                  isAuthenticated ? (
                    <Groups />
                  ) : (
                    <NotFound />
                  )
                } 
              />
              <Route 
                path="/recommendations" 
                element={
                  isAuthenticated ? (
                    <Recommendations />
                  ) : (
                    <NotFound />
                  )
                } 
              />
              <Route 
                path="/edit-profile" 
                element={
                  isAuthenticated ? (
                    <EditProfile />
                  ) : (
                    <NotFound />
                  )
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
