import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, User, Music, MapPin, Target, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SignupProps {
  onSignup: (userData: any) => void;
}

const Signup = ({ onSignup }: SignupProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: "",
    email: "",
    password: "",
    
    // Step 2: Your Vibes
    musicArtists: [] as string[],
    movies: [] as string[],
    books: [] as string[],
    
    // Step 3: Your Tastes
    travelDestinations: [] as string[],
    cuisines: [] as string[],
    tvShows: [] as string[],
    
    // Step 4: Your Intent
    recommendationType: "",
    vibeDescription: ""
  });

  const [currentInput, setCurrentInput] = useState("");

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddToArray = (field: keyof typeof formData, value: string) => {
    if (value.trim() && Array.isArray(formData[field])) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      setCurrentInput("");
    }
  };

  const handleRemoveFromArray = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // TODO: Handle backend logic here
    console.log("Signup data:", formData);
    
    toast({
      title: "Welcome to CultureCircle! 🎉",
      description: "Your profile has been created successfully."
    });
    
    onSignup(formData);
    navigate("/dashboard");
  };

  const stepIcons = [User, Music, MapPin, Target];
  const stepTitles = ["Basic Info", "Your Vibes", "Your Tastes", "Your Intent"];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-extrabold text-primary">Join CultureCircle</h1>
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-2 mb-6" />
          
          <div className="flex justify-between">
            {stepTitles.map((title, index) => {
              const StepIcon = stepIcons[index];
              const isActive = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;
              
              return (
                <div key={title} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isCompleted
                      ? "bg-button-gradient text-white"
                      : isActive
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium text-center hidden sm:block ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              {stepTitles[currentStep - 1]}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a password"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Your Vibes */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <MultiSelectInput
                  label="Favorite Music Artists"
                  placeholder="Add an artist (e.g., Taylor Swift, The Beatles)"
                  items={formData.musicArtists}
                  onAdd={(value) => handleAddToArray("musicArtists", value)}
                  onRemove={(index) => handleRemoveFromArray("musicArtists", index)}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                />
                
                <MultiSelectInput
                  label="Favorite Movies"
                  placeholder="Add a movie (e.g., Inception, The Godfather)"
                  items={formData.movies}
                  onAdd={(value) => handleAddToArray("movies", value)}
                  onRemove={(index) => handleRemoveFromArray("movies", index)}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                />
                
                <MultiSelectInput
                  label="Favorite Books"
                  placeholder="Add a book (e.g., 1984, Harry Potter)"
                  items={formData.books}
                  onAdd={(value) => handleAddToArray("books", value)}
                  onRemove={(index) => handleRemoveFromArray("books", index)}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                />
              </div>
            )}

            {/* Step 3: Your Tastes */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <MultiSelectInput
                  label="Favorite Travel Destinations"
                  placeholder="Add a destination (e.g., Tokyo, Paris)"
                  items={formData.travelDestinations}
                  onAdd={(value) => handleAddToArray("travelDestinations", value)}
                  onRemove={(index) => handleRemoveFromArray("travelDestinations", index)}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                />
                
                <MultiSelectInput
                  label="Favorite Foods/Cuisines"
                  placeholder="Add a cuisine (e.g., Italian, Sushi)"
                  items={formData.cuisines}
                  onAdd={(value) => handleAddToArray("cuisines", value)}
                  onRemove={(index) => handleRemoveFromArray("cuisines", index)}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                />
                
                <MultiSelectInput
                  label="Favorite TV Shows or Fashion Brands"
                  placeholder="Add a show or brand (e.g., Breaking Bad, Nike)"
                  items={formData.tvShows}
                  onAdd={(value) => handleAddToArray("tvShows", value)}
                  onRemove={(index) => handleRemoveFromArray("tvShows", index)}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                />
              </div>
            )}

            {/* Step 4: Your Intent */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label>What do you want recommendations for?</Label>
                  <Select 
                    value={formData.recommendationType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recommendationType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your main interest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trip-planning">Trip Planning</SelectItem>
                      <SelectItem value="playlist">Playlist</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="something-fun">Something Fun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="vibeDescription">Describe your vibe in 3 words</Label>
                  <Textarea
                    id="vibeDescription"
                    value={formData.vibeDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, vibeDescription: e.target.value }))}
                    placeholder="e.g., adventurous, artistic, spontaneous"
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  variant="warm"
                  onClick={handleNext}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="warm"
                  onClick={handleSubmit}
                  className="flex items-center"
                >
                  Complete Signup
                  <CheckCircle className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Multi-select input component
interface MultiSelectInputProps {
  label: string;
  placeholder: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  currentInput: string;
  setCurrentInput: (value: string) => void;
}

const MultiSelectInput = ({ 
  label, 
  placeholder, 
  items, 
  onAdd, 
  onRemove, 
  currentInput, 
  setCurrentInput 
}: MultiSelectInputProps) => {
  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd(currentInput);
              }
            }}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="warm-outline"
            onClick={() => onAdd(currentInput)}
          >
            Add
          </Button>
        </div>
        
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-muted-foreground hover:text-destructive ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;