import React, { useRef, useState, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingSuccess, setBillingSuccess] = useState("");

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        // Adjust for responsive padding on different device sizes
        const padding = window.innerWidth < 640 ? 16 : 48;
        const availableWidth = width - padding;
        const newScale = Math.min(1, availableWidth / 794);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    const timer = setTimeout(updateScale, 150);
    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timer);
    };
  }, []);

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

  const convertOklchToRgb = (colorStr: string): string => {
    if (!colorStr || typeof colorStr !== 'string') return colorStr;
    if (!colorStr.includes('oklch')) return colorStr;
    try {
      return colorStr.replace(/oklch\([^)]+\)/g, (match) => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          if (!ctx) return match;
          ctx.fillStyle = match;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
          return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        } catch (e) {
          return match;
        }
      });
    } catch (e) {
      return colorStr;
    }
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

    // Stash original descriptors/functions to restore in finally block
    const originalCssRulesDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, "cssRules");
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      // 1. Temporary patch for CSSStyleSheet.prototype.cssRules on the main window
      Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
        get() {
          try {
            const rules = originalCssRulesDescriptor && originalCssRulesDescriptor.get
              ? originalCssRulesDescriptor.get.call(this)
              : [];
            if (!rules) return rules;

            const filtered: CSSRule[] = [];
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i];
              if (rule && rule.cssText && rule.cssText.includes("oklch")) {
                continue; // Skip rules with oklch to prevent html2canvas parsing crash
              }
              filtered.push(rule);
            }

            // Return custom array-like Proxy for html2canvas rule iterator
            return new Proxy(rules, {
              get(target, prop) {
                if (prop === "length") {
                  return filtered.length;
                }
                if (typeof prop === "string" && !isNaN(Number(prop))) {
                  return filtered[Number(prop)];
                }
                if (prop === "item") {
                  return (index: number) => filtered[index];
                }
                const val = (target as any)[prop];
                return typeof val === "function" ? val.bind(target) : val;
              },
            });
          } catch (e) {
            return [];
          }
        },
        configurable: true,
      });

      // 2. Temporary patch for window.getComputedStyle on the main window
      window.getComputedStyle = function (el, pseudoElt) {
        const styleObj = originalGetComputedStyle.call(window, el, pseudoElt);
        return new Proxy(styleObj, {
          get(target, prop) {
            const val = target[prop as any];
            if (typeof val === "function") {
              if (prop === "getPropertyValue") {
                return function (name: string) {
                  const originalVal = target.getPropertyValue(name);
                  if (originalVal && typeof originalVal === "string" && originalVal.includes("oklch")) {
                    return convertOklchToRgb(originalVal);
                  }
                  return originalVal;
                };
              }
              return val.bind(target);
            }
            if (val && typeof val === "string" && val.includes("oklch")) {
              return convertOklchToRgb(val);
            }
            return val;
          },
        });
      };

      const element = certificateRef.current;
      
      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            try {
              // 1. Setup oklch parser and computedStyle proxy in the iframe window
              if (clonedDoc.defaultView) {
                const originalGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
                clonedDoc.defaultView.getComputedStyle = function(el, pseudoElt) {
                  const styleObj = originalGetComputedStyle.call(clonedDoc.defaultView, el, pseudoElt);
                  return new Proxy(styleObj, {
                    get(target, prop) {
                      let val = target[prop as any];
                      if (typeof val === 'function') {
                        if (prop === 'getPropertyValue') {
                          return function(name: string) {
                            let originalVal = target.getPropertyValue(name);
                            if (originalVal && typeof originalVal === 'string' && originalVal.includes('oklch')) {
                              return convertOklchToRgb(originalVal);
                            }
                            return originalVal;
                          }
                        }
                        return val.bind(target);
                      }
                      if (val && typeof val === 'string' && val.includes('oklch')) {
                        return convertOklchToRgb(val);
                      }
                      return val;
                    }
                  });
                };
              }

              // 2. Process style tags to strip oklch declarations
              const styleTags = clonedDoc.querySelectorAll("style");
              styleTags.forEach((style) => {
                if (style.innerHTML && style.innerHTML.includes("oklch")) {
                  style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, "#334155");
                }
              });

              // 3. Remove oklch rules from parsed stylesheets to prevent html2canvas color parsing crash
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
                const elements = [el, ...Array.from(el.querySelectorAll("*"))];
                elements.forEach((node) => {
                  const htmlNode = node as HTMLElement;
                  
                  // Convert inline styles
                  if (htmlNode.style) {
                    const inlineStyle = htmlNode.getAttribute("style");
                    if (inlineStyle && inlineStyle.includes("oklch")) {
                      htmlNode.setAttribute("style", convertOklchToRgb(inlineStyle));
                    }
                  }

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
        console.warn("CORS-enabled HTML2Canvas failed, retrying without CORS...", corsErr);
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: false,
          logging: true,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            try {
              // 1. Setup oklch parser and computedStyle proxy in the iframe window
              if (clonedDoc.defaultView) {
                const originalGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
                clonedDoc.defaultView.getComputedStyle = function(el, pseudoElt) {
                  const styleObj = originalGetComputedStyle.call(clonedDoc.defaultView, el, pseudoElt);
                  return new Proxy(styleObj, {
                    get(target, prop) {
                      let val = target[prop as any];
                      if (typeof val === 'function') {
                        if (prop === 'getPropertyValue') {
                          return function(name: string) {
                            let originalVal = target.getPropertyValue(name);
                            if (originalVal && typeof originalVal === 'string' && originalVal.includes('oklch')) {
                              return convertOklchToRgb(originalVal);
                            }
                            return originalVal;
                          }
                        }
                        return val.bind(target);
                      }
                      if (val && typeof val === 'string' && val.includes('oklch')) {
                        return convertOklchToRgb(val);
                      }
                      return val;
                    }
                  });
                };
              }

              // 2. Process style tags to strip oklch declarations
              const styleTags = clonedDoc.querySelectorAll("style");
              styleTags.forEach((style) => {
                if (style.innerHTML && style.innerHTML.includes("oklch")) {
                  style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, "#334155");
                }
              });

              // 3. Remove oklch rules from parsed stylesheets to prevent html2canvas color parsing crash
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
                const elements = [el, ...Array.from(el.querySelectorAll("*"))];
                elements.forEach((node) => {
                  const htmlNode = node as HTMLElement;
                  
                  // Convert inline styles
                  if (htmlNode.style) {
                    const inlineStyle = htmlNode.getAttribute("style");
                    if (inlineStyle && inlineStyle.includes("oklch")) {
                      htmlNode.setAttribute("style", convertOklchToRgb(inlineStyle));
                    }
                  }

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
      
      // Dynamic naming tag requested by user: TAXID-FRANKLIN_ENTERPRISE.pdf
      const cleanName = taxpayerData.taxpayerName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      pdf.save(`TAXID-${cleanName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(`An error occurred while compiling your PDF: ${err instanceof Error ? err.message : String(err)}. Please try again or use the print option.`);
    } finally {
      // Restore oklch patches
      if (originalCssRulesDescriptor) {
        Object.defineProperty(CSSStyleSheet.prototype, "cssRules", originalCssRulesDescriptor);
      }
      window.getComputedStyle = originalGetComputedStyle;

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
        <div className="lg:col-span-3 flex justify-center w-full">
          <div ref={containerRef} className="w-full max-w-[794px] bg-slate-100 rounded-3xl p-4 md:p-8 flex justify-center items-center border border-slate-200/50 shadow-xl shadow-slate-100/50 overflow-hidden">
            
            {/* Aspect-ratio-fitting scale wrapper for high fidelity preview without horizontal scrolling */}
            <div 
              style={{ 
                height: `${1123 * scale}px`, 
                width: `${794 * scale}px`,
                position: "relative"
              }} 
              className="shrink-0 transition-all duration-300"
            >
              {/* Scale wrapper so the printable-area doesn't have the transform scale in the DOM structure */}
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: "794px",
                  height: "1123px",
                  position: "absolute",
                  left: 0,
                  top: 0
                }}
              >
                {/* The Actual Printable JTB National TIN Certificate Slip */}
                <div
                  id="printable-area"
                  ref={certificateRef}
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
                <div style={{ flex: "1 1 0%", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                  
                  {/* Diagonal Gold/Amber Sash in the Background on the Right */}
                  <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, height: "100%", width: "320px", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                    <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 320 1023" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                              {taxpayerData.taxpayerName}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top", paddingBottom: "24px" }}>RC:</td>
                            <td style={{ width: "65%", fontSize: "16px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", fontFamily: "monospace", verticalAlign: "top", paddingBottom: "24px", wordBreak: "break-word" }}>
                              {taxpayerData.cacNumber}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top", paddingBottom: "24px" }}>Tax ID:</td>
                            <td style={{ width: "65%", fontSize: "16px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", fontFamily: "monospace", verticalAlign: "top", paddingBottom: "24px", wordBreak: "break-word" }}>
                              {taxpayerData.tin}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ width: "35%", fontSize: "16px", fontWeight: "800", color: "#030712", textTransform: "uppercase", verticalAlign: "top" }}>Business Address:</td>
                            <td style={{ width: "65%", fontSize: "15px", fontWeight: "700", color: "#334155", textTransform: "uppercase", lineHeight: "1.5", verticalAlign: "top", wordBreak: "break-word" }}>
                              {taxpayerData.registeredAddress}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right Side Width Space for Circular Badge */}
                    <div style={{ width: "128px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", userSelect: "none" }}>
                      {/* The Green Circular Badge overlapping Box 1 right boundary */}
                      <div style={{ position: "absolute", right: "-10px", width: "192px", height: "192px", borderRadius: "50%", backgroundColor: "#1b552b", border: "8px solid #c08d2d", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", zIndex: 20 }}>
                        <div style={{ width: "128px", height: "128px", backgroundColor: "#ffffff", padding: "10px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#1e7e34", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "18px", flexShrink: 0, userSelect: "none" }}>
                      ✓
                    </div>

                    {/* Message Blocks */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <h4 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.25", fontFamily: "Georgia, serif", margin: 0 }}>
                        Hello, {taxpayerData.taxpayerName}
                      </h4>
                      
                      <ul style={{ display: "flex", flexDirection: "column", gap: "14px", margin: 0, padding: 0, listStyle: "none" }}>
                        
                        <li style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px", fontSize: "15px", fontWeight: "600", color: "#1a3a54" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#1a3a54", marginTop: "6px", flexShrink: 0, userSelect: "none" }} />
                          <span>Your RC Number has been successfully verified and matches a Tax-ID in our system</span>
                        </li>
                        
                        <li style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px", fontSize: "15px", fontWeight: "600", color: "#1a3a54" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#1a3a54", marginTop: "6px", flexShrink: 0, userSelect: "none" }} />
                            <span>Your Tax ID is <strong style={{ fontWeight: "800", color: "#0f172a", fontFamily: "monospace", fontSize: "16px", marginLeft: "4px" }}>{taxpayerData.tin}</strong></span>
                          </div>
                          
                          {/* Interactive Copy ID trigger */}
                          <button
                            onClick={handleCopyTIN}
                            className="no-print"
                            style={{
                              marginLeft: "24px",
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: "6px",
                              color: "#1b753c",
                              fontWeight: "800",
                              fontSize: "16px",
                              textDecoration: "underline",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              userSelect: "none"
                            }}
                          >
                            <span>{copied ? "Copied ID!" : "Copy ID"}</span>
                            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </li>

                      </ul>
                    </div>

                  </div>

                  {/* Disclaimer Consent text and Reset trigger */}
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "32px", zIndex: 10, position: "relative" }}>
                    
                    <p style={{ fontSize: "12px", color: "#475569", fontWeight: "500", maxWidth: "500px", lineHeight: "1.52", margin: 0, userSelect: "none" }}>
                      I hereby consent to the processing of my information for tax-related identity verification.
                    </p>
                    
                    <button
                      onClick={onReset}
                      className="no-print"
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "8px",
                        paddingLeft: "24px",
                        paddingRight: "24px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        backgroundColor: "#ffffff",
                        border: "2px solid #1e7e34",
                        borderRadius: "9999px",
                        fontSize: "14px",
                        fontWeight: "800",
                        color: "#1e7e34",
                        cursor: "pointer",
                        userSelect: "none",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                      }}
                    >
                      <span>Reset</span>
                      <RotateCcw className="w-4 h-4 stroke-[3px]" />
                    </button>

                  </div>

                </div>

                {/* Solid Green Bottom Bar */}
                <div style={{ width: "100%", height: "32px", backgroundColor: "#1a5f35", flexShrink: 0 }} />

              </div>

            </div>

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
