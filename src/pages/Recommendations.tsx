import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, RefreshCw, Save, Copy, Sparkles, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

  // Mock groups data
  const groups = [
    { id: "1", name: "Tokyo Adventure Squad" },
    { id: "2", name: "Indie Music Lovers" },
    { id: "3", name: "Foodie Friends" }
  ];

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('trip') || message.includes('travel') || message.includes('tokyo') || message.includes('vacation')) {
      return mockResponses.travel[Math.floor(Math.random() * mockResponses.travel.length)];
    } else if (message.includes('music') || message.includes('playlist') || message.includes('song') || message.includes('concert')) {
      return mockResponses.music[Math.floor(Math.random() * mockResponses.music.length)];
    } else if (message.includes('food') || message.includes('restaurant') || message.includes('eat') || message.includes('dinner')) {
      return mockResponses.food[Math.floor(Math.random() * mockResponses.food.length)];
    } else {
      return mockResponses.general[Math.floor(Math.random() * mockResponses.general.length)];
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    if (!selectedGroup) {
      toast({
        title: "Error", 
        description: "Please select a group first",
        variant: "destructive"
      });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsGenerating(true);

    // TODO: Handle backend API logic here
    console.log("Generating recommendation for:", inputMessage, "Group:", selectedGroup);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(inputMessage),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleGenerateAgain = () => {
    if (messages.length === 0) return;

    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (!lastUserMessage) return;

    setIsGenerating(true);

    // TODO: Handle backend regeneration logic here
    console.log("Regenerating response for:", lastUserMessage.content);

    setTimeout(() => {
      const newResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: generateResponse(lastUserMessage.content),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newResponse]);
      setIsGenerating(false);
    }, 1500);
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
      handleSendMessage();
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

          {/* Chat Interface */}
          <Card className="bg-card shadow-lg flex-1">
            <CardContent className="p-0">
              {/* Messages Area */}
              <ScrollArea className="h-96 p-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Start Your Planning Journey</h3>
                    <p className="text-muted-foreground mb-4">
                      Ask me anything about planning experiences for your group!
                    </p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>💡 Try: "Plan a 3-day Tokyo trip for my group"</p>
                      <p>🎵 Or: "Create a playlist for our road trip"</p>
                      <p>🍜 Or: "Suggest restaurants for our foodie night"</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-button-gradient text-white'
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <div className={`text-xs mt-2 opacity-70 ${
                            message.type === 'user' ? 'text-white' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-secondary text-secondary-foreground rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-muted-foreground">Generating recommendations...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What do you want to plan? (e.g., A 3-day Tokyo trip for my group)"
                    className="flex-1"
                    disabled={!selectedGroup}
                  />
                  <Button
                    onClick={handleSendMessage}
                    variant="warm"
                    disabled={!inputMessage.trim() || !selectedGroup || isGenerating}
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {!selectedGroup && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Please select a group to start getting recommendations
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