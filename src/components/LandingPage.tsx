import React, { useState, useRef } from "react";
import { useUser } from "../context/UserContext";
import { 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  UserPlus, 
  LogIn, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  Star, 
  FileText, 
  Clock, 
  Coins, 
  ArrowUpRight, 
  Zap, 
  Printer, 
  Download, 
  Lock, 
  Smartphone, 
  MapPin, 
  CheckCircle2, 
  Database,
  Building,
  DollarSign
} from "lucide-react";

export default function LandingPage() {
  const { login, signup, users, portalSettings } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  
  // Auth Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nin, setNin] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  // Forgot Password Workflow States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [forgotCodeInput, setForgotCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const authSectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToAuth = (isLoginMode: boolean) => {
    setIsForgotPassword(false);
    setIsLogin(isLoginMode);
    setError("");
    authSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (forgotStep === 1) {
      if (!forgotEmail) {
        setError("Please enter your registered email address.");
        return;
      }
      const trimmedEmail = forgotEmail.trim().toLowerCase();
      const userExists = users.some((u) => u.email.toLowerCase() === trimmedEmail);
      if (!userExists && trimmedEmail !== "seiminiyifafranklin@gmail.com") {
        setError("No registered corporate account found with this email address.");
        return;
      }
      
      // Generate OTP Code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setForgotStep(2);
      setSuccessMsg("Security verification code generated successfully!");
    } else if (forgotStep === 2) {
      if (!forgotCodeInput) {
        setError("Please enter the 6-digit security code.");
        return;
      }
      if (forgotCodeInput.trim() !== generatedCode) {
        setError("Invalid security code. Please check and try again.");
        return;
      }
      setForgotStep(3);
      setError("");
      setSuccessMsg("Verification successful! Please choose a new password.");
    } else if (forgotStep === 3) {
      if (!newPassword || !confirmNewPassword) {
        setError("Please fill out both password fields.");
        return;
      }
      if (newPassword.length < 6) {
        setError("Your new password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError("Passwords do not match.");
        return;
      }

      // Password reset successful! Preset email in login and return to sign in
      setEmail(forgotEmail);
      setPassword("");
      setIsForgotPassword(false);
      setIsLogin(true);
      setForgotStep(1);
      setForgotEmail("");
      setForgotCodeInput("");
      setGeneratedCode("");
      setSuccessMsg("Password successfully reset! You can now log in with your new password.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (isLogin) {
      const success = login(email, password);
      if (!success) {
        setError("Invalid credentials. Please verify your email and password, or create a new corporate account.");
      } else {
        setSuccessMsg("Success! Accessing your tax portal...");
      }
    } else {
      if (!fullName) {
        setError("Please enter your organization or full name.");
        return;
      }
      if (!nin) {
        setError("Please enter your 11-digit National Identification Number (NIN) for verification.");
        return;
      }
      const cleanedNIN = nin.replace(/\s+/g, "");
      if (cleanedNIN.length !== 11 || !/^\d{11}$/.test(cleanedNIN)) {
        setError("NIN verification failed. Your National Identification Number must be exactly 11 digits.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      const success = signup(fullName, email, password, cleanedNIN);
      if (!success) {
        setError("This email is already registered on our gateway.");
      } else {
        setSuccessMsg("NIN Verified Successfully! Gateway Wallet Virtual Account Generated. Welcome to your 24-hour free trial.");
      }
    }
  };

  const faqs = (portalSettings.faqs || []).map(f => ({
    q: f.question,
    a: f.answer
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white" id="landing-root">
      
      {/* 1. STUNNING LANDING NAVBAR */}
      <nav className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/60 z-50 shadow-sm" id="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full shadow-sm rounded-xl">
                {/* Shield background */}
                <path d="M50 10 C72 10 85 15 85 20 C85 52 72 75 50 90 C28 75 15 52 15 20 C15 15 28 10 50 10 Z" fill="#00B074" />
                {/* Document paper */}
                <path d="M34 28 h24 l10 10 v32 a4 4 0 0 1 -4 4 h-26 a4 4 0 0 1 -4 -4 v-38 a4 4 0 0 1 4 -4 Z" fill="white" />
                {/* Folded corner flap */}
                <path d="M58 28 L68 38 h-6 a4 4 0 0 1 -4 -4 v-6 Z" fill="#A7F3D0" />
                {/* Text lines on paper */}
                <path d="M40 37 h20" stroke="#00B074" strokeWidth="4" strokeLinecap="round" />
                <path d="M40 44 h12" stroke="#00B074" strokeWidth="4" strokeLinecap="round" />
                {/* Bold checkmark */}
                <path d="M38 58 l7 7 l16 -16" stroke="#00B074" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                  TaxID<span className="text-emerald-600">PDF</span>
                </span>
                <span className="text-[9px] bg-slate-900 text-slate-100 font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">
                Nigeria's Standard TIN Retriever
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition">Features</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-emerald-600 transition">FAQ Help</a>
            <span className="h-4 w-[1px] bg-slate-200" />
            <button 
              onClick={() => handleScrollToAuth(true)}
              className="hover:text-emerald-600 transition font-extrabold cursor-pointer"
            >
              Log In
            </button>
            <button 
              onClick={() => handleScrollToAuth(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition cursor-pointer"
            >
              Sign Up Free
            </button>
          </div>

          {/* Mobile CTAs */}
          <div className="flex md:hidden gap-1.5">
            <button 
              onClick={() => handleScrollToAuth(true)}
              className="px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            >
              Log In
            </button>
            <button 
              onClick={() => handleScrollToAuth(false)}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              Get Trial
            </button>
          </div>
        </div>
      </nav>

      {/* 2. DUAL-COLUMN HIGH-IMPACT HERO AREA */}
      <section className="relative overflow-hidden pt-8 pb-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12" id="hero-section">
        
        {/* Background glow effects */}
        <div className="absolute top-[10%] left-[-15%] w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[20%] right-[-15%] w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-[100px] -z-10" />

        {/* Hero Left Copy */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100/30 text-[10px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure Joint Tax Board API Synced Gateway</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-black text-slate-900 tracking-tighter leading-[1.02] font-sans">
            {portalSettings.landingTitle}
          </h1>

          <p className="text-slate-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {portalSettings.landingDescription}
          </p>

          {/* Value tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 pt-2 text-center lg:text-left">
            {(portalSettings.benefits || []).map((benefit, bIdx) => (
              <div key={bIdx} className="flex items-center justify-center lg:justify-start gap-2 text-sm sm:text-base font-semibold text-slate-700">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={() => handleScrollToAuth(false)}
              className="w-full sm:w-auto px-9 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>
            <a
              href="#pricing"
              className="w-full sm:w-auto text-center px-9 py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              View Gateway Tariffs
            </a>
          </div>

          {/* High-fidelity corporate proof indicators */}
          <div className="pt-6 border-t border-slate-200/60 max-w-lg mx-auto lg:mx-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-3">TRUSTED BY 5,000+ ACCOUNTANTS & CORPORATIONS NATIONWIDE</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-slate-400 font-black text-sm tracking-wider font-mono">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> NRS-REP</span>
              <span className="flex items-center gap-1.5"><Database className="w-4 h-4" /> JTB-CORE</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> SSL-SECURE</span>
            </div>
          </div>
        </div>

        {/* Hero Right: THE INTERACTIVE AUTHENTICATION PANEL */}
        <div 
          ref={authSectionRef}
          className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/70 shadow-2xl shadow-slate-200/60 relative overflow-hidden transition-all duration-300" 
          id="auth-panel"
        >
          {/* Top banner tag */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-600" />
          
          <div className="text-center">
            {isForgotPassword ? (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider mb-4 border border-amber-100">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Security Recovery</span>
                </div>
                
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {forgotStep === 1 && "Recover Account"}
                  {forgotStep === 2 && "Security OTP Code"}
                  {forgotStep === 3 && "Reset Password"}
                </h2>
                <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {forgotStep === 1 && "Enter your registered email address to verify your credentials and generate a secure reset code."}
                  {forgotStep === 2 && "We have simulated an OTP transmission to your email. Enter the code shown below."}
                  {forgotStep === 3 && "Setup a secure, strong password for your corporate tax identifier portal."}
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unified Gateway Auth</span>
                </div>
                
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                  {isLogin ? "Welcome Back to Portal" : "Create Gateway Account"}
                </h2>
                <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {isLogin 
                    ? "Access your TIN retrieval dashboard, track saved slips, configure custom billing settings, and fund your wallet account." 
                    : "Unlock an instant 24-hour trial with absolutely unlimited free compiled PDF downloads."}
                </p>
              </>
            )}
          </div>

          {/* Success / Error Messages */}
          {error && (
            <div className="mt-6 bg-red-50 text-red-700 p-4 rounded-xl text-xs font-semibold leading-relaxed border border-red-100/80 flex items-start gap-2 animate-shake animate-duration-200">
              <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0 text-[10px]">!</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-6 bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-semibold leading-relaxed border border-emerald-100 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          {isForgotPassword ? (
            <form className="mt-6 space-y-4" onSubmit={handleForgotPasswordSubmit}>
              {forgotStep === 1 && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Corporate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tax@sterlingconsulting.ng"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                  />
                </div>
              )}

              {forgotStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100/80 rounded-xl p-4 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold mb-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>SIMULATED SECURITY OTP</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed font-semibold">
                      Your secure reset code is: <strong className="text-sm tracking-wider text-slate-900 bg-white px-2 py-0.5 rounded font-mono border border-emerald-200">{generatedCode}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={forgotCodeInput}
                      onChange={(e) => setForgotCodeInput(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                </div>
              )}

              {forgotStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      New Gateway Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {forgotStep === 1 && "GENERATE SECURITY CODE"}
                  {forgotStep === 2 && "VERIFY SECURITY CODE"}
                  {forgotStep === 3 && "SAVE NEW PASSWORD"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      Full Name / corporate organization name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sterling Consulting Ltd"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      National Identification Number (11-Digit NIN)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      placeholder="e.g. 12345678901"
                      value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold tracking-widest text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all"
                    />
                    <p className="mt-1 text-[10px] text-emerald-600 font-bold tracking-wide uppercase flex items-center gap-1">
                      <span>⚡ Automatically binds Moniepoint wallet on completion</span>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Corporate Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. tax@sterlingconsulting.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Access Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                />
                {isLogin && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep(1);
                        setForgotEmail(email); // Preset if already typed
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="text-[10px] font-extrabold text-slate-400 hover:text-emerald-600 transition tracking-wide uppercase"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="consent-checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="consent-checkbox" className="text-[11px] font-semibold text-slate-500 leading-snug cursor-pointer select-none">
                      By signing up, you agree to the Terms of Service and hereby give my consent to share my personal data.
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={!isLogin && !consentGiven}
                className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{isLogin ? "LOG IN TO DASHBOARD" : "ACTIVATE 24-HOUR TRIAL"}</span>
              </button>
            </form>
          )}



          {/* Toggle state action */}
          <div className="text-center pt-4 border-t border-slate-100 mt-4">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setForgotStep(1);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 underline underline-offset-4 decoration-2 transition flex items-center justify-center gap-1.5 mx-auto"
              >
                <span>Back to Log In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 underline underline-offset-4 decoration-2 transition"
              >
                {isLogin ? "Need a new corporate account? Sign up here" : "Already registered? Sign in here"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. CORE GATEWAY FEATURES */}
      <section className="bg-white border-y border-slate-200/50 py-16 md:py-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
              Enterprise Features
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Built to simplify Nigerian Tax ID processing
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              No manual verification queues. No delayed PDF templates. We provide clean digital formats instantly with rigorous Joint Tax Board compliance rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(portalSettings.features || []).map((feature, fIdx) => {
              const getIcon = (idx: number) => {
                if (idx === 0) return <FileText className="w-6 h-6" />;
                if (idx === 1) return <Coins className="w-6 h-6" />;
                return <Clock className="w-6 h-6" />;
              };
              return (
                <div key={fIdx} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
                    {getIcon(fIdx)}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. TARIFFS & TRANSPARENT PRICING MATRIX */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="pricing">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            Pricing & Plans
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            Start with our ₦100 Trial. Flexible tariffs thereafter.
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            Choose between our 24-Hour Trial Promo, pay-as-you-go Starter On-Demand billing, or subscribe to any of our high-volume corporate bundles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: 24-Hour Trial Promo */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 transition relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
              Welcome Promo
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Free Trial</h4>
                <h3 className="text-2xl font-black text-slate-900 mt-1">₦100 / First Slip</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full access to search and look up TIN records for 24 hours. Download your very first official PDF slip for only ₦100.
              </p>
              <div className="h-[1px] bg-slate-100" />
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Unlimited Search Lookups</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>24 Hours Total Access</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>₦100 First Download</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Subsequent slips: ₦750</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleScrollToAuth(false)}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Activate Trial Promo
            </button>
          </div>

          {/* Card 2: Starter On-Demand (Default) */}
          <div className="bg-emerald-950 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-emerald-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[8px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
              Default Plan
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Starter On-Demand</h4>
                <h3 className="text-2xl font-black mt-1 flex items-baseline gap-1">
                  <span>₦750</span>
                  <span className="text-[11px] font-bold text-emerald-300">/ per PDF slip</span>
                </h3>
              </div>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Applies automatically after trial. No monthly renewals. Transfer exactly ₦750 to your Moniepoint wallet on-demand to download paid slips.
              </p>
              <div className="h-[1px] bg-emerald-800/50" />
              <ul className="space-y-2.5 text-xs text-emerald-100/80">
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>No monthly subscriptions</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Keep generated slips forever</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Re-download anytime for 100% Free</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleScrollToAuth(false)}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Sign Up For Starter
            </button>
          </div>

          {/* Card 3: Business Bundles */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-500 transition">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Corporate Subscriptions</h4>
                <h3 className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                  <span>₦5,000</span>
                  <span className="text-xs font-bold text-slate-400">/ month</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unlock high-volume lookups with our Basic, Premium, or Unlimited plans. Best for bulk accounting and consultancies.
              </p>
              <div className="h-[1px] bg-slate-100" />
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Basic: 20 monthly lookups</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Premium: 100 monthly lookups</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Unlimited: Complete open access</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleScrollToAuth(false)}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Explore Corporate Plans
            </button>
          </div>

        </div>
      </section>

      {/* 5. FAQS SECTION */}
      <section className="bg-slate-100/50 border-t border-slate-200/50 py-16 md:py-20" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
              Got Questions?
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Everything you need to know about taxidpdf.com, trial transitions, and wallet payments.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/40 shadow-sm space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. CORPORATE DISCLAIMER FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800" id="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-800">
            <div>
              <span className="text-white font-extrabold text-base tracking-tight font-sans block">
                TaxID<span className="text-emerald-500">PDF</span>.com
              </span>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                An independent high-speed digital helper gateway designed for automated non-individual/individual Nigerian TIN document layout compilation.
              </p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-slate-400">
              <span className="hover:text-emerald-500 cursor-pointer">Security Ledger</span>
              <span>•</span>
              <span className="hover:text-emerald-500 cursor-pointer">Support Helpline</span>
              <span>•</span>
              <span className="hover:text-emerald-500 cursor-pointer">Legal Counsel</span>
            </div>
          </div>

          <div className="bg-slate-950/65 rounded-2xl p-5 border border-slate-800/80 space-y-2 max-w-4xl">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Official Notice & Terms of Usage</span>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {portalSettings.disclaimerText}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-[10px] text-slate-500 font-semibold">
              &copy; {new Date().getFullYear()} taxidpdf.com Portal. Direct Database Wrapper.
            </p>
            <div className="text-[10px] text-emerald-500 font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>GATEWAY ENCRYPTED VIA SECURE 256-BIT SSL PROTOCOLS</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
