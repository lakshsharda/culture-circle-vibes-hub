import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Eye, Settings, TrendingUp, Calendar, Hash, ArrowRight, Crown, Plus, UserPlus, Mail } from "lucide-react";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, setDoc, query, where, arrayUnion, deleteDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  memberCount?: number;
  isOwner?: boolean;
  createdAt: string;
  lastActivity: string;
  category: string;
  code: string;
  owner: string; // Add owner field
}

const Dashboard = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Move fetchGroups outside useEffect so it can be called after join
  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "groups"), where("members", "array-contains", user.email));
      const querySnapshot = await getDocs(q);
      const groupList: Group[] = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Group[];
      setGroups(groupList);
    } catch (e) {
      toast({ title: "Error", description: "Failed to fetch groups.", variant: "destructive" });
    } finally {
      setLoadingGroups(false);
    }
  };

  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch group requests for groups I own
  const fetchGroupRequests = async () => {
    setLoadingRequests(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      // Get all groups owned by the user
      const groupsQ = query(collection(db, "groups"), where("owner", "==", user.email));
      const groupsSnap = await getDocs(groupsQ);
      const groupIds = groupsSnap.docs.map(doc => doc.id);
      if (groupIds.length === 0) {
        setGroupRequests([]);
        setLoadingRequests(false);
        return;
      }
      // Get all requests for these groups
      const requestsQ = query(collection(db, "groupRequests"), where("groupId", "in", groupIds), where("status", "==", "pending"));
      const requestsSnap = await getDocs(requestsQ);
      setGroupRequests(requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      setGroupRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Add a state for user invites
  const [userInvites, setUserInvites] = useState<any[]>([]);
  const [loadingUserInvites, setLoadingUserInvites] = useState(true);

  // Fetch group invites for the current user
  const fetchUserInvites = async () => {
    setLoadingUserInvites(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const invitesQ = query(collection(db, "groupRequests"), where("invitedEmail", "==", user.email), where("status", "==", "pending"));
      const invitesSnap = await getDocs(invitesQ);
      setUserInvites(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      setUserInvites([]);
    } finally {
      setLoadingUserInvites(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchGroupRequests();
    fetchUserInvites();
  }, []);

  // Group creation state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("");
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Add member email after checking Firestore
  const handleAddMemberEmail = async () => {
    const email = memberEmailInput.trim().toLowerCase();
    if (!email || memberEmails.includes(email)) return;
    // Check if user exists in Firestore (query for lowercase email)
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      toast({ title: "User not found", description: `No verified user with email: ${email}`, variant: "destructive" });
      return;
    }
    setMemberEmails(prev => [...prev, email]);
    setMemberEmailInput("");
    toast({ title: "Member added", description: `${email} added to group.` });
  };

  // Generate a unique 9-letter code
  const generateGroupCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 9; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  // Create group in Firestore
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupDescription.trim() || !newGroupCategory) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const code = generateGroupCode();
      const groupData = {
        name: newGroupName,
        description: newGroupDescription,
        category: newGroupCategory,
        members: [user.email], // Only owner is added directly
        owner: user.email,
        code,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      const groupRef = await addDoc(collection(db, "groups"), groupData);
      // For each entered member email, create an invite request
      for (const email of memberEmails) {
        await addDoc(collection(db, "groupRequests"), {
          groupId: groupRef.id,
          groupName: newGroupName,
          invitedEmail: email,
          inviterEmail: user.email,
          status: "pending",
          createdAt: Timestamp.now(),
        });
      }
      toast({ title: "Group Created! 🎉", description: `${newGroupName} has been created. Share code: ${code}` });
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupCategory("");
      setMemberEmails([]);
      // Refresh group list after a short delay for better UX
      setTimeout(fetchGroups, 500);
    } catch (e) {
      toast({ title: "Error", description: "Failed to create group.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Approve/Decline request logic
  const handleApproveRequest = async (request: any) => {
    try {
      // Add member to group
      const groupRef = doc(db, "groups", request.groupId);
      await updateDoc(groupRef, { members: arrayUnion(request.requesterEmail) });
      // Update request status
      await updateDoc(doc(db, "groupRequests", request.id), { status: "approved" });
      toast({ title: "Request Approved", description: `${request.requesterEmail} added to group.` });
      await fetchGroups();
      await fetchGroupRequests();
    } catch (e) {
      toast({ title: "Error", description: "Failed to approve request.", variant: "destructive" });
    }
  };
  const handleDeclineRequest = async (request: any) => {
    try {
      await updateDoc(doc(db, "groupRequests", request.id), { status: "declined" });
      toast({ title: "Request Declined", description: `Request from ${request.requesterEmail} declined.` });
      await fetchGroupRequests();
    } catch (e) {
      toast({ title: "Error", description: "Failed to decline request.", variant: "destructive" });
    }
  };

  // Update join group by code logic to create a join request instead of adding member directly
  const handleJoinGroup = async () => {
    const code = joinCodeInput.trim();
    if (!code) return;
    setJoining(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const q = query(collection(db, "groups"), where("code", "==", code));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({ title: "Group not found", description: "Invalid group code.", variant: "destructive" });
        return;
      }
      const groupDoc = querySnapshot.docs[0];
      const groupRef = doc(db, "groups", groupDoc.id);
      const groupData = groupDoc.data();
      if (groupData.members.includes(user.email)) {
        toast({ title: "Already a member", description: "You are already in this group." });
        return;
      }
      // Instead of adding directly, create a join request
      await addDoc(collection(db, "groupRequests"), {
        groupId: groupDoc.id,
        groupName: groupData.name,
        requesterEmail: user.email,
        status: "pending",
        createdAt: Timestamp.now(),
      });
      toast({ title: "Request Sent!", description: "Waiting for group owner approval." });
      setJoinCodeInput("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to send join request.", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  // Accept/Decline invite logic
  const handleAcceptInvite = async (invite: any) => {
    try {
      const groupRef = doc(db, "groups", invite.groupId);
      await updateDoc(groupRef, { members: arrayUnion(invite.invitedEmail) });
      await updateDoc(doc(db, "groupRequests", invite.id), { status: "accepted" });
      toast({ title: "Invite Accepted", description: `You have joined ${invite.groupName}` });
      await fetchGroups();
      await fetchUserInvites();
    } catch (e) {
      toast({ title: "Error", description: "Failed to accept invite.", variant: "destructive" });
    }
  };
  const handleDeclineInvite = async (invite: any) => {
    try {
      await updateDoc(doc(db, "groupRequests", invite.id), { status: "declined" });
      toast({ title: "Invite Declined", description: `You declined invite to ${invite.groupName}` });
      await fetchUserInvites();
    } catch (e) {
      toast({ title: "Error", description: "Failed to decline invite.", variant: "destructive" });
    }
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

  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupCategory, setEditGroupCategory] = useState("");
  const [editMemberEmailInput, setEditMemberEmailInput] = useState("");
  const [editMemberEmails, setEditMemberEmails] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEditGroup = (group: Group) => {
    setEditGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description);
    setEditGroupCategory(group.category);
    setEditMemberEmails(group.members.filter(m => m !== group.owner));
  };

  const handleEditAddMemberEmail = async () => {
    const email = editMemberEmailInput.trim().toLowerCase();
    if (!email || editMemberEmails.includes(email) || email === editGroup?.owner) return;
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      toast({ title: "User not found", description: `No verified user with email: ${email}`, variant: "destructive" });
      return;
    }
    const user = auth.currentUser;
    if (!user || !editGroup) return;
    await addDoc(collection(db, "groupRequests"), {
      groupId: editGroup.id,
      groupName: editGroup.name,
      invitedEmail: email,
      inviterEmail: user.email,
      status: "pending",
      createdAt: Timestamp.now(),
    });
    setEditMemberEmailInput("");
    toast({ title: "Invite Sent!", description: `Invite sent to ${email}. Waiting for their approval.` });
  };

  const handleSaveEditGroup = async () => {
    if (!editGroup) return;
    setSavingEdit(true);
    try {
      const groupRef = doc(db, "groups", editGroup.id);
      await updateDoc(groupRef, {
        name: editGroupName,
        description: editGroupDescription,
        category: editGroupCategory,
        members: [editGroup.owner, ...editMemberEmails],
        lastActivity: new Date().toISOString(),
      });
      toast({ title: "Group Updated!", description: "Group details updated successfully." });
      setEditGroup(null);
      await fetchGroups();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update group.", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "groups", group.id));
      toast({ title: "Group Deleted", description: `${group.name} has been deleted.` });
      await fetchGroups();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete group.", variant: "destructive" });
    }
  };

  // Define categories for the dropdown
  const groupCategories = [
    "Travel",
    "Music",
    "Food",
    "Art",
    "Books",
    "Movies",
    "Sports",
    "Gaming",
    "Other"
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#f0fdfa] dark:from-[#18181b] dark:via-[#23272f] dark:to-[#1e293b] py-10 px-6 flex flex-col">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-center sm:text-left">
          <div>
            <h1 className="text-5xl font-extrabold text-primary mb-2 drop-shadow-lg animate-fade-in-up">Dashboard</h1>
            <p className="text-xl text-muted-foreground animate-fade-in-up">
              Manage your cultural groups and discover new experiences together.
            </p>
          </div>
          <Link to="/edit-profile">
            <Button variant="warm-outline" className="font-semibold rounded-full px-6 py-2 shadow-md hover:scale-105 transition-transform animate-float">
              Edit Profile
            </Button>
          </Link>
        </div>
        {/* Group Creation & Join Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Create Group */}
          <Card className="bg-gradient-to-br from-white/90 via-secondary/20 to-accent/10 shadow-2xl rounded-2xl animate-fade-in-up border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Group
              </CardTitle>
              <p className="text-sm text-muted-foreground">Start a new cultural group and invite members</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Group Name</label>
                <input
                  className="w-full border border-border/50 rounded-lg px-4 py-3 bg-white/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Enter a creative group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
                <textarea
                  className="w-full border border-border/50 rounded-lg px-4 py-3 bg-white/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  rows={3}
                  value={newGroupDescription}
                  onChange={e => setNewGroupDescription(e.target.value)}
                  placeholder="Describe your group's purpose and interests"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Category</label>
                <select
                  className="w-full border border-border/50 rounded-lg px-4 py-3 bg-white/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={newGroupCategory}
                  onChange={e => setNewGroupCategory(e.target.value)}
                >
                  <option value="" disabled>Select a category</option>
                  {groupCategories.map((cat) => (
                    <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Add Members (email)</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-border/50 rounded-lg px-4 py-3 bg-white/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={memberEmailInput}
                    onChange={e => setMemberEmailInput(e.target.value)}
                    placeholder="Enter member email address"
                  />
                  <Button type="button" variant="warm-outline" onClick={handleAddMemberEmail} className="px-6">
                    Add
                  </Button>
                </div>
                {memberEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {memberEmails.map((email, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-3 py-2 rounded-full text-sm border border-primary/20">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        {email}
                        <button
                          type="button"
                          onClick={() => setMemberEmails(prev => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive ml-1 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="warm" className="w-full font-bold py-3 text-base" onClick={handleCreateGroup} disabled={creating}>
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Group...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Group
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Join Group by Code */}
          <Card className="bg-gradient-to-br from-white/90 via-secondary/20 to-accent/10 shadow-2xl rounded-2xl animate-fade-in-up border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Join Existing Group
              </CardTitle>
              <p className="text-sm text-muted-foreground">Enter a group code to join an existing group</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Group Code</label>
                <input
                  className="w-full border border-border/50 rounded-lg px-4 py-3 bg-white/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-center text-lg tracking-wider"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value)}
                  placeholder="Enter 9-letter group code"
                  maxLength={9}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">Ask the group owner for the invite code</p>
              </div>
              <Button variant="warm-outline" className="w-full font-bold py-3 text-base" onClick={handleJoinGroup} disabled={joining}>
                {joining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Joining Group...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Join Group
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Group Requests and Invites */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Group Requests section */}
          <Card className="bg-gradient-to-br from-white/90 via-secondary/20 to-accent/10 shadow-2xl rounded-2xl animate-fade-in-up border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Group Requests
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage requests to join your groups</p>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              ) : groupRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pending requests</p>
                  <p className="text-xs text-muted-foreground mt-1">When people request to join your groups, they'll appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/30">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{req.requesterEmail}</div>
                        <div className="text-sm text-muted-foreground">Requesting to join <span className="font-medium text-primary">{req.groupName}</span></div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="warm" onClick={() => handleApproveRequest(req)} className="px-4">
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeclineRequest(req)} className="px-4">
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* User Group Invites section */}
          <Card className="bg-gradient-to-br from-white/90 via-secondary/20 to-accent/10 shadow-2xl rounded-2xl animate-fade-in-up border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Your Invites
              </CardTitle>
              <p className="text-sm text-muted-foreground">Respond to group invitations</p>
            </CardHeader>
            <CardContent>
              {loadingUserInvites ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-muted-foreground">Loading invites...</p>
                </div>
              ) : userInvites.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pending invites</p>
                  <p className="text-xs text-muted-foreground mt-1">When you receive group invitations, they'll appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/30">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{invite.groupName}</div>
                        <div className="text-sm text-muted-foreground">Invited by <span className="font-medium text-primary">{invite.inviterEmail}</span></div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="warm" onClick={() => handleAcceptInvite(invite)} className="px-4">
                          Accept
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeclineInvite(invite)} className="px-4">
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid lg:grid-cols-3 gap-10 mb-10">
          {/* My Groups Section */}
          <section className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-secondary/30 via-accent/10 to-card/80 border-0 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 animate-fade-in-up">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary animate-float" />
                  My Groups ({groups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingGroups ? (
                  <div className="text-center py-12 text-muted-foreground">Loading groups...</div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No groups yet</p>
                    <p className="text-sm text-muted-foreground">Create your first group to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <Card key={group.id} className="bg-gradient-to-br from-white/80 via-secondary/20 to-accent/10 border-0 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
                        <CardContent className="p-6">
                          {/* Header Section */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-2xl font-bold text-foreground">{group.name}</h3>
                                <div className="flex items-center gap-2">
                                  {group.owner === auth.currentUser?.email && (
                                    <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary border-primary/20">
                                      <Crown className="h-3 w-3" />
                                      Owner
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="px-3 py-1 text-sm">
                                    {getCategoryIcon(group.category)} {group.category}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-base text-muted-foreground leading-relaxed">{group.description}</p>
                            </div>
                            {group.owner === auth.currentUser?.email && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="warm-outline" className="ml-4" onClick={() => openEditGroup(group)}>
                                    <Settings className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Edit Group</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Group Name</label>
                                      <input className="w-full border rounded-lg px-3 py-2" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Description</label>
                                      <input className="w-full border rounded-lg px-3 py-2" value={editGroupDescription} onChange={e => setEditGroupDescription(e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Category</label>
                                      <input className="w-full border rounded-lg px-3 py-2" value={editGroupCategory} onChange={e => setEditGroupCategory(e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Add Member (email)</label>
                                      <div className="flex gap-2">
                                        <input className="flex-1 border rounded-lg px-3 py-2" value={editMemberEmailInput} onChange={e => setEditMemberEmailInput(e.target.value)} placeholder="Enter member email" />
                                        <Button type="button" variant="warm-outline" onClick={handleEditAddMemberEmail}>Add</Button>
                                      </div>
                                      {editMemberEmails.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {editMemberEmails.map((email, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
                                              {email}
                                              <button type="button" onClick={() => setEditMemberEmails(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive ml-1">×</button>
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <Button variant="warm" className="w-full font-bold" onClick={handleSaveEditGroup} disabled={savingEdit}>
                                      {savingEdit ? "Saving..." : "Save Changes"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>

                          {/* Members Section */}
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Members ({group.members.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.members.slice(0, 4).map((member, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                                  <Avatar className="w-8 h-8 border-2 border-primary/20">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="text-sm font-medium">
                                      {member.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{member}</p>
                                    {member === group.owner && (
                                      <Badge variant="secondary" className="mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20">
                                        Owner
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {group.members.length > 4 && (
                                <div className="flex items-center justify-center p-3 bg-secondary/20 rounded-lg">
                                  <span className="text-sm text-muted-foreground">
                                    +{group.members.length - 4} more members
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Group Code Section */}
                          <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-foreground mb-1">Group Code</h4>
                                <p className="text-xs text-muted-foreground">Share this code to invite members</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-lg bg-white px-3 py-2 rounded-lg border shadow-sm">{group.code}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(group.code);
                                    toast({ title: "Copied!", description: "Group code copied to clipboard." });
                                  }}
                                  className="hover:bg-primary/10"
                                  aria-label="Copy group code"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Footer Section */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Hash className="h-4 w-4" />
                                <span>Active: {new Date(group.lastActivity).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Link to="/recommendations">
                                <Button size="sm" variant="warm" className="font-medium">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Recommendations
                                </Button>
                              </Link>
                              {group.owner === auth.currentUser?.email && (
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => handleDeleteGroup(group)}
                                  className="font-medium"
                                >
                                  Delete
                                </Button>
                              )}
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

          {/* Quick Stats & Actions */}
          <section>
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-gradient-to-br from-card via-secondary/30 to-accent/20 shadow-2xl rounded-2xl animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary animate-float" />
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
                        <span className="text-lg font-semibold">{groups.filter(g => g.owner === auth.currentUser?.email).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Groups</span>
                      <span className="text-lg font-semibold">{groups.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gradient-to-br from-card via-secondary/30 to-accent/20 shadow-2xl rounded-2xl animate-fade-in-up">
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