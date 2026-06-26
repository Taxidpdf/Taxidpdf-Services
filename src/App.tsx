import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import CertificatePreview from "./components/CertificatePreview";
import FAQ from "./components/FAQ";
import TaxpayerNews from "./components/TaxpayerNews";
import Footer from "./components/Footer";
import LandingPage, { RotatingWord } from "./components/LandingPage";
import DashboardOverview from "./components/DashboardOverview";
import WalletAndSubs from "./components/WalletAndSubs";
import ProfileSettings from "./components/ProfileSettings";
import HistoryLog from "./components/HistoryLog";
import AdminDashboard from "./components/AdminDashboard";
import SupportChatWidget from "./components/SupportChatWidget";
import { TaxpayerData } from "./types";
import { useUser } from "./context/UserContext";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  CreditCard, 
  User, 
  ShieldCheck 
} from "lucide-react";

export default function App() {
  const { currentUser, isTrialActive, getRemainingTrialHours, portalSettings } = useUser();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [taxpayerData, setTaxpayerData] = useState<TaxpayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(false);

  // Secure path routing intercept for coachfranklin
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes("coachfranklin") || hash.includes("coachfranklin") || search.includes("coachfranklin")) {
      setIsAdminRoute(true);
    }
  }, []);

  const handleSearchResult = (data: TaxpayerData) => {
    setTaxpayerData(data);
  };

  const handleReset = () => {
    setTaxpayerData(null);
  };

  if (isAdminRoute) {
    return <AdminDashboard onExit={() => setIsAdminRoute(false)} />;
  }

  if (!currentUser) {
    return (
      <>
        <LandingPage />
        <SupportChatWidget />
      </>
    );
  }

  const trialActive = isTrialActive();
  const trialHoursLeft = getRemainingTrialHours();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden" id="app-root">
      {/* Background Glows for Sleek Interface */}
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[120px] opacity-40 pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-100 rounded-full blur-[100px] opacity-40 pointer-events-none -z-10" />

      {/* Top Notification Bar */}
      <div className="bg-emerald-600 text-white text-[11px] font-extrabold py-2 px-4 text-center select-none flex items-center justify-center gap-2 relative z-20">
        <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
        {currentUser ? (
          trialActive ? (
            <span>⏳ 24-HOUR TRIAL PROMO ACTIVE: {trialHoursLeft} Hours Remaining. Retrieve your first TIN slip for just ₦{portalSettings.trialFee}! Subsequent slips use On-Demand.</span>
          ) : (
            <span>✅ SECURE PORTAL ACTIVE: You are logged in on the {currentUser.subscription.tier} Subscription Plan.</span>
          )
        ) : (
          <span>JTB National Tax System Online. All State Registers and NRS databases are synchronized.</span>
        )}
      </div>

      {/* Header component */}
      <Header 
        onEnterAdmin={() => setIsAdminRoute(true)} 
        onLogoClick={() => {
          setActiveTab("dashboard");
          setTaxpayerData(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-10 relative z-10">
        
        {/* Render Dashboard Shell when user is authenticated */}
        <div className="space-y-8">
          
          {/* Dashboard Tabs Bar */}
            <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-xl shadow-slate-100/50 flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                  activeTab === "dashboard" 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                  activeTab === "search" 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Search className="w-4 h-4" />
                <span>TIN Lookup Form</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                  activeTab === "history" 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Saved Slips</span>
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                  activeTab === "billing" 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Wallet & Subscriptions</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer select-none ${
                  activeTab === "settings" 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>
            </div>

            {/* Render Tab Contents */}
            {activeTab === "dashboard" && (
              <DashboardOverview 
                onSelectTab={(tab) => setActiveTab(tab)} 
                onSelectSlip={(slip) => {
                  setTaxpayerData(slip);
                  setActiveTab("search");
                }}
              />
            )}

            {activeTab === "search" && (
              <div className="space-y-6">
                {!taxpayerData ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    
                    {/* Hero Column */}
                    <div className="lg:col-span-6 space-y-6 lg:pt-4 animate-fadeIn">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official Utility Wrapper</span>
                      </div>

                      <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight font-sans" id="hero-title-inner">
                          {(() => {
                            const title = portalSettings.landingTitle || "Download your JTB TIN Slip securely.";
                            const lowerTitle = title.toLowerCase();
                            const target = "securely.";
                            if (lowerTitle.includes(target)) {
                              const idx = lowerTitle.indexOf(target);
                              const mainText = title.substring(0, idx);
                              return (
                                <>
                                  {mainText}
                                  <RotatingWord />
                                </>
                              );
                            }
                            const fallbackTarget = "instantly.";
                            if (lowerTitle.includes(fallbackTarget)) {
                              const idx = lowerTitle.indexOf(fallbackTarget);
                              const mainText = title.substring(0, idx);
                              return (
                                <>
                                  {mainText}
                                  <RotatingWord />
                                </>
                              );
                            }
                            const fallbackTarget2 = "instantly";
                            if (lowerTitle.includes(fallbackTarget2)) {
                              const idx = lowerTitle.indexOf(fallbackTarget2);
                              const mainText = title.substring(0, idx);
                              return (
                                <>
                                  {mainText}
                                  <RotatingWord />
                                </>
                              );
                            }
                            return title;
                          })()}
                        </h1>
                        <p className="text-base text-slate-600 leading-relaxed font-normal">
                          {portalSettings.landingDescription || "Need a physical copy of your Tax Identification Number? Use our secure portal to query the Joint Tax Board (JTB) registers, format your particulars, and generate your high-quality PDF slip ready for printing."}
                        </p>
                      </div>

                      {/* Checkmarks representation from Sleek Theme */}
                      <div className="flex flex-wrap items-center gap-6 pt-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-slate-600">Secure Processing</span>
                        </div>
                        
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-slate-600">Official JTB Format</span>
                        </div>
                      </div>

                      {/* CTA Statistics banner in Sleek Minimal White card */}
                      <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                            Active Registries
                          </span>
                          <span className="text-lg font-extrabold text-slate-800 block mt-1.5 font-sans">
                            36 States + FCT
                          </span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-100" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                            TINs Generated
                          </span>
                          <span className="text-lg font-extrabold text-slate-800 block mt-1.5 font-sans">
                            5.2 Million+
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Form Column */}
                    <div className="lg:col-span-6 animate-fadeIn">
                      <SearchForm
                        onSearchResult={handleSearchResult}
                        loading={loading}
                        setLoading={setLoading}
                      />
                    </div>

                  </div>
                ) : (
                  /* Render JTB Certificate Preview once retrieved successfully */
                  <CertificatePreview
                    taxpayerData={taxpayerData}
                    onReset={handleReset}
                    onNavigateToBilling={() => setActiveTab("billing")}
                  />
                )}
              </div>
            )}

            {activeTab === "history" && (
              <HistoryLog 
                onSelectSlip={(slip) => {
                  setTaxpayerData(slip);
                  setActiveTab("search");
                }} 
              />
            )}

            {activeTab === "billing" && (
              <WalletAndSubs />
            )}

            {activeTab === "settings" && (
              <ProfileSettings />
            )}

          </div>

        {/* Informative Grid (News Tips) - visible when not active on a result or keeps layout complete */}
        <div className="space-y-4 pt-4 border-t border-slate-100/40">
          <div className="border-b border-slate-200/60 pb-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-sans">
              National Tax Intelligence & Guides
            </h3>
          </div>
          <TaxpayerNews />
        </div>

        {/* Accordion FAQ Area */}
        <FAQ />

      </main>

      {/* Footer component */}
      <Footer />

      {/* Global AI Live Support Chat Widget */}
      <SupportChatWidget />
    </div>
  );
}
