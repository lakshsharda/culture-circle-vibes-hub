import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Multi-select input component (copied from Signup.tsx, no Qloo logic)
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

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    musicArtists: [] as string[],
    movies: [] as string[],
    books: [] as string[],
    travelDestinations: [] as string[],
    cuisines: [] as string[],
    tvShows: [] as string[],
    recommendationType: "",
    vibeDescription: ""
  });
  // Input states
  const [musicArtistInput, setMusicArtistInput] = useState("");
  const [movieInput, setMovieInput] = useState("");
  const [bookInput, setBookInput] = useState("");
  const [travelInput, setTravelInput] = useState("");
  const [cuisineInput, setCuisineInput] = useState("");
  const [tvShowInput, setTvShowInput] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          toast({ title: "Not logged in", description: "Please log in to edit your profile.", variant: "destructive" });
          navigate("/login");
          return;
        }
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData({ ...formData, ...docSnap.data() });
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const handleAddToArray = (field: keyof typeof formData, value: string) => {
    if (value.trim() && Array.isArray(formData[field])) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      if (field === "musicArtists") setMusicArtistInput("");
      if (field === "movies") setMovieInput("");
      if (field === "books") setBookInput("");
      if (field === "travelDestinations") setTravelInput("");
      if (field === "cuisines") setCuisineInput("");
      if (field === "tvShows") setTvShowInput("");
    }
  };
  const handleRemoveFromArray = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const profileData = { ...formData, email: user.email };
      await setDoc(doc(db, "users", user.uid), profileData);
      toast({ title: "Profile Updated!", description: "Your profile has been updated." });
      navigate("/dashboard");
    } catch (e) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-lg text-muted-foreground">Loading profile...</span></div>;

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="opacity-70 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-6">
              <MultiSelectInput
                label="Favorite Music Artists"
                placeholder="Add an artist (e.g., Taylor Swift, The Beatles)"
                items={formData.musicArtists}
                onAdd={value => handleAddToArray("musicArtists", value)}
                onRemove={index => handleRemoveFromArray("musicArtists", index)}
                currentInput={musicArtistInput}
                setCurrentInput={setMusicArtistInput}
              />
              <MultiSelectInput
                label="Favorite Movies"
                placeholder="Add a movie (e.g., Inception, The Godfather)"
                items={formData.movies}
                onAdd={value => handleAddToArray("movies", value)}
                onRemove={index => handleRemoveFromArray("movies", index)}
                currentInput={movieInput}
                setCurrentInput={setMovieInput}
              />
              <MultiSelectInput
                label="Favorite Books"
                placeholder="Add a book (e.g., 1984, Harry Potter)"
                items={formData.books}
                onAdd={value => handleAddToArray("books", value)}
                onRemove={index => handleRemoveFromArray("books", index)}
                currentInput={bookInput}
                setCurrentInput={setBookInput}
              />
              <MultiSelectInput
                label="Favorite Travel Destinations"
                placeholder="Add a destination (e.g., Tokyo, Paris)"
                items={formData.travelDestinations}
                onAdd={value => handleAddToArray("travelDestinations", value)}
                onRemove={index => handleRemoveFromArray("travelDestinations", index)}
                currentInput={travelInput}
                setCurrentInput={setTravelInput}
              />
              <MultiSelectInput
                label="Favorite Foods/Cuisines"
                placeholder="Add a cuisine (e.g., Italian, Sushi)"
                items={formData.cuisines}
                onAdd={value => handleAddToArray("cuisines", value)}
                onRemove={index => handleRemoveFromArray("cuisines", index)}
                currentInput={cuisineInput}
                setCurrentInput={setCuisineInput}
              />
              <MultiSelectInput
                label="Favorite TV Shows or Fashion Brands"
                placeholder="Add a show or brand (e.g., Breaking Bad, Nike)"
                items={formData.tvShows}
                onAdd={value => handleAddToArray("tvShows", value)}
                onRemove={index => handleRemoveFromArray("tvShows", index)}
                currentInput={tvShowInput}
                setCurrentInput={setTvShowInput}
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label>What do you want recommendations for?</Label>
                <Select
                  value={formData.recommendationType}
                  onValueChange={value => setFormData(prev => ({ ...prev, recommendationType: value }))}
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
                  onChange={e => setFormData(prev => ({ ...prev, vibeDescription: e.target.value }))}
                  placeholder="e.g., adventurous, artistic, spontaneous"
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end pt-6">
              <Button
                variant="warm"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile; 