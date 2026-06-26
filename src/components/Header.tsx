import React from "react";
import { ShieldCheck, Landmark, Globe, LogOut } from "lucide-react";
import { useUser } from "../context/UserContext";

interface HeaderProps {
  onEnterAdmin?: () => void;
}

export default function Header({ onEnterAdmin }: HeaderProps) {
  const { currentUser, logout } = useUser();

  const getInitials = (name: string) => {
    if (!name) return "U";
    try {
      return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0] || "")
        .slice(0, 2)
        .join("")
        .toUpperCase();
    } catch (e) {
      return "U";
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 shadow-sm relative overflow-hidden" id="main-header">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-emerald-50 rounded-full blur-[100px] opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        {/* JTB Emblem & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 font-sans">
                  TaxID<span className="text-emerald-600">PDF</span>
                </h1>
                <span className="text-[9px] bg-slate-900 text-slate-100 font-bold px-1.5 py-0.5 rounded-full font-mono">
                  JTB PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
                Federal Republic of Nigeria • National TIN Services
              </p>
            </div>
          </div>

          {/* Quick logout trigger on mobile */}
          {currentUser && (
            <button 
              onClick={logout}
              className="md:hidden p-2 text-slate-400 hover:text-red-500 transition cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User profile or status badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 w-full md:w-auto">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.isAdmin && onEnterAdmin && (
                <button
                  onClick={onEnterAdmin}
                  className="bg-slate-900 text-amber-400 hover:bg-slate-800 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-2xl text-[11px] font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
                  title="Enter Admin Management Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Panel</span>
                </button>
              )}
              
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl py-1.5 pl-3 pr-2.5 shadow-sm text-xs">
                <div className="flex items-center gap-2">
                  {currentUser.profilePicture && currentUser.profilePicture.startsWith("http") ? (
                    <img 
                      src={currentUser.profilePicture} 
                      alt={currentUser.fullName} 
                      className="w-7 h-7 rounded-full border border-emerald-500/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px]">
                      {getInitials(currentUser.fullName)}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="font-extrabold text-slate-800 leading-none">{currentUser.fullName}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-mono">₦{currentUser.walletBalance.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-600 transition flex items-center gap-1 font-bold cursor-pointer select-none"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SSL Certificate Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secure 256-Bit SSL</span>
              </div>

              {/* Database Integration Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 font-semibold">
                <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                <span>JTB & NRS API</span>
              </div>

              {/* Language / Region Badge */}
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/30">
                <Globe className="w-3.5 h-3.5" />
                <span>NG</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
