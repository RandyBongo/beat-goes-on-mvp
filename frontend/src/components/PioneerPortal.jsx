import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Shield, Award, X, Loader2 } from "lucide-react";

const PioneerPortal = ({ open, onOpenChange, pioneerCount }) => {
  const { login, signup, user, isPioneer } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
        toast.success("Welcome back, Pioneer!");
      } else {
        const userData = await signup(formData.name, formData.email, formData.password);
        if (userData.is_pioneer) {
          toast.success(`Genesis Pioneer #${userData.pioneer_number}! Your legacy begins.`);
        } else {
          toast.success("Welcome to The Beat Goes On!");
        }
      }
      onOpenChange(false);
      setFormData({ name: "", email: "", password: "" });
    } catch (error) {
      const message = error.response?.data?.detail || "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // If user is already authenticated, show their badge
  if (user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-[#0A0A0A] border-white/10">
          <div className="text-center py-8">
            {isPioneer ? (
              <>
                <div className="w-24 h-24 mx-auto mb-6 pioneer-badge rounded-full flex items-center justify-center">
                  <Award className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Genesis Pioneer #{user.pioneer_number}
                </h3>
                <p className="text-white/60 mb-6">
                  You are one of the first 50. Your contribution is immortal.
                </p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 mx-auto mb-6 genesis-badge rounded-full flex items-center justify-center">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Protocol Contributor
                </h3>
                <p className="text-white/60 mb-6">
                  Welcome to the community. Your journey begins now.
                </p>
              </>
            )}

            <div className="bg-black/50 border border-white/10 p-4 rounded text-left">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Name</span>
                  <span className="text-sm text-white">{user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Email</span>
                  <span className="text-sm text-white">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Status</span>
                  <span className="text-sm text-[#FF3B30]">
                    {isPioneer ? "Genesis Pioneer" : "Contributor"}
                  </span>
                </div>
                {user.is_admin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">Role</span>
                    <span className="text-sm text-[#3B82F6]">Administrator</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0A0A0A] border-white/10 p-0 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-[#FF3B30] tracking-widest mb-1">
                PIONEER PORTAL
              </p>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  {mode === "login" ? "Welcome Back" : "Join the Protocol"}
                </DialogTitle>
              </DialogHeader>
            </div>
          </div>

          {/* Pioneer Status Alert */}
          {pioneerCount.pioneers_remaining > 0 && mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/30"
            >
              <p className="text-sm text-[#FF3B30] font-medium">
                {pioneerCount.pioneers_remaining} Genesis Pioneer spots remaining!
              </p>
              <p className="text-xs text-white/50 mt-1">
                Sign up now to become a permanent part of history.
              </p>
            </motion.div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="text-white/70 text-sm">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required={mode === "signup"}
                    className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-[#FF3B30]"
                    data-testid="auth-name-input"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/70 text-sm">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-[#FF3B30]"
                data-testid="auth-email-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/70 text-sm">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10 bg-black border-white/20 text-white placeholder:text-white/40 focus:border-[#FF3B30]"
                data-testid="auth-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#FF3B30] hover:bg-[#D32F2F] text-white font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="auth-submit-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-white/50 hover:text-white transition-colors"
              data-testid="auth-toggle-mode"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/50 border-t border-white/10">
          <p className="text-xs text-white/30 text-center">
            By signing up, you agree to contribute to the perpetual documentation of dance music history.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PioneerPortal;
