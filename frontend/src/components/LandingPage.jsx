import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import TimelineSlider from "./TimelineSlider";
import ProtocolCards from "./ProtocolCards";
import GenreGrid from "./GenreGrid";
import PioneerPortal from "./PioneerPortal";
import Footer from "./Footer";

const LandingPage = () => {
  const [episodes, setEpisodes] = useState([]);
  const [genres, setGenres] = useState([]);
  const [pioneerCount, setPioneerCount] = useState({ total_users: 0, pioneers_remaining: 50 });
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading && location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [loading, location.hash]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed data first
        await axios.post(`${API}/seed`).catch(() => {});
        
        // Fetch all data in parallel
        const [episodesRes, genresRes, countRes] = await Promise.all([
          axios.get(`${API}/episodes`),
          axios.get(`${API}/genres`),
          axios.get(`${API}/auth/pioneer-count`)
        ]);
        
        setEpisodes(episodesRes.data);
        setGenres(genresRes.data);
        setPioneerCount(countRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#FF3B30] rounded-full animate-spin" />
          <p className="text-white/60 font-mono text-sm tracking-widest">LOADING PROTOCOL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" data-testid="landing-page">
      <Navbar onAuthClick={() => setShowAuthModal(true)} />
      
      <main>
        <HeroSection 
          pioneerCount={pioneerCount} 
          onJoinClick={() => setShowAuthModal(true)} 
        />
        
        <TimelineSlider episodes={episodes} />
        
        <ProtocolCards />
        
        <section id="pioneer" className="py-24 md:py-32 px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
              GENESIS CONTRIBUTORS
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
              Pioneer Portal
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              The first 50 contributors gain Genesis status—permanent recognition 
              in the protocol's immutable history. Your badge. Your legacy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <div className="text-center">
                <p className="font-mono text-5xl font-bold text-white">
                  {pioneerCount.pioneers_remaining}
                </p>
                <p className="text-sm text-white/40 mt-2">Spots Remaining</p>
              </div>
              <div className="hidden sm:block w-px h-16 bg-white/10" />
              <div className="text-center">
                <p className="font-mono text-5xl font-bold text-[#FF3B30]">
                  {pioneerCount.total_users}
                </p>
                <p className="text-sm text-white/40 mt-2">Genesis Pioneers</p>
              </div>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-[#FF3B30] hover:bg-[#D32F2F] text-white font-bold uppercase tracking-widest transition-all duration-300 glow-red"
              data-testid="become-pioneer-btn"
            >
              Become a Pioneer
            </button>
          </div>
        </section>
        
        <GenreGrid genres={genres} />
        
        <Footer />
      </main>

      <PioneerPortal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        pioneerCount={pioneerCount}
      />
    </div>
  );
};

export default LandingPage;
