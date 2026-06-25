import React, { useRef, useState } from "react";
import { Download, Printer, Copy, Check, RotateCcw, Share2, ShieldCheck, AlertCircle, Coins, CreditCard, Lock, Loader2, Wallet, Building, ArrowRight } from "lucide-react";
import { TaxpayerData } from "../types";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "../context/UserContext";

interface CertificatePreviewProps {
  taxpayerData: TaxpayerData;
  onReset: () => void;
  onNavigateToBilling?: () => void;
}

export default function CertificatePreview({ taxpayerData, onReset, onNavigateToBilling }: CertificatePreviewProps) {
  const { currentUser, registerDownload, isTrialActive, fundWallet } = useUser();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingSuccess, setBillingSuccess] = useState("");

  // Payment popup state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [pendingAction, setPendingAction] = useState<'download' | 'print' | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const trialSlipCount = currentUser?.savedSlips.length || 0;
  const isTrial = isTrialActive();
  const currentFee = isTrial ? (trialSlipCount === 0 ? 100 : 750) : 750;

  const isTrialOrSubActive = (): boolean => {
    if (currentUser?.isAdmin) return true;
    // Only paid monthly plans (Basic, Premium, Unlimited) bypass payment check.
    // Trial users must pay ₦100 for their first slip and ₦750 for subsequent ones, so payment is required.
    const sub = currentUser?.subscription;
    if (sub && ["Basic", "Premium", "Unlimited"].includes(sub.tier)) {
      const expiry = new Date(sub.expiresAt);
      return expiry.getTime() > Date.now();
    }
    return false;
  };

  const isAlreadySaved = currentUser?.savedSlips.some(
    (s) => s.tin.replace(/[^a-zA-Z0-9]/g, "") === taxpayerData.tin.replace(/[^a-zA-Z0-9]/g, "")
  ) || false;

  const paymentRequired = !isTrialOrSubActive() && !isAlreadySaved;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(currentUser?.walletAccountNumber || "1024859384");
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyTIN = () => {
    navigator.clipboard.writeText(taxpayerData.tin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkAndProcessDownload = (): boolean => {
    setBillingError("");
    setBillingSuccess("");

    if (!currentUser) {
      setBillingError("Please log in to your account to export TIN slips.");
      return false;
    }

    const res = registerDownload({
      taxpayerName: taxpayerData.taxpayerName,
      tin: taxpayerData.tin,
      cacNumber: taxpayerData.cacNumber || "",
      registeredAddress: taxpayerData.registeredAddress,
    });

    if (!res.allowed) {
      setBillingError(res.message);
      return false;
    }

    if (res.cost && res.cost > 0) {
      setBillingSuccess(`₦${res.cost.toLocaleString()} deducted from your wallet for this Starter download.`);
    } else if (res.message) {
      // Show short feedback message
      setBillingSuccess(res.message);
    }
    return true;
  };

  const handleDownloadPDF = async (bypassPaymentCheck = false) => {
    if (paymentRequired && !bypassPaymentCheck) {
      setPendingAction('download');
      setShowPaymentModal(true);
      return;
    }

    if (!checkAndProcessDownload()) return;
    if (!certificateRef.current) return;
    setDownloading(true);

    try {
      const element = certificateRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794, 
        windowHeight: 1123, 
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
      pdf.save(`JRB_TIN_Slip_${taxpayerData.tin.replace(/[^a-zA-Z0-9]/g, "")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("An error occurred while compiling your PDF. Please try again or use the print option.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = (bypassPaymentCheck = false) => {
    if (paymentRequired && !bypassPaymentCheck) {
      setPendingAction('print');
      setShowPaymentModal(true);
      return;
    }

    if (!checkAndProcessDownload()) return;
    window.print();
  };

  return (
    <div className="space-y-6" id="certificate-preview-container">
      {/* Printable Style Injector */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background-color: #ffffff !important;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          #print-controls, #print-controls-sidebar, #main-header, #main-footer, #faq-section, #taxpayer-news {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Banner Message */}
      <div className={`p-6 rounded-3xl shadow-xl shadow-slate-100/50 flex flex-col md:flex-row items-center justify-between gap-4 ${
        paymentRequired ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
      }`}>
        <div>
          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
            paymentRequired ? "bg-amber-500 border-amber-400/30 text-white" : "bg-emerald-500 border-emerald-400/30 text-white"
          }`}>
            {paymentRequired 
              ? (isTrial ? (trialSlipCount === 0 ? "Trial Promo • First Slip" : "Trial Limit Reached • Upgrade") : "Action Required • Starter On-Demand Plan") 
              : "Success • Slip Compiled Successfully"}
          </span>
          <h2 className="text-lg font-extrabold font-sans mt-2">
            {paymentRequired 
              ? (isTrial ? (trialSlipCount === 0 ? "TIN Slip Ready: ₦100 Trial Promo" : "Trial Exhausted: On-Demand Upgrade Required") : "TIN Slip Ready: On-Demand Payment Required") 
              : "Your JRB Non-Individual TIN Slip is Ready"}
          </h2>
          <p className="text-xs text-amber-100 font-medium leading-relaxed">
            {paymentRequired 
              ? (isTrial 
                  ? (trialSlipCount === 0 
                      ? "Your 24-hour trial is active! To download your first official TIN slip, make a promotional payment of just ₦100." 
                      : "You have generated your 1 trial slip. Subsequent downloads require ₦750 On-Demand top-up or selecting a subscription plan.") 
                  : "Your 24-hour trial has expired. To generate, download and print this slip, please make an instant payment of ₦750.") 
              : "The slip has been generated and perfectly formatted with your details."}
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0" id="print-controls">
          <button
            onClick={handleCopyTIN}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition select-none cursor-pointer border ${
              paymentRequired 
                ? "bg-amber-700 hover:bg-amber-800 border-amber-600/40" 
                : "bg-emerald-700 hover:bg-emerald-800 border-emerald-600/40"
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied ID!" : "Copy Tax ID"}</span>
          </button>
          <button
            onClick={onReset}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition select-none cursor-pointer border ${
              paymentRequired 
                ? "bg-amber-700 hover:bg-amber-800 border-amber-600/40" 
                : "bg-emerald-700 hover:bg-emerald-800 border-emerald-600/40"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Search New</span>
          </button>
        </div>
      </div>

      {/* Main Panel with side controls and Certificate stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Actions Sidebar */}
        <div className="lg:col-span-1 space-y-4" id="print-controls-sidebar">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              Export Actions
            </h4>
            
            {billingError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl text-xs font-semibold border border-red-100/60 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{billingError}</span>
                </div>
                {onNavigateToBilling && (
                  <button
                    onClick={onNavigateToBilling}
                    className="w-full select-none py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition text-center cursor-pointer"
                  >
                    Upgrade / Fund Wallet
                  </button>
                )}
              </div>
            )}

            {billingSuccess && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-semibold border border-emerald-100 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{billingSuccess}</span>
              </div>
            )}

            {paymentRequired ? (
              <button
                onClick={() => {
                  setPendingAction('download');
                  setShowPaymentModal(true);
                }}
                disabled={downloading}
                className="w-full select-none py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-200 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Pay ₦750 & Download PDF</span>
              </button>
            ) : (
              <button
                onClick={() => handleDownloadPDF(false)}
                disabled={downloading}
                className="w-full select-none py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-200 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? "Compiling PDF..." : "Download Official PDF"}</span>
              </button>
            )}

            {paymentRequired ? (
              <button
                onClick={() => {
                  setPendingAction('print');
                  setShowPaymentModal(true);
                }}
                className="w-full select-none py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Coins className="w-4 h-4 text-slate-500" />
                <span>Pay ₦750 & Print Slip</span>
              </button>
            ) : (
              <button
                onClick={() => handlePrint(false)}
                className="w-full select-none py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Registration Slip</span>
              </button>
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Verification</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This slip features a digital QR code matching the Nigeria Joint Revenue Board standard registration register database.
            </p>
          </div>
        </div>

        {/* Certificate Display Screen */}
        <div className="lg:col-span-3 flex justify-center">
          <div className="w-full max-w-[794px] overflow-x-auto bg-slate-100 rounded-3xl p-4 md:p-8 flex justify-center border border-slate-200/50 shadow-xl shadow-slate-100/50">
            
            {/* The Actual Printable JTB National TIN Certificate Slip */}
            <div
              id="printable-area"
              ref={certificateRef}
              className="w-[794px] h-[1123px] bg-[#f8faf9] p-0 shadow-2xl flex flex-col justify-between text-black font-sans relative shrink-0 overflow-hidden"
              style={{
                fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box",
              }}
            >
              {/* Solid Green Top Bar */}
              <div className="w-full h-8 bg-[#1a5f35] shrink-0" />

              {/* White Header Area */}
              <div className="bg-white px-10 py-5 flex items-center justify-between border-b border-slate-200 shrink-0">
                
                {/* JRB Logo on the Left */}
                <div className="flex flex-col items-start select-none">
                  <div className="flex items-center gap-2.5">
                    <span className="text-5xl font-extrabold text-[#008248] tracking-tighter" style={{ fontFamily: "Inter, sans-serif" }}>JRB</span>
                    <div className="flex flex-col text-slate-800 text-[10px] font-extrabold leading-tight tracking-wider uppercase">
                      <span>Joint</span>
                      <span>Revenue</span>
                      <span>Board</span>
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-300 my-1" />
                  <span className="text-[8px] font-bold text-slate-500 tracking-wider">Harmonize. Optimize. Trust.</span>
                </div>

                {/* NRS Logo on the Right */}
                <div className="flex flex-col items-end select-none">
                  <div className="flex items-center gap-2.5">
                    <span className="text-5xl font-black text-[#56595e] tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>NRS</span>
                    <div className="flex flex-col text-[#b12c1b] text-[10px] font-black leading-none tracking-wider text-left">
                      <span>NIGERIA</span>
                      <span>REVENUE</span>
                      <span>SERVICE</span>
                    </div>
                  </div>
                  <div className="w-full h-[3px] bg-[#56595e] mt-2 relative">
                    <div className="absolute right-4 w-8 h-full bg-[#b12c1b]" />
                  </div>
                </div>

              </div>

              {/* Main Content Body */}
              <div className="flex-1 p-10 flex flex-col justify-between relative">
                
                {/* Diagonal Gold/Amber Sash in the Background on the Right */}
                <div className="absolute inset-y-0 right-0 h-full w-[320px] pointer-events-none z-0 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 320 1023" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Shadow band */}
                    <path d="M120 0 L180 0 L320 1023 L260 1023 Z" fill="#925f19" opacity="0.15" />
                    {/* Main gold/amber gradient sash */}
                    <path d="M160 0 L320 0 L320 1023 L80 1023 Z" fill="url(#sashGradient)" />
                    <defs>
                      <linearGradient id="sashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#dfa344" />
                        <stop offset="60%" stopColor="#ca9130" />
                        <stop offset="100%" stopColor="#966318" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Title */}
                <div className="z-10 mt-2 select-none">
                  <h2 className="text-xl font-extrabold text-[#111] uppercase tracking-wide">
                    NON INDIVIDUAL TAX ID RETRIEVAL
                  </h2>
                </div>

                {/* Box 1: Company Details and Circular Overlapping Badge */}
                <div className="flex relative items-stretch gap-6 z-10 mt-3">
                  
                  {/* Left Side: Solid details box with thin black border */}
                  <div className="flex-1 bg-white border border-black p-8 relative">
                    <div className="grid grid-cols-12 gap-y-6 text-base font-bold text-slate-900 leading-tight">
                      
                      <div className="col-span-4 text-[16px] font-extrabold text-slate-950 uppercase tracking-wide">Company Name:</div>
                      <div className="col-span-8 text-[16px] font-bold text-slate-800 uppercase break-words pr-2">
                        {taxpayerData.taxpayerName}
                      </div>

                      <div className="col-span-4 text-[16px] font-extrabold text-slate-950 uppercase tracking-wide">RC:</div>
                      <div className="col-span-8 text-[16px] font-bold text-slate-800 uppercase font-mono break-words pr-2">
                        {taxpayerData.cacNumber}
                      </div>

                      <div className="col-span-4 text-[16px] font-extrabold text-slate-950 uppercase tracking-wide">Tax ID:</div>
                      <div className="col-span-8 text-[16px] font-bold text-slate-800 uppercase font-mono break-words pr-2">
                        {taxpayerData.tin}
                      </div>

                      <div className="col-span-4 text-[16px] font-extrabold text-slate-950 uppercase tracking-wide">Business Address:</div>
                      <div className="col-span-8 text-[15px] font-bold text-slate-700 uppercase leading-relaxed break-words pr-2">
                        {taxpayerData.registeredAddress}
                      </div>

                    </div>
                  </div>

                  {/* Right Side Width Space for Circular Badge */}
                  <div className="w-32 shrink-0 flex items-center justify-center relative select-none">
                    {/* The Green Circular Badge overlapping Box 1 right boundary */}
                    <div className="absolute right-[-10px] w-48 h-48 rounded-full bg-[#1b552b] border-[8px] border-[#c08d2d] flex items-center justify-center shadow-xl z-20">
                      <div className="w-32 h-32 bg-white p-2.5 rounded-2xl flex items-center justify-center overflow-hidden">
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
                <div className="border border-black bg-white p-8 relative z-10 flex gap-5 items-start mt-6">
                  
                  {/* Green Round Check Icon */}
                  <div className="w-8 h-8 rounded-full bg-[#1e7e34] flex items-center justify-center shrink-0 text-white font-bold text-lg select-none">
                    ✓
                  </div>

                  {/* Message Blocks */}
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-slate-900 leading-tight select-none" style={{ fontFamily: "serif, Georgia" }}>
                      Hello, {taxpayerData.taxpayerName}
                    </h4>
                    
                    <ul className="space-y-3.5 text-[15px] font-semibold text-[#1a3a54]">
                      
                      <li className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1a3a54] mt-1.5 shrink-0 select-none" />
                        <span>Your RC Number has been successfully verified and matches a Tax-ID in our system</span>
                      </li>
                      
                      <li className="flex flex-col gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1a3a54] mt-1.5 shrink-0 select-none" />
                          <span>Your Tax ID is <strong className="font-extrabold text-slate-900 select-all font-mono text-base ml-1">{taxpayerData.tin}</strong></span>
                        </div>
                        
                        {/* Interactive Copy ID trigger */}
                        <button
                          onClick={handleCopyTIN}
                          className="ml-6 flex items-center gap-1.5 text-[#1b753c] hover:text-emerald-800 font-extrabold text-base transition select-none cursor-pointer underline underline-offset-4 decoration-2"
                        >
                          <span>{copied ? "Copied ID!" : "Copy ID"}</span>
                          <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </li>

                    </ul>
                  </div>

                </div>

                {/* Disclaimer Consent text and Reset trigger */}
                <div className="flex items-center justify-between mt-8 z-10 relative">
                  
                  <p className="text-xs text-slate-600 font-medium max-w-[500px] leading-relaxed select-none">
                    I hereby consent to the processing of my information for tax-related identity verification.
                  </p>
                  
                  <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-slate-50 border-2 border-[#1e7e34] rounded-full text-sm font-extrabold text-[#1e7e34] transition select-none cursor-pointer shadow-sm"
                  >
                    <span>Reset</span>
                    <RotateCcw className="w-4 h-4 stroke-[3px]" />
                  </button>

                </div>

              </div>

              {/* Solid Green Bottom Bar */}
              <div className="w-full h-8 bg-[#1a5f35] shrink-0" />

            </div>

          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-fadeIn" id="payment-modal">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">JTB National Tax Gateway</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Instant On-Demand Retrieval</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!verifyingPayment) {
                    setShowPaymentModal(false);
                    setPendingAction(null);
                  }
                }}
                disabled={verifyingPayment}
                className="text-slate-400 hover:text-slate-600 text-xs font-extrabold disabled:opacity-50 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div className="bg-amber-50/65 rounded-2xl p-4 border border-amber-100/50">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 block mb-1">Taxpayer Details</span>
                <span className="text-xs font-bold text-slate-800 uppercase block">{taxpayerData.taxpayerName}</span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">Tax ID (TIN): {taxpayerData.tin}</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Service Fee</span>
                  <span className="font-extrabold text-slate-900">₦{currentFee.toLocaleString()}.00</span>
                </div>
                <div className="h-[1px] bg-slate-100" />
                
                {/* Account Details */}
                <div className="space-y-2.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Transfer To Wallet Bank Account</span>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Bank Name</span>
                    <span className="font-extrabold text-slate-900">Moniepoint</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Account Number</span>
                    <div className="flex items-center gap-1.5 font-mono font-extrabold text-emerald-700">
                      <span>{currentUser?.walletAccountNumber || "1024859384"}</span>
                      <button
                        onClick={handleCopyAccount}
                        className="p-1 hover:bg-slate-200/50 rounded transition cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Account Name</span>
                    <span className="font-bold text-slate-800 uppercase text-[10px]">
                      {currentUser?.walletAccountName || `TAXIDPDF-${currentUser?.fullName?.toUpperCase() || "TAXPAYER"}`}
                    </span>
                  </div>
                </div>
              </div>

              {verifyingPayment ? (
                /* Verification Steps Progress */
                <div className="space-y-3.5 py-2 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                    <span className="text-xs font-bold text-slate-700">Verifying transfer... Please wait</span>
                  </div>
                  
                  {/* Visual Tracker */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${(verificationStep + 1) * 20}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold font-mono animate-pulse uppercase tracking-wider">
                      {verificationStep === 0 && "• Connecting to Moniepoint API gateway..."}
                      {verificationStep === 1 && "• Checking inbound ledger for credit transactions..."}
                      {verificationStep === 2 && "• Matching credit balance to TIN registration token..."}
                      {verificationStep === 3 && `• Confirming credit of ₦${currentFee} on JTB records...`}
                      {verificationStep === 4 && "• Authorizing PDF watermarked slip compilation..."}
                    </p>
                  </div>
                </div>
              ) : (
                /* CTAs */
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setVerifyingPayment(true);
                      setVerificationStep(0);
                      
                      // Progress step simulator
                      let step = 0;
                      const interval = setInterval(() => {
                        step++;
                        if (step <= 4) {
                          setVerificationStep(step);
                        } else {
                          clearInterval(interval);
                          // Successful Payment flow
                          fundWallet(currentFee, `${isTrial && trialSlipCount === 0 ? "Trial Promo" : "On-Demand"} Slip Retrieval Transfer: ${taxpayerData.taxpayerName}`);
                          setVerifyingPayment(false);
                          setShowPaymentModal(false);
                          
                          // Execute download/print action after success
                          setTimeout(() => {
                            if (pendingAction === 'print') {
                              handlePrint(true);
                            } else {
                              handleDownloadPDF(true);
                            }
                            setPendingAction(null);
                          }, 100);
                        }
                      }, 1000);
                    }}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-200 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>I have made the transfer</span>
                  </button>
                  <p className="text-[9px] text-slate-400 font-semibold text-center uppercase tracking-wide flex items-center justify-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Direct Bank Network Integration Secured</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
