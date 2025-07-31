import { useState, useEffect } from "react";
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
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface SignupProps {
  onSignup: (userData: any) => void;
}

const Signup = ({ onSignup }: SignupProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Update formData to store array of { name, id } objects for each interest
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    musicArtists: [] as { name: string; id: string }[],
    movies: [] as { name: string; id: string }[],
    books: [] as { name: string; id: string }[],
    travelDestinations: [] as { name: string; id: string }[],
    cuisines: [] as { name: string; id: string }[],
    tvShows: [] as { name: string; id: string }[],
    videoGames: [] as { name: string; id: string }[],
    recommendationType: "",
    vibeDescription: ""
  });

  const [musicArtistInput, setMusicArtistInput] = useState("");
  const [movieInput, setMovieInput] = useState("");
  const [bookInput, setBookInput] = useState("");
  const [travelInput, setTravelInput] = useState("");
  const [cuisineInput, setCuisineInput] = useState("");
  const [tvShowInput, setTvShowInput] = useState("");
  const [videoGameInput, setVideoGameInput] = useState("");

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

  // Update handleAddToArray to accept { name, id }
  const handleAddToArray = (field: keyof typeof formData, value: { name: string; id: string }) => {
    if (value.name.trim() && Array.isArray(formData[field])) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as { name: string; id: string }[]), value]
      }));
      if (field === "musicArtists") setMusicArtistInput("");
      if (field === "movies") setMovieInput("");
      if (field === "books") setBookInput("");
      if (field === "travelDestinations") setTravelInput("");
      if (field === "cuisines") setCuisineInput("");
      if (field === "tvShows") setTvShowInput("");
      if (field === "videoGames") setVideoGameInput("");
    }
  };

  // Update handleRemoveFromArray for new structure
  const handleRemoveFromArray = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as { name: string; id: string }[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Prepare user profile data (exclude password)
      const profileData: Record<string, any> = { ...formData };
      delete profileData.password;
      profileData.uid = user.uid;
      profileData.email = user.email.toLowerCase(); // Always store lowercase

      // Store user profile in Firestore
      await setDoc(doc(db, "users", user.uid), profileData);

      toast({
        title: "Welcome to CultureCircle! 🎉",
        description: "Your profile has been created successfully."
      });

      onSignup(profileData);
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup Error",
        description: error.message || "An error occurred during signup.",
        variant: "destructive"
      });
    }
  };

  // Update validation for new structure
  const isStepValid = () => {
    if (currentStep === 1) {
      return (
        formData.fullName.trim() !== "" &&
        formData.email.trim() !== "" &&
        formData.password.trim() !== ""
      );
    }
    if (currentStep === 2) {
      return (
        formData.musicArtists.length > 0 &&
        formData.movies.length > 0 &&
        formData.books.length > 0
      );
    }
    if (currentStep === 3) {
      return (
        formData.travelDestinations.length > 0 &&
        formData.cuisines.length > 0 &&
        formData.tvShows.length > 0 &&
        formData.videoGames.length > 0
      );
    }
    if (currentStep === 4) {
      return (
        formData.recommendationType.trim() !== "" &&
        formData.vibeDescription.trim() !== ""
      );
    }
    return false;
  };

  const stepIcons = [User, Music, MapPin, Target];
  const stepTitles = ["Basic Info", "Your Vibes", "Your Tastes", "Your Intent"];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        {/* Progress Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-extrabold text-primary">Join CultureCircle</h1>
            <span className="text-sm font-medium text-muted-foreground bg-white/50 px-4 py-2 rounded-full">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-3 mb-8" />
          
          <div className="flex justify-between">
            {stepTitles.map((title, index) => {
              const StepIcon = stepIcons[index];
              const isActive = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;
              
              return (
                <div key={title} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                    isCompleted
                      ? "bg-button-gradient text-white shadow-lg"
                      : isActive
                      ? "bg-primary text-white shadow-lg"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                  </div>
                  <span className={`text-sm font-medium text-center hidden sm:block ${
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
        <Card className="bg-gradient-to-br from-white/90 via-secondary/20 to-accent/10 shadow-2xl rounded-2xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">
              {stepTitles[currentStep - 1]}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8">
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
                  currentInput={musicArtistInput}
                  setCurrentInput={setMusicArtistInput}
                  qlooType="artist"
                />
                <MultiSelectInput
                  label="Favorite Movies"
                  placeholder="Add a movie (e.g., Inception, The Godfather)"
                  items={formData.movies}
                  onAdd={(value) => handleAddToArray("movies", value)}
                  onRemove={(index) => handleRemoveFromArray("movies", index)}
                  currentInput={movieInput}
                  setCurrentInput={setMovieInput}
                  qlooType="movie"
                />
                <MultiSelectInput
                  label="Favorite Books"
                  placeholder="Add a book (e.g., 1984, Harry Potter)"
                  items={formData.books}
                  onAdd={(value) => handleAddToArray("books", value)}
                  onRemove={(index) => handleRemoveFromArray("books", index)}
                  currentInput={bookInput}
                  setCurrentInput={setBookInput}
                  qlooType="book"
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
                  currentInput={travelInput}
                  setCurrentInput={setTravelInput}
                  qlooType="destination"
                />
                <MultiSelectInput
                  label="Favorite Foods/Cuisines"
                  placeholder="Add a cuisine (e.g., Italian, Sushi)"
                  items={formData.cuisines}
                  onAdd={(value) => handleAddToArray("cuisines", value)}
                  onRemove={(index) => handleRemoveFromArray("cuisines", index)}
                  currentInput={cuisineInput}
                  setCurrentInput={setCuisineInput}
                  qlooType="place"
                />
                <MultiSelectInput
                  label="Favorite TV Shows or Fashion Brands"
                  placeholder="Add a show or brand (e.g., Breaking Bad, Nike)"
                  items={formData.tvShows}
                  onAdd={(value) => handleAddToArray("tvShows", value)}
                  onRemove={(index) => handleRemoveFromArray("tvShows", index)}
                  currentInput={tvShowInput}
                  setCurrentInput={setTvShowInput}
                  qlooType="tv_show"
                />
                <MultiSelectInput
                  label="Favorite Video Games"
                  placeholder="Add a video game (e.g., The Legend of Zelda, Fortnite)"
                  items={formData.videoGames}
                  onAdd={(value) => handleAddToArray("videoGames", value)}
                  onRemove={(index) => handleRemoveFromArray("videoGames", index)}
                  currentInput={videoGameInput}
                  setCurrentInput={setVideoGameInput}
                  qlooType="video_game"
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
                  disabled={!isStepValid()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  variant="warm"
                  onClick={handleSubmit}
                  className="flex items-center"
                  disabled={!isStepValid()}
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

// Qloo Autocomplete Hook
function useQlooAutocomplete(query: string, type: string) {
  const [suggestions, setSuggestions] = useState<{ name: string; id: string }[]>([]);
  useEffect(() => {
    if (!query) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://hackathon.api.qloo.com/search?query=${encodeURIComponent(query)}&types=${type}`,
          { headers: { 'x-api-key': import.meta.env.VITE_QLOO_API_KEY } }
        );
        const data = await res.json();
        setSuggestions(
          (data.results || []).map((item: any) => ({ name: item.name, id: item.id }))
        );
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, type]);
  return suggestions;
}

interface MultiSelectInputProps {
  label: string;
  placeholder: string;
  items: { name: string; id: string }[];
  onAdd: (value: { name: string; id: string }) => void;
  onRemove: (index: number) => void;
  currentInput: string;
  setCurrentInput: (value: string) => void;
  qlooType: string;
}

const MultiSelectInput = ({ 
  label, 
  placeholder, 
  items, 
  onAdd, 
  onRemove, 
  currentInput, 
  setCurrentInput,
  qlooType
}: MultiSelectInputProps) => {
  const suggestions = useQlooAutocomplete(currentInput, qlooType);
  const [showSuggestions, setShowSuggestions] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-2">
        <div className="flex gap-2 relative">
          <Input
            value={currentInput}
            onChange={(e) => {
              setCurrentInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="warm-outline"
            onClick={() => {
              if (currentInput.trim()) {
                onAdd({ name: currentInput, id: "" });
                setShowSuggestions(false);
              }
            }}
          >
            Add
          </Button>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 top-full z-10 w-full bg-white border border-border rounded shadow-lg mt-1 max-h-40 overflow-auto">
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  className="px-3 py-2 cursor-pointer hover:bg-accent"
                  onMouseDown={() => {
                    onAdd(s);
                    setShowSuggestions(false);
                  }}
                >
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <span
                key={item.id + index}
                className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm"
              >
                {item.name}
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