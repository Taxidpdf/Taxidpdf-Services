import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../context/UserContext";

export default function FAQ() {
  const { portalSettings } = useUser();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = portalSettings.faqs || [];

  const toggleIndex = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="bg-white rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100 p-6 md:p-8" id="faq-section">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 font-sans">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-slate-500">
            Everything you need to know about Nigerian Tax IDs & PDF Conversion
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div
              key={index}
              className={`border rounded-xl transition-all duration-300 ${
                isOpen
                  ? "border-emerald-500/20 bg-emerald-50/10"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <button
                onClick={() => toggleIndex(index)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 select-none focus:outline-none"
              >
                <span className="font-semibold text-sm text-slate-900 pr-2">
                  {faq.question}
                </span>
                <span className="shrink-0 text-slate-400">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
