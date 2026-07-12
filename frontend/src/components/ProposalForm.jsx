import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { API, useAuth } from "../App";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const SOURCE_TYPES = [
  { value: "archived_web", label: "Archived web page" },
  { value: "press", label: "Press article" },
  { value: "flyer", label: "Flyer scan" },
  { value: "photo", label: "Photo" },
  { value: "recording_link", label: "Recording link" },
  { value: "contributor_attestation", label: "I was there (no link)" },
];

const IMAGE_SOURCE_TYPES = new Set(["flyer", "photo"]);

const emptyForm = {
  stageName: "",
  artistName: "",
  setDate: "",
  startTime: "",
  endTime: "",
  isB2b: false,
  b2bPartners: "",
  notes: "",
  sourceType: "archived_web",
  sourceLink: "",
  sourceDescription: "",
  contributorName: "",
};

// lockedEdition: { id, label, festivalName } - when opened from an edition page
// lockedArtist: string - when opened from an artist page
// correctionOf: { id, edition_id, stage_name, artist_name, set_date, start_time, end_time, is_b2b, b2b_partners, notes } - when correcting an existing set
const ProposalForm = ({ open, onOpenChange, lockedEdition, lockedArtist, correctionOf, onSubmitted }) => {
  const { user, token, isAuthenticated } = useAuth();
  const isCorrection = !!correctionOf;

  const [festivals, setFestivals] = useState([]);
  const [selectedFestivalSlug, setSelectedFestivalSlug] = useState("");
  const [editions, setEditions] = useState([]);
  const [selectedEditionId, setSelectedEditionId] = useState(lockedEdition?.id || correctionOf?.edition_id || "");
  const [stageSuggestions, setStageSuggestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const editionIsFixed = !!lockedEdition || isCorrection;

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm,
      stageName: correctionOf?.stage_name || "",
      artistName: correctionOf?.artist_name || lockedArtist || "",
      setDate: correctionOf?.set_date || "",
      startTime: correctionOf?.start_time || "",
      endTime: correctionOf?.end_time || "",
      isB2b: correctionOf?.is_b2b || false,
      b2bPartners: (correctionOf?.b2b_partners || []).join(", "),
      notes: correctionOf?.notes || "",
    });
    setSelectedEditionId(lockedEdition?.id || correctionOf?.edition_id || "");
    setSelectedFestivalSlug("");
    setEditions([]);
    if (!editionIsFixed) {
      axios.get(`${API}/festivals`).then((res) => setFestivals(res.data)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!selectedFestivalSlug) return;
    axios
      .get(`${API}/festivals/${selectedFestivalSlug}/editions`)
      .then((res) => setEditions(res.data))
      .catch(() => setEditions([]));
  }, [selectedFestivalSlug]);

  useEffect(() => {
    if (!selectedEditionId) {
      setStageSuggestions([]);
      return;
    }
    axios
      .get(`${API}/editions/${selectedEditionId}`)
      .then((res) => setStageSuggestions(res.data.stages.map((s) => s.name)))
      .catch(() => setStageSuggestions([]));
  }, [selectedEditionId]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEditionId) {
      toast.error("Pick a festival edition");
      return;
    }
    if (!form.stageName.trim() || !form.artistName.trim()) {
      toast.error("Stage and artist are required");
      return;
    }
    const isImageSource = IMAGE_SOURCE_TYPES.has(form.sourceType);
    const isAttestation = form.sourceType === "contributor_attestation";
    if (!isAttestation && !form.sourceLink.trim()) {
      toast.error("A source link is required for this source type");
      return;
    }
    if (isAttestation && !form.sourceDescription.trim()) {
      toast.error("Describe what you witnessed");
      return;
    }

    const payload = {
      proposal_type: isCorrection ? "correction" : "new",
      target_set_id: correctionOf?.id || null,
      edition_id: selectedEditionId,
      stage_name: form.stageName.trim(),
      artist_name: form.artistName.trim(),
      set_date: form.setDate || null,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      is_b2b: form.isB2b,
      b2b_partners: form.isB2b
        ? form.b2bPartners.split(",").map((p) => p.trim()).filter(Boolean)
        : null,
      notes: form.notes || null,
      source_type: form.sourceType,
      source_url: !isImageSource && !isAttestation ? form.sourceLink.trim() : null,
      source_image_url: isImageSource ? form.sourceLink.trim() : null,
      source_description: form.sourceDescription || null,
      contributor_name: isAuthenticated ? undefined : form.contributorName.trim() || null,
    };

    setSubmitting(true);
    try {
      await axios.post(`${API}/proposals`, payload, {
        headers: isAuthenticated ? { Authorization: `Bearer ${token}` } : {},
      });
      toast.success("Thanks! Your submission is pending review.");
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const isImageSource = IMAGE_SOURCE_TYPES.has(form.sourceType);
  const isAttestation = form.sourceType === "contributor_attestation";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0A0A0A] border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {isCorrection ? "Correct this set" : "Add a set"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {lockedEdition && (
            <div>
              <Label className="text-white/70">Edition</Label>
              <p className="text-white mt-1">
                {lockedEdition.festivalName} — {lockedEdition.label}
              </p>
            </div>
          )}

          {isCorrection && !lockedEdition && (
            <div>
              <Label className="text-white/70">Edition</Label>
              <p className="text-white mt-1">
                {correctionOf.festival_name
                  ? `${correctionOf.festival_name} — ${
                      correctionOf.edition_name || correctionOf.edition_year || ""
                    }`
                  : "Correcting the existing set on this edition"}
              </p>
            </div>
          )}

          {!editionIsFixed && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Festival</Label>
                <Select value={selectedFestivalSlug} onValueChange={setSelectedFestivalSlug}>
                  <SelectTrigger className="bg-black border-white/20 text-white">
                    <SelectValue placeholder="Select a festival" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {festivals.map((f) => (
                      <SelectItem key={f.slug} value={f.slug}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Edition</Label>
                <Select
                  value={selectedEditionId}
                  onValueChange={setSelectedEditionId}
                  disabled={!selectedFestivalSlug}
                >
                  <SelectTrigger className="bg-black border-white/20 text-white">
                    <SelectValue placeholder="Select an edition" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                    {editions.map((ed) => (
                      <SelectItem key={ed.id} value={ed.id}>
                        {ed.edition_name || ed.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label className="text-white/70">Stage</Label>
            <Input
              list="stage-suggestions"
              value={form.stageName}
              onChange={(e) => update("stageName", e.target.value)}
              className="bg-black border-white/20 text-white"
              placeholder="e.g. kineticFIELD"
              required
            />
            <datalist id="stage-suggestions">
              {stageSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          {lockedArtist ? (
            <div>
              <Label className="text-white/70">Artist</Label>
              <p className="text-white mt-1">{lockedArtist}</p>
            </div>
          ) : (
            <div>
              <Label className="text-white/70">Artist</Label>
              <Input
                value={form.artistName}
                onChange={(e) => update("artistName", e.target.value)}
                className="bg-black border-white/20 text-white"
                placeholder="Artist name"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-white/70">Date</Label>
              <Input
                type="date"
                value={form.setDate}
                onChange={(e) => update("setDate", e.target.value)}
                className="bg-black border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70">Start time</Label>
              <Input
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className="bg-black border-white/20 text-white"
                placeholder="e.g. 23:00"
              />
            </div>
            <div>
              <Label className="text-white/70">End time</Label>
              <Input
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                className="bg-black border-white/20 text-white"
                placeholder="e.g. 00:30"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isB2b}
                onChange={(e) => update("isB2b", e.target.checked)}
                className="accent-[#FF3B30]"
              />
              This was a B2B set
            </label>
            {form.isB2b && (
              <Input
                value={form.b2bPartners}
                onChange={(e) => update("b2bPartners", e.target.value)}
                className="bg-black border-white/20 text-white mt-2"
                placeholder="B2B partner names, comma-separated"
              />
            )}
          </div>

          <div>
            <Label className="text-white/70">Notes (optional)</Label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full h-20 bg-black border border-white/20 text-white p-3 resize-none focus:border-[#FF3B30] focus:outline-none"
              placeholder="Anything else worth noting"
            />
          </div>

          <div className="pt-4 border-t border-white/10 space-y-4">
            <div>
              <Label className="text-white/70">Source type</Label>
              <Select value={form.sourceType} onValueChange={(v) => update("sourceType", v)}>
                <SelectTrigger className="bg-black border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0A] border-white/10 text-white">
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isAttestation && (
              <div>
                <Label className="text-white/70">
                  {isImageSource ? "Link to the image" : "Source link"}
                </Label>
                <Input
                  value={form.sourceLink}
                  onChange={(e) => update("sourceLink", e.target.value)}
                  className="bg-black border-white/20 text-white"
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            <div>
              <Label className="text-white/70">
                {isAttestation ? "What did you witness?" : "Additional context (optional)"}
              </Label>
              <textarea
                value={form.sourceDescription}
                onChange={(e) => update("sourceDescription", e.target.value)}
                className="w-full h-20 bg-black border border-white/20 text-white p-3 resize-none focus:border-[#FF3B30] focus:outline-none"
                placeholder={isAttestation ? "I was there and saw..." : "Optional caption or context"}
                required={isAttestation}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            {isAuthenticated ? (
              <p className="text-sm text-white/50">
                Submitting as <span className="text-white">{user?.name}</span>
              </p>
            ) : (
              <div>
                <Label className="text-white/70">Your name (optional)</Label>
                <Input
                  value={form.contributorName}
                  onChange={(e) => update("contributorName", e.target.value)}
                  className="bg-black border-white/20 text-white"
                  placeholder="Leave blank to submit anonymously"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-[#FF3B30] text-white font-medium hover:bg-[#D32F2F] transition-colors disabled:opacity-50"
              data-testid="submit-proposal-btn"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Submit for review
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalForm;
