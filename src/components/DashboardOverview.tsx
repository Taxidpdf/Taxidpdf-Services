import React from "react";
import { useUser } from "../context/UserContext";
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Clock, 
  TrendingUp, 
  FileText, 
  ShieldCheck, 
  User, 
  History,
  Coins
} from "lucide-react";

interface DashboardOverviewProps {
  onSelectTab: (tab: string) => void;
  onSelectSlip: (slip: any) => void;
}

export default function DashboardOverview({ onSelectTab, onSelectSlip }: DashboardOverviewProps) {
  const { currentUser, getRemainingTrialHours, isTrialActive } = useUser();

  if (!currentUser) return null;

  const trialActive = isTrialActive();
  const trialHoursLeft = getRemainingTrialHours();
  const totalDownloads = currentUser.savedSlips.length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-8" id="dashboard-overview">
      
      {/* Welcome banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {currentUser.profilePicture && currentUser.profilePicture.startsWith("http") ? (
            <img 
              src={currentUser.profilePicture} 
              alt={currentUser.fullName} 
              className="w-16 h-16 rounded-full border-2 border-emerald-500 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
              {getInitials(currentUser.fullName)}
            </div>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
              Hello, {currentUser.fullName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Welcome to your JTB/NRS Non-Individual Tax ID portal. All records are active.
            </p>
          </div>
        </div>

        {/* 24-Hour Free Trial Countdown Badge */}
        {trialActive ? (
          <div className="w-full md:w-auto px-5 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3.5 shrink-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-md animate-pulse">
              {trialHoursLeft}h
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                24-Hour Trial Period
              </span>
              <span className="text-sm font-extrabold text-emerald-800 block mt-1.5 font-sans">
                {trialHoursLeft > 0 ? `${trialHoursLeft} Hours Remaining` : "Expires Soon"}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full md:w-auto px-5 py-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3.5 shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
              Plan
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">
                Active Subscription
              </span>
              <span className="text-sm font-extrabold text-blue-800 block mt-1.5 font-sans">
                {currentUser.subscription.tier} Plan
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bento Grid Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Wallet Balance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                Current Wallet Balance
              </span>
              <span className="text-3xl font-black text-slate-900 block mt-3 font-sans">
                ₦{currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="border-t border-slate-50 mt-6 pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Prepaid Credits / Starter Payments</span>
              <button 
                onClick={() => onSelectTab("billing")}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline select-none cursor-pointer"
              >
                Fund Wallet →
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] border border-slate-100 flex justify-between items-center">
              <span className="font-semibold text-slate-500">Moniepoint</span>
              <span className="font-black text-emerald-700 font-mono tracking-wider">{currentUser.walletAccountNumber || "1024859384"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Current Plan Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                Active Subscription Limit
              </span>
              <span className="text-3xl font-black text-slate-900 block mt-3 font-sans">
                {trialActive ? (
                  currentUser.savedSlips.length === 0 ? "1 Trial Slip" : "Trial Exhausted"
                ) : currentUser.subscription.tier === "Starter" ? (
                  "Pay On-Demand"
                ) : (
                  `${currentUser.subscription.downloadsUsed} / ${currentUser.subscription.downloadLimit === 999999 ? "∞" : currentUser.subscription.downloadLimit}`
                )}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="border-t border-slate-50 mt-6 pt-4 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {trialActive ? "24-Hour Trial Promo Active" : `Renews: ${new Date(currentUser.subscription.expiresAt).toLocaleDateString()}`}
            </span>
            <button 
              onClick={() => onSelectTab("billing")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline select-none cursor-pointer"
            >
              Upgrade Plan →
            </button>
          </div>
        </div>

        {/* Card 3: Total Slips Compiled */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                Total TIN Slips Retained
              </span>
              <span className="text-3xl font-black text-slate-900 block mt-3 font-sans">
                {totalDownloads} Slips
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="border-t border-slate-50 mt-6 pt-4 flex justify-between items-center">
            <span className="text-xs text-slate-400">Re-downloads are always 100% free</span>
            <button 
              onClick={() => onSelectTab("history")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline select-none cursor-pointer"
            >
              View Slips →
            </button>
          </div>
        </div>

      </div>

      {/* Main Grid: Saved Slips & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Saved Slips log (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-200/30 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                Recently Saved Tax ID Slips
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Access previously queried and compiled non-individual JTB registrations.
              </p>
            </div>
            <button
              onClick={() => onSelectTab("search")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Query New</span>
            </button>
          </div>

          {currentUser.savedSlips.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 font-medium">No saved corporate JTB slips retrieved yet.</p>
              <button 
                onClick={() => onSelectTab("search")}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Perform your first lookup now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Company Details</th>
                    <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tax ID (TIN)</th>
                    <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Saved On</th>
                    <th className="pb-3 text-right text-xs font-extrabold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
                  {currentUser.savedSlips.slice(0, 5).map((slip) => (
                    <tr key={slip.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 font-bold text-slate-800">
                        <div className="truncate max-w-[200px]">{slip.taxpayerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slip.cacNumber}</div>
                      </td>
                      <td className="py-4 font-mono font-bold text-slate-600">{slip.tin}</td>
                      <td className="py-4 text-slate-400">
                        {new Date(slip.downloadedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => onSelectSlip(slip)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Recent Transactions & Logs (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-200/30 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-4 border-b border-slate-50">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Recent Invoices</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Billing history and wallet transactions.
              </p>
            </div>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {currentUser.transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No invoice or wallet transaction logs.
                </div>
              ) : (
                currentUser.transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="flex justify-between items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs font-extrabold shrink-0 ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.type === "credit" ? "+" : "-"}₦{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectTab("billing")}
            className="w-full mt-6 py-3 border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition text-center select-none cursor-pointer"
          >
            Manage Wallet Balance
          </button>
        </div>

      </div>

    </div>
  );
}
