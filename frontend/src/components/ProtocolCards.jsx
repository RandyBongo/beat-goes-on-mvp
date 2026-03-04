import { motion } from "framer-motion";
import { Database, GitMerge, GitPullRequest, FileCheck } from "lucide-react";

const ProtocolCards = () => {
  const cards = [
    {
      icon: Database,
      title: "Modular Ingestion",
      code: "git commit -m 'add block_011'",
      description:
        "Every video is an immutable 'Block' on the blockchain. Once committed, it cannot be altered—only built upon. The truth, preserved forever.",
      features: ["Immutable storage", "IPFS integration", "Timestamped commits"],
    },
    {
      icon: GitPullRequest,
      title: "Pull Requests",
      code: "git request merge origin/house",
      description:
        "Creators submit new footage to be merged into the master timeline. Community verification ensures accuracy and authenticity.",
      features: ["Peer review", "Source verification", "Community voting"],
    },
    {
      icon: FileCheck,
      title: "Canonical Versions",
      code: "git tag v1.1.0 -m 'Q2 Release'",
      description:
        "The Foundation releases biannual 'Finished Cuts' for mainstream distribution. Polished, curated, but never the final word.",
      features: ["Biannual releases", "Curated content", "Distribution ready"],
    },
  ];

  return (
    <section id="protocol" className="py-24 md:py-32 px-6 md:px-12 lg:px-24 bg-black" data-testid="protocol-section">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center mb-16"
      >
        <p className="text-xs font-mono tracking-[0.3em] text-[#FF3B30] mb-4">
          THE GITHUB LOGIC
        </p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">
          Built Like Open Source
        </h2>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          The protocol operates like a decentralized repository. Contributions are reviewed, 
          merged, and versioned—creating an ever-evolving, community-owned history.
        </p>
      </motion.div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="group"
          >
            <div
              className="h-full bg-[#0A0A0A] border border-white/10 p-8 hover:border-white/20 transition-all duration-500 card-hover"
              data-testid={`protocol-card-${index}`}
            >
              {/* Icon */}
              <div className="protocol-icon mb-6">
                <card.icon className="w-6 h-6 text-[#FF3B30]" />
              </div>

              {/* Code Block */}
              <div className="code-block mb-6 overflow-x-auto">
                <span className="keyword">$</span>{" "}
                <span className="text-white">{card.code}</span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-white/50 text-sm mb-6 leading-relaxed">
                {card.description}
              </p>

              {/* Features */}
              <ul className="space-y-2">
                {card.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/40">
                    <span className="w-1 h-1 bg-[#FF3B30] rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Workflow Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 max-w-4xl mx-auto"
      >
        <div className="bg-[#0A0A0A] border border-white/10 p-8">
          <p className="text-xs font-mono text-white/40 mb-4">// CONTRIBUTION WORKFLOW</p>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-mono text-sm text-white">01</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Submit</p>
                <p className="text-xs text-white/40">Upload footage</p>
              </div>
            </div>
            
            <div className="hidden md:block w-16 h-px bg-gradient-to-r from-white/20 to-[#FF3B30]" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-mono text-sm text-white">02</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Review</p>
                <p className="text-xs text-white/40">Community verifies</p>
              </div>
            </div>
            
            <div className="hidden md:block w-16 h-px bg-[#FF3B30]" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-mono text-sm text-white">03</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Merge</p>
                <p className="text-xs text-white/40">Added to timeline</p>
              </div>
            </div>
            
            <div className="hidden md:block w-16 h-px bg-gradient-to-r from-[#FF3B30] to-white/20" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF3B30] flex items-center justify-center">
                <span className="font-mono text-sm text-white">04</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Immortal</p>
                <p className="text-xs text-white/40">Forever preserved</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ProtocolCards;
