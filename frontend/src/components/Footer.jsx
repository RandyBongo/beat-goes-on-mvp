import { Github, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    protocol: [
      { label: "Documentation", href: "#" },
      { label: "Whitepaper", href: "#" },
      { label: "Roadmap", href: "#" },
      { label: "Governance", href: "#" },
    ],
    community: [
      { label: "Discord", href: "#" },
      { label: "Forum", href: "#" },
      { label: "Contributors", href: "#" },
      { label: "Events", href: "#" },
    ],
    resources: [
      { label: "API Docs", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "Brand Kit", href: "#" },
      { label: "Press", href: "#" },
    ],
  };

  return (
    <footer className="py-16 px-6 md:px-12 lg:px-24 bg-black border-t border-white/10" data-testid="footer">
      <div className="max-w-6xl mx-auto">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#FF3B30] flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-white font-bold tracking-tight">
                THE BEAT GOES ON
              </span>
            </div>
            <p className="text-sm text-white/40 mb-6">
              A perpetual blockchain documentary protocol. 
              The history of dance music, immortalized.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                data-testid="footer-github"
              >
                <Github className="w-5 h-5 text-white/60" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                data-testid="footer-twitter"
              >
                <Twitter className="w-5 h-5 text-white/60" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                data-testid="footer-discord"
              >
                <MessageCircle className="w-5 h-5 text-white/60" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">
              Protocol
            </h4>
            <ul className="space-y-3">
              {links.protocol.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">
              Community
            </h4>
            <ul className="space-y-3">
              {links.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="section-divider mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="version-tag">v1.0.0</span>
            <span className="text-xs text-white/30">Genesis Launch</span>
          </div>
          
          <p className="text-xs text-white/30">
            © {currentYear} The Beat Goes On Foundation. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
