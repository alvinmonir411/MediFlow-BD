"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Heart, 
  Lock, 
  Mail, 
  User, 
  Camera, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Loader2 
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  // Password rules validation (Section 2 specification)
  const isMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isNameValid = name.trim().length > 0;

  // Google Login modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

    if (!isNameValid) {
      setError("Please enter your full name.");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please satisfy all password security requirements.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          photoUrl: photoUrl.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Registration failed. Please try again.");
      }

      setSuccess("Account created successfully! Welcome to PrescriptionMate BD. Redirecting...");
      window.dispatchEvent(new Event("mediflow_patient_changed"));

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (gEmail?: string, gName?: string) => {
    const targetEmail = (gEmail || googleEmail || "").trim();
    const targetName = (gName || googleName || (targetEmail ? targetEmail.split("@")[0] : "Google User")).trim();

    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setError("Please enter a valid Google email address.");
      return;
    }

    setGoogleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Google Sign-In failed.");
      }

      setShowGoogleModal(false);
      setSuccess("Google Sign-In successful! Redirecting to dashboard...");
      window.dispatchEvent(new Event("mediflow_patient_changed"));

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-md w-full space-y-6 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-600/30">
            <Heart className="w-6 h-6 fill-white/20" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join <span className="font-bold text-teal-600">PrescriptionMate BD</span> to manage prescriptions, dose schedules & health records
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-teal-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Social Login: Google Login */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm hover:border-teal-500 transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
          >
            {/* Google Logo SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              or register with email
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4 pt-1">
          {/* Required Field: Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rafiqul Islam / Alvin Monir"
                value={name}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  touched.name && !isNameValid
                    ? "border-rose-300 dark:border-rose-700 bg-rose-50/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                } text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors`}
              />
            </div>
            {touched.name && !isNameValid && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">Full name is required.</p>
            )}
          </div>

          {/* Required Field: Email */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="e.g. user@prescriptionmate.bd"
                value={email}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                  touched.email && !isEmailValid
                    ? "border-rose-300 dark:border-rose-700 bg-rose-50/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                } text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors`}
              />
            </div>
            {touched.email && !isEmailValid && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">Please enter a valid email format.</p>
            )}
          </div>

          {/* Optional Field: Profile Photo URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Profile Photo URL <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              {photoUrl && (
                <span className="text-[10.5px] text-teal-600 dark:text-teal-400 font-semibold">
                  Preview active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Avatar Preview"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                  className="w-10 h-10 rounded-xl object-cover border border-teal-500 shadow-sm"
                />
              ) : null}
            </div>
          </div>

          {/* Required Field: Password */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Create a secure password"
                value={password}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                  touched.password && !isPasswordValid
                    ? "border-rose-300 dark:border-rose-700 bg-rose-50/30"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                } text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Requirements Live Checklist (Section 2 Specification) */}
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Password Requirements:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${isMinLength ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isMinLength ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} />
                  <span>Min 6 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} />
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasLowercase ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} />
                  <span>1 Lowercase (a-z)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button with Loading State */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-teal-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Google Sign-In Quick Modal */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sign in with Google
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect your verified Google profile
                  </p>
                </div>
              </div>

              {/* Quick 1-click accounts or custom email */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Select or Enter Google Account:
                </p>
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn("alvinmonir411@gmail.com", "Alvin Monir")}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 flex items-center justify-between text-xs transition-all"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Alvin Monir</p>
                    <p className="text-[11px] text-slate-500">alvinmonir411@gmail.com</p>
                  </div>
                  <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full">
                    Select
                  </span>
                </button>

                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Or Enter Other Google Email:
                  </label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn()}
                  disabled={googleLoading}
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  {googleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Authorize"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
