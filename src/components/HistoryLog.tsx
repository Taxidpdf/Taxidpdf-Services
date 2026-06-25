import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { SavedSlip } from "../types";
import { Search, Calendar, Download, FileText, ArrowUpDown, ChevronRight } from "lucide-react";

interface HistoryLogProps {
  onSelectSlip: (slip: SavedSlip) => void;
}

export default function HistoryLog({ onSelectSlip }: HistoryLogProps) {
  const { currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  if (!currentUser) return null;

  const handleToggleSort = (type: "date" | "name") => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("desc");
    }
  };

  // Filter and sort slips
  const filteredSlips = (currentUser?.savedSlips || [])
    .filter((slip) => {
      if (!slip) return false;
      const query = searchQuery.toLowerCase();
      const name = (slip.taxpayerName || "").toLowerCase();
      const tin = (slip.tin || "").toLowerCase();
      const cac = (slip.cacNumber || "").toLowerCase();
      return (
        name.includes(query) ||
        tin.includes(query) ||
        cac.includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const timeA = new Date(a.downloadedAt).getTime();
        const timeB = new Date(b.downloadedAt).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      } else {
        const nameA = a.taxpayerName.toLowerCase();
        const nameB = b.taxpayerName.toLowerCase();
        return sortOrder === "asc" 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      }
    });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-200/30 space-y-6" id="history-log">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-50">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800">My Saved TIN Slip Registry</h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse and instantly reprint your compiled Joint Tax Board non-individual tax registration certificates.
          </p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-100/45 w-fit">
          {currentUser.savedSlips.length} Total Registered Slips
        </span>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Company, RC Number, or Tax ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => handleToggleSort("date")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer select-none ${
              sortBy === "date" 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <span>Sort by Date</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleToggleSort("name")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer select-none ${
              sortBy === "name" 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
            }`}
          >
            <span>Sort by Name</span>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slips table */}
      {filteredSlips.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            {searchQuery ? "No saved slips match your search criteria." : "No saved TIN slips retrieved yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Company Name</th>
                <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">RC Number</th>
                <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tax ID (TIN)</th>
                <th className="pb-3 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Saved On</th>
                <th className="pb-3 text-right text-xs font-extrabold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-xs">
              {filteredSlips.map((slip) => (
                <tr key={slip.id} className="hover:bg-slate-50/40 transition group">
                  <td className="py-4 font-extrabold text-slate-900 uppercase">
                    {slip.taxpayerName}
                  </td>
                  <td className="py-4 font-mono font-bold text-slate-500">
                    {slip.cacNumber}
                  </td>
                  <td className="py-4 font-mono font-bold text-emerald-700">
                    {slip.tin}
                  </td>
                  <td className="py-4 text-slate-400">
                    {new Date(slip.downloadedAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onSelectSlip(slip)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer select-none border border-slate-100 group-hover:border-emerald-600/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
