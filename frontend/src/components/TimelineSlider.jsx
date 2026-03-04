import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Users, Calendar, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const TimelineSlider = ({ episodes }) => {
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const itemWidth = 380;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(newIndex, episodes.length - 1));
    }
  };

  return (
    <section id="timeline" className="py-24 md:py-32 bg-black" data-testid="timeline-section">
      {/* Section Header */}
      <div className="px-6 md:px-12 lg:px-24 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
            VERSION SLIDER // 2026 GENESIS LAUNCH
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
              The Timeline
            </h2>
            <p className="text-white/50 max-w-md text-base">
              10 immutable blocks documenting the evolution of dance music from 1960 to today.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Timeline Navigation */}
      <div className="relative px-6 md:px-12 lg:px-24">
        {/* Nav Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/80 border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
          data-testid="timeline-prev-btn"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/80 border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
          data-testid="timeline-next-btn"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Timeline Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto timeline-scroll pb-6 px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {episodes.map((episode, index) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="timeline-item flex-shrink-0 w-[340px] md:w-[380px]"
            >
              <div
                onClick={() => setSelectedEpisode(episode)}
                className="group cursor-pointer bg-[#0A0A0A] border border-white/10 hover:border-white/30 transition-all duration-500 overflow-hidden card-hover"
                data-testid={`timeline-block-${episode.block_number}`}
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={episode.image_url}
                    alt={episode.title}
                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                      episode.block_number < 10 ? "img-historical" : ""
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  
                  {/* Block Number Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 border border-white/20">
                    <span className="font-mono text-xs text-white">
                      BLOCK #{episode.block_number.toString().padStart(2, "0")}
                    </span>
                  </div>

                  {/* Year Range */}
                  <div className="absolute bottom-4 right-4">
                    <span className="font-mono text-2xl font-bold text-white/90">
                      {episode.year_start}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                    {episode.title}
                  </h3>
                  <p className="text-sm text-[#FF3B30] font-medium mb-3">
                    {episode.subtitle}
                  </p>
                  <p className="text-sm text-white/50 line-clamp-2 mb-4">
                    {episode.description}
                  </p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{episode.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{episode.pioneers.length} pioneers</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {episodes.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    left: index * 400,
                    behavior: "smooth",
                  });
                }
              }}
              className={`timeline-dot ${activeIndex === index ? "active" : ""}`}
              data-testid={`timeline-dot-${index}`}
            />
          ))}
        </div>

        {/* Year Range Bar */}
        <div className="mt-8 flex items-center justify-between px-4">
          <span className="font-mono text-sm text-white/40">1960</span>
          <div className="flex-1 mx-4 h-px bg-gradient-to-r from-white/20 via-[#FF3B30] to-white/20 relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FF3B30] rounded-full"
              style={{ left: `${(activeIndex / (episodes.length - 1)) * 100}%` }}
            />
          </div>
          <span className="font-mono text-sm text-white/40">2026</span>
        </div>
      </div>

      {/* Episode Detail Modal */}
      <Dialog open={!!selectedEpisode} onOpenChange={() => setSelectedEpisode(null)}>
        <DialogContent className="max-w-3xl bg-[#0A0A0A] border-white/10 p-0 overflow-hidden">
          {selectedEpisode && (
            <>
              {/* Modal Image */}
              <div className="relative aspect-video">
                <img
                  src={selectedEpisode.image_url}
                  alt={selectedEpisode.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                <button
                  onClick={() => setSelectedEpisode(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/60 border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
                  data-testid="modal-close-btn"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-xs px-3 py-1 bg-[#FF3B30] text-white">
                    BLOCK #{selectedEpisode.block_number.toString().padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs text-white/40">
                    {selectedEpisode.year_start} - {selectedEpisode.year_end}
                  </span>
                  <span className="version-tag">v{selectedEpisode.version}</span>
                </div>

                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-white tracking-tight">
                    {selectedEpisode.title}
                  </DialogTitle>
                </DialogHeader>

                <p className="text-[#FF3B30] font-medium mb-4">
                  {selectedEpisode.subtitle}
                </p>

                <p className="text-white/70 leading-relaxed mb-8">
                  {selectedEpisode.description}
                </p>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Location</p>
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="w-4 h-4 text-[#FF3B30]" />
                      <span>{selectedEpisode.location}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Era</p>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4 text-[#FF3B30]" />
                      <span>{selectedEpisode.year_start} - {selectedEpisode.year_end}</span>
                    </div>
                  </div>
                </div>

                {/* Pioneers */}
                <div className="mt-8">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Key Pioneers</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEpisode.pioneers.map((pioneer, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm text-white/80"
                      >
                        {pioneer}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TimelineSlider;
