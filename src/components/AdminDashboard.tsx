import React, { useState, useRef } from "react";
import { useUser, getNeutralAgentNameForChat } from "../context/UserContext";
import { SubscriptionTier, SavedSlip, PortalSettings } from "../types";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Check, 
  X, 
  ShieldCheck, 
  Settings, 
  MessageSquare, 
  FileText, 
  UserPlus, 
  Layers, 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowLeft,
  Search,
  BookOpen,
  Eye,
  LogOut,
  Download,
  Printer,
  Copy
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";

export default function AdminDashboard({ onExit }: { onExit: () => void }) {
  const { 
    users, 
    pendingTopups, 
    approveTopup, 
    rejectTopup, 
    setAdminStatus, 
    deleteUser,
    portalSettings, 
    updateSettings,
    supportChats,
    sendAdminChatMessage,
    toggleChatRepStatus
  } = useUser();

  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"metrics" | "topups" | "users" | "cms" | "support" | "slip-gen">("metrics");
  
  // CMS state
  const [landingTitle, setLandingTitle] = useState(portalSettings?.landingTitle || "");
  const [landingDescription, setLandingDescription] = useState(portalSettings?.landingDescription || "");
  const [disclaimerText, setDisclaimerText] = useState(portalSettings?.disclaimerText || "");
  const [supportEmail, setSupportEmail] = useState(portalSettings?.supportEmail || "");
  const [formTitle, setFormTitle] = useState(portalSettings?.formTitle || "");
  const [formDescription, setFormDescription] = useState(portalSettings?.formDescription || "");
  const [footerDisclaimer, setFooterDisclaimer] = useState(portalSettings?.footerDisclaimer || "");
  const [footerCopyrightText, setFooterCopyrightText] = useState(portalSettings?.footerCopyrightText || "");
  const [trialFee, setTrialFee] = useState((portalSettings?.trialFee ?? 100).toString());
  const [onDemandFee, setOnDemandFee] = useState((portalSettings?.onDemandFee ?? 750).toString());
  const [basicFee, setBasicFee] = useState((portalSettings?.basicFee ?? 2500).toString());
  const [premiumFee, setPremiumFee] = useState((portalSettings?.premiumFee ?? 5000).toString());
  const [unlimitedFee, setUnlimitedFee] = useState((portalSettings?.unlimitedFee ?? 10000).toString());
  const [cmsSuccess, setCmsSuccess] = useState("");

  const [faqs, setFaqs] = useState(portalSettings?.faqs || []);
  const [features, setFeatures] = useState(portalSettings?.features || []);
  const [newsList, setNewsList] = useState(portalSettings?.newsList || []);
  const [benefits, setBenefits] = useState(portalSettings?.benefits || []);

  // FAQ Handlers
  const handleAddFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };
  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };
  const handleFaqChange = (index: number, field: "question" | "answer", val: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: val };
    setFaqs(updated);
  };

  // Feature Handlers
  const handleAddFeature = () => {
    setFeatures([...features, { title: "", desc: "" }]);
  };
  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };
  const handleFeatureChange = (index: number, field: "title" | "desc", val: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: val };
    setFeatures(updated);
  };

  // News Handlers
  const handleAddNews = () => {
    setNewsList([...newsList, { title: "", desc: "" }]);
  };
  const handleRemoveNews = (index: number) => {
    setNewsList(newsList.filter((_, i) => i !== index));
  };
  const handleNewsChange = (index: number, field: "title" | "desc", val: string) => {
    const updated = [...newsList];
    updated[index] = { ...updated[index], [field]: val };
    setNewsList(updated);
  };

  // Benefits Handlers
  const handleAddBenefit = () => {
    setBenefits([...benefits, ""]);
  };
  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };
  const handleBenefitChange = (index: number, val: string) => {
    const updated = [...benefits];
    updated[index] = val;
    setBenefits(updated);
  };

  // Support active chat state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Super Slip Gen state
  const [genName, setGenName] = useState("");
  const [genTin, setGenTin] = useState("");
  const [genCac, setGenCac] = useState("");
  const [genAddress, setGenAddress] = useState("");
  const [generatedSlip, setGeneratedSlip] = useState<SavedSlip | null>(null);

  const adminCertificateRef = useRef<HTMLDivElement>(null);
  const [adminDownloading, setAdminDownloading] = useState(false);
  const [adminCopied, setAdminCopied] = useState(false);

  // Password Unlock Check
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "Eseohgene1@") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect administrator password. Access denied.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#064e3b,transparent_50%)] opacity-30 pointer-events-none" />
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl relative z-10 animate-scaleUp">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Chief Admin Portal</h2>
            <p className="text-xs text-slate-400">Authorized personnel only. Provide password to unlock dynamic CMS & support chat overrides.</p>
          </div>

          {authError && (
            <div className="bg-red-500/10 text-red-400 p-3.5 border border-red-500/20 rounded-xl text-xs font-bold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-800 cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-emerald-950"
              >
                Unlock Panel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const totalUsers = users?.length || 0;
  const activeSubscribers = (users || []).filter((u) => u?.subscription?.tier && ["Basic", "Premium", "Unlimited"].includes(u.subscription.tier));
  const activeSubsCount = activeSubscribers.length;
  
  // Dynamic pricing sum of all credit transactions
  let totalRevenue = 0;
  (users || []).forEach((user) => {
    user?.transactions?.forEach((tx) => {
      if (tx?.type === "credit" && tx?.amount > 0) {
        totalRevenue += tx.amount;
      }
    });
  });

  // Calculate top users by slips generated
  const topUsers = [...(users || [])]
    .map((u) => ({
      fullName: u?.fullName || "Unknown",
      email: u?.email || "",
      slipsCount: u?.savedSlips?.length || 0,
      walletBalance: u?.walletBalance || 0,
      tier: u?.subscription?.tier || "Starter",
    }))
    .sort((a, b) => b.slipsCount - a.slipsCount)
    .slice(0, 5);

  const handleSaveCms = (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSuccess("");

    const updated: PortalSettings = {
      landingTitle,
      landingDescription,
      disclaimerText,
      supportEmail,
      formTitle,
      formDescription,
      footerDisclaimer,
      footerCopyrightText,
      trialFee: parseFloat(trialFee) || 100,
      onDemandFee: parseFloat(onDemandFee) || 750,
      basicFee: parseFloat(basicFee) || 2500,
      premiumFee: parseFloat(premiumFee) || 5000,
      unlimitedFee: parseFloat(unlimitedFee) || 10000,
      basicLimit: portalSettings?.basicLimit ?? 5, // preserved
      premiumLimit: portalSettings?.premiumLimit ?? 50, // preserved
      faqs,
      features,
      newsList,
      benefits
    };

    updateSettings(updated);
    setCmsSuccess("Portal settings saved successfully! All user frontends have been updated in real-time.");
    setTimeout(() => setCmsSuccess(""), 4000);
  };

  const handleAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !replyText.trim()) return;

    sendAdminChatMessage(selectedChatId, replyText.trim());
    setReplyText("");
  };

  const handleSuperSlipGen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genName.trim() || !genTin.trim()) return;

    const mockSlip: SavedSlip = {
      id: `slip-sup-${Math.random().toString(36).substr(2, 9)}`,
      taxpayerName: genName.trim().toUpperCase(),
      tin: genTin.trim().toUpperCase(),
      cacNumber: genCac.trim().toUpperCase() || "N/A",
      registeredAddress: genAddress.trim().toUpperCase() || "NOT PROVIDED",
      downloadedAt: new Date().toISOString()
    };

    setGeneratedSlip(mockSlip);
  };

  const handleAdminDownloadPDF = async () => {
    if (!generatedSlip) return;
    if (!adminCertificateRef.current) return;
    setAdminDownloading(true);

    try {
      const element = adminCertificateRef.current;
      
      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            try {
              // 1. Process style tags to strip oklch declarations
              const styleTags = clonedDoc.querySelectorAll("style");
              styleTags.forEach((style) => {
                if (style.innerHTML && style.innerHTML.includes("oklch")) {
                  style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, "#334155");
                }
              });

              // 2. Remove oklch rules from parsed stylesheets to prevent html2canvas color parsing crash
              for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
                try {
                  const sheet = clonedDoc.styleSheets[i];
                  if (!sheet) continue;
                  const rules = sheet.cssRules || sheet.rules;
                  if (!rules) continue;
                  for (let j = rules.length - 1; j >= 0; j--) {
                    const rule = rules[j];
                    if (rule && rule.cssText && rule.cssText.includes("oklch")) {
                      sheet.deleteRule(j);
                    }
                  }
                } catch (e) {
                  // Ignore stylesheet reading errors
                }
              }

              const el = clonedDoc.getElementById("printable-area");
              if (el) {
                el.style.transform = "none";
                el.style.position = "relative";
                el.style.left = "0";
                el.style.top = "0";
                el.style.margin = "0";
                el.style.display = "flex";
                el.style.flexDirection = "column";

                // Ensure parent container does not clip or scale down the cloned document layout
                const parent = el.parentElement;
                if (parent) {
                  parent.style.width = "794px";
                  parent.style.height = "1123px";
                  parent.style.overflow = "visible";
                  parent.style.transform = "none";
                  parent.style.position = "relative";
                  parent.style.left = "0";
                  parent.style.top = "0";
                }

                // Force standard colors on elements to prevent rendering issues due to stripped stylesheets
                const elements = el.querySelectorAll("*");
                elements.forEach((node) => {
                  const htmlNode = node as HTMLElement;
                  if (htmlNode.className) {
                    if (htmlNode.className.includes("text-slate-900")) htmlNode.style.color = "#0f172a";
                    if (htmlNode.className.includes("text-slate-950")) htmlNode.style.color = "#030712";
                    if (htmlNode.className.includes("text-slate-800")) htmlNode.style.color = "#1e293b";
                    if (htmlNode.className.includes("text-slate-700")) htmlNode.style.color = "#334155";
                    if (htmlNode.className.includes("text-slate-600")) htmlNode.style.color = "#475569";
                    if (htmlNode.className.includes("text-slate-500")) htmlNode.style.color = "#64748b";
                    if (htmlNode.className.includes("border-slate-200")) htmlNode.style.borderColor = "#e2e8f0";
                    if (htmlNode.className.includes("border-slate-300")) htmlNode.style.borderColor = "#cbd5e1";
                  }
                });
              }
            } catch (err) {
              console.error("onclone oklch cleanup failed:", err);
            }
          }
        });
      } catch (corsErr) {
        console.warn("CORS-enabled Admin HTML2Canvas failed, retrying without CORS...", corsErr);
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: false,
          logging: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            try {
              // 1. Process style tags to strip oklch declarations
              const styleTags = clonedDoc.querySelectorAll("style");
              styleTags.forEach((style) => {
                if (style.innerHTML && style.innerHTML.includes("oklch")) {
                  style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, "#334155");
                }
              });

              // 2. Remove oklch rules from parsed stylesheets to prevent html2canvas color parsing crash
              for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
                try {
                  const sheet = clonedDoc.styleSheets[i];
                  if (!sheet) continue;
                  const rules = sheet.cssRules || sheet.rules;
                  if (!rules) continue;
                  for (let j = rules.length - 1; j >= 0; j--) {
                    const rule = rules[j];
                    if (rule && rule.cssText && rule.cssText.includes("oklch")) {
                      sheet.deleteRule(j);
                    }
                  }
                } catch (e) {
                  // Ignore stylesheet reading errors
                }
              }

              const el = clonedDoc.getElementById("printable-area");
              if (el) {
                el.style.transform = "none";
                el.style.position = "relative";
                el.style.left = "0";
                el.style.top = "0";
                el.style.margin = "0";
                el.style.display = "flex";
                el.style.flexDirection = "column";

                // Ensure parent container does not clip or scale down the cloned document layout
                const parent = el.parentElement;
                if (parent) {
                  parent.style.width = "794px";
                  parent.style.height = "1123px";
                  parent.style.overflow = "visible";
                  parent.style.transform = "none";
                  parent.style.position = "relative";
                  parent.style.left = "0";
                  parent.style.top = "0";
                }

                // Force standard colors on elements to prevent rendering issues due to stripped stylesheets
                const elements = el.querySelectorAll("*");
                elements.forEach((node) => {
                  const htmlNode = node as HTMLElement;
                  if (htmlNode.className) {
                    if (htmlNode.className.includes("text-slate-900")) htmlNode.style.color = "#0f172a";
                    if (htmlNode.className.includes("text-slate-950")) htmlNode.style.color = "#030712";
                    if (htmlNode.className.includes("text-slate-800")) htmlNode.style.color = "#1e293b";
                    if (htmlNode.className.includes("text-slate-700")) htmlNode.style.color = "#334155";
                    if (htmlNode.className.includes("text-slate-600")) htmlNode.style.color = "#475569";
                    if (htmlNode.className.includes("text-slate-500")) htmlNode.style.color = "#64748b";
                    if (htmlNode.className.includes("border-slate-200")) htmlNode.style.borderColor = "#e2e8f0";
                    if (htmlNode.className.includes("border-slate-300")) htmlNode.style.borderColor = "#cbd5e1";
                  }
                });
              }
            } catch (err) {
              console.error("onclone oklch cleanup failed:", err);
            }
          }
        });
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
      
      const cleanName = generatedSlip.taxpayerName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      pdf.save(`TAXID-${cleanName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(`An error occurred while compiling your PDF: ${err instanceof Error ? err.message : String(err)}. Please try again or use the print option.`);
    } finally {
      setAdminDownloading(false);
    }
  };

  const handleAdminPrint = () => {
    window.print();
  };

  const handleAdminCopyTIN = () => {
    if (!generatedSlip) return;
    navigator.clipboard.writeText(generatedSlip.tin);
    setAdminCopied(true);
    setTimeout(() => setAdminCopied(false), 2000);
  };

  const activeChatSession = supportChats.find((c) => c.id === selectedChatId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Admin Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-emerald-950">
              AD
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide leading-tight text-white uppercase">System Administrator Panel</h1>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Secure Dynamic Bypass Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Go to Front Site</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Admin Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 px-3 block mb-2">Navigation</span>
          
          <button
            onClick={() => setActiveTab("metrics")}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer select-none ${
              activeTab === "metrics" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab("topups")}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer select-none ${
              activeTab === "topups" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4" />
              <span>Approve Topups</span>
            </div>
            {pendingTopups.filter(t => t.status === "pending").length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                {pendingTopups.filter(t => t.status === "pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("cms")}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer select-none ${
              activeTab === "cms" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Dynamic CMS (Edit Site)</span>
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer select-none ${
              activeTab === "support" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>Support Chats</span>
            </div>
            {supportChats.length > 0 && (
              <span className="bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                {supportChats.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer select-none ${
              activeTab === "users" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>

          <button
            onClick={() => setActiveTab("slip-gen")}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer select-none ${
              activeTab === "slip-gen" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Unlimited Slip Gen</span>
          </button>
        </aside>

        {/* Content Pane Area */}
        <main className="flex-1 space-y-6">
          
          {/* TAB 1: Metrics & Top Users */}
          {activeTab === "metrics" && (
            <div className="space-y-6">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Total Sign Ups</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{totalUsers} Users</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Registered database size</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Active Subscriptions</span>
                    <Layers className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{activeSubsCount} Members</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Basic / Premium / Unlimited Tiers</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Estimated Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-400">₦{totalRevenue.toLocaleString()}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Cumulative Moniepoint inflows</p>
                </div>
              </div>

              {/* Top Users & Leaderboard */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Top Active Users</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Identified corporate power-agents ranked by generated JTB slips volume.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="pb-3">User Name</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3 text-center">Active Plan</th>
                        <th className="pb-3 text-center">Slips Generated</th>
                        <th className="pb-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {topUsers.map((u, i) => (
                        <tr key={i} className="hover:bg-slate-850/30">
                          <td className="py-3 font-extrabold">{u.fullName}</td>
                          <td className="py-3 font-mono text-slate-400">{u.email}</td>
                          <td className="py-3 text-center">
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                              {u.tier}
                            </span>
                          </td>
                          <td className="py-3 text-center font-bold text-white text-sm">{u.slipsCount} Slips</td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-400">₦{u.walletBalance.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Approve Pending Topups */}
          {activeTab === "topups" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Pending Transaction Manual Auditing</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Review and approve uncredited payment claims submitted by users who faced network latency or debit discrepancies.</p>
                </div>

                {pendingTopups.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                    No payment discrepancy reports logged. Your wallet ledger is perfectly synchronized!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTopups.map((top) => (
                      <div 
                        key={top.id}
                        className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">{top.userName}</span>
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{top.userEmail}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold space-x-2">
                            <span>Ref: <strong className="font-mono text-amber-400 uppercase">{top.reference}</strong></span>
                            <span>•</span>
                            <span>Reported: {new Date(top.date).toLocaleString()}</span>
                          </div>
                          <div className="text-lg font-black font-mono text-emerald-400">
                            ₦{top.amount.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {top.status === "pending" ? (
                            <>
                              <button
                                onClick={() => rejectTopup(top.id)}
                                className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => approveTopup(top.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md"
                              >
                                Approve Credit
                              </button>
                            </>
                          ) : (
                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                              top.status === "approved" 
                                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" 
                                : "bg-red-950/40 text-red-400 border border-red-900/30"
                            }`}>
                              {top.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Dynamic CMS */}
          {activeTab === "cms" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Dynamic Portal CMS Content Management</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Edit any text blocks or fees in real-time. Changes instantly reflect across all user views without requiring system recompilations.</p>
                </div>

                {cmsSuccess && (
                  <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 p-4 rounded-xl text-xs font-semibold">
                    {cmsSuccess}
                  </div>
                )}

                <form onSubmit={handleSaveCms} className="space-y-6 text-xs font-semibold">
                  
                  {/* Fee adjustments block */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 border-b border-slate-800 pb-1">Price Configuration Settings (₦)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Trial Download Fee</label>
                        <input
                          type="number"
                          value={trialFee}
                          onChange={(e) => setTrialFee(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">On-Demand Fee</label>
                        <input
                          type="number"
                          value={onDemandFee}
                          onChange={(e) => setOnDemandFee(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Basic Monthly Fee</label>
                        <input
                          type="number"
                          value={basicFee}
                          onChange={(e) => setBasicFee(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Premium Monthly Fee</label>
                        <input
                          type="number"
                          value={premiumFee}
                          onChange={(e) => setPremiumFee(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Unlimited Monthly Fee</label>
                        <input
                          type="number"
                          value={unlimitedFee}
                          onChange={(e) => setUnlimitedFee(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Header/Landing custom text blocks */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 border-b border-slate-800 pb-1">Landing Text Editor</h4>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Main Title Heading</label>
                      <input
                        type="text"
                        value={landingTitle}
                        onChange={(e) => setLandingTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Main Description Block</label>
                      <textarea
                        rows={3}
                        value={landingDescription}
                        onChange={(e) => setLandingDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Support Contact Email Address</label>
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Third-Party Disclaimer (Official Notice block)</label>
                      <textarea
                        rows={3}
                        value={disclaimerText}
                        onChange={(e) => setDisclaimerText(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed font-semibold text-[11px]"
                      />
                    </div>

                    <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 border-b border-slate-800 pb-1 pt-2">Search Form Configuration</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Form Title</label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                          placeholder="e.g. Corporate JTB TIN Slip"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Form Description</label>
                        <textarea
                          rows={2}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed font-semibold"
                          placeholder="Provide detailed instruction to taxpayers on what details to enter..."
                        />
                      </div>
                    </div>

                    <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 border-b border-slate-800 pb-1 pt-2">Footer Configuration</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Footer Specific Disclaimer (Third-Party Notice card)</label>
                        <textarea
                          rows={3}
                          value={footerDisclaimer}
                          onChange={(e) => setFooterDisclaimer(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed font-semibold text-[11px]"
                          placeholder="Provide explicit disclaimer statement shown in the footer layout..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Footer Copyright Note</label>
                        <input
                          type="text"
                          value={footerCopyrightText}
                          onChange={(e) => setFooterCopyrightText(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                          placeholder="e.g. TaxIDPDF Independent Document Utility. For corrections or updates..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* CMS List editors */}
                  <div className="space-y-6 pt-6 border-t border-slate-800">
                    
                    {/* 1. Value Benefits checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400">Value Checklist Highlights</h4>
                        <button
                          type="button"
                          onClick={handleAddBenefit}
                          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/30 transition-all cursor-pointer"
                        >
                          + Add Benefit
                        </button>
                      </div>
                      
                      {benefits.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No benefits highlights specified. Click Add to create one.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl">
                              <span className="text-[10px] font-mono font-bold text-slate-500 w-5 text-center">#{idx + 1}</span>
                              <input
                                type="text"
                                value={benefit}
                                onChange={(e) => handleBenefitChange(idx, e.target.value)}
                                placeholder="e.g. Instant Watermarked PDFs"
                                className="flex-grow bg-transparent text-xs font-semibold text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveBenefit(idx)}
                                className="text-red-500 hover:text-red-400 p-1 cursor-pointer"
                                title="Delete benefit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Enterprise Features */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400">Features Checklist Manager</h4>
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/30 transition-all cursor-pointer"
                        >
                          + Add Feature
                        </button>
                      </div>

                      {features.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No features card defined.</p>
                      ) : (
                        <div className="space-y-3">
                          {features.map((feature, idx) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-extrabold text-slate-500">Feature Card #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeature(idx)}
                                  className="text-[10px] font-extrabold text-red-500 hover:text-red-400 uppercase tracking-wider cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-4 space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Card Title</label>
                                  <input
                                    type="text"
                                    value={feature.title}
                                    onChange={(e) => handleFeatureChange(idx, "title", e.target.value)}
                                    placeholder="e.g. Beautiful PDF Compositions"
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none"
                                  />
                                </div>
                                <div className="md:col-span-8 space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Card Description</label>
                                  <input
                                    type="text"
                                    value={feature.desc}
                                    onChange={(e) => handleFeatureChange(idx, "desc", e.target.value)}
                                    placeholder="Provide short explanatory benefits summary..."
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. News Articles / Informational Guides */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400">Guides & CAC News Alerts Manager</h4>
                        <button
                          type="button"
                          onClick={handleAddNews}
                          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/30 transition-all cursor-pointer"
                        >
                          + Add News/Guide
                        </button>
                      </div>

                      {newsList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No news alerts or guide cards defined.</p>
                      ) : (
                        <div className="space-y-3">
                          {newsList.map((news, idx) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-extrabold text-slate-500">Alert Card #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNews(idx)}
                                  className="text-[10px] font-extrabold text-red-500 hover:text-red-400 uppercase tracking-wider cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-4 space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alert Title</label>
                                  <input
                                    type="text"
                                    value={news.title}
                                    onChange={(e) => handleNewsChange(idx, "title", e.target.value)}
                                    placeholder="e.g. Tax Filing Deadlines"
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none"
                                  />
                                </div>
                                <div className="md:col-span-8 space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alert Details Description</label>
                                  <input
                                    type="text"
                                    value={news.desc}
                                    onChange={(e) => handleNewsChange(idx, "desc", e.target.value)}
                                    placeholder="Provide informational guide detail text..."
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 4. Frequently Asked Questions (FAQ) Manager */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400">Frequently Asked Questions (FAQ) Manager</h4>
                        <button
                          type="button"
                          onClick={handleAddFaq}
                          className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-lg hover:bg-emerald-900/30 transition-all cursor-pointer"
                        >
                          + Add FAQ Item
                        </button>
                      </div>

                      {faqs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No FAQ items defined.</p>
                      ) : (
                        <div className="space-y-4">
                          {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-black text-emerald-500 uppercase">FAQ Accordion #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFaq(idx)}
                                  className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span>Remove</span>
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Question Accordion Header Text</label>
                                  <input
                                    type="text"
                                    value={faq.question}
                                    onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                                    placeholder="e.g. What is taxidpdf.com?"
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Answer Content Block Text</label>
                                  <textarea
                                    rows={2}
                                    value={faq.answer}
                                    onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                                    placeholder="Write a clear, thorough answer to explain to taxpayers..."
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-white leading-relaxed focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-emerald-950"
                  >
                    Save & Apply Changes Globally
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* TAB 4: Support Chats Override console */}
          {activeTab === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
              
              {/* Left sidebar chats list */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Active Support Dialogues</span>
                
                {supportChats.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                    No support chats initiated by end users.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supportChats.map((c) => {
                      const lastMsg = c.messages[c.messages.length - 1];
                      const isUnreplied = lastMsg && lastMsg.sender === "user";
                      
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedChatId(c.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1.5 cursor-pointer relative ${
                            selectedChatId === c.id 
                              ? "bg-slate-850 border-emerald-600/50" 
                              : "bg-slate-950 border-slate-850 hover:border-slate-800"
                          }`}
                        >
                          {isUnreplied && (
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          )}
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-white">{c.userName}</span>
                            <span className="text-[9px] font-semibold text-slate-500">
                              {new Date(c.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
                            {lastMsg ? lastMsg.text : "Empty Conversation"}
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-bold mt-1">
                            <span className={c.isRepResponding ? "text-emerald-400" : "text-amber-400"}>
                              {c.isRepResponding ? "● Representative Active" : "● AI Responding"}
                            </span>
                            <span className="text-slate-500">{c.userEmail}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Active Chat Console pane */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
                {activeChatSession ? (
                  <>
                    {/* Console Header */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                      <div>
                        <h4 className="text-sm font-black text-white">
                          {activeChatSession.userName}
                          <span className="text-[9px] font-normal text-slate-400 ml-2 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Assigned Agent Name: {getNeutralAgentNameForChat(activeChatSession.id)}
                          </span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{activeChatSession.userEmail}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Chat Control:</span>
                        <button
                          onClick={() => toggleChatRepStatus(activeChatSession.id, !activeChatSession.isRepResponding)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                            activeChatSession.isRepResponding 
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-900" 
                              : "bg-slate-950 text-slate-400 border border-slate-800"
                          }`}
                        >
                          {activeChatSession.isRepResponding ? "Release Chat to AI" : "Take over from AI"}
                        </button>
                      </div>
                    </div>

                    {/* Messages pane */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                      {activeChatSession.messages.map((m) => {
                        const isAdmin = m.sender === "admin";
                        const isUser = m.sender === "user";
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                              isAdmin 
                                ? "bg-emerald-600 text-white rounded-tr-none" 
                                : m.sender === "ai"
                                ? "bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none"
                                : "bg-slate-800 text-white rounded-tl-none"
                            }`}>
                              <span className="block text-[8px] opacity-50 uppercase font-bold mb-1 tracking-widest">
                                {m.sender}
                              </span>
                              <span>{m.text}</span>
                              <span className="block text-[8px] mt-1 text-right opacity-60">
                                {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat reply form */}
                    <form onSubmit={handleAdminReply} className="mt-4 flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Type reply as support agent (automatically overrides AI responder)..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Reply
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                    <MessageSquare className="w-12 h-12 text-slate-700" />
                    <p className="text-xs text-slate-500 font-semibold max-w-sm">
                      Select a support chat from the left sidebar to audit user queries, or manually override the AI Assistant.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: User Management list */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">TaxID Registered User Ledger</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Audit, promote, delete, or review active balances and credentials of corporate agents.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="pb-3">User Name</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">NIN Number</th>
                        <th className="pb-3 text-center">Wallet Credit</th>
                        <th className="pb-3 text-center">Permissions</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {users.map((u) => (
                        <tr key={u?.id || ""} className="hover:bg-slate-850/20">
                          <td className="py-3.5 font-bold flex items-center gap-2">
                            <img src={u?.profilePicture || ""} alt="Avatar" className="w-6 h-6 rounded-full shrink-0 border border-slate-800" />
                            <span>{u?.fullName || "Unknown"}</span>
                          </td>
                          <td className="py-3.5 font-mono text-slate-400">{u?.email || ""}</td>
                          <td className="py-3.5 font-mono text-slate-400">{u?.nin || "NOT LOADED"}</td>
                          <td className="py-3.5 text-center font-mono font-bold text-emerald-400">₦{(u?.walletBalance ?? 0).toLocaleString()}</td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => setAdminStatus(u.id, !u.isAdmin)}
                              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition cursor-pointer border ${
                                u?.isAdmin 
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40" 
                                  : "bg-slate-950 text-slate-500 border-slate-800"
                              }`}
                            >
                              {u?.isAdmin ? "Chief Admin" : "Regular Agent"}
                            </button>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you absolutely sure you want to delete user ${u?.fullName || "this user"} from the ledger?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-500 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Super Unlimited Slip Generator override */}
          {activeTab === "slip-gen" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Super Slip PDF Generator Bypass</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">As Chief Administrator, you can generate high-quality JTB-watermarked TIN slips for free, with customized corporate naming and details.</p>
                </div>

                <form onSubmit={handleSuperSlipGen} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Taxpayer/Business Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DANGOTE REFINERY WEST AFRICA"
                      value={genName}
                      onChange={(e) => setGenName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">TIN Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1045738495-0001"
                      value={genTin}
                      onChange={(e) => setGenTin(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">CAC Registration Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. RC-1938592"
                      value={genCac}
                      onChange={(e) => setGenCac(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Registered Business Address</label>
                    <input
                      type="text"
                      placeholder="e.g. PLOT 14, INDUSTRIAL AVENUE, IKEJA, LAGOS."
                      value={genAddress}
                      onChange={(e) => setGenAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shadow-amber-950"
                    >
                      Bypass & Generate JTB Custom Slip
                    </button>
                  </div>
                </form>

                {/* Display Super Slip Details and visual layout */}
                {generatedSlip && (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 relative overflow-hidden space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        Admin Slip Bypass Ready
                      </span>
                      <button 
                        onClick={() => setGeneratedSlip(null)} 
                        className="text-slate-500 hover:text-white cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2.5 justify-start" id="print-controls">
                      <button
                        onClick={handleAdminDownloadPDF}
                        disabled={adminDownloading}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>{adminDownloading ? "Compiling PDF..." : "Download PDF"}</span>
                      </button>
                      <button
                        onClick={handleAdminPrint}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Slip</span>
                      </button>
                      <button
                        onClick={handleAdminCopyTIN}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none"
                      >
                        {adminCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{adminCopied ? "Copied ID!" : "Copy Tax ID"}</span>
                      </button>
                    </div>

                    {/* Certificate Display Screen */}
                    <div className="flex justify-center overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-inner">
                      {/* Printable Style Injector */}
                       <style>{`
                        @media print {
                          html, body {
                            width: 210mm;
                            height: 297mm;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                          }
                          body * {
                            visibility: hidden;
                          }
                          #printable-area, #printable-area * {
                            visibility: visible;
                          }
                          #printable-area {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                            box-shadow: none !important;
                            background: #f8faf9 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                          }
                          #print-controls, header, aside, .no-print {
                            display: none !important;
                          }
                        }
                      `}</style>
                      
                      {/* The Actual Printable JTB National TIN Certificate Slip */}
                      <div
                        id="printable-area"
                        ref={adminCertificateRef}
                        className="w-[794px] h-[1123px] shrink-0 overflow-hidden"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          boxSizing: "border-box",
                          width: "794px",
                          height: "1123px",
                          backgroundColor: "#f8faf9",
                          padding: 0,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                          position: "relative"
                        }}
                      >
                        {/* Solid Green Top Bar */}
                        <div style={{ width: "100%", height: "32px", backgroundColor: "#1a5f35", flexShrink: 0 }} />

                        {/* White Header Area */}
                        <div style={{ backgroundColor: "#ffffff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                          <div style={{ paddingLeft: "40px", paddingRight: "40px", paddingTop: "20px", paddingBottom: "20px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            
                            {/* JRB Logo on the Left */}
                            <div style={{ userSelect: "none", width: "190px" }}>
                              <table style={{ borderCollapse: "collapse", border: "none", padding: 0, margin: 0, width: "190px" }}>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: 0, verticalAlign: "middle", width: "85px" }}>
                                      <span style={{ fontSize: "38px", fontWeight: "900", color: "#008248", fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "-1.5px", lineHeight: "1.1", display: "block" }}>
                                        JRB
                                      </span>
                                    </td>
                                    <td style={{ padding: 0, paddingLeft: "8px", verticalAlign: "middle" }}>
                                      <div style={{ color: "#1e293b", fontSize: "9px", fontWeight: "900", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                        <div>JOINT</div>
                                        <div>REVENUE</div>
                                        <div>BOARD</div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan={2} style={{ padding: 0, height: "6px" }} />
                                  </tr>
                                  <tr>
                                    <td colSpan={2} style={{ padding: 0 }}>
                                      <div style={{ width: "100%", height: "1px", backgroundColor: "#cbd5e1" }} />
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan={2} style={{ padding: 0, height: "4px" }} />
                                  </tr>
                                  <tr>
                                    <td colSpan={2} style={{ padding: 0 }}>
                                      <span style={{ fontSize: "8px", fontWeight: "800", color: "#64748b", letterSpacing: "0.3px", fontFamily: "Arial, Helvetica, sans-serif", display: "block" }}>
                                        Harmonize. Optimize. Trust.
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* NRS Logo on the Right */}
                            <div style={{ userSelect: "none", width: "190px" }}>
                              <table style={{ borderCollapse: "collapse", border: "none", padding: 0, margin: 0, width: "190px" }}>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: 0, verticalAlign: "middle", width: "90px" }}>
                                      <span style={{ fontSize: "38px", fontWeight: "900", color: "#56595e", fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "-0.5px", lineHeight: "1.1", display: "block" }}>
                                        NRS
                                      </span>
                                    </td>
                                    <td style={{ padding: 0, paddingLeft: "8px", verticalAlign: "middle", width: "100px" }}>
                                      <div style={{ color: "#b12c1b", fontSize: "9px", fontWeight: "900", lineHeight: "1.2", fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                                        <div>NIGERIA</div>
                                        <div>REVENUE</div>
                                        <div>SERVICE</div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan={2} style={{ padding: 0, height: "6px" }} />
                                  </tr>
                                  <tr>
                                    <td colSpan={2} style={{ padding: 0 }}>
                                      <table style={{ width: "100%", borderCollapse: "collapse", border: "none", padding: 0, margin: 0 }}>
                                        <tbody>
                                          <tr>
                                            <td style={{ padding: 0, width: "90px" }}>
                                              <div style={{ height: "3px", backgroundColor: "#56595e" }} />
                                            </td>
                                            <td style={{ padding: 0, width: "8px" }} />
                                            <td style={{ padding: 0, width: "92px" }}>
                                              <div style={{ height: "3px", backgroundColor: "#b12c1b" }} />
                                            </td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                          </div>
                          <div style={{ height: "1px", backgroundColor: "#e2e8f0", width: "100%" }} />
                        </div>

                        {/* Main Content Body */}
                        <div style={{ flex: "1 1 0%", padding: "40px", display: "flex", flexDirection: "column", justifyBox: "space-between", position: "relative" }}>
                          
                          {/* Diagonal Gold/Amber Sash in the Background on the Right */}
                          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, height: "100%", width: "320px", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                            <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 320 1023" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {/* Shadow band */}
                              <path d="M120 0 L180 0 L320 1023 L260 1023 Z" fill="#925f19" opacity="0.15" />
                              {/* Main gold/amber gradient sash */}
                              <path d="M160 0 L320 0 L320 1023 L80 1023 Z" fill="url(#adminSashGradient)" />
                              <defs>
                                <linearGradient id="adminSashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#dfa344" />
                                  <stop offset="60%" stopColor="#ca9130" />
                                  <stop offset="100%" stopColor="#966318" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>

                          {/* Title */}
                          <div style={{ zIndex: 10, marginTop: "8px", userSelect: "none" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#111111", textTransform: "uppercase", letterSpacing: "0.025em", margin: 0 }}>
                              NON INDIVIDUAL TAX ID RETRIEVAL
                            </h2>
                          </div>

                          {/* Box 1: Company Details and Circular Overlapping Badge */}
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "stretch", gap: "24px", zIndex: 10, marginTop: "12px", position: "relative" }}>
                            
                            {/* Left Side: Solid details box with thin black border */}
                            <div style={{ flex: "1 1 0%", backgroundColor: "#ffffff", border: "1px solid #000000", padding: "32px", position: "relative" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                  <tr>
                                    <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top", paddingBottom: "24px" }}>Company Name:</td>
                                    <td style={{ width: "65%", fontSize: "16px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", verticalAlign: "top", paddingBottom: "24px", wordBreak: "break-word" }}>
                                      {generatedSlip.taxpayerName}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top", paddingBottom: "24px" }}>RC:</td>
                                    <td style={{ width: "65%", fontSize: "16px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", fontFamily: "monospace", verticalAlign: "top", paddingBottom: "24px", wordBreak: "break-word" }}>
                                      {generatedSlip.cacNumber}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top", paddingBottom: "24px" }}>Tax ID:</td>
                                    <td style={{ width: "65%", fontSize: "16px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", fontFamily: "monospace", verticalAlign: "top", paddingBottom: "24px", wordBreak: "break-word" }}>
                                      {generatedSlip.tin}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top" }}>Business Address:</td>
                                    <td style={{ width: "65%", fontSize: "15px", fontWeight: "700", color: "#334155", textTransform: "uppercase", lineHeight: "1.5", verticalAlign: "top", wordBreak: "break-word" }}>
                                      {generatedSlip.registeredAddress}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Right Side Width Space for Circular Badge */}
                            <div style={{ width: "128px", flexShrink: 0, display: "flex", alignItems: "center", justifyBox: "center", position: "relative", userSelect: "none" }}>
                              {/* The Green Circular Badge overlapping Box 1 right boundary */}
                              <div style={{ position: "absolute", right: "-10px", width: "192px", height: "192px", borderRadius: "50%", backgroundColor: "#1b552b", border: "8px solid #c08d2d", display: "flex", alignItems: "center", justifyBox: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", zIndex: 20 }}>
                                <div style={{ width: "128px", height: "128px", backgroundColor: "#ffffff", padding: "10px", borderRadius: "16px", display: "flex", alignItems: "center", justifyBox: "center", overflow: "hidden" }}>
                                  <QRCodeSVG
                                    value="https://taxid.nrs.gov.ng/"
                                    size={110}
                                    level="M"
                                    includeMargin={false}
                                  />
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Box 2: Verification Welcome and Direct Action */}
                          <div style={{ border: "1px solid #000000", backgroundColor: "#ffffff", padding: "32px", position: "relative", zIndex: 10, display: "flex", flexDirection: "row", gap: "20px", alignItems: "flex-start", marginTop: "24px" }}>
                            
                            {/* Green Round Check Icon */}
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#1e7e34", display: "flex", alignItems: "center", justifyBox: "center", color: "#ffffff", fontWeight: "bold", fontSize: "18px", flexShrink: 0, userSelect: "none" }}>
                              ✓
                            </div>

                            {/* Message Blocks */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                              <h4 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.25", fontFamily: "Georgia, serif", margin: 0 }}>
                                Hello, {generatedSlip.taxpayerName}
                              </h4>
                              
                              <ul style={{ display: "flex", flexDirection: "column", gap: "14px", margin: 0, padding: 0, listStyle: "none" }}>
                                
                                <li style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px", fontSize: "15px", fontWeight: "600", color: "#1a3a54" }}>
                                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#1a3a54", marginTop: "6px", flexShrink: 0, userSelect: "none" }} />
                                  <span>Your RC Number has been successfully verified and matches a Tax-ID in our system</span>
                                </li>
                                
                                <li style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px", fontSize: "15px", fontWeight: "600", color: "#1a3a54" }}>
                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#1a3a54", marginTop: "6px", flexShrink: 0, userSelect: "none" }} />
                                    <span>Your Tax ID is <strong style={{ fontWeight: "800", color: "#0f172a", fontFamily: "monospace", fontSize: "16px", marginLeft: "4px" }}>{generatedSlip.tin}</strong></span>
                                  </div>
                                </li>

                              </ul>
                            </div>

                          </div>

                          {/* Disclaimer Consent text and Reset trigger */}
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyBox: "space-between", marginTop: "32px", zIndex: 10, position: "relative" }}>
                            
                            <p style={{ fontSize: "12px", color: "#475569", fontWeight: "500", maxWidth: "500px", lineHeight: "1.52", margin: 0, userSelect: "none" }}>
                              I hereby consent to the processing of my information for tax-related identity verification.
                            </p>

                          </div>

                        </div>

                        {/* Solid Green Bottom Bar */}
                        <div style={{ width: "100%", height: "32px", backgroundColor: "#1a5f35", flexShrink: 0 }} />

                      </div>

                    </div>

                    <p className="text-[10px] text-slate-500 font-semibold text-center">
                      Note: Since you are in Admin Bypass mode, no download credits are charged to any wallet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
