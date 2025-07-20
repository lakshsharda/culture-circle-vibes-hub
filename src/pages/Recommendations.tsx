import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw, Save, Copy, Sparkles, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { callGemini } from "@/lib/gemini";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

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
  const [selectedEntityType, setSelectedEntityType] = useState(supportedEntityTypes[0].urn);

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

  // Refactored handleSendMessage
  const handleSendMessage = async (userPrompt: string) => {
    setQlooLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup, // or selectedGroupId if that's the actual group id
          type: selectedEntityType === "urn:entity:artist" ? "music"
              : selectedEntityType === "urn:entity:movie" ? "movie"
              : selectedEntityType === "urn:entity:place" ? "restaurant"
              : selectedEntityType === "urn:entity:destination" ? "travel"
              : "music" // default fallback
        })
      });
      if (!res.ok) {
        toast({ title: "No Data", description: "No valid interests found for this group and type." });
        setQlooLoading(false);
        return;
      }
      const data = await res.json();
      // Use data.gemini.summary, data.gemini.harmonyScore, etc. as needed
      // Add Gemini response to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: userPrompt,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.gemini.summary + "\n\nHarmony Score: " + data.gemini.harmonyScore + "\n" + data.gemini.reasoning,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (e) {
      toast({ title: "AI Error", description: "Failed to get recommendation.", variant: "destructive" });
    } finally {
      setQlooLoading(false);
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
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-primary mb-2">AI Recommendations</h1>
          <p className="text-lg text-muted-foreground">
            Get personalized suggestions for your cultural group experiences.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Group Selection */}
          <Card className="bg-card shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Group
                  </label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group for recommendations" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedGroup && (
                  <div className="flex gap-2 mt-6 sm:mt-0">
                    <Button
                      variant="warm-outline"
                      size="sm"
                      onClick={handleGenerateAgain}
                      disabled={isGenerating || messages.length === 0}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                      Generate Again
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSavePlan}
                      disabled={messages.length === 0}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Plan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPlan}
                      disabled={messages.length === 0}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Chat Interface */}
          <Card className="bg-card shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-warm-orange/10 to-warm-yellow/10 p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-foreground">CultureCircle AI Assistant</span>
                <Badge variant="secondary" className="text-xs">Online</Badge>
              </div>
            </div>
            
            <CardContent className="p-0">
              {/* Messages Area */}
              <ScrollArea className="h-[500px] p-6">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-button-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Sparkles className="h-10 w-10 text-white animate-pulse" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-foreground mb-3">Start Your Planning Journey</h3>
                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                      I'm here to help you create amazing experiences with your cultural group!
                    </p>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm max-w-3xl mx-auto">
                      <Card className="bg-secondary/50 border-0 p-4 hover:bg-secondary/70 transition-colors cursor-pointer">
                        <div className="text-2xl mb-2">🗾</div>
                        <div className="font-medium text-foreground mb-1">Travel Planning</div>
                        <div className="text-xs text-muted-foreground">"Plan a 3-day Tokyo trip for my group"</div>
                      </Card>
                      
                      <Card className="bg-secondary/50 border-0 p-4 hover:bg-secondary/70 transition-colors cursor-pointer">
                        <div className="text-2xl mb-2">🎵</div>
                        <div className="font-medium text-foreground mb-1">Music & Playlists</div>
                        <div className="text-xs text-muted-foreground">"Create a playlist for our road trip"</div>
                      </Card>
                      
                      <Card className="bg-secondary/50 border-0 p-4 hover:bg-secondary/70 transition-colors cursor-pointer">
                        <div className="text-2xl mb-2">🍜</div>
                        <div className="font-medium text-foreground mb-1">Food & Dining</div>
                        <div className="text-xs text-muted-foreground">"Suggest restaurants for our foodie night"</div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${
                          message.type === 'user'
                            ? 'bg-button-gradient text-white'
                            : 'bg-white border border-border'
                        }`}>
                          {message.type === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-button-gradient rounded-full flex items-center justify-center">
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
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
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
                    
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-border rounded-2xl px-5 py-4 shadow-lg max-w-[85%]">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 bg-button-gradient rounded-full flex items-center justify-center">
                              <Sparkles className="h-3 w-3 text-white animate-pulse" />
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
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Select Recommendation Type</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={selectedEntityType}
                      onChange={e => setSelectedEntityType(e.target.value)}
                    >
                      {supportedEntityTypes.map((type) => (
                        <option key={type.urn} value={type.urn}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="What amazing experience should we plan? ✨"
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
                    className="h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {isGenerating || qlooLoading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
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
      </div>
    </div>
  );
};

export default Recommendations;