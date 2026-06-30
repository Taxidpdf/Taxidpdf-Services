import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { SubscriptionTier } from "../types";
import { 
  Coins, 
  CreditCard, 
  Sparkles, 
  Check, 
  DollarSign, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Hash, 
  User as UserIcon,
  HelpCircle,
  Copy,
  AlertCircle,
  FileWarning
} from "lucide-react";

export default function WalletAndSubs() {
  const { currentUser, fundWallet, purchaseSubscription, portalSettings, requestManualTopup } = useUser();
  const [fundingPurpose, setFundingPurpose] = useState<string>("custom");
  const [fundingAmount, setFundingAmount] = useState<string>("750");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedBankAcc, setCopiedBankAcc] = useState(false);

  // Manual payment reporting state
  const [reportAmount, setReportAmount] = useState("");
  const [reportRef, setReportRef] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");

  const [processingPayment, setProcessingPayment] = useState(false);
  const [isPaystackTestMode, setIsPaystackTestMode] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/paystack/config")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsPaystackTestMode(data.isTestMode);
        }
      })
      .catch(err => console.warn("Failed to fetch Paystack configuration mode:", err));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const balance = currentUser.walletBalance;

    if (fundingPurpose === "on-demand") {
      setFundingAmount(portalSettings.onDemandFee.toString());
    } else if (fundingPurpose === "basic") {
      const needed = Math.max(0, portalSettings.basicFee - balance);
      setFundingAmount(needed.toString());
    } else if (fundingPurpose === "premium") {
      const needed = Math.max(0, portalSettings.premiumFee - balance);
      setFundingAmount(needed.toString());
    } else if (fundingPurpose === "unlimited") {
      const needed = Math.max(0, portalSettings.unlimitedFee - balance);
      setFundingAmount(needed.toString());
    } else {
      setFundingAmount("750");
    }
  }, [fundingPurpose, currentUser, portalSettings]);

  if (!currentUser) return null;

  const currentTier = currentUser.subscription.tier;

  const subscriptionPlans = [
    {
      id: "Starter" as SubscriptionTier,
      name: "Starter On-Demand",
      price: `₦${portalSettings.onDemandFee.toLocaleString()}`,
      rawPrice: portalSettings.onDemandFee,
      period: "per single download",
      downloads: "1 Download",
      features: [
        `Pay ₦${portalSettings.onDemandFee.toLocaleString()} only when you retrieve`,
        "No recurring monthly contract",
        "Official JTB/NRS watermark",
        "24/7 self-service retrieval"
      ],
      badge: "On-Demand Pay",
      bgClass: "border-slate-200 bg-white hover:border-slate-300",
      btnClass: "bg-slate-100 hover:bg-slate-200 text-slate-800"
    },
    {
      id: "Basic" as SubscriptionTier,
      name: "Basic Plan",
      price: `₦${portalSettings.basicFee.toLocaleString()}`,
      rawPrice: portalSettings.basicFee,
      period: "per month",
      downloads: `${portalSettings.basicLimit} Downloads Monthly`,
      features: [
        `Costs ₦${Math.round(portalSettings.basicFee / portalSettings.basicLimit)} per download`,
        `Includes ${portalSettings.basicLimit} official downloads`,
        "Official JTB/NRS compliant layout",
        "Priority live database lookup"
      ],
      badge: "Most Affordable",
      bgClass: "border-slate-200 bg-white hover:border-slate-300",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100"
    },
    {
      id: "Premium" as SubscriptionTier,
      name: "Premium Plan",
      price: `₦${portalSettings.premiumFee.toLocaleString()}`,
      rawPrice: portalSettings.premiumFee,
      period: "per month",
      downloads: `${portalSettings.premiumLimit} Downloads Monthly`,
      features: [
        `Costs only ₦${Math.round(portalSettings.premiumFee / portalSettings.premiumLimit)} per download`,
        `Includes ${portalSettings.premiumLimit} official downloads`,
        "Bulk corporate query enabled",
        "Dedicated VIP revenue support"
      ],
      badge: "Best Value",
      bgClass: "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 shadow-lg shadow-emerald-100/50",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
    },
    {
      id: "Unlimited" as SubscriptionTier,
      name: "Unlimited Corporate",
      price: `₦${portalSettings.unlimitedFee.toLocaleString()}`,
      rawPrice: portalSettings.unlimitedFee,
      period: "per month",
      downloads: "Unlimited Downloads",
      features: [
        "Uncapped retrieval queries",
        "Uncapped high-quality downloads",
        "Integrate search inside portals",
        "Dedicated API token access"
      ],
      badge: "Unlimited Scale",
      bgClass: "border-slate-900 bg-slate-950 text-white hover:bg-slate-900",
      btnClass: "bg-white hover:bg-slate-100 text-slate-950 shadow-md shadow-slate-900/10"
    }
  ];

  const handleOpenCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const numAmount = parseFloat(fundingAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    // Strict validation bounds based on user requirements:
    // If they selected Basic Plan (2,500), they can't fund more or less than required.
    const currentBalance = currentUser.walletBalance;
    if (fundingPurpose === "basic") {
      const required = Math.max(0, portalSettings.basicFee - currentBalance);
      if (numAmount !== required) {
        setErrorMsg(`Purchase constraint error: For the Basic Monthly plan, you must fund exactly the required amount of ₦${required.toLocaleString()}.`);
        return;
      }
    } else if (fundingPurpose === "premium") {
      const required = Math.max(0, portalSettings.premiumFee - currentBalance);
      if (numAmount !== required) {
        setErrorMsg(`Purchase constraint error: For the Premium Monthly plan, you must fund exactly the required amount of ₦${required.toLocaleString()}.`);
        return;
      }
    } else if (fundingPurpose === "unlimited") {
      const required = Math.max(0, portalSettings.unlimitedFee - currentBalance);
      if (numAmount !== required) {
        setErrorMsg(`Purchase constraint error: For the Unlimited plan, you must fund exactly the required amount of ₦${required.toLocaleString()}.`);
        return;
      }
    } else if (fundingPurpose === "on-demand") {
      if (numAmount !== portalSettings.onDemandFee) {
        setErrorMsg(`Purchase constraint error: For On-Demand retrieval, you must fund exactly ₦${portalSettings.onDemandFee.toLocaleString()}.`);
        return;
      }
    } else if (fundingPurpose === "custom") {
      if (numAmount !== 750) {
        setErrorMsg("Purchase constraint error: Custom top-up is locked to exactly ₦750.");
        return;
      }
    }

    setIsCheckoutOpen(true);
  };

  const payWithPaystack = async (amount: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    setProcessingPayment(true);

    try {
      const response = await fetch("/api/paystack/init-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          customerName: currentUser.fullName,
          customerEmail: currentUser.email,
          paymentDescription: "Tax ID Portal Wallet Funding"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Paystack checkout initialization server.");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to initialize Paystack checkout.");
      }

      if (data.checkoutUrl) {
        // Redirect to Paystack's secure hosted payment page (recommended standard, works inside iframe seamlessly)
        setProcessingPayment(false);
        setIsCheckoutOpen(false);
        window.location.href = data.checkoutUrl;
      } else {
        // Mock Sandbox simulation overlay if credentials are not filled yet on the server
        setTimeout(() => {
          fundWallet(amount, `Instant Deposit via Paystack (Card/Online)`);
          setProcessingPayment(false);
          setIsCheckoutOpen(false);
          setSuccessMsg(`Sandbox Paystack Payment of ₦${amount.toLocaleString()} successful! Credited your wallet balance.`);
          setFundingPurpose("custom");
          setFundingAmount("750");
        }, 1800);
      }
    } catch (err: any) {
      setProcessingPayment(false);
      setErrorMsg(`Paystack checkout error: ${err.message}`);
    }
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(fundingAmount);
    payWithPaystack(numAmount);
  };

  const handlePurchaseSub = (tier: SubscriptionTier, rawPrice: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    
    // Check cost of the tier from settings
    let cost = rawPrice;
    if (tier === "Basic") cost = portalSettings.basicFee;
    else if (tier === "Premium") cost = portalSettings.premiumFee;
    else if (tier === "Unlimited") cost = portalSettings.unlimitedFee;

    // Calculate required amount
    const actualChargeAmount = Math.max(0, cost - currentUser.walletBalance);

    if (actualChargeAmount > 0) {
      // Direct payment flow to Paystack with specific amount
      setFundingPurpose(tier.toLowerCase() as any);
      setFundingAmount(actualChargeAmount.toString());
      setIsCheckoutOpen(true);
      payWithPaystack(actualChargeAmount);
    } else {
      // Already has sufficient balance, execute purchase directly
      const res = purchaseSubscription(tier);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleReportPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess("");
    setReportError("");

    const amt = parseFloat(reportAmount);
    if (isNaN(amt) || amt <= 0) {
      setReportError("Please enter a valid payment amount.");
      return;
    }
    if (!reportRef.trim()) {
      setReportError("Please enter the bank transaction reference/narrative.");
      return;
    }

    requestManualTopup(amt, reportRef);
    setReportSuccess("Your uncredited payment report has been submitted to the Admin Support Team for instant manual review and credit approval!");
    setReportAmount("");
    setReportRef("");
  };

  return (
    <div className="space-y-8" id="wallet-and-subs">
      
      {/* Wallet overview card and Quick funding panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Wallet Display (Styled precisely as an ATM card) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-200/50 flex flex-col justify-between aspect-[1.58/1] max-w-sm md:max-w-md w-full relative overflow-hidden border border-emerald-600/30">
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute left-1/3 top-1/4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-300 block leading-none">
                TAXIDPDF PORTAL WALLET
              </span>
              <span className="text-[11px] font-bold text-white/80 mt-1 block">
                Paystack Secure Gateway
              </span>
            </div>
            <span className="text-[10px] font-black tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded text-emerald-300 border border-emerald-800/30">
              DEBIT
            </span>
          </div>

          <div className="relative z-10 mt-1 flex justify-between items-end">
            <div>
              <div className="w-9 h-7 bg-gradient-to-r from-amber-300 to-amber-500 rounded-md relative overflow-hidden border border-amber-200/30 shadow-inner flex flex-col justify-between p-1">
                <div className="flex justify-between"><div className="w-1.5 h-1.5 bg-amber-600/20" /><div className="w-1.5 h-1.5 bg-amber-600/20" /></div>
                <div className="h-0.5 bg-amber-600/30" />
                <div className="flex justify-between"><div className="w-1.5 h-1.5 bg-amber-600/20" /><div className="w-1.5 h-1.5 bg-amber-600/20" /></div>
              </div>
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-300 mt-2 block opacity-70">
                BALANCE
              </div>
              <h3 className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white mt-0.5 animate-fadeIn">
                ₦{currentUser.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            
            <div className="text-right">
              <span className="text-[9px] font-bold text-emerald-300 block opacity-70 uppercase tracking-wider">GATEWAY</span>
              <span className="text-xs font-black font-mono text-white tracking-widest block uppercase">
                Paystack Verified
              </span>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-2 flex justify-between items-center text-xs">
            <div className="truncate max-w-[70%]">
              <span className="text-[8px] uppercase font-bold text-emerald-300 block opacity-50">Cardholder Name</span>
              <span className="font-extrabold text-white font-mono tracking-wide text-[10px] truncate block uppercase">
                {currentUser.fullName.toUpperCase()}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[8px] uppercase font-bold text-emerald-300 block opacity-50">STATUS</span>
              <span className="font-black text-white text-[9px] uppercase tracking-wider bg-emerald-600/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                {currentTier} PLAN
              </span>
            </div>
          </div>
        </div>

        {/* Quick Fund Panel */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Fund Your Portal Wallet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Top up your balance instantly. If purchasing or upgrading to a monthly plan, you must fund the exact required amount (paying only the prorated upgrade difference!).
            </p>
          </div>

          {/* Funding Purpose Selector with strict bound locking */}
          <div className="space-y-2">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Choose Funding Purpose:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFundingPurpose("custom")}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between cursor-pointer select-none ${
                  fundingPurpose === "custom" ? "border-emerald-600 bg-emerald-50/30 text-emerald-800" : "border-slate-100 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Custom Top-up</span>
                <span className="text-[10px] text-slate-400 font-medium mt-1">Single retrieve credit (₦750 locked)</span>
              </button>

              <button
                type="button"
                onClick={() => setFundingPurpose("basic")}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between cursor-pointer select-none ${
                  fundingPurpose === "basic" ? "border-emerald-600 bg-emerald-50/30 text-emerald-800" : "border-slate-100 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Basic Plan Purchase / Upgrade</span>
                <span className="text-[10px] text-emerald-600 font-extrabold mt-1">
                  Prorated: ₦{Math.max(0, portalSettings.basicFee - currentUser.walletBalance).toLocaleString()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFundingPurpose("premium")}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between cursor-pointer select-none ${
                  fundingPurpose === "premium" ? "border-emerald-600 bg-emerald-50/30 text-emerald-800" : "border-slate-100 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Premium Plan Purchase / Upgrade</span>
                <span className="text-[10px] text-emerald-600 font-extrabold mt-1">
                  Prorated: ₦{Math.max(0, portalSettings.premiumFee - currentUser.walletBalance).toLocaleString()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFundingPurpose("unlimited")}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between cursor-pointer select-none ${
                  fundingPurpose === "unlimited" ? "border-emerald-600 bg-emerald-50/30 text-emerald-800" : "border-slate-100 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <span>Unlimited Plan Purchase / Upgrade</span>
                <span className="text-[10px] text-emerald-600 font-extrabold mt-1">
                  Prorated: ₦{Math.max(0, portalSettings.unlimitedFee - currentUser.walletBalance).toLocaleString()}
                </span>
              </button>
            </div>
          </div>

          {/* Success / Error state feedback */}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-semibold border border-emerald-100 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 text-red-800 p-4 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0 text-[10px]">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleOpenCheckout} className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-sans">
                ₦
              </span>
              <input
                type="number"
                disabled={true}
                min="750"
                max="750"
                placeholder="750"
                value={fundingAmount}
                onChange={(e) => setFundingAmount("750")}
                className="w-full pl-8 pr-4 py-3.5 border bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed rounded-xl text-sm font-bold focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none shadow-md shadow-emerald-200"
            >
              Secure Top Up
            </button>
          </form>

          {fundingPurpose === "custom" ? (
            <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-3 text-[11px] font-semibold flex items-center gap-2 leading-tight">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Custom top-ups are locked to exactly ₦750 (the single on-demand rate). To obtain bulk discount rates or unlimited query access, please upgrade to a subscription plan below.</span>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-3 text-[11px] font-semibold flex items-center gap-2 leading-tight">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Purchase limit bounds are active. You cannot fund above or below the exact required prorated plan amount of ₦{parseFloat(fundingAmount).toLocaleString()}.</span>
            </div>
          )}

          {/* Presets (Only shown for custom general funding) */}
          {fundingPurpose === "custom" && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold mr-1">Active Limit:</span>
              <span className="px-3 py-1.5 rounded-lg border font-bold border-amber-200 bg-amber-50 text-amber-700 select-none">
                ₦750 Only (Locked)
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Manual Top-up Approval Form: Network issues reported by user */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/30">
        <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <FileWarning className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Report Uncredited Payment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Did a network glitch prevent your transfer from showing in your wallet? Report it below with transaction details. Our Admin Support Team will review and approve it manually!
            </p>
          </div>
        </div>

        {reportSuccess && (
          <div className="mt-4 bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-semibold border border-emerald-100 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reportSuccess}</span>
          </div>
        )}

        {reportError && (
          <div className="mt-4 bg-red-50 text-red-800 p-4 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0 text-[10px]">!</span>
            <span>{reportError}</span>
          </div>
        )}

        <form onSubmit={handleReportPayment} className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Amount Transferred (₦)
            </label>
            <input
              type="number"
              required
              min="100"
              placeholder="e.g. 5000"
              value={reportAmount}
              onChange={(e) => setReportAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
              Paystack Payment Reference / Narrative
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PAYSTACK-REF-123456"
              value={reportRef}
              onChange={(e) => setReportRef(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none shadow-md shadow-amber-200"
            >
              Submit Payment Report
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Pricing Tiers Header */}
      <div className="pt-4 border-t border-slate-100 space-y-1.5">
        <h3 className="text-lg font-extrabold text-slate-800">
          Choose a Subscription Category
        </h3>
        <p className="text-xs text-slate-400">
          Maximize savings! Unlock higher retrieval volumes or completely uncapped monthly downloads.
        </p>
      </div>

      {/* Plans Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan) => {
          const isActive = currentTier === plan.id;
          return (
            <div 
              key={plan.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition relative ${plan.bgClass}`}
            >
              {plan.badge && (
                <span className={`absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  plan.id === "Unlimited" 
                    ? "bg-slate-800 text-amber-400 border-slate-700" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}>
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    {plan.name}
                  </h4>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-xs text-slate-400 ml-1 font-medium">{plan.period}</span>
                  </div>
                  <span className={`inline-block mt-2 text-xs font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-lg ${
                    plan.id === "Unlimited" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                    {plan.downloads}
                  </span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-50 text-[11px] font-semibold text-slate-500">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${plan.id === "Unlimited" ? "text-amber-400" : "text-emerald-500"}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-50">
                {plan.id === "Starter" ? (
                  <div className="text-center text-slate-400 text-xs font-semibold py-2 leading-tight">
                    Preloaded credits used per retrieval. No setup needed.
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchaseSub(plan.id, plan.rawPrice)}
                    disabled={isActive}
                    className={`w-full py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition select-none cursor-pointer ${plan.btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isActive ? "Currently Active Plan" : `Purchase Plan`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Card Secure Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl animate-scaleUp">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm uppercase tracking-wider">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>SECURE PAYMENT PORTAL</span>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-sm select-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Funding Amount</span>
                <span className="text-lg font-black text-slate-800">₦{parseFloat(fundingAmount).toLocaleString()}</span>
              </div>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                PAYSTACK SECURE
              </span>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
                  Paystack Secure Checkout
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                  You will be securely redirected to Paystack to complete your deposit. Paystack supports <strong>Card, Bank Transfer, USSD, and Bank App payments</strong> instantly.
                </p>
                <div className="bg-slate-200/40 p-2.5 rounded-xl text-[10px] text-slate-500 font-bold flex justify-between items-center">
                  <span>Verification Status</span>
                  <span className="text-emerald-700 uppercase tracking-widest font-black text-[9px]">Instant Auto-Credit</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-2 text-[10px] text-slate-400 leading-normal">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Securely routing checkout via standard encrypted Paystack APIs. No credentials or card pins are saved on this portal.</span>
              </div>

              <button
                type="submit"
                disabled={processingPayment}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {processingPayment
                    ? "REDIRECTING SECURELY..."
                    : `PROCEED TO SECURE CHECKOUT (₦${parseFloat(fundingAmount).toLocaleString()})`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
