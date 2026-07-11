import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// trail: [{ label, to }] — last entry renders as plain text (current page)
const Breadcrumbs = ({ trail }) => (
  <nav className="flex items-center flex-wrap gap-2 text-xs uppercase tracking-widest text-white/40 mb-8">
    {trail.map((crumb, index) => {
      const isLast = index === trail.length - 1;
      return (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-3 h-3 text-white/20" />}
          {isLast || !crumb.to ? (
            <span className="text-white/70">{crumb.label}</span>
          ) : (
            <Link to={crumb.to} className="hover:text-white transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      );
    })}
  </nav>
);

export default Breadcrumbs;
