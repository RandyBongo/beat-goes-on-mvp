import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";

const GenreGrid = ({ genres }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(genres.map((g) => g.category))];
    return cats.sort();
  }, [genres]);

  // Filter genres
  const filteredGenres = useMemo(() => {
    let result = genres;
    if (selectedCategory) {
      result = result.filter((g) => g.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(query));
    }
    return result;
  }, [genres, selectedCategory, searchQuery]);

  // Group by category for display
  const genresByCategory = useMemo(() => {
    const grouped = {};
    filteredGenres.forEach((genre) => {
      if (!grouped[genre.category]) {
        grouped[genre.category] = [];
      }
      grouped[genre.category].push(genre);
    });
    return grouped;
  }, [filteredGenres]);

  return (
    <section id="genres" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-[#0A0A0A]" data-testid="genres-section">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center mb-12"
      >
        <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
          GENRE BREAKDOWN
        </p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
          100+ Genres Documented
        </h2>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          From the foundational sounds of Disco to the cutting-edge of Wave and Color Bass. 
          Every subgenre. Every evolution. Catalogued and preserved.
        </p>
      </motion.div>

      {/* Search & Filter */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-[#FF3B30]"
              data-testid="genre-search-input"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                !selectedCategory
                  ? "bg-[#FF3B30] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
              data-testid="genre-filter-all"
            >
              All
            </button>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                  selectedCategory === cat
                    ? "bg-[#FF3B30] text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
                data-testid={`genre-filter-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Genre Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        {Object.entries(genresByCategory).map(([category, categoryGenres]) => (
          <div key={category} className="mb-8">
            <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-4">
              {category} ({categoryGenres.length})
            </h3>
            <div className="genre-grid">
              <AnimatePresence>
                {categoryGenres.map((genre, index) => (
                  <motion.button
                    key={genre.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    onClick={() => setSelectedGenre(genre)}
                    className="genre-item px-3 py-2 bg-black border border-white/10 text-left text-sm text-white/70 hover:text-white truncate"
                    data-testid={`genre-item-${genre.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {genre.name}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Stats */}
      <div className="mt-16 flex items-center justify-center gap-8 text-center">
        <div>
          <p className="font-mono text-3xl font-bold text-white">{genres.length}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Total Genres</p>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div>
          <p className="font-mono text-3xl font-bold text-white">{categories.length}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Categories</p>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div>
          <p className="font-mono text-3xl font-bold text-white">{filteredGenres.length}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Showing</p>
        </div>
      </div>

      {/* Genre Detail Modal */}
      <Dialog open={!!selectedGenre} onOpenChange={() => setSelectedGenre(null)}>
        <DialogContent className="max-w-md bg-[#0A0A0A] border-white/10">
          {selectedGenre && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-[#FF3B30] text-xs font-mono text-white">
                    {selectedGenre.category}
                  </span>
                  {selectedGenre.year_emerged && (
                    <span className="text-xs text-white/40 font-mono">
                      Est. {selectedGenre.year_emerged}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {selectedGenre.name}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {selectedGenre.parent_genre && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
                      Parent Genre
                    </p>
                    <p className="text-white">{selectedGenre.parent_genre}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
                    Category
                  </p>
                  <p className="text-white">{selectedGenre.category}</p>
                </div>

                {selectedGenre.year_emerged && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
                      Year Emerged
                    </p>
                    <p className="text-white font-mono">{selectedGenre.year_emerged}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default GenreGrid;
