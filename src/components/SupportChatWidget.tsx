import React, { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { MessageCircle, Send, X, Bot, User as UserIcon, Shield, Minus, ArrowRight } from "lucide-react";

export default function SupportChatWidget() {
  const { currentUser, supportChats, sendUserChatMessage, clearChatSession } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If there's no logged-in user, we can still show support chat, but let's encourage signup/login or tie chat to session
  const activeChat = currentUser ? supportChats.find((c) => c.userId === currentUser.id) : null;
  const messages = activeChat?.messages || [];
  const isRepResponding = activeChat?.isRepResponding || false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || isSending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      await sendUserChatMessage(textToSend);
    } catch (err) {
      console.error("Error sending user support chat message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans" id="support-chat-root">
      
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
          title="Open Live Chat Support"
        >
          <MessageCircle className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          
          <div className="absolute right-16 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none shadow-md">
            Need help? Chat with AI Rep
          </div>
        </button>
      )}

      {/* Interactive Chat Window Box */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[480px] bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-scaleUp">
          
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-sm shadow-inner shadow-emerald-800">
                {isRepResponding ? <UserIcon className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide leading-tight">
                  {isRepResponding ? "Coach Franklin (Support)" : "TaxID AI Assistant"}
                </h4>
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isRepResponding ? "Human Representative Active" : "AI Helper Online"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={clearChatSession}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer text-[10px] font-bold uppercase tracking-wide"
                  title="Clear Chat History"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Third Party Legitimacy Warning Info Box */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-500 leading-normal font-medium">
              We are an independent third-party tool querying public tax records at https://taxid.nrs.gov.ng/. We cannot edit official names or TIN registrations.
            </p>
          </div>

          {/* Messages Pane Area */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-3"
          >
            {/* If no logged in user */}
            {!currentUser ? (
              <div className="text-center py-10 px-4 space-y-3">
                <Bot className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Support chat is available for verified members. Please sign up or log in to query with Coach Franklin.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    const authSection = document.getElementById("auth-form-container");
                    authSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition uppercase tracking-wide inline-flex items-center gap-1"
                >
                  <span>Go to Login / Sign Up</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 px-6 space-y-2">
                <span className="text-2xl">👋</span>
                <h5 className="text-xs font-black text-slate-700">Welcome to TaxID Support!</h5>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  Ask me about pricing, how to retrieve JTB slips, or upload questions. Coach Franklin is also notified and can join live!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed font-medium shadow-sm ${
                        isMe
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : msg.sender === "admin"
                          ? "bg-slate-900 text-white rounded-tl-none border border-slate-800"
                          : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                      <span className={`block text-[8px] mt-1.5 text-right opacity-60 ${isMe ? "text-white" : "text-slate-400"}`}>
                        {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  <span className="ml-1">AI Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Message Input Form Panel */}
          {currentUser && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                required
                placeholder="Ask about payments, JTB slips, or limits..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 focus:bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSending}
                className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  );
}
