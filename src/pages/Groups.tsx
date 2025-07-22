import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Edit3, Trash2, UserPlus, Eye, Settings, Crown, Calendar, Hash, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  memberCount: number;
  isOwner: boolean;
  inviteCode: string;
  createdAt: string;
  lastActivity: string;
  category: string;
}

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "1",
      name: "Tokyo Adventure Squad",
      description: "Planning amazing trips to Japan and exploring Asian culture",
      members: ["Alex Chen", "Sarah Johnson", "Mike Rodriguez"],
      memberCount: 3,
      isOwner: true,
      inviteCode: "TOKYO2024",
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
      inviteCode: "INDIE2024",
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
      inviteCode: "FOOD2024",
      createdAt: "2024-01-25",
      lastActivity: "2024-01-26",
      category: "Food"
    }
  ]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  // Mock user data for member selection
  const availableUsers = [
    "Alex Chen", "Sarah Johnson", "Mike Rodriguez", "Emma Wilson", 
    "David Kim", "Lisa Martinez", "John Smith", "Tom Brown", 
    "Anna Davis", "Chris Lee", "Maya Patel", "Ryan O'Connor"
  ];

  const categories = ["Travel", "Music", "Food", "Art", "Books", "Movies", "Sports", "Gaming"];

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newGroupDescription.trim() || !newGroupCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDescription,
      members: selectedMembers,
      memberCount: selectedMembers.length,
      isOwner: true,
      inviteCode: `${newGroupName.toUpperCase().replace(/\s/g, '').slice(0, 4)}${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      category: newGroupCategory
    };

    setGroups(prev => [...prev, newGroup]);
    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupCategory("");
    setSelectedMembers([]);
    setIsCreateDialogOpen(false);

    // TODO: Handle backend logic here
    console.log("Creating group:", newGroup);

    toast({
      title: "Group Created! 🎉",
      description: `${newGroupName} has been created successfully.`
    });
  };

  const handleUpdateGroup = () => {
    if (!selectedGroup || !newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setGroups(prev => prev.map(group => 
      group.id === selectedGroup.id 
        ? { 
            ...group, 
            name: newGroupName, 
            description: newGroupDescription,
            category: newGroupCategory,
            members: selectedMembers,
            memberCount: selectedMembers.length
          }
        : group
    ));

    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupCategory("");
    setSelectedMembers([]);
    setSelectedGroup(null);
    setIsUpdateDialogOpen(false);

    // TODO: Handle backend logic here
    console.log("Updating group:", selectedGroup.id);

    toast({
      title: "Group Updated",
      description: "Group details have been updated successfully."
    });
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (window.confirm(`Are you sure you want to delete "${groupName}"?`)) {
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      // TODO: Handle backend logic here
      console.log("Deleting group:", groupId);

      toast({
        title: "Group Deleted",
        description: `${groupName} has been deleted.`
      });
    }
  };

  const handleJoinGroup = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive"
      });
      return;
    }

    // TODO: Handle backend logic here
    console.log("Joining group with code:", inviteCode);

    toast({
      title: "Join Request Sent",
      description: "Your request to join the group has been sent!"
    });

    setInviteCode("");
  };

  const handleAddMemberByUsername = () => {
    if (!newMemberUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    if (!selectedGroup) return;

    const updatedGroup = {
      ...selectedGroup,
      members: [...selectedGroup.members, newMemberUsername],
      memberCount: selectedGroup.memberCount + 1
    };

    setGroups(prev => prev.map(group => 
      group.id === selectedGroup.id ? updatedGroup : group
    ));

    setSelectedGroup(updatedGroup);
    setNewMemberUsername("");
    setIsAddMemberDialogOpen(false);

    // TODO: Handle backend logic here
    console.log("Adding member by username:", newMemberUsername, "to group:", selectedGroup.id);

    toast({
      title: "Member Added",
      description: `${newMemberUsername} has been added to the group.`
    });
  };

  const openUpdateDialog = (group: Group) => {
    setSelectedGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description);
    setNewGroupCategory(group.category);
    setSelectedMembers([...group.members]);
    setIsUpdateDialogOpen(true);
  };

  const toggleMemberSelection = (member: string) => {
    setSelectedMembers(prev => 
      prev.includes(member)
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard."
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent py-8 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold text-primary mb-2 drop-shadow-lg">Group Management</h1>
          <p className="text-xl text-muted-foreground">
            Manage all your cultural groups, members, and settings in one place.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Groups Section */}
          <section className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-card via-secondary/30 to-accent/20 shadow-xl rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary animate-float" />
                  My Groups ({groups.length})
                </CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="warm" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="groupName">Group Name *</Label>
                        <Input
                          id="groupName"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="groupDescription">Description *</Label>
                        <Input
                          id="groupDescription"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Describe your group's purpose"
                        />
                      </div>

                      <div>
                        <Label>Category *</Label>
                        <Select value={newGroupCategory} onValueChange={setNewGroupCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {getCategoryIcon(category)} {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Initial Members</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                          {availableUsers.map((user) => (
                            <label key={user} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(user)}
                                onChange={() => toggleMemberSelection(user)}
                                className="rounded"
                              />
                              <span className="text-sm">{user}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <Button onClick={handleCreateGroup} variant="warm" className="w-full">
                        Create Group
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-float" />
                    <p className="text-muted-foreground mb-4">No groups yet</p>
                    <p className="text-sm text-muted-foreground">Create your first group to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groups.map((group) => (
                      <Card key={group.id} className="bg-gradient-to-br from-secondary/30 via-accent/10 to-card/80 border-0 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-foreground drop-shadow-lg">{group.name}</h3>
                                {group.isOwner && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Crown className="h-3 w-3" />
                                    Owner
                                  </Badge>
                                )}
                                <Badge variant="outline">
                                  {getCategoryIcon(group.category)} {group.category}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-3">{group.description}</p>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openUpdateDialog(group)}
                                disabled={!group.isOwner}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                disabled={!group.isOwner}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-foreground mb-2">
                                Members ({group.memberCount})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {group.members.slice(0, 4).map((member, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8 border-2 border-primary/40 shadow-md">
                                      <AvatarImage src="" />
                                      <AvatarFallback className="text-xs">
                                        {member.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground font-semibold">{member}</span>
                                  </div>
                                ))}
                                {group.memberCount > 4 && (
                                  <span className="text-sm text-muted-foreground">
                                    +{group.memberCount - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-foreground mb-2">Invite Code</p>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                  {group.inviteCode}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyInviteCode(group.inviteCode)}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-border">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created: {new Date(group.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Active: {new Date(group.lastActivity).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              {group.isOwner && (
                                <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="warm-outline"
                                      onClick={() => setSelectedGroup(group)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-1" />
                                      Add Member
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Add Member by Username</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="memberUsername">Username</Label>
                                        <Input
                                          id="memberUsername"
                                          value={newMemberUsername}
                                          onChange={(e) => setNewMemberUsername(e.target.value)}
                                          placeholder="Enter username to add"
                                        />
                                      </div>
                                      <Button onClick={handleAddMemberByUsername} variant="warm" className="w-full">
                                        Add Member
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              
                              <Link to="/recommendations">
                                <Button size="sm" variant="warm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Recommendations
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions Sidebar */}
          <section>
            <div className="space-y-6">
              {/* Update Group */}
              <Card className="bg-gradient-to-br from-card via-secondary/30 to-accent/20 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="warm-outline" className="w-full">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Update Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select Group to Update</Label>
                          <Select onValueChange={(value) => {
                            const group = groups.find(g => g.id === value);
                            if (group) openUpdateDialog(group);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a group" />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.filter(g => g.isOwner).map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedGroup && (
                          <>
                            <div>
                              <Label htmlFor="updateGroupName">Group Name</Label>
                              <Input
                                id="updateGroupName"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Enter new group name"
                              />
                            </div>

                            <div>
                              <Label htmlFor="updateGroupDescription">Description</Label>
                              <Input
                                id="updateGroupDescription"
                                value={newGroupDescription}
                                onChange={(e) => setNewGroupDescription(e.target.value)}
                                placeholder="Update group description"
                              />
                            </div>

                            <div>
                              <Label>Category</Label>
                              <Select value={newGroupCategory} onValueChange={setNewGroupCategory}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {getCategoryIcon(category)} {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Update Members</Label>
                              <div className="grid grid-cols-1 gap-2 mt-2 max-h-32 overflow-y-auto">
                                {availableUsers.map((user) => (
                                  <label key={user} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedMembers.includes(user)}
                                      onChange={() => toggleMemberSelection(user)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">{user}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            
                            <Button onClick={handleUpdateGroup} variant="warm" className="w-full">
                              Update Group
                            </Button>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Join Group</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="inviteCode">Group Invite Code</Label>
                        <Input
                          id="inviteCode"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="Enter invite code"
                        />
                      </div>
                      <Button 
                        onClick={handleJoinGroup} 
                        variant="warm-outline" 
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Group
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Stats */}
              <Card className="bg-gradient-to-br from-card via-secondary/30 to-accent/20 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Groups</span>
                      <span className="font-semibold">{groups.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Groups I Own</span>
                      <span className="font-semibold">{groups.filter(g => g.isOwner).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Members</span>
                      <span className="font-semibold">
                        {groups.reduce((sum, group) => sum + group.memberCount, 0)}
                      </span>
                    </div>
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

export default Groups;