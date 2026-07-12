import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Link2,
  Share2,
  ShieldQuestion,
  Plus,
  Pencil,
} from "lucide-react";
import { API } from "../App";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import ProposalForm from "./ProposalForm";

const ArtistSetRow = ({ performanceSet, onCorrect }) => {
  const [expanded, setExpanded] = useState(false);
  const hasSources = performanceSet.sources?.length > 0;
  const timeRange = [performanceSet.start_time, performanceSet.end_time]
    .filter(Boolean)
    .join(" – ");
  const editionLabel =
    performanceSet.edition_name ||
    (performanceSet.edition_year
      ? `${performanceSet.festival_name} ${performanceSet.edition_year}`
      : performanceSet.festival_name);

  return (
    <div
      className="border border-white/10 bg-[#0A0A0A] px-5 py-4"
      data-testid={`artist-set-row-${performanceSet.id}`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to={`/editions/${performanceSet.edition_id}`}
            className="text-white font-bold hover:text-[#FF3B30] transition-colors"
          >
            {editionLabel}
          </Link>
          <div className="flex items-center gap-3 flex-wrap mt-1 text-sm text-white/50">
            {performanceSet.festival_name && (
              <Link
                to={`/festivals/${performanceSet.festival_slug}`}
                className="hover:text-white transition-colors"
              >
                {performanceSet.festival_name}
              </Link>
            )}
            {performanceSet.stage_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {performanceSet.stage_name}
              </span>
            )}
            {performanceSet.set_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {performanceSet.set_date}
              </span>
            )}
            {timeRange && <span className="font-mono">{timeRange}</span>}
          </div>
          {performanceSet.is_b2b && performanceSet.b2b_partners?.length > 0 && (
            <p className="text-sm text-white/40 mt-1">
              b2b {performanceSet.b2b_partners.join(", ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {performanceSet.status === "unverified" && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-white/40 border border-white/15">
              <ShieldQuestion className="w-3 h-3" />
              Unverified
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-30 font-mono"
            disabled={!hasSources}
          >
            {hasSources ? performanceSet.sources.length : 0} source
            {performanceSet.sources?.length === 1 ? "" : "s"}
            {hasSources && (expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </button>
          <button
            onClick={() => onCorrect(performanceSet)}
            className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors font-mono"
          >
            <Pencil className="w-3 h-3" />
            Correct
          </button>
        </div>
      </div>

      {expanded && hasSources && (
        <div className="mt-3 pl-4 border-l border-white/10 space-y-2">
          {performanceSet.sources.map((source) => (
            <div key={source.id} className="flex items-start gap-2 text-xs text-white/50">
              <Link2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
              <div>
                <span className="text-white/60">{source.source_type.replace(/_/g, " ")}</span>
                {source.description && <span> — {source.description}</span>}
                {(source.url || source.image_url) && (
                  <>
                    {" "}
                    <a
                      href={source.url || source.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF3B30] hover:underline"
                    >
                      view
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ArtistPage = () => {
  const { name } = useParams();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposalState, setProposalState] = useState(null); // null | { correctionOf? }

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/artists/${encodeURIComponent(name)}/sets`)
      .then((res) => setSets(res.data))
      .catch(() => toast.error("Failed to load artist history"))
      .finally(() => setLoading(false));
  }, [name]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const years = sets.map((s) => s.edition_year).filter(Boolean);
  const yearRange =
    years.length > 0
      ? Math.min(...years) === Math.max(...years)
        ? `${Math.min(...years)}`
        : `${Math.min(...years)} – ${Math.max(...years)}`
      : null;

  return (
    <div className="min-h-screen bg-black" data-testid="artist-page">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            trail={[{ label: "Archive", to: "/festivals" }, { label: name }]}
          />

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
                ARTIST HISTORY
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-3">
                {name}
              </h1>
              {!loading && (
                <p className="text-white/50">
                  {sets.length} set{sets.length === 1 ? "" : "s"} documented
                  {yearRange && ` · ${yearRange}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 self-start">
              <button
                onClick={() => setProposalState({})}
                className="flex items-center gap-2 px-5 py-2.5 border border-white/20 hover:border-white/40 text-white text-sm font-medium uppercase tracking-widest transition-colors"
                data-testid="add-set-for-artist-btn"
              >
                <Plus className="w-4 h-4" />
                Add a set
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 border border-white/20 hover:border-white/40 text-white text-sm font-medium uppercase tracking-widest transition-colors"
                data-testid="share-artist-btn"
              >
                <Share2 className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-white/20 border-t-[#FF3B30] rounded-full animate-spin" />
            </div>
          ) : sets.length === 0 ? (
            <div className="py-24 text-center border border-white/10 bg-[#0A0A0A]">
              <p className="text-white/50">No documented sets for this artist yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sets.map((performanceSet) => (
                <ArtistSetRow
                  key={performanceSet.id}
                  performanceSet={performanceSet}
                  onCorrect={(set) => setProposalState({ correctionOf: set })}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ProposalForm
        open={!!proposalState}
        onOpenChange={(open) => !open && setProposalState(null)}
        lockedArtist={name}
        correctionOf={proposalState?.correctionOf}
      />

      <Footer />
    </div>
  );
};

export default ArtistPage;
