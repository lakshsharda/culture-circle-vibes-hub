import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Eye, Settings, TrendingUp, Calendar, Hash, ArrowRight, Crown } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  memberCount: number;
  isOwner: boolean;
  createdAt: string;
  lastActivity: string;
  category: string;
}

const Dashboard = () => {
  const [groups] = useState<Group[]>([
    {
      id: "1",
      name: "Tokyo Adventure Squad",
      description: "Planning amazing trips to Japan and exploring Asian culture",
      members: ["Alex Chen", "Sarah Johnson", "Mike Rodriguez"],
      memberCount: 3,
      isOwner: true,
      createdAt: "2024-01-15",
      lastActivity: "2024-01-20",
      category: "Travel"
    },
    {
      id: "2", 
      name: "Indie Music Lovers",
      description: "Discovering new artists and sharing our favorite indie tracks",
      members: ["Emma Wilson", "David Kim", "Lisa Martinez", "John Smith"],
      memberCount: 4,
      isOwner: false,
      createdAt: "2024-01-20",
      lastActivity: "2024-01-25",
      category: "Music"
    },
    {
      id: "3",
      name: "Foodie Friends",
      description: "Exploring restaurants and cooking experiences together",
      members: ["Tom Brown", "Anna Davis"],
      memberCount: 2,
      isOwner: true,
      createdAt: "2024-01-25",
      lastActivity: "2024-01-26",
      category: "Food"
    }
  ]);

  const getCategoryIcon = (category: string) => {
    const icons = {
      Travel: "🌍",
      Music: "🎵",
      Food: "🍽️",
      Art: "🎨",
      Books: "📚",
      Movies: "🎬",
      Sports: "⚽",
      Gaming: "🎮"
    };
    return icons[category as keyof typeof icons] || "📋";
  };

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-primary mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage your cultural groups and discover new experiences together.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Groups Section */}
          <section className="lg:col-span-2">
            <Card className="bg-card shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Groups ({groups.length})
                </CardTitle>
                <Link to="/groups">
                  <Button variant="warm-outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage All Groups
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No groups yet</p>
                    <p className="text-sm text-muted-foreground">Create your first group to get started!</p>
                    <Link to="/groups" className="mt-4 inline-block">
                      <Button variant="warm">
                        Create Your First Group
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.slice(0, 3).map((group) => (
                      <Card key={group.id} className="bg-secondary/30 border-0 hover:bg-secondary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-foreground">{group.name}</h3>
                                {group.isOwner && (
                                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                    <Crown className="h-3 w-3" />
                                    Owner
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryIcon(group.category)} {group.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm font-medium text-foreground mb-2">
                              Members ({group.memberCount})
                            </p>
                            <div className="flex items-center gap-2">
                              {group.members.slice(0, 3).map((member, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-xs">
                                      {member.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">{member}</span>
                                </div>
                              ))}
                              {group.memberCount > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{group.memberCount - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-3 border-t border-border">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(group.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {new Date(group.lastActivity).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <Link to="/recommendations">
                              <Button size="sm" variant="warm">
                                <Eye className="h-4 w-4 mr-1" />
                                Recommendations
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {groups.length > 3 && (
                      <div className="text-center pt-4">
                        <Link to="/groups">
                          <Button variant="warm-outline" className="group">
                            View All {groups.length} Groups
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Quick Stats & Actions */}
          <section>
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-card shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Groups</span>
                      <span className="text-xl font-bold text-primary">{groups.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Groups I Own</span>
                      <span className="text-lg font-semibold">{groups.filter(g => g.isOwner).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Members</span>
                      <span className="text-lg font-semibold">
                        {groups.reduce((sum, group) => sum + group.memberCount, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Groups</span>
                      <span className="text-lg font-semibold">{groups.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/groups">
                    <Button variant="warm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Groups
                    </Button>
                  </Link>
                  
                  <Link to="/recommendations">
                    <Button variant="warm-outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Recommendations
                    </Button>
                  </Link>
                  
                  <Link to="/groups">
                    <Button variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Create New Group
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-card shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groups.slice(0, 3).map((group, index) => (
                      <div key={group.id} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-foreground">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {new Date(group.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;