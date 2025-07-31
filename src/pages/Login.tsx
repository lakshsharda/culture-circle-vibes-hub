import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface LoginProps {
  onLogin: () => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast({
        title: "Welcome back! 🎉",
        description: "You've successfully logged in to CultureCircle."
      });
      onLogin();
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "Invalid email or password.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-primary via-warm-orange to-warm-yellow rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-float">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold bg-button-gradient bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to continue your cultural journey
          </p>
        </div>

        <Card className="bg-gradient-to-br from-white/90 via-secondary/20 to-accent/10 shadow-2xl rounded-2xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Sign In
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="pl-12 h-12 border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    className="pl-12 pr-12 h-12 border-border/50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  to="#" 
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                variant="warm" 
                className="w-full font-bold h-12 text-base shadow-lg hover:scale-105 transition-transform"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-6 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link 
                  to="/signup" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link to="#" className="text-primary hover:text-primary/80">Terms of Service</Link>{" "}
            and{" "}
            <Link to="#" className="text-primary hover:text-primary/80">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;