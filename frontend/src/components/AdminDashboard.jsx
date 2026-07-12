import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Film,
  Music,
  Users,
  Save,
  X,
  Loader2,
  Inbox,
  Check,
  ShieldQuestion,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const AdminDashboard = () => {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [genres, setGenres] = useState([]);
  const [pioneerCount, setPioneerCount] = useState({ total_users: 0, pioneers_remaining: 50 });
  const [loading, setLoading] = useState(true);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [proposalStatus, setProposalStatus] = useState("pending");
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const [episodeForm, setEpisodeForm] = useState({
    block_number: 1,
    year_start: 2026,
    year_end: 2030,
    title: "",
    subtitle: "",
    description: "",
    location: "",
    pioneers: "",
    image_url: "",
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const [episodesRes, genresRes, countRes] = await Promise.all([
          axios.get(`${API}/episodes`),
          axios.get(`${API}/genres`),
          axios.get(`${API}/auth/pioneer-count`),
        ]);
        setEpisodes(episodesRes.data);
        setGenres(genresRes.data);
        setPioneerCount(countRes.data);
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchProposals = async (status) => {
    setProposalsLoading(true);
    try {
      const res = await axios.get(`${API}/proposals`, {
        params: { status },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProposals(res.data);
    } catch (error) {
      toast.error("Failed to load proposals");
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProposals(proposalStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, proposalStatus]);

  const handleApprove = async (proposalId) => {
    setReviewingId(proposalId);
    try {
      await axios.post(
        `${API}/proposals/${proposalId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Proposal approved");
      fetchProposals(proposalStatus);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to approve proposal");
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (proposalId) => {
    const reviewerNote = window.prompt("Reason for rejecting this proposal (shown to no one but kept for the record):");
    if (reviewerNote === null) return;
    if (!reviewerNote.trim()) {
      toast.error("A reason is required to reject a proposal");
      return;
    }
    setReviewingId(proposalId);
    try {
      await axios.post(
        `${API}/proposals/${proposalId}/reject`,
        { reviewer_note: reviewerNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Proposal rejected");
      fetchProposals(proposalStatus);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reject proposal");
    } finally {
      setReviewingId(null);
    }
  };

  const handleEpisodeSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...episodeForm,
      pioneers: episodeForm.pioneers.split(",").map((p) => p.trim()).filter(Boolean),
    };

    try {
      if (editingEpisode) {
        await axios.put(`${API}/episodes/${editingEpisode.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Episode updated");
      } else {
        await axios.post(`${API}/episodes`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Episode created");
      }

      // Refresh episodes
      const res = await axios.get(`${API}/episodes`);
      setEpisodes(res.data);
      setEditingEpisode(null);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save episode");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEpisode = async (episodeId) => {
    if (!window.confirm("Are you sure you want to delete this episode?")) return;

    try {
      await axios.delete(`${API}/episodes/${episodeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEpisodes(episodes.filter((e) => e.id !== episodeId));
      toast.success("Episode deleted");
    } catch (error) {
      toast.error("Failed to delete episode");
    }
  };

  const startEditing = (episode) => {
    setEditingEpisode(episode);
    setEpisodeForm({
      block_number: episode.block_number,
      year_start: episode.year_start,
      year_end: episode.year_end,
      title: episode.title,
      subtitle: episode.subtitle,
      description: episode.description,
      location: episode.location,
      pioneers: episode.pioneers.join(", "),
      image_url: episode.image_url,
    });
  };

  const resetForm = () => {
    setEpisodeForm({
      block_number: episodes.length + 1,
      year_start: 2026,
      year_end: 2030,
      title: "",
      subtitle: "",
      description: "",
      location: "",
      pioneers: "",
      image_url: "",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black" data-testid="admin-dashboard">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-white/5 transition-colors"
              data-testid="admin-back-btn"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-white/40">Manage protocol content</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white">{user?.name}</p>
              <p className="text-xs text-[#FF3B30]">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0A0A0A] border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF3B30]/10 flex items-center justify-center">
                <Film className="w-6 h-6 text-[#FF3B30]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{episodes.length}</p>
                <p className="text-sm text-white/40">Episodes</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#3B82F6]/10 flex items-center justify-center">
                <Music className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{genres.length}</p>
                <p className="text-sm text-white/40">Genres</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#22C55E]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{pioneerCount.total_users}</p>
                <p className="text-sm text-white/40">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF3B30]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#FF3B30]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{pioneerCount.pioneers_remaining}</p>
                <p className="text-sm text-white/40">Pioneer Spots</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="episodes" className="w-full">
            <TabsList className="bg-[#0A0A0A] border border-white/10 mb-8">
              <TabsTrigger value="episodes" className="data-[state=active]:bg-[#FF3B30]">
                Episodes
              </TabsTrigger>
              <TabsTrigger value="genres" className="data-[state=active]:bg-[#FF3B30]">
                Genres
              </TabsTrigger>
              <TabsTrigger value="proposals" className="data-[state=active]:bg-[#FF3B30]" data-testid="proposals-tab">
                Proposals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="episodes">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Timeline Episodes</h2>
                <button
                  onClick={() => {
                    resetForm();
                    setIsCreating(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF3B30] text-white text-sm font-medium hover:bg-[#D32F2F] transition-colors"
                  data-testid="add-episode-btn"
                >
                  <Plus className="w-4 h-4" />
                  Add Episode
                </button>
              </div>

              <div className="space-y-4">
                {episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="bg-[#0A0A0A] border border-white/10 p-6 flex items-center gap-6"
                    data-testid={`episode-row-${episode.block_number}`}
                  >
                    <img
                      src={episode.image_url}
                      alt={episode.title}
                      className="w-24 h-16 object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-xs text-[#FF3B30]">
                          BLOCK #{episode.block_number.toString().padStart(2, "0")}
                        </span>
                        <span className="text-xs text-white/40">
                          {episode.year_start} - {episode.year_end}
                        </span>
                        <span className="version-tag">v{episode.version}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{episode.title}</h3>
                      <p className="text-sm text-white/50">{episode.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(episode)}
                        className="p-2 hover:bg-white/5 transition-colors"
                        data-testid={`edit-episode-${episode.block_number}`}
                      >
                        <Edit className="w-4 h-4 text-white/60" />
                      </button>
                      <button
                        onClick={() => handleDeleteEpisode(episode.id)}
                        className="p-2 hover:bg-white/5 transition-colors"
                        data-testid={`delete-episode-${episode.block_number}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="genres">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Genre Database</h2>
                <p className="text-sm text-white/40">{genres.length} genres documented</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="p-3 bg-[#0A0A0A] border border-white/10 text-sm text-white/70"
                  >
                    <p className="font-medium truncate">{genre.name}</p>
                    <p className="text-xs text-white/40">{genre.category}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="proposals">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Moderation Queue</h2>
                <div className="flex items-center gap-2">
                  {["pending", "approved", "rejected"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setProposalStatus(s)}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
                        proposalStatus === s
                          ? "bg-[#FF3B30] border-[#FF3B30] text-white"
                          : "border-white/20 text-white/50 hover:text-white"
                      }`}
                      data-testid={`proposal-filter-${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {proposalsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : proposals.length === 0 ? (
                <div className="py-16 text-center border border-white/10 bg-[#0A0A0A]">
                  <Inbox className="w-8 h-8 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">No {proposalStatus} proposals.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#0A0A0A] border border-white/10 p-6"
                      data-testid={`proposal-row-${p.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
                                p.proposal_type === "correction"
                                  ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30"
                                  : "bg-white/10 text-white/70 border border-white/20"
                              }`}
                            >
                              {p.proposal_type === "correction" ? "Correction" : "New Set"}
                            </span>
                            <span className="text-xs text-white/40">
                              {p.festival_name} — {p.edition_label}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white">
                            {p.artist_name}
                            {p.is_b2b && p.b2b_partners?.length > 0 && (
                              <span className="text-white/50 font-normal">
                                {" "}
                                b2b {p.b2b_partners.join(", ")}
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-white/50">
                            {p.stage_name}
                            {p.set_date && ` · ${p.set_date}`}
                            {(p.start_time || p.end_time) &&
                              ` · ${[p.start_time, p.end_time].filter(Boolean).join(" – ")}`}
                          </p>
                        </div>
                        {p.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReject(p.id)}
                              disabled={reviewingId === p.id}
                              className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-red-500/50 text-white/70 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
                              data-testid={`reject-proposal-${p.id}`}
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={reviewingId === p.id}
                              className="flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] transition-colors disabled:opacity-50"
                              data-testid={`approve-proposal-${p.id}`}
                            >
                              {reviewingId === p.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                          </div>
                        )}
                      </div>

                      {p.notes && <p className="text-sm text-white/50 mb-3">{p.notes}</p>}

                      <div className="bg-black/40 border border-white/10 px-4 py-3 text-sm">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
                          Source ({p.source_type.replace(/_/g, " ")})
                        </p>
                        {(p.source_url || p.source_image_url) && (
                          <a
                            href={p.source_url || p.source_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FF3B30] hover:underline break-all"
                          >
                            {p.source_url || p.source_image_url}
                          </a>
                        )}
                        {p.source_description && (
                          <p className="text-white/70 mt-1">{p.source_description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs text-white/40">
                        <span>
                          Submitted by {p.contributor_name || "Anonymous"} on{" "}
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                        {p.status !== "pending" && (
                          <span className="flex items-center gap-1">
                            {p.status === "approved" ? (
                              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                            ) : (
                              <ShieldQuestion className="w-3.5 h-3.5 text-red-400" />
                            )}
                            Reviewed by {p.reviewed_by}
                            {p.reviewer_note && ` — "${p.reviewer_note}"`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Episode Form Modal */}
      <Dialog
        open={!!editingEpisode || isCreating}
        onOpenChange={() => {
          setEditingEpisode(null);
          setIsCreating(false);
        }}
      >
        <DialogContent className="max-w-2xl bg-[#0A0A0A] border-white/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {editingEpisode ? "Edit Episode" : "Create Episode"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEpisodeSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-white/70">Block Number</Label>
                <Input
                  type="number"
                  value={episodeForm.block_number}
                  onChange={(e) =>
                    setEpisodeForm({ ...episodeForm, block_number: parseInt(e.target.value) })
                  }
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white/70">Year Start</Label>
                <Input
                  type="number"
                  value={episodeForm.year_start}
                  onChange={(e) =>
                    setEpisodeForm({ ...episodeForm, year_start: parseInt(e.target.value) })
                  }
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-white/70">Year End</Label>
                <Input
                  type="number"
                  value={episodeForm.year_end}
                  onChange={(e) =>
                    setEpisodeForm({ ...episodeForm, year_end: parseInt(e.target.value) })
                  }
                  className="bg-black border-white/20 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-white/70">Title</Label>
              <Input
                value={episodeForm.title}
                onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                className="bg-black border-white/20 text-white"
                placeholder="Episode title"
                required
              />
            </div>

            <div>
              <Label className="text-white/70">Subtitle</Label>
              <Input
                value={episodeForm.subtitle}
                onChange={(e) => setEpisodeForm({ ...episodeForm, subtitle: e.target.value })}
                className="bg-black border-white/20 text-white"
                placeholder="Episode subtitle"
                required
              />
            </div>

            <div>
              <Label className="text-white/70">Description</Label>
              <textarea
                value={episodeForm.description}
                onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                className="w-full h-24 bg-black border border-white/20 text-white p-3 resize-none focus:border-[#FF3B30] focus:outline-none"
                placeholder="Episode description"
                required
              />
            </div>

            <div>
              <Label className="text-white/70">Location</Label>
              <Input
                value={episodeForm.location}
                onChange={(e) => setEpisodeForm({ ...episodeForm, location: e.target.value })}
                className="bg-black border-white/20 text-white"
                placeholder="e.g. Detroit, Michigan"
                required
              />
            </div>

            <div>
              <Label className="text-white/70">Pioneers (comma-separated)</Label>
              <Input
                value={episodeForm.pioneers}
                onChange={(e) => setEpisodeForm({ ...episodeForm, pioneers: e.target.value })}
                className="bg-black border-white/20 text-white"
                placeholder="e.g. Juan Atkins, Derrick May, Kevin Saunderson"
                required
              />
            </div>

            <div>
              <Label className="text-white/70">Image URL</Label>
              <Input
                value={episodeForm.image_url}
                onChange={(e) => setEpisodeForm({ ...episodeForm, image_url: e.target.value })}
                className="bg-black border-white/20 text-white"
                placeholder="https://..."
                required
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setEditingEpisode(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#FF3B30] text-white font-medium hover:bg-[#D32F2F] transition-colors disabled:opacity-50"
                data-testid="save-episode-btn"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingEpisode ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
