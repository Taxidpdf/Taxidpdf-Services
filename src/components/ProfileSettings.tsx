import React, { useState, useRef } from "react";
import { useUser } from "../context/UserContext";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Camera, 
  Check, 
  Sparkles,
  Award
} from "lucide-react";

export default function ProfileSettings() {
  const { currentUser, updateProfile } = useUser();
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.profilePicture || "");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const presetAvatars = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Seiminiyifa",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Franklin",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Amina",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Emeka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Yusuf",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oluwaseun"
  ];

  const handleAvatarClick = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedAvatar(reader.result);
          setSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    
    updateProfile(fullName.trim(), selectedAvatar);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-200/30 space-y-8" id="profile-settings">
      
      {/* Title */}
      <div className="pb-4 border-b border-slate-50">
        <h3 className="text-lg font-extrabold text-slate-800">My Profile Settings</h3>
        <p className="text-xs text-slate-400 mt-1">
          Customize your corporate profile, change your display particulars, and manage your custom avatar or business logo.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs font-semibold border border-emerald-100 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Profile Picture Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
            Profile Picture & Avatar
          </label>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {/* Active Display */}
            <div className="relative group select-none">
              <img 
                src={selectedAvatar} 
                alt="Selected profile" 
                className="w-20 h-20 rounded-full border-2 border-emerald-500 shadow-md object-cover bg-white"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-3 flex-1 w-full text-center sm:text-left">
              <span className="text-[11px] text-slate-400 font-semibold block">
                Select a high-fidelity avatar preset or upload a custom image.
              </span>
              
              {/* Presets Grid */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                {presetAvatars.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAvatarClick(av)}
                    className={`w-10 h-10 rounded-full border-2 transition select-none cursor-pointer overflow-hidden bg-white ${
                      selectedAvatar === av ? "border-emerald-600 scale-110 shadow-sm" : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <img src={av} alt={`Avatar ${idx}`} className="w-full h-full" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>

              {/* Upload Trigger */}
              <div className="pt-1">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  Upload Custom Image
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Name and particulars fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Full Name / Authorized Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address (ReadOnly)
              </label>
              <input
                type="text"
                disabled
                value={currentUser.email}
                className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-medium text-slate-400 focus:outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Member Since
              </label>
              <input
                type="text"
                disabled
                value={new Date(currentUser.registrationDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
                className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-medium text-slate-400 focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Subscription Security Summary Row */}
        <div className="bg-emerald-50/20 border border-emerald-100/30 rounded-2xl p-4 flex items-start gap-3">
          <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-extrabold text-slate-800 block">JTB Verification Credentials Certified</span>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              This profile is linked to official lookup nodes. All activities conducted on this workspace are securely authorized under current JTB regulations.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition cursor-pointer"
          >
            Save Account Changes
          </button>
        </div>

      </form>
    </div>
  );
}
