import React from "react";
import { ExternalLink, ShieldAlert, Mail } from "lucide-react";
import { useUser } from "../context/UserContext";

export default function Footer() {
  const { portalSettings } = useUser();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 py-10 mt-16" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 items-start">
          {/* Brand/Info */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-slate-900 font-extrabold text-base tracking-tight font-sans">
                TaxID<span className="text-emerald-600">PDF</span>
              </span>
              <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-bold">
                THIRD-PARTY HELPER
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An independent helper utility providing formatting tools to assist individuals and corporate agents in querying publicly available tax registries and compiling clean PDF slips.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 p-2.5 rounded-xl max-w-xs">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>For inquiries & support: <a href={`mailto:${portalSettings.supportEmail}`} className="text-emerald-600 underline font-bold">{portalSettings.supportEmail}</a></span>
            </div>
          </div>

          {/* Quick Official Links */}
          <div className="md:col-span-3 col-span-1">
            <h4 className="text-slate-800 font-extrabold text-xs uppercase tracking-wider mb-3">
              Official Tax Channels
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://taxid.nrs.gov.ng/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-600 font-medium text-slate-500 transition-colors inline-flex items-center gap-1"
                >
                  Nigeria Revenue Services (NRS) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://tin.jtb.gov.ng"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-600 font-medium text-slate-500 transition-colors inline-flex items-center gap-1"
                >
                  JTB TIN Verification <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Sleek Theme Status Indicators & Disclaimer Block */}
          <div className="md:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operational Status</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  Connected to Public Ledger
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Type</span>
                <span className="text-xs font-black text-slate-700 block mt-1">Independent Third-Party</span>
              </div>
            </div>
            
            <div className="flex gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[11px] text-slate-800 font-bold mb-1 font-sans">
                  Third-Party Disclaimer & Legitimacy
                </h5>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {portalSettings.footerDisclaimer}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 font-medium">
            &copy; {currentYear} {portalSettings.footerCopyrightText}
          </p>
          <div className="flex gap-4 text-[11px] text-slate-400 font-medium">
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <a href={`mailto:${portalSettings.supportEmail}`} className="hover:text-emerald-600 transition-colors">Support Email</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
