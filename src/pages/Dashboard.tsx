import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit3, Trash2, UserPlus, Eye, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Group {
  id: string;
  name: string;
  members: string[];
  createdAt: string;
}

const Dashboard = () => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: "1",
      name: "Tokyo Adventure Squad",
      members: ["Alex Chen", "Sarah Johnson", "Mike Rodriguez"],
      createdAt: "2024-01-15"
    },
    {
      id: "2", 
      name: "Indie Music Lovers",
      members: ["Emma Wilson", "David Kim", "Lisa Martinez", "John Smith"],
      createdAt: "2024-01-20"
    },
    {
      id: "3",
      name: "Foodie Friends",
      members: ["Tom Brown", "Anna Davis"],
      createdAt: "2024-01-25"
    }
  ]);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Mock user data for member selection
  const availableUsers = [
    "Alex Chen", "Sarah Johnson", "Mike Rodriguez", "Emma Wilson", 
    "David Kim", "Lisa Martinez", "John Smith", "Tom Brown", 
    "Anna Davis", "Chris Lee", "Maya Patel", "Ryan O'Connor"
  ];

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      members: selectedMembers,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setGroups(prev => [...prev, newGroup]);
    setNewGroupName("");
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
        ? { ...group, name: newGroupName, members: selectedMembers }
        : group
    ));

    setNewGroupName("");
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

  const openUpdateDialog = (group: Group) => {
    setSelectedGroup(group);
    setNewGroupName(group.name);
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Groups Section */}
          <section>
            <Card className="bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No groups yet</p>
                    <p className="text-sm text-muted-foreground">Create your first group to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="bg-secondary/50 border-0">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-foreground">{group.name}</h3>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openUpdateDialog(group)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-2">Members:</p>
                            <div className="flex flex-wrap gap-1">
                              {group.members.map((member, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {member}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              Created: {new Date(group.createdAt).toLocaleDateString()}
                            </span>
                            <Link to="/recommendations">
                              <Button size="sm" variant="warm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Recommendations
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Manage Groups Section */}
          <section>
            <Card className="bg-card shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Manage Groups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create Group */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Create New Group</h3>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="warm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="groupName">Group Name</Label>
                          <Input
                            id="groupName"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Enter group name"
                          />
                        </div>
                        
                        <div>
                          <Label>Select Members</Label>
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
                </div>

                {/* Update Group */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Update Group</h3>
                  <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="warm-outline" className="w-full">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Update Group
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                              {groups.map((group) => (
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
                              <Label>Update Members</Label>
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
                            
                            <Button onClick={handleUpdateGroup} variant="warm" className="w-full">
                              Update Group
                            </Button>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Join Group */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Join Group</h3>
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;