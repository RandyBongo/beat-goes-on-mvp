import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { Menu, X, User, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navbar = ({ onAuthClick }) => {
  const { user, logout, isAuthenticated, isAdmin, isPioneer } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Timeline", href: "#timeline" },
    { label: "Protocol", href: "#protocol" },
    { label: "Pioneer", href: "#pioneer" },
    { label: "Genres", href: "#genres" },
  ];

  const scrollToSection = (href) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass py-3" : "bg-transparent py-6"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-3 group"
          data-testid="nav-logo"
        >
          <div className="w-8 h-8 bg-[#FF3B30] flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
            THE BEAT GOES ON
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.href)}
              className="text-sm text-white/70 hover:text-white transition-colors duration-300 uppercase tracking-widest font-medium"
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-3 px-4 py-2 border border-white/20 hover:border-white/40 transition-colors"
                  data-testid="user-menu-trigger"
                >
                  <div className="flex items-center gap-2">
                    {isPioneer && (
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-[#FF3B30] text-white">
                        PIONEER #{user?.pioneer_number}
                      </span>
                    )}
                    <span className="text-sm text-white">{user?.name}</span>
                  </div>
                  <User className="w-4 h-4 text-white/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#0A0A0A] border-white/10"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/50">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer"
                    data-testid="admin-dashboard-btn"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="text-white/80 hover:text-white hover:bg-white/5 cursor-pointer"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-6 py-2.5 bg-white text-black font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors duration-300"
              data-testid="signin-btn"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white"
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="text-left text-lg text-white/70 hover:text-white transition-colors uppercase tracking-widest"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
