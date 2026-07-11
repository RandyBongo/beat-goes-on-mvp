import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Pencil, CheckCircle2, AlertTriangle, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { API } from "../App";
import Navbar from "./Navbar";
import Footer from "./Footer";

const ACTION_META = {
  created: { icon: Plus, color: "#FFFFFF", label: "Created" },
  updated: { icon: Pencil, color: "#3B82F6", label: "Updated" },
  verified: { icon: CheckCircle2, color: "#22C55E", label: "Verified" },
  correction: { icon: AlertTriangle, color: "#F59E0B", label: "Correction" },
  deleted: { icon: Minus, color: "#71717A", label: "Removed" },
};

const formatTimestamp = (iso) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const ChangelogPage = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], page: 1, page_size: 25, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API}/changelog`, { params: { page, page_size: 25 } })
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load changelog"))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size));

  return (
    <div className="min-h-screen bg-black" data-testid="changelog-page">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
            THE PERPETUAL FORMAT
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
            Changelog
          </h1>
          <p className="text-white/50 max-w-2xl mb-16">
            Every addition, correction, and verification to the archive, in order. Nothing
            is quietly overwritten — this is the record of how the record itself was built.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-white/20 border-t-[#FF3B30] rounded-full animate-spin" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="py-24 text-center border border-white/10 bg-[#0A0A0A]">
              <p className="text-white/50">No changelog entries yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-px bg-white/10">
                {data.items.map((entry) => {
                  const meta = ACTION_META[entry.action] || ACTION_META.created;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={entry.id}
                      className="bg-black flex items-start gap-4 px-5 py-4"
                      data-testid={`changelog-entry-${entry.id}`}
                    >
                      <div
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${meta.color}1A`,
                          border: `1px solid ${meta.color}4D`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span
                            className="text-[10px] font-mono uppercase tracking-widest"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-white/30 font-mono">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-white/80">{entry.summary}</p>
                        <p className="text-xs text-white/40 mt-1">
                          {entry.credited_to}
                          {entry.version_note && ` · ${entry.version_note}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    data-testid="changelog-prev-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Newer
                  </button>
                  <span className="text-xs text-white/40 font-mono">
                    Page {data.page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    data-testid="changelog-next-btn"
                  >
                    Older
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChangelogPage;
