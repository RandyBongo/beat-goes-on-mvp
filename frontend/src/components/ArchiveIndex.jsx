import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Calendar, ChevronRight } from "lucide-react";
import { API } from "../App";
import Navbar from "./Navbar";
import Footer from "./Footer";

const ArchiveIndex = () => {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/festivals`)
      .then((res) => setFestivals(res.data))
      .catch(() => toast.error("Failed to load festivals"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black" data-testid="archive-index">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
            FESTIVAL ARCHIVE
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
            The Archive
          </h1>
          <p className="text-white/50 max-w-2xl mb-16 text-base">
            Lineups, set histories, and citations for the festivals that shaped dance
            music culture. Every entry sourced. Every correction logged.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-2 border-white/20 border-t-[#FF3B30] rounded-full animate-spin" />
            </div>
          ) : festivals.length === 0 ? (
            <div className="py-24 text-center border border-white/10 bg-[#0A0A0A]">
              <p className="text-white/50">No festivals documented yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {festivals.map((festival) => (
                <Link
                  key={festival.id}
                  to={`/festivals/${festival.slug}`}
                  className="group bg-[#0A0A0A] border border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden card-hover"
                  data-testid={`festival-card-${festival.slug}`}
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    {festival.image_url ? (
                      <img
                        src={festival.image_url}
                        alt={festival.name}
                        className="w-full h-full object-cover img-historical transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/20 text-4xl font-bold">
                          {festival.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
                      {festival.name}
                    </h2>
                    {festival.promoter && (
                      <p className="text-sm text-[#FF3B30] font-medium mb-3">
                        {festival.promoter}
                      </p>
                    )}
                    {festival.description && (
                      <p className="text-sm text-white/50 line-clamp-2 mb-4">
                        {festival.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-white/40">
                      {festival.founded_year ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Since {festival.founded_year}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="flex items-center gap-1 text-white/60 group-hover:text-white transition-colors">
                        View archive
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArchiveIndex;
