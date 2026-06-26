import React, { useState } from "react";
import { ExternalLink, ShieldAlert, Mail, X, FileText, ShieldCheck } from "lucide-react";
import { useUser } from "../context/UserContext";

export default function Footer() {
  const { portalSettings } = useUser();
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | null>(null);

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
            <button 
              onClick={() => setActiveModal("privacy")}
              className="hover:text-emerald-600 cursor-pointer transition-colors border-none bg-transparent p-0 font-medium"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveModal("terms")}
              className="hover:text-emerald-600 cursor-pointer transition-colors border-none bg-transparent p-0 font-medium"
            >
              Terms of Service
            </button>
            <span>•</span>
            <a href={`mailto:${portalSettings.supportEmail}`} className="hover:text-emerald-600 transition-colors">Support Email</a>
          </div>
        </div>
      </div>

      {/* Policies Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  {activeModal === "privacy" ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {activeModal === "privacy" ? "Privacy Policy" : "Terms of Service"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Last Updated: June 2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-600 text-xs leading-relaxed max-h-[calc(80vh-140px)]">
              {activeModal === "privacy" ? (
                <>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">1. Introduction</h4>
                    <p>
                      Welcome to TaxIDPDF ("we", "our", or "us"). We respect your privacy and are committed to protecting the corporate and personal data you process through our platform. This Privacy Policy describes how we collect, use, and protect information when you utilize our independent third-party tax-retrieval helper tools.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">2. Information We Process</h4>
                    <p className="font-semibold text-slate-800">A. On-Demand Registry Queries:</p>
                    <p>
                      To generate tax slips, you input specific criteria such as your Business/Company Name, CAC Registration Number (RC/IT Number), Taxpayer Identification Number (TIN), and Business Address. This data is utilized solely in real-time to query public directories on your behalf and format the resulting information into a downloadable, clean PDF slip.
                    </p>
                    <p className="font-semibold text-slate-800">B. User Account & Wallet Data:</p>
                    <p>
                      For registered agents or recurring users, we securely store account credentials (full name, email, portal login passwords) and transaction histories. When utilizing wallet features for instant automated retrievals, we log deposit transaction reference numbers, credit amounts, and wallet accounts to prevent credit failure and maintain accounting integrity.
                    </p>
                    <p className="font-semibold text-slate-800">C. Financial Details:</p>
                    <p>
                      All top-up payments are processed through integrated secure banking transfers (using Moniepoint/Providus). We do not collect or store your payment card numbers or personal bank log-ins on our servers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">3. How Your Information is Used</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>To execute secure public database inquiries and render customized PDF certificates.</li>
                      <li>To securely coordinate wallet account balances, top-ups, and on-demand retrievals.</li>
                      <li>To safeguard against unauthorized account access and prevent platform exploitation.</li>
                      <li>To provide prompt support, handle transaction inquiries, and notify users of system status.</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">4. Data Security and Encryption</h4>
                    <p>
                      We incorporate advanced secure server protocols and TLS/SSL encryption to protect database tables from unauthorized access, loss, or alteration. Information processed strictly during anonymous single-session queries is transiently maintained and is not cached indefinitely on public nodes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">5. Neutral Third-Party Disclaimer</h4>
                    <p>
                      This helper platform does not operate, store, or edit any official governmental taxation registers. We retrieve publicly available status records directly from the Joint Revenue Board (JRB), Nigeria Revenue Service (NRS), and other official portals. We do not transmit or share collected query parameters to unauthorized external advertising networks.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">6. User Rights</h4>
                    <p>
                      Depending on your region, you have the right to request deletion, correction, or copy access of your registered portal account data. Please direct any such privacy inquiries directly to our support channel.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h4>
                    <p>
                      By accessing or using TaxIDPDF, you agree to be bound by these Terms of Service. If you do not agree to all terms specified herein, you are strictly prohibited from using the platform and must immediately cease access.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">2. Scope of Service</h4>
                    <p>
                      TaxIDPDF is an independent, non-governmental helper utility designed to assist users in querying publicly accessible tax registries and compiling high-contrast, formatted PDF retrieval slips. Our system does not register new taxpayers or alter existing governmental ledger records.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">3. User Warranties & Legitimacy</h4>
                    <p>
                      When utilizing this system, you represent, warrant, and guarantee that any query details supplied (such as CAC numbers or business parameters) are genuine, accurate, and correspond strictly to registered businesses or entities that you have the explicit legal authorization to query. You agree not to exploit this tool for identity fraud, deceptive financial representational claims, or unauthorized administrative harassment.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">4. Payments, Refunds, and Wallets</h4>
                    <p>
                      Retrieval transactions are charged in accordance with on-demand pricing tiers or subtracted from the user's pre-funded portal wallet. Pre-funded balances cannot be withdrawn, and due to the immediate digital nature of public search queries and PDF rendering services, all service fees are strictly non-refundable. All inbound payments are securely coordinated through licensed commercial transaction channels.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">5. Limitation of Liability and Outage Disclaimers</h4>
                    <p>
                      We construct and format search reports exactly as represented on official public databases (such as NRS and JTB). We make no warranties, express or implied, regarding the factual accuracy of remote public records, nor do we guarantee uninterrupted uptime of remote governmental API gateways. TaxIDPDF and its developers shall not be held liable for any financial losses, transaction blockages, or commercial damages resulting from governmental database discrepancies or platform downtime.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900">6. Intellectual Property & Brand Clarification</h4>
                    <p>
                      The names, design, brand styles, and custom software architectures of TaxIDPDF belong exclusively to the platform operators. Trademarks, official logos, and official government branding elements (such as Joint Revenue Board or Nigeria Revenue Service acronyms) displayed on retrieved reports remain the exclusive intellectual properties of their respective statutory bodies and are utilized strictly for factual representation of retrieved public records.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
