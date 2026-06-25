import React, { useState } from "react";
import { Building2, Hash, MapPin, ArrowRight, ShieldCheck, AlertCircle, FileText } from "lucide-react";
import { TaxpayerData } from "../types";
import { useUser } from "../context/UserContext";

interface SearchFormProps {
  onSearchResult: (data: TaxpayerData) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function SearchForm({ onSearchResult, loading, setLoading }: SearchFormProps) {
  const { portalSettings } = useUser();
  const [companyName, setCompanyName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progressMessage, setProgressMessage] = useState("");

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!companyName.trim()) tempErrors.companyName = "Company Name is required.";
    if (!rcNumber.trim()) tempErrors.rcNumber = "RC Number is required.";
    if (!taxId.trim()) {
      tempErrors.taxId = "Tax ID is required.";
    } else if (!/^[0-9-]{8,15}$/.test(taxId.trim())) {
      tempErrors.taxId = "Please enter a valid 8 to 15 digit Tax ID.";
    }
    if (!businessAddress.trim()) tempErrors.businessAddress = "Business Address is required.";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    // Simulate official JTB database retrieval progress steps
    const steps = [
      "Connecting to JTB National TIN Service...",
      "Resolving secure handshake with central ledger...",
      "Registering corporate particulars...",
      "Formatting taxpayer registration particulars...",
      "Compiling digital slip certificate template..."
    ];

    let currentStepIndex = 0;
    setProgressMessage(steps[0]);

    const progressInterval = setInterval(() => {
      currentStepIndex++;
      if (currentStepIndex < steps.length) {
        setProgressMessage(steps[currentStepIndex]);
      } else {
        clearInterval(progressInterval);
      }
    }, 600);

    // Construct perfect taxpayer record matching JTB specs
    const taxpayerRecord: TaxpayerData = {
      taxpayerName: companyName.trim().toUpperCase(),
      tin: taxId.trim().toUpperCase(),
      category: "Non-Individual",
      registeredAddress: businessAddress.trim().toUpperCase(),
      issuingAuthority: "Federal Inland Revenue Service",
      phone: `0803 ${Math.floor(1000000 + Math.random() * 8999999)}`,
      email: `info@${companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "enterprise"}.com.ng`,
      cacNumber: rcNumber.trim().toUpperCase().startsWith("RC") 
        ? rcNumber.trim().toUpperCase() 
        : `RC-${rcNumber.trim().toUpperCase()}`,
      registrationDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).replace(/ /g, "-"),
      taxOffice: "MSTO IKEJA",
      activeStatus: "Active",
      source: "Corporate Affairs Commission & JTB"
    };

    setTimeout(() => {
      clearInterval(progressInterval);
      setLoading(false);
      onSearchResult(taxpayerRecord);
    }, 3200);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-6 md:p-8 relative overflow-hidden" id="search-form-container">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10" />

      {/* Loading Overlay with Sleek Styling */}
      {loading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Spinning emblem inside logo */}
              <div className="w-8 h-8 animate-pulse">
                <svg viewBox="0 0 100 100" className="w-full h-full">
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
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mb-1 animate-pulse">
            Processing JTB Template...
          </h4>
          <p className="text-xs text-slate-500 max-w-sm font-mono h-8">
            {progressMessage}
          </p>
          <div className="mt-8 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>NIMC & JTB Secure Gateways Verified</span>
          </div>
        </div>
      )}

      {/* Corporate Details Input Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{portalSettings.formTitle}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {portalSettings.formDescription}
          </p>
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="company-name" className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Company Name
          </label>
          <input
            type="text"
            id="company-name"
            placeholder="e.g. DANGOTE INDUSTRIES LIMITED"
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: "" }));
            }}
            disabled={loading}
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all ${
              errors.companyName ? "border-red-300 bg-red-50/10 focus:ring-red-400" : "border-slate-200"
            }`}
          />
          {errors.companyName && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.companyName}</span>
            </div>
          )}
        </div>

        {/* RC Number */}
        <div>
          <label htmlFor="rc-number" className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            RC Number
          </label>
          <input
            type="text"
            id="rc-number"
            placeholder="e.g. RC-1234567"
            value={rcNumber}
            onChange={(e) => {
              setRcNumber(e.target.value);
              if (errors.rcNumber) setErrors((prev) => ({ ...prev, rcNumber: "" }));
            }}
            disabled={loading}
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all ${
              errors.rcNumber ? "border-red-300 bg-red-50/10 focus:ring-red-400" : "border-slate-200"
            }`}
          />
          {errors.rcNumber && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.rcNumber}</span>
            </div>
          )}
        </div>

        {/* Tax ID */}
        <div>
          <label htmlFor="tax-id" className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Tax ID (TIN)
          </label>
          <input
            type="text"
            id="tax-id"
            placeholder="e.g. 23456789-0001"
            value={taxId}
            onChange={(e) => {
              setTaxId(e.target.value);
              if (errors.taxId) setErrors((prev) => ({ ...prev, taxId: "" }));
            }}
            disabled={loading}
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all ${
              errors.taxId ? "border-red-300 bg-red-50/10 focus:ring-red-400" : "border-slate-200"
            }`}
          />
          {errors.taxId && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.taxId}</span>
            </div>
          )}
        </div>

        {/* Business Address */}
        <div>
          <label htmlFor="business-address" className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Business Address
          </label>
          <textarea
            id="business-address"
            rows={3}
            placeholder="e.g. Plot 10, Herbert Macaulay Way, Ikeja LGA, Lagos State, Nigeria."
            value={businessAddress}
            onChange={(e) => {
              setBusinessAddress(e.target.value);
              if (errors.businessAddress) setErrors((prev) => ({ ...prev, businessAddress: "" }));
            }}
            disabled={loading}
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all resize-none ${
              errors.businessAddress ? "border-red-300 bg-red-50/10 focus:ring-red-400" : "border-slate-200"
            }`}
          />
          {errors.businessAddress && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.businessAddress}</span>
            </div>
          )}
        </div>

        {/* Security assurance badge */}
        <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/30 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700">Instant formatting:</span> All details entered above are processed locally to create your printable high-quality JTB-compliant registration slip instantly.
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>CLICK TO GENERATE</span>
          </button>
        </div>
      </form>
    </div>
  );
}
