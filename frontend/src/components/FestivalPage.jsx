import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { API } from "../App";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";

const FestivalPage = () => {
  const { slug } = useParams();
  const [festival, setFestival] = useState(null);
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      axios.get(`${API}/festivals/${slug}`),
      axios.get(`${API}/festivals/${slug}/editions`),
    ])
      .then(([festivalRes, editionsRes]) => {
        setFestival(festivalRes.data);
        setEditions(editionsRes.data);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-[#FF3B30] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !festival) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <main className="pt-40 pb-24 px-6 text-center">
          <p className="text-white/50 mb-6">Festival not found.</p>
          <Link to="/festivals" className="text-[#FF3B30] hover:underline">
            Back to the Archive
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" data-testid="festival-page">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            trail={[
              { label: "Archive", to: "/festivals" },
              { label: festival.name },
            ]}
          />

          <div className="flex flex-col md:flex-row gap-8 mb-16">
            {festival.image_url && (
              <div className="w-full md:w-64 aspect-video md:aspect-square flex-shrink-0 overflow-hidden bg-[#0A0A0A] border border-white/10">
                <img
                  src={festival.image_url}
                  alt={festival.name}
                  className="w-full h-full object-cover img-historical"
                />
              </div>
            )}
            <div>
              {festival.promoter && (
                <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
                  {festival.promoter.toUpperCase()}
                </p>
              )}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-4">
                {festival.name}
              </h1>
              {festival.description && (
                <p className="text-white/60 max-w-2xl leading-relaxed mb-4">
                  {festival.description}
                </p>
              )}
              {festival.founded_year && (
                <p className="text-sm text-white/40 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Founded {festival.founded_year}
                </p>
              )}
            </div>
          </div>

          <div className="section-divider mb-12" />

          <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Editions</h2>

          {editions.length === 0 ? (
            <div className="py-16 text-center border border-white/10 bg-[#0A0A0A]">
              <p className="text-white/50">No editions documented yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editions.map((edition) => (
                <Link
                  key={edition.id}
                  to={`/editions/${edition.id}`}
                  className="group bg-[#0A0A0A] border border-white/10 hover:border-white/30 transition-all duration-300 p-6"
                  data-testid={`edition-card-${edition.id}`}
                >
                  <span className="font-mono text-3xl font-bold text-white/90">
                    {edition.year}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-3 tracking-tight">
                    {edition.edition_name || `${festival.name} ${edition.year}`}
                  </h3>
                  <div className="space-y-1 text-sm text-white/40">
                    {edition.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                          {edition.venue}
                          {edition.city ? `, ${edition.city}` : ""}
                        </span>
                      </div>
                    )}
                    {edition.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {edition.start_date}
                          {edition.end_date && edition.end_date !== edition.start_date
                            ? ` – ${edition.end_date}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="mt-4 flex items-center gap-1 text-xs text-white/60 group-hover:text-white transition-colors">
                    View lineup
                    <ChevronRight className="w-3 h-3" />
                  </span>
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

export default FestivalPage;
