import { motion } from "framer-motion";
import { ChevronDown, Play } from "lucide-react";

const HeroSection = ({ pioneerCount, onJoinClick }) => {
  const scrollToTimeline = () => {
    const element = document.querySelector("#timeline");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-testid="hero-section"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1634321117972-0395485f8a4d?w=1920&q=80')`,
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Radial Spotlight */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(255,59,48,0.1) 0%, transparent 50%)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 text-center">
        {/* Version Tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <span className="version-tag">v1.0.0</span>
          <span className="text-white/40 text-sm font-mono">Genesis Launch 2026</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6"
          data-testid="hero-headline"
        >
          <span className="text-white glow-text">The History of</span>
          <br />
          <span className="text-white glow-text">Dance Music is</span>
          <br />
          <span className="text-[#FF3B30]">No Longer Finished</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed"
          data-testid="hero-subheadline"
        >
          A perpetual blockchain documentary protocol revealing the importance of 
          dance music culture and its profound influence on society. Immutable. 
          Community-driven. Eternal.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={onJoinClick}
            className="group px-8 py-4 bg-[#FF3B30] hover:bg-[#D32F2F] text-white font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-3 glow-red"
            data-testid="hero-join-btn"
          >
            <Play className="w-5 h-5" />
            Join the Protocol
          </button>
          <button
            onClick={scrollToTimeline}
            className="px-8 py-4 border border-white/30 hover:border-white/60 text-white font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white/5"
            data-testid="hero-explore-btn"
          >
            Explore Timeline
          </button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          <div className="text-center">
            <p className="font-mono text-3xl md:text-4xl font-bold text-white">10</p>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Genesis Blocks</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block" />
          <div className="text-center">
            <p className="font-mono text-3xl md:text-4xl font-bold text-white">100+</p>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Genres Documented</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block" />
          <div className="text-center">
            <p className="font-mono text-3xl md:text-4xl font-bold text-[#FF3B30]">
              {pioneerCount.pioneers_remaining}
            </p>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Pioneer Spots Left</p>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToTimeline}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ 
          opacity: { delay: 1, duration: 0.5 },
          y: { delay: 1, duration: 2, repeat: Infinity }
        }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/40 hover:text-white transition-colors"
        data-testid="scroll-indicator"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.button>
    </section>
  );
};

export default HeroSection;
