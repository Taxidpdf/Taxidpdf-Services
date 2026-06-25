import React from "react";
import { Award, FileText, Calendar, HelpCircle } from "lucide-react";
import { useUser } from "../context/UserContext";

export default function TaxpayerNews() {
  const { portalSettings } = useUser();
  const newsList = portalSettings.newsList || [];

  const getIcon = (index: number) => {
    if (index === 0) return <Calendar className="w-5 h-5 text-emerald-600" />;
    if (index === 1) return <Award className="w-5 h-5 text-emerald-600" />;
    return <FileText className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="taxpayer-news">
      {newsList.map((card, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-emerald-500/20 hover:bg-emerald-50/10 shadow-md shadow-slate-100/50 transition-all duration-300 flex gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/40 flex items-center justify-center shrink-0">
            {getIcon(i)}
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 mb-1 font-sans uppercase tracking-wider">
              {card.title}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {card.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
