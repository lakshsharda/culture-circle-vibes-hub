import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw, Save, Copy, Sparkles, Users, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { callGemini } from "@/lib/gemini";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Recommendations = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [qlooLoading, setQlooLoading] = useState(false);
  const [qlooResult, setQlooResult] = useState<any>(null);
  const supportedEntityTypes = [
    { urn: "urn:entity:artist", label: "Music Artist", key: "musicArtists", searchType: "artist" },
    { urn: "urn:entity:movie", label: "Movie", key: "movies", searchType: "movie" },
    { urn: "urn:entity:book", label: "Book", key: "books", searchType: "book" },
    { urn: "urn:entity:destination", label: "Destination", key: "travelDestinations", searchType: "destination" },
    { urn: "urn:entity:tv_show", label: "TV Show", key: "tvShows", searchType: "tv_show" },
    { urn: "urn:entity:brand", label: "Brand", key: "brands", searchType: "brand" },
    { urn: "urn:entity:place", label: "Place", key: "places", searchType: "place" },
    { urn: "urn:entity:person", label: "Person", key: "people", searchType: "person" },
    { urn: "urn:entity:podcast", label: "Podcast", key: "podcasts", searchType: "podcast" },
    { urn: "urn:entity:video_game", label: "Video Game", key: "videoGames", searchType: "video_game" },
  ];
  const [selectedCategories, setSelectedCategories] = useState<string[]>([supportedEntityTypes[0].urn]);
  const [selectedEntityType, setSelectedEntityType] = useState(supportedEntityTypes[0].urn);
  const [recommendationMode, setRecommendationMode] = useState<'standard' | 'itinerary'>('standard');
  const [itineraryDestination, setItineraryDestination] = useState('');
  const [itineraryDays, setItineraryDays] = useState(3);
  const [itineraryResult, setItineraryResult] = useState<any[] | null>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [popularityMin, setPopularityMin] = useState<number | undefined>();
  const [popularityMax, setPopularityMax] = useState<number | undefined>();
  const [yearMin, setYearMin] = useState<number | undefined>();
  const [yearMax, setYearMax] = useState<number | undefined>();
  const [countryCode, setCountryCode] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<{ id: string; name: string }[]>([]);
  const [tagSearch, setTagSearch] = useState<string>("");
  const [tagSuggestions, setTagSuggestions] = useState<{ id: string; name: string }[]>([]);

  // Mock groups data
  // const groups = [
  //   { id: "1", name: "Tokyo Adventure Squad" },
  //   { id: "2", name: "Indie Music Lovers" },
  //   { id: "3", name: "Foodie Friends" }
  // ];

  // Mock AI responses for different types of requests
  const mockResponses = {
    travel: [
      "🗾 **3-Day Tokyo Itinerary for Your Group**\n\n**Day 1: Traditional Tokyo**\n• Morning: Visit Senso-ji Temple in Asakusa\n• Lunch: Authentic sushi at Tsukiji Outer Market\n• Afternoon: Explore Meiji Shrine\n• Evening: Dinner in Shibuya + observation deck\n\n**Day 2: Modern Culture**\n• Morning: TeamLab Borderless digital art\n• Lunch: Ramen in Harajuku\n• Afternoon: Shopping in Takeshita Street\n• Evening: Karaoke in Shinjuku\n\n**Day 3: Local Experiences**\n• Morning: Cooking class in Tsukiji\n• Lunch: Picnic in Ueno Park\n• Afternoon: Traditional tea ceremony\n• Evening: Izakaya tour in Golden Gai\n\n*Why this fits your group: Based on your love for cultural experiences and adventurous spirits!*",
      
      "🌸 **Perfect Tokyo Spring Experience**\n\nSince your group loves both tradition and modern culture, here's a cherry blossom season plan:\n\n**Cultural Highlights:**\n• Early morning hanami at Chidorigafuchi\n• Traditional kaiseki dinner in Ginza\n• Private sake tasting in historic brewery\n• Sunset viewing from Tokyo Skytree\n\n**Why it's perfect:** Your group's appreciation for authentic experiences + love for scenic beauty makes this ideal. Plus, the quieter morning spots avoid crowds!"
    ],
    
    music: [
      "🎵 **Indie Vibes Playlist for Your Group**\n\n**Chill Indie Essentials:**\n• Tame Impala - The Less I Know The Better\n• Clairo - Pretty Girl\n• Boy Pablo - Everytime\n• Mac DeMarco - Chamber of Reflection\n• The Paper Kites - Bloom\n\n**Upbeat Discoveries:**\n• Wallows - Are You Bored Yet?\n• TOPS - I Feel Alive\n• Homeshake - Call Me Up\n• Mild High Club - Some Feeling\n\n**Deep Cuts You'll Love:**\n• Crumb - Locket\n• Feng Suave - Sink Into The Floor\n• Still Woozy - Goodie Bag\n\n*This playlist matches your group's taste for dreamy, atmospheric music with just the right amount of energy!*",
      
      "🎸 **Your Perfect Concert Calendar**\n\nBased on your indie music taste, here are upcoming shows your group would love:\n\n**This Month:**\n• Local indie band showcase at The Echo\n• Vinyl listening party at Amoeba Records\n\n**Next Month:**\n• Beach House tribute band performance\n• DIY venue secret show (DM for details)\n\n*Why these fit: Intimate venues, authentic sound, and discovery opportunities your group values!*"
    ],
    
    food: [
      "🍜 **Ultimate Foodie Adventure for Your Group**\n\n**Weekend Food Tour Plan:**\n\n**Saturday Morning:** Farmers market breakfast tour\n• Fresh pastries from local bakery\n• Artisan coffee tasting\n• Seasonal fruit picking\n\n**Saturday Lunch:** Authentic ramen crawl\n• Traditional tonkotsu at Ichiran\n• Experimental fusion at Momofuku\n• Vegetarian option at Afuri\n\n**Saturday Dinner:** Group cooking class\n• Learn to make fresh pasta\n• Wine pairing with local sommelier\n• Take home recipe cards\n\n**Sunday Brunch:** Hidden gem cafe\n• Instagram-worthy avocado toast\n• Specialty latte art\n• Quiet atmosphere for group conversations\n\n*Perfect for your group because you love trying new flavors while maintaining that cozy, intimate vibe!*",
      
      "🌮 **Taco Tuesday Elevated**\n\nHere's how to turn your regular group dinner into a cultural food experience:\n\n**Setup:** DIY taco bar with authentic ingredients\n• Fresh masa tortillas (I'll share a recipe!)\n• Three protein options: carnitas, fish, vegetarian\n• Traditional salsas: verde, roja, pico\n• Sides: mexican street corn, black beans\n\n**Drinks:** Craft cocktail pairings\n• Fresh margaritas with different salts\n• Agua frescas (horchata, hibiscus)\n• Local beer selection\n\n**Activity:** Salsa dancing playlist + basic steps tutorial\n\n*Why this works: Combines your love for authentic flavors with interactive group bonding!*"
    ],
    
    general: [
      "✨ **Perfect Group Activity Suggestions**\n\nBased on your collective interests, here are some amazing options:\n\n**Creative Activities:**\n• Pottery painting workshop\n• Group art class (watercolor landscapes)\n• Photography walk in the arts district\n• DIY candle making session\n\n**Adventure Options:**\n• Escape room challenge\n• Mini golf tournament\n• Hiking + picnic combo\n• Bike tour of local neighborhoods\n\n**Cultural Experiences:**\n• Museum hop with themed discussions\n• Live theater performance\n• Local history walking tour\n• Wine or coffee tasting\n\n*These activities balance your group's love for culture, creativity, and quality time together!*"
    ]
  };

  // Fetch user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "groups"), where("members", "array-contains", user.email));
      const qsnap = await getDocs(q);
      setGroups(qsnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchGroups();
  }, []);

  // Fetch group members' profiles when group is selected
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedGroupId) return;
      setLoadingMembers(true);
      const group = groups.find(g => g.id === selectedGroupId);
      if (!group) return;
      const memberEmails = group.members;
      const memberProfiles: any[] = [];
      for (const email of memberEmails) {
        const q = query(collection(db, "users"), where("email", "==", email));
        const qsnap = await getDocs(q);
        if (!qsnap.empty) memberProfiles.push(qsnap.docs[0].data());
      }
      setGroupMembers(memberProfiles);
      setLoadingMembers(false);
    };
    fetchMembers();
  }, [selectedGroupId, groups]);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cc_chat_sessions');
    if (saved) {
      setChatSessions(JSON.parse(saved));
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cc_chat_sessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  // Save current chat to sessions
  const saveCurrentChat = (title?: string) => {
    if (loadingChat) return; // Don't save while loading a chat
    if (messages.length === 0) return;
    const id = activeChatId || uuidv4();
    const session = {
      id,
      title: title || messages[0]?.content?.slice(0, 30) || 'Untitled',
      messages,
      createdAt: new Date().toISOString(),
      groupId: selectedGroup,
      categories: selectedCategories,
    };
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return [session, ...filtered];
    });
    setActiveChatId(id);
  };

  // Load a chat session
  const loadChatSession = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setLoadingChat(true);
      // Convert timestamps to Date objects if needed
      const fixedMessages = session.messages.map((msg: any) => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
      }));
      setMessages(fixedMessages);
      setActiveChatId(id);
      setSelectedGroup(session.groupId);
      setSelectedCategories(session.categories || []);
      setTimeout(() => setLoadingChat(false), 100); // allow state to settle
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([]);
    setActiveChatId(null);
  };

  // Save chat after each message
  useEffect(() => {
    if (loadingChat) return; // Don't save while loading a chat
    if (messages.length > 0) {
      saveCurrentChat();
    }
    // eslint-disable-next-line
  }, [messages]);

  // Helper: Aggregate interests from all members
  const aggregateInterests = () => {
    const interests = {
      musicArtists: [] as string[],
      movies: [] as string[],
      books: [] as string[],
      travelDestinations: [] as string[],
      cuisines: [] as string[],
      tvShows: [] as string[],
    };
    for (const member of groupMembers) {
      for (const key of Object.keys(interests)) {
        if (Array.isArray(member[key])) {
          interests[key as keyof typeof interests].push(...member[key]);
        }
      }
    }
    // Remove duplicates
    for (const key of Object.keys(interests)) {
      interests[key as keyof typeof interests] = Array.from(new Set(interests[key as keyof typeof interests]));
    }
    return interests;
  };

  // Qloo API helpers
  const QLOO_BASE = "https://hackathon.api.qloo.com";
  const QLOO_API_KEY = import.meta.env.VITE_QLOO_API_KEY;

  async function qlooSearchEntities(type: string, names: string[]): Promise<string[]> {
    // type: 'artist', 'movie', etc.
    const ids: string[] = [];
    for (const name of names) {
      const url = `${QLOO_BASE}/search?query=${encodeURIComponent(name)}`;
      const res = await fetch(url, {
        headers: { "x-api-key": QLOO_API_KEY }
      });
      if (res.ok) {
        const data = await res.json();
        // Find the first entity of the right type
        const entity = (data.results || []).find((e: any) => e.type === type);
        if (entity && entity.id) ids.push(entity.id);
      }
    }
    return ids;
  }

  async function qlooGetInsights(entityTypeUrn: string, entityIds: string[]): Promise<any> {
    // entityTypeUrn: e.g., 'urn:entity:artist', 'urn:entity:movie', etc.
    const url = `${QLOO_BASE}/v2/insights`;
    const body = {
      filter: { type: entityTypeUrn },
      signal: { interests: { entities: entityIds } }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": QLOO_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Qloo insights error");
    return await res.json();
  }

  // Helper: Qloo /v2/tags for cuisines, genres, etc.
  async function qlooSearchTags(queryStr: string): Promise<string[]> {
    const url = `${QLOO_BASE}/v2/tags?query=${encodeURIComponent(queryStr)}`;
    const res = await fetch(url, {
      headers: { "x-api-key": QLOO_API_KEY }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((tag: any) => tag.id);
  }

  // Test API connectivity
  const testAPI = async () => {
    try {
      console.log("Testing API connectivity...");
      const testRes = await fetch('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (testRes.ok) {
        const testData = await testRes.json();
        console.log("API test successful:", testData);
        return true;
      } else {
        console.error("API test failed:", testRes.status, testRes.statusText);
        return false;
      }
    } catch (error) {
      console.error("API test error:", error);
      return false;
    }
  };

  const handleSendMessage = async (userPrompt: string) => {
    setIsGenerating(true);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userPrompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Test API connectivity first
      const apiTestResult = await testAPI();
      if (!apiTestResult) {
        toast({ 
          title: "API Error", 
          description: "Cannot connect to recommendation service. Please try again later.", 
          variant: "destructive" 
        });
        setIsGenerating(false);
        return;
      }
      if (recommendationMode === 'itinerary') {
        setItineraryResult(null);
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId: selectedGroup,
            type: 'itinerary',
            destination: itineraryDestination,
            days: itineraryDays
          })
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "Failed to parse error response" }));
          toast({ title: "API Error", description: errorData.error || "An unknown error occurred.", variant: "destructive" });
          setIsGenerating(false);
          return;
        }
        const data = await res.json();
        setItineraryResult(data.itinerary);
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `**🗺️ Here is your ${data.days}-day itinerary for ${data.destination}:**`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsGenerating(false);
        return;
      }
      // Multi-category recommendation (no filters)
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup,
          categories: selectedCategories
        })
      });

      if (!res.ok) {
        console.error("API Response not OK:", res.status, res.statusText);
        
        // Try to get the response text first
        const responseText = await res.text();
        console.error("Raw response:", responseText);
        
        let errorData;
        try {
          // Try to parse as JSON
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          // If it's not JSON, create a generic error
          errorData = { 
            error: `Server error (${res.status}): ${res.statusText}`,
            details: responseText.substring(0, 200) // First 200 chars for debugging
          };
        }
        
        console.error("Parsed error data:", errorData);
        toast({ 
          title: "API Error", 
          description: errorData.error || `Server error: ${res.status} ${res.statusText}`, 
          variant: "destructive" 
        });
        setIsGenerating(false);
        return;
      }

      let data;
      try {
        data = await res.json();
        console.log("API Response:", data);
      } catch (parseError) {
        console.error("Failed to parse successful response as JSON:", parseError);
        toast({ 
          title: "API Error", 
          description: "Invalid response format from server.", 
          variant: "destructive" 
        });
        setIsGenerating(false);
        return;
      }
      
      // Enhanced error handling for missing fields
      const { recommendation, alternative, harmonyScore, vibeAnalysis } = data.gemini || {};
      
      if (!recommendation) {
        console.error("Missing recommendation in API response:", data);
        toast({ 
          title: "API Error", 
          description: "Invalid response format from recommendation service.", 
          variant: "destructive" 
        });
        setIsGenerating(false);
        return;
      }

      const aiContent = `**✨ Here's a vibe for your group! ✨**

**Recommendation:**
${recommendation}

**Alternative Idea:**
${alternative || "No alternative suggestion was generated."}

---

**Harmony Score: ${harmonyScore || 75}/100**

**Vibe Analysis:**
${vibeAnalysis || "This recommendation is tailored to your group's unique interests and preferences."}`;

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (e) {
      toast({ title: "AI Error", description: "Failed to get recommendation.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAgain = async () => {
    if (messages.length === 0) return;
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (!lastUserMessage) return;
    setIsGenerating(true);
    try {
      const prompt = `Group: ${groups.find(g => g.id === selectedGroup)?.name || ''}\nUser: ${lastUserMessage.content}`;
      const aiText = await callGemini(prompt);
      const newResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: aiText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newResponse]);
    } catch (error: any) {
      toast({
        title: "AI Error",
        description: error.message || "Failed to regenerate recommendation.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = () => {
    // TODO: Handle backend save logic here
    console.log("Saving conversation:", messages);

    toast({
      title: "Plan Saved! 💾",
      description: "Your recommendation has been saved to your group."
    });
  };

  const handleCopyPlan = async () => {
    const conversationText = messages
      .map(msg => `${msg.type === 'user' ? 'You' : 'CultureCircle'}: ${msg.content}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(conversationText);
      toast({
        title: "Copied! 📋",
        description: "Conversation copied to clipboard."
      });
    } catch (error) {
      // TODO: Handle clipboard error
      console.log("Clipboard copy failed:", error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="w-full h-screen flex bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] transition-colors duration-700 overflow-hidden">
      {/* Sidebar for chat history */}
      <aside className="fixed left-0 top-0 h-full w-72 z-20 bg-white/70 dark:bg-[#23272f]/80 backdrop-blur-lg border-r border-primary/20 flex flex-col glassy shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-gradient-to-r from-primary/10 to-accent/10">
          <span className="font-extrabold text-lg text-primary tracking-wide flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-float text-warm-yellow" /> Chats
          </span>
          <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10" onClick={startNewChat} title="New Chat">
            <PlusCircle className="h-6 w-6 text-primary" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chatSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground text-sm gap-4">
              <Sparkles className="h-10 w-10 animate-float text-warm-yellow/70" />
              <span>No chats yet. Start a new conversation!</span>
            </div>
          ) : (
            chatSessions.map(session => (
              <div
                key={session.id}
                className={`group p-4 border-b border-border/20 cursor-pointer flex items-center gap-3 hover:bg-accent/20 transition-all ${activeChatId === session.id ? 'bg-accent/30 border-l-4 border-primary/80' : ''}`}
                onClick={() => loadChatSession(session.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary truncate flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {session.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">{new Date(session.createdAt).toLocaleString()}</div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10"
                  title="Delete chat"
                  onClick={e => { e.stopPropagation(); setChatSessions(prev => prev.filter(s => s.id !== session.id)); }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-accent/5 to-warm-yellow/10 animate-gradient-move" />
      </aside>
      
      {/* Main Recommendations UI */}
      <main className="flex-1 ml-72 h-full flex flex-col items-center justify-start py-8 px-4 md:px-10 relative overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-warm-yellow to-accent shadow-2xl flex items-center justify-center animate-float mb-4">
            <Sparkles className="h-12 w-12 text-white animate-pulse" />
          </div>
          <h1 className="text-5xl font-extrabold text-primary drop-shadow-lg tracking-tight mb-3">CultureCircle</h1>
          <p className="text-xl text-muted-foreground max-w-2xl text-center leading-relaxed">
            Get AI-powered, group-based cultural recommendations and plans—beautifully personalized for your vibe.
          </p>
        </div>

        <div className="w-full max-w-4xl space-y-6">
          {/* Group Selection - Simplified */}
          <Card className="bg-white/80 dark:bg-[#18181b]/80 shadow-xl rounded-2xl border-0 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1 w-full">
                  <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Choose Your Group
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a group to get personalized recommendations based on everyone's interests
                  </p>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="h-12 rounded-lg border-2 border-primary/30 shadow-sm bg-white/70 dark:bg-[#23272f]/70">
                      <SelectValue placeholder="Select a group for recommendations" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id} className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full lg:w-auto">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Recommendation Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {supportedEntityTypes.map(type => (
                      <button
                        key={type.urn}
                        className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 shadow-sm border-2 transition-all duration-200 ${selectedCategories.includes(type.urn) ? 'bg-gradient-to-r from-primary via-warm-yellow to-accent text-white border-primary' : 'bg-white/70 dark:bg-[#23272f]/70 border-border text-primary hover:bg-primary/10'}`}
                        onClick={() => setSelectedCategories(selectedCategories.includes(type.urn) ? selectedCategories.filter(c => c !== type.urn) : [...selectedCategories, type.urn])}
                        type="button"
                      >
                        {type.label === 'Music Artist' && '🎵'}
                        {type.label === 'Movie' && '🎬'}
                        {type.label === 'Book' && '📚'}
                        {type.label === 'Destination' && '🗺️'}
                        {type.label === 'TV Show' && '📺'}
                        {type.label === 'Brand' && '👗'}
                        {type.label === 'Place' && '🍽️'}
                        {type.label === 'Person' && '🧑'}
                        {type.label === 'Podcast' && '🎙️'}
                        {type.label === 'Video Game' && '🎮'}
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="bg-white/90 dark:bg-[#18181b]/90 shadow-2xl border-0 overflow-hidden rounded-2xl backdrop-blur-md">
            <div className="bg-gradient-to-r from-primary/10 via-warm-orange/10 to-warm-yellow/10 p-4 border-b flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-foreground">CultureCircle AI Assistant</span>
              <Badge variant="secondary" className="text-xs">Online</Badge>
            </div>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-6 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-button-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
                        <Sparkles className="h-10 w-10 text-white animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Start Your Planning Journey</h3>
                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                      I'm here to help you create amazing experiences with your cultural group!
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm max-w-3xl mx-auto">
                      <Card className="bg-secondary/50 border-0 p-4 hover:bg-secondary/70 transition-colors cursor-pointer rounded-xl shadow-md">
                        <div className="text-2xl mb-2">🗾</div>
                        <div className="font-medium text-foreground mb-1">Travel Planning</div>
                        <div className="text-xs text-muted-foreground">"Plan a 3-day Tokyo trip for my group"</div>
                      </Card>
                      <Card className="bg-secondary/50 border-0 p-4 hover:bg-secondary/70 transition-colors cursor-pointer rounded-xl shadow-md">
                        <div className="text-2xl mb-2">🎵</div>
                        <div className="font-medium text-foreground mb-1">Music & Playlists</div>
                        <div className="text-xs text-muted-foreground">"Create a playlist for our road trip"</div>
                      </Card>
                      <Card className="bg-secondary/50 border-0 p-4 hover:bg-secondary/70 transition-colors cursor-pointer rounded-xl shadow-md">
                        <div className="text-2xl mb-2">🍜</div>
                        <div className="font-medium text-foreground mb-1">Food & Dining</div>
                        <div className="text-xs text-muted-foreground">"Suggest restaurants for our foodie night"</div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message, idx) => (
                      <div
                        key={message.id + idx}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] px-5 py-4 shadow-xl rounded-2xl mb-2 transition-all duration-300 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-primary/80 via-warm-yellow/60 to-accent/60 text-white animate-fade-in-right'
                            : 'bg-white/95 border border-border text-foreground animate-fade-in-left'
                        }`}
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          {message.type === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-button-gradient rounded-full flex items-center justify-center animate-float">
                                <Sparkles className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-xs font-medium text-primary">CultureCircle AI</span>
                            </div>
                          )}
                          <div className={`whitespace-pre-wrap leading-relaxed ${
                            message.type === 'user' ? 'text-white' : 'text-foreground'
                          }`}>
                            {message.content}
                          </div>
                          <div className={`text-xs mt-3 opacity-70 flex items-center gap-2 ${
                            message.type === 'user' ? 'text-white' : 'text-muted-foreground'
                          }`}>
                            <span>
                              {message.timestamp instanceof Date && !isNaN(message.timestamp as any)
                                ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''}
                            </span>
                            {message.type === 'assistant' && (
                              <Badge variant="secondary" className="text-xs">
                                AI Generated
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {itineraryResult && (
                      <div className="bg-white/90 border border-border rounded-2xl px-5 py-4 shadow-lg max-w-[85%] mx-auto mt-6 animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                          <span>🗺️</span> Group Itinerary
                        </h3>
                        {Array.isArray(itineraryResult) ? (
                          <ol className="relative border-l-4 border-primary/30 ml-4">
                            {itineraryResult.map((day, idx) => (
                              <li key={idx} className="mb-8 ml-6">
                                <span className="absolute -left-5 flex items-center justify-center w-8 h-8 bg-primary/80 rounded-full ring-4 ring-white text-white font-bold text-lg shadow-lg">
                                  {day.day || idx + 1}
                                </span>
                                <div className="mb-2 font-semibold text-lg text-primary">Day {day.day || idx + 1}</div>
                                <ul className="list-disc ml-6 mb-2">
                                  {Array.isArray(day.activities)
                                    ? day.activities.map((act: string, i: number) => <li key={i}>{act}</li>)
                                    : null}
                                </ul>
                                {day.description && <div className="text-muted-foreground mt-1">{day.description}</div>}
                                {day.error && <div className="text-red-500 mt-1">{day.error}</div>}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <div className="text-red-500">{JSON.stringify(itineraryResult)}</div>
                        )}
                      </div>
                    )}
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-border rounded-2xl px-5 py-4 shadow-lg max-w-[85%] animate-pulse">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 bg-button-gradient rounded-full flex items-center justify-center animate-spin">
                              <Loader2 className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-primary">CultureCircle AI</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex space-x-1">
                              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-3 h-3 bg-warm-orange rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-3 h-3 bg-warm-yellow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-muted-foreground">Creating your perfect recommendations...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>
              {/* Enhanced Input Area */}
              <div className="border-t bg-gradient-to-r from-secondary/30 to-accent/30 p-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={recommendationMode === 'itinerary' ? "What kind of trip do you want? (optional)" : "What amazing experience should we plan? ✨"}
                      className="flex-1 h-12 pl-4 pr-12 text-base bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl focus:ring-2 focus:ring-primary/20"
                      disabled={!selectedGroup}
                    />
                    {inputMessage && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSendMessage(inputMessage)}
                    variant="warm"
                    disabled={!inputMessage.trim() || !selectedGroup || isGenerating || qlooLoading}
                    className="h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full font-bold"
                  >
                    {isGenerating || qlooLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {!selectedGroup ? (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    ✨ Select a group above to unlock AI-powered recommendations
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    🎯 Press Enter or click send to get personalized recommendations for <span className="font-medium text-primary">{groups.find(g => g.id === selectedGroup)?.name}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Recommendations;