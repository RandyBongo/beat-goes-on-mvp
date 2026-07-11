import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Link2,
  Image as ImageIcon,
  Newspaper,
  PlayCircle,
  MessageSquare,
  ShieldQuestion,
} from "lucide-react";
import { API } from "../App";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";

const SOURCE_ICONS = {
  flyer: ImageIcon,
  archived_web: Link2,
  press: Newspaper,
  photo: ImageIcon,
  recording_link: PlayCircle,
  contributor_attestation: MessageSquare,
};

const SOURCE_LABELS = {
  flyer: "Flyer",
  archived_web: "Archived web page",
  press: "Press",
  photo: "Photo",
  recording_link: "Recording",
  contributor_attestation: "Contributor attestation",
};

const SourceList = ({ sources }) => (
  <div className="mt-3 pl-4 border-l border-white/10 space-y-2">
    {sources.map((source) => {
      const Icon = SOURCE_ICONS[source.source_type] || Link2;
      return (
        <div key={source.id} className="flex items-start gap-2 text-xs text-white/50">
          <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/30" />
          <div>
            <span className="text-white/60">{SOURCE_LABELS[source.source_type]}</span>
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
            {source.contributor_name && (
              <span className="text-white/30"> · credit: {source.contributor_name}</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const SetRow = ({ performanceSet }) => {
  const [expanded, setExpanded] = useState(false);
  const hasSources = performanceSet.sources?.length > 0;

  const timeRange = [performanceSet.start_time, performanceSet.end_time]
    .filter(Boolean)
    .join(" – ");

  return (
    <div
      className="border border-white/10 bg-black/40 px-4 py-3"
      data-testid={`set-row-${performanceSet.id}`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to={`/artists/${encodeURIComponent(performanceSet.artist_name)}`}
            className="text-white font-medium hover:text-[#FF3B30] transition-colors"
          >
            {performanceSet.artist_name}
            {performanceSet.is_b2b && performanceSet.b2b_partners?.length > 0 && (
              <span className="text-white/60">
                {" "}
                b2b {performanceSet.b2b_partners.join(", ")}
              </span>
            )}
          </Link>
          {performanceSet.status === "unverified" && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-white/40 border border-white/15"
              title="Not yet verified against a source"
            >
              <ShieldQuestion className="w-3 h-3" />
              Unverified
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
          {timeRange && <span>{timeRange}</span>}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-white/50 hover:text-white transition-colors disabled:opacity-30"
            disabled={!hasSources}
            data-testid={`toggle-sources-${performanceSet.id}`}
          >
            {hasSources ? performanceSet.sources.length : 0} source
            {performanceSet.sources?.length === 1 ? "" : "s"}
            {hasSources && (expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
          </button>
        </div>
      </div>

      {performanceSet.notes && (
        <p className="text-xs text-white/40 mt-2">{performanceSet.notes}</p>
      )}

      {expanded && hasSources && <SourceList sources={performanceSet.sources} />}
    </div>
  );
};

const EditionPage = () => {
  const { id } = useParams();
  const [edition, setEdition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    axios
      .get(`${API}/editions/${id}`)
      .then((res) => setEdition(res.data))
      .catch((error) => {
        if (error.response?.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-[#FF3B30] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !edition) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="pt-40 pb-24 px-6 text-center">
          <p className="text-white/50 mb-6">Edition not found.</p>
          <Link to="/festivals" className="text-[#FF3B30] hover:underline">
            Back to the Archive
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const editionLabel = edition.edition_name || `${edition.festival_name} ${edition.year}`;
  const totalSets = edition.stages.reduce((sum, stage) => sum + stage.sets.length, 0);

  return (
    <div className="min-h-screen bg-black" data-testid="edition-page">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            trail={[
              { label: "Archive", to: "/festivals" },
              ...(edition.festival_slug
                ? [{ label: edition.festival_name, to: `/festivals/${edition.festival_slug}` }]
                : []),
              { label: editionLabel },
            ]}
          />

          <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
            {edition.festival_name?.toUpperCase()}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
            {editionLabel}
          </h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/50 mb-4">
            {edition.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {edition.venue}
                {edition.city ? `, ${edition.city}` : ""}
                {edition.country ? `, ${edition.country}` : ""}
              </span>
            )}
            {edition.start_date && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {edition.start_date}
                {edition.end_date && edition.end_date !== edition.start_date
                  ? ` – ${edition.end_date}`
                  : ""}
              </span>
            )}
            {edition.attendance && (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {edition.attendance.toLocaleString()} attendees
              </span>
            )}
          </div>

          {edition.notes && (
            <p className="text-white/60 leading-relaxed mb-4 max-w-2xl">{edition.notes}</p>
          )}

          {edition.sources?.length > 0 && (
            <div className="mb-8">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                Sources for this edition
              </p>
              <SourceList sources={edition.sources} />
            </div>
          )}

          <div className="section-divider mb-10 mt-6" />

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Lineup</h2>
            <span className="text-xs text-white/40 font-mono">
              {totalSets} set{totalSets === 1 ? "" : "s"} documented
            </span>
          </div>

          {edition.stages.length === 0 ? (
            <div className="py-16 text-center border border-white/10 bg-[#0A0A0A]">
              <p className="text-white/50">No lineup documented yet.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {edition.stages.map((stage) => (
                <div key={stage.id} data-testid={`stage-section-${stage.id}`}>
                  <h3 className="text-lg font-bold text-white mb-4 tracking-tight flex items-center gap-3">
                    {stage.name}
                    <span className="text-xs text-white/30 font-mono font-normal">
                      {stage.sets.length} set{stage.sets.length === 1 ? "" : "s"}
                    </span>
                  </h3>
                  {stage.sets.length === 0 ? (
                    <p className="text-sm text-white/30">No sets documented for this stage.</p>
                  ) : (
                    <div className="space-y-2">
                      {stage.sets.map((performanceSet) => (
                        <SetRow key={performanceSet.id} performanceSet={performanceSet} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditionPage;
