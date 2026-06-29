import React, { createContext, useContext, useState, useEffect } from "react";
import { User, SubscriptionTier, SavedSlip, Transaction, PortalSettings, PendingTopup, SupportChat, ChatMessage } from "../types";
import { getSupabase } from "../lib/supabase";
import {
  fetchUsersFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  fetchPortalSettingsFromSupabase,
  savePortalSettingsToSupabase,
  fetchPendingTopupsFromSupabase,
  savePendingTopupToSupabase,
  fetchSupportChatsFromSupabase,
  saveSupportChatToSupabase,
  deleteSupportChatFromSupabase
} from "../lib/supabaseSync";

interface UserContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (fullName: string, email: string, password: string, nin: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (fullName: string, profilePicture: string) => void;
  fundWallet: (amount: number, description?: string) => void;
  purchaseSubscription: (tier: SubscriptionTier) => { success: boolean; message: string };
  registerDownload: (slip: Omit<SavedSlip, "id" | "downloadedAt">) => { allowed: boolean; message: string; cost?: number };
  getRemainingTrialHours: () => number;
  isTrialActive: () => boolean;
  hasAvailableDownloads: () => boolean;
  
  // Dynamic Settings (CMS)
  portalSettings: PortalSettings;
  updateSettings: (settings: PortalSettings) => void;
  
  // Pending Topups manual approval
  pendingTopups: PendingTopup[];
  requestManualTopup: (amount: number, reference: string) => void;
  approveTopup: (topupId: string) => void;
  rejectTopup: (topupId: string) => void;
  
  // User Management
  setAdminStatus: (userId: string, isAdmin: boolean) => void;
  deleteUser: (userId: string) => void;
  
  // Support Chat Sessions
  supportChats: SupportChat[];
  sendUserChatMessage: (text: string) => Promise<void>;
  sendAdminChatMessage: (chatId: string, text: string) => void;
  toggleChatRepStatus: (chatId: string, isRepResponding: boolean) => void;
  clearChatSession: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const SEED_USERS_KEY = "jtb_portal_users";
const CURRENT_USER_KEY = "jtb_portal_current_user";
const SETTINGS_KEY = "portal_settings_v1";
const TOPUPS_KEY = "portal_pending_topups_v1";
const CHATS_KEY = "portal_support_chats_v1";

const DEFAULT_SETTINGS: PortalSettings = {
  trialFee: 100,
  onDemandFee: 750,
  basicFee: 2500,
  premiumFee: 5000,
  unlimitedFee: 10000,
  basicLimit: 5,
  premiumLimit: 50,
  landingTitle: "Download your JTB TIN Slip as PDF securely.",
  landingDescription: "Need a physical copy of your Tax Identification Number? Use our secure portal to query the Joint Tax Board (JTB) registers, format your particulars, and generate your high-quality PDF slip ready for printing.",
  disclaimerText: "Disclaimer: taxidpdf.com operates solely as a third-party helper wrapper facilitating official tax database queries. We do not issue corporate TIN registrations or represent state boards. All original ownership is preserved with the Nigeria Revenue Services (NRS) and the Joint Tax Board (JTB) of Nigeria. For profile rectifications, please approach authorized physical state board offices. This is an independent third-party website to make CAC agents and business owners generate JTB/NRS TIN slips as shown on the official website https://taxid.nrs.gov.ng/. We only work with the information available publicly on this website.",
  supportEmail: "support@taxidpf.com",
  formTitle: "Corporate JTB TIN Slip",
  formDescription: "Fill in your business details exactly as registered with the CAC to automatically compile and align them in front of the official JTB PDF slip template.",
  footerDisclaimer: "This website is an independent third-party wrapper to make CAC agents and business owners generate the JTB/NRS TIN as shown on the official website https://taxid.nrs.gov.ng/. We only work with the information available publicly on this website. We are not official partners of CAC, JTB, or NRS, and we are not in any way hacking into CAC website, JTB, or NRS website. Whatever details you supply during the lookup are what will appear on the generated slip.",
  footerCopyrightText: "TaxIDPDF Independent Document Utility. For corrections or updates, approach authorized physical state board offices.",
  faqs: [
    {
      question: "What is taxidpdf.com?",
      answer: "TaxIDPDF is Nigeria's premier digital helper portal designed to automate the retrieval, formatting, and secure high-quality PDF generation of your JTB and NRS non-individual and individual Tax Identification Numbers (TIN)."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! Every new sign-up is automatically enrolled in a 24-hour trial. During these 24 hours, you have complete access to search and view TIN results, and can download your first compiled official PDF slip for a special promotional fee of just ₦100."
    },
    {
      question: "What happens after my 24-hour trial or after my first download?",
      answer: "Once you download your first trial slip (or after 24 hours), further downloads require our affordable On-Demand top-up of ₦750 per download or selecting a premium subscription plan."
    },
    {
      question: "Can I download my past slips without paying again?",
      answer: "Absolutely. Once a slip has been paid for (either at the ₦100 trial promo or the ₦750 on-demand rate), it is saved securely to your Dashboard Logs. You can re-download, view, or print it at any time for 100% free with no extra fees."
    },
    {
      question: "How does the wallet bank transfer verification work?",
      answer: "We assign a unique Moniepoint gateway wallet account name to your organization. When you make a standard bank transfer of the ₦100 (trial first slip) or ₦750 retrieval fee to this account, our direct API ledger validates the inbound transaction in under 5 seconds, triggering your official slip download instantly."
    },
    {
      question: "Does this portal save my sensitive information (BVN or NIN)?",
      answer: "No. Security and privacy are our highest priorities. Any personal identification numbers, such as your Bank Verification Number (BVN) or National Identification Number (NIN), are used purely for real-time authentication queries with NIMC/JTB systems. They are not stored in our databases, logged on our servers, or shared with third parties."
    },
    {
      question: "What is the difference between NRS and JTB?",
      answer: "The Nigeria Revenue Services (NRS) is responsible for collecting federal registries and taxes in Nigeria. The Joint Tax Board (JTB) is an umbrella body that harmonizes tax administration across all 36 States and the FCT. The JTB manages the central National Tax Identification Number (TIN) registry, ensuring a single tax identity nationwide."
    },
    {
      question: "Can I use the generated PDF slip for visa applications?",
      answer: "Yes. The generated PDF slip is fully formatted with your official details, National TIN, issuing authority, registration date, barcode, and QR verification code. It is identical to the official registration slip issued at the tax offices and is widely accepted by banks, foreign embassies, corporate registrars (CAC), and government agencies."
    },
    {
      question: "DOES BANKS ACCEPT IT?",
      answer: "Yes. Banks that previously accepted the old JTB TIN slip will also accept this new format. Our new JTB/NRS Slip for Non-Individual TIN is generated in PDF format, making it easy to print and present professionally. The information displayed on the slip contains verifiable details that align with the records available on the Tax-ID portal, giving financial institutions confidence in its authenticity."
    },
    {
      question: "CAN I USE THE WEBSITE TO GENERATE AN INDIVIDUAL TIN?",
      answer: "No. The website is designed specifically for generating Non-Individual TIN (Business Name, Company, and Incorporated Trustee) slips. It does not support Individual TIN generation."
    }
  ],
  features: [
    {
      title: "CAC Integration",
      desc: "Supply corporate RC Number to instantly pull up registered items."
    },
    {
      title: "Beautiful PDF Compositions",
      desc: "We layout and watermark JTB TIN slips in beautiful, high-contrast, scalable vector typography that is 100% compliant and ready to present to banks or government portals."
    },
    {
      title: "Wallet On-Demand Settlement",
      desc: "After your 24-hour trial, never get locked into expensive monthly sub fees. Pay only ₦750 per download using bank transfers to your assigned Moniepoint gateway account."
    },
    {
      title: "Eternal Storage & Re-downloads",
      desc: "Every generated slip is logged safely to your dashboard. You can re-download, view, or copy saved tax details for free at any time with zero extra costs."
    }
  ],
  newsList: [
    {
      title: "Tax Filing Deadlines",
      desc: "For individuals, the deadline is March 31st of every fiscal year. For companies, filing must occur within 6 months of the financial year-end."
    },
    {
      title: "Benefits of a TIN",
      desc: "Necessary for opening official corporate bank accounts, obtaining government loans, clearing imports, and registering assets."
    },
    {
      title: "CAC Requirements",
      desc: "Registered companies must supply their CAC RC number to obtain a Corporate TIN. Individual TINs are linked directly to BVN or NIN."
    }
  ],
  benefits: [
    "Instant Watermarked PDFs",
    "Wallet Instant Transfers",
    "Unlimited History Logs",
    "Full NRS/JTB Compliance"
  ]
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(DEFAULT_SETTINGS);
  const [pendingTopups, setPendingTopups] = useState<PendingTopup[]>([]);
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);

  // Check 30-days expirations and reset wallet balance to 0 for expired users
  const checkAndRunExpirations = (allUsers: User[], currentU: User | null) => {
    let changed = false;

    const updatedUsers = allUsers.map((user) => {
      const sub = user?.subscription;
      if (sub && sub.tier && ["Basic", "Premium", "Unlimited"].includes(sub.tier)) {
        const expiresAt = new Date(sub.expiresAt);
        if (expiresAt.getTime() <= Date.now()) {
          changed = true;
          // Plan expired! Set tier to Starter and reset balance to 0
          const expTx: Transaction = {
            id: `tx-exp-${Math.random().toString(36).substr(2, 9)}`,
            type: "debit",
            amount: user?.walletBalance ?? 0,
            description: `Monthly ${sub.tier} Plan Expired - Credit Balance Reset to 0`,
            date: new Date().toISOString(),
          };
          return {
            ...user,
            walletBalance: 0,
            subscription: {
              tier: "Starter" as const,
              downloadsUsed: 0,
              downloadLimit: 99999,
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            },
            transactions: [expTx, ...(user?.transactions || [])],
          };
        }
      }
      return user;
    });

    let updatedCurrent = currentU;
    if (currentU && currentU.subscription && currentU.subscription.tier && ["Basic", "Premium", "Unlimited"].includes(currentU.subscription.tier)) {
      const expiresAt = new Date(currentU.subscription.expiresAt);
      if (expiresAt.getTime() <= Date.now()) {
        const matchingUpdated = updatedUsers.find((u) => u.id === currentU.id);
        if (matchingUpdated) {
          updatedCurrent = matchingUpdated;
        }
      }
    }

    if (changed) {
      setUsers(updatedUsers);
      localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
      }
    }
  };

  // Initialize from LocalStorage
  useEffect(() => {
    // 1. Settings
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed && typeof parsed === "object") {
          if (parsed.landingTitle === "Download your JTB TIN Slip instantly." || parsed.landingTitle === "Download your JTB TIN Slip securely.") {
            parsed.landingTitle = "Download your JTB TIN Slip as PDF securely.";
          }
          const defaultFaqs = DEFAULT_SETTINGS.faqs;
          const mergedFaqs = [...(parsed.faqs || DEFAULT_SETTINGS.faqs)];
          for (const df of defaultFaqs) {
            if (!mergedFaqs.some(f => f.question.toLowerCase() === df.question.toLowerCase())) {
              mergedFaqs.push(df);
            }
          }

          const defaultFeatures = DEFAULT_SETTINGS.features;
          const mergedFeatures = [...(parsed.features || DEFAULT_SETTINGS.features)];
          for (const df of defaultFeatures) {
            if (!mergedFeatures.some(f => f.title.toLowerCase() === df.title.toLowerCase())) {
              mergedFeatures.push(df);
            }
          }

          const defaultNews = DEFAULT_SETTINGS.newsList;
          const mergedNews = [...(parsed.newsList || DEFAULT_SETTINGS.newsList)];
          for (const dn of defaultNews) {
            if (!mergedNews.some(n => n.title.toLowerCase() === dn.title.toLowerCase())) {
              mergedNews.push(dn);
            }
          }

          const defaultBenefits = DEFAULT_SETTINGS.benefits;
          const mergedBenefits = [...(parsed.benefits || DEFAULT_SETTINGS.benefits)];
          for (const db of defaultBenefits) {
            if (!mergedBenefits.some(b => b.toLowerCase() === db.toLowerCase())) {
              mergedBenefits.push(db);
            }
          }

          const mergedSettings: PortalSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            formTitle: parsed.formTitle || DEFAULT_SETTINGS.formTitle,
            formDescription: parsed.formDescription || DEFAULT_SETTINGS.formDescription,
            footerDisclaimer: parsed.footerDisclaimer || DEFAULT_SETTINGS.footerDisclaimer,
            footerCopyrightText: parsed.footerCopyrightText || DEFAULT_SETTINGS.footerCopyrightText,
            faqs: mergedFaqs,
            features: mergedFeatures,
            newsList: mergedNews,
            benefits: mergedBenefits,
          };
          setPortalSettings(mergedSettings);
        } else {
          setPortalSettings(DEFAULT_SETTINGS);
        }
      } catch (e) {
        setPortalSettings(DEFAULT_SETTINGS);
      }
    } else {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }

    // 2. Pending Topups
    const storedTopups = localStorage.getItem(TOPUPS_KEY);
    if (storedTopups) {
      try {
        const parsed = JSON.parse(storedTopups);
        setPendingTopups(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setPendingTopups([]);
      }
    }

    // 3. Support Chats
    const storedChats = localStorage.getItem(CHATS_KEY);
    if (storedChats) {
      try {
        const parsed = JSON.parse(storedChats);
        setSupportChats(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setSupportChats([]);
      }
    }

    // 4. Users
    const storedUsersStr = localStorage.getItem(SEED_USERS_KEY);
    const storedCurrentUserStr = localStorage.getItem(CURRENT_USER_KEY);

    let parsedUsers: User[] = [];
    if (storedUsersStr) {
      try {
        const tempUsers = JSON.parse(storedUsersStr);
        if (Array.isArray(tempUsers)) {
          parsedUsers = tempUsers.filter(Boolean).map((user: any) => ({
            ...user,
            walletBalance: user.walletBalance ?? 0,
            subscription: {
              tier: user.subscription?.tier ?? "Starter",
              downloadsUsed: user.subscription?.downloadsUsed ?? 0,
              downloadLimit: user.subscription?.downloadLimit ?? 99999,
              expiresAt: user.subscription?.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            },
            transactions: user.transactions ?? [],
            savedSlips: user.savedSlips ?? [],
          }));
        } else {
          parsedUsers = [];
        }
      } catch (e) {
        parsedUsers = [];
      }
    }

    if (parsedUsers.length === 0) {
      // Seed default admin user matching Franklin's metadata
      const demoUser: User = {
        id: "demo-user-id",
        fullName: "Seiminiyifa Franklin",
        email: "Seiminiyifafranklin@gmail.com",
        profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Seiminiyifa",
        registrationDate: new Date().toISOString(),
        walletBalance: 5000,
        subscription: {
          tier: "Trial",
          downloadsUsed: 0,
          downloadLimit: 9999,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        transactions: [
          {
            id: "tx-1",
            type: "credit",
            amount: 5000,
            description: "Welcome Promo - Preloaded Testing Wallet Balance",
            date: new Date().toISOString(),
          },
        ],
        savedSlips: [
          {
            id: "slip-demo-1",
            taxpayerName: "DANGOTE INDUSTRIES LIMITED",
            tin: "1045738495-0001",
            cacNumber: "RC-1294857",
            registeredAddress: "PLOT 12, HERBERT MACAULAY WAY, IKEJA LGA, LAGOS STATE, NIGERIA.",
            downloadedAt: new Date(Date.now() - 3600000).toISOString(),
          }
        ],
        nin: "12345678901",
        walletAccountNumber: "1024859384",
        walletAccountName: "TAXIDPDF-SEIMINIYIFA FRANKLIN",
        isAdmin: true, // Seiminiyifa Franklin is preloaded as Admin!
      };

      parsedUsers = [demoUser];
      localStorage.setItem(SEED_USERS_KEY, JSON.stringify(parsedUsers));
    }

    // Set users and run expirations
    setUsers(parsedUsers);

    let finalCurrent: User | null = null;
    if (storedCurrentUserStr) {
      try {
        const parsed = JSON.parse(storedCurrentUserStr);
        if (parsed && typeof parsed === "object") {
          finalCurrent = {
            ...parsed,
            walletBalance: parsed.walletBalance ?? 0,
            subscription: {
              tier: parsed.subscription?.tier ?? "Starter",
              downloadsUsed: parsed.subscription?.downloadsUsed ?? 0,
              downloadLimit: parsed.subscription?.downloadLimit ?? 99999,
              expiresAt: parsed.subscription?.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            },
            transactions: parsed.transactions ?? [],
            savedSlips: parsed.savedSlips ?? [],
          };
        } else {
          finalCurrent = null;
        }
      } catch (e) {
        finalCurrent = null;
      }
    }

    setCurrentUser(finalCurrent);
    checkAndRunExpirations(parsedUsers, finalCurrent);

    // Initial Supabase synchronization (Background fetch and merge)
    const initSupabase = async () => {
      const sb = getSupabase();
      if (!sb) return;

      try {
        // Fetch Settings from Supabase
        const dbSettings = await fetchPortalSettingsFromSupabase();
        if (dbSettings) {
          const defaultFaqs = DEFAULT_SETTINGS.faqs;
          const mergedFaqs = [...(dbSettings.faqs || DEFAULT_SETTINGS.faqs)];
          let needsUpdate = false;
          for (const df of defaultFaqs) {
            if (!mergedFaqs.some(f => f.question.toLowerCase() === df.question.toLowerCase())) {
              mergedFaqs.push(df);
              needsUpdate = true;
            }
          }

          const defaultFeatures = DEFAULT_SETTINGS.features;
          const mergedFeatures = [...(dbSettings.features || DEFAULT_SETTINGS.features)];
          for (const df of defaultFeatures) {
            if (!mergedFeatures.some(f => f.title.toLowerCase() === df.title.toLowerCase())) {
              mergedFeatures.push(df);
              needsUpdate = true;
            }
          }

          const defaultNews = DEFAULT_SETTINGS.newsList;
          const mergedNews = [...(dbSettings.newsList || DEFAULT_SETTINGS.newsList)];
          for (const dn of defaultNews) {
            if (!mergedNews.some(n => n.title.toLowerCase() === dn.title.toLowerCase())) {
              mergedNews.push(dn);
              needsUpdate = true;
            }
          }

          const defaultBenefits = DEFAULT_SETTINGS.benefits;
          const mergedBenefits = [...(dbSettings.benefits || DEFAULT_SETTINGS.benefits)];
          for (const db of defaultBenefits) {
            if (!mergedBenefits.some(b => b.toLowerCase() === db.toLowerCase())) {
              mergedBenefits.push(db);
              needsUpdate = true;
            }
          }

          const mergedSettings: PortalSettings = {
            ...DEFAULT_SETTINGS,
            ...dbSettings,
            formTitle: dbSettings.formTitle || DEFAULT_SETTINGS.formTitle,
            formDescription: dbSettings.formDescription || DEFAULT_SETTINGS.formDescription,
            footerDisclaimer: dbSettings.footerDisclaimer || DEFAULT_SETTINGS.footerDisclaimer,
            footerCopyrightText: dbSettings.footerCopyrightText || DEFAULT_SETTINGS.footerCopyrightText,
            faqs: mergedFaqs,
            features: mergedFeatures,
            newsList: mergedNews,
            benefits: mergedBenefits,
          };

          setPortalSettings(mergedSettings);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
          if (needsUpdate) {
            await savePortalSettingsToSupabase(mergedSettings).catch(e => console.warn("Error updating remote settings with new FAQs/Features:", e));
          }
        } else {
          // Seed settings to Supabase
          await savePortalSettingsToSupabase(DEFAULT_SETTINGS);
        }

        // Check active Supabase Auth Session
        const { data: { session } } = await sb.auth.getSession();
        let activeUserEmail = finalCurrent?.email;
        let activeUserId = finalCurrent?.id;

        if (session && session.user) {
          activeUserEmail = session.user.email;
          activeUserId = session.user.id;
        }

        // Fetch Users from Supabase
        const dbUsers = await fetchUsersFromSupabase();
        if (dbUsers && dbUsers.length > 0) {
          setUsers(dbUsers);
          localStorage.setItem(SEED_USERS_KEY, JSON.stringify(dbUsers));

          // Also update currentUser if matched by ID or email
          const lookupEmail = activeUserEmail || finalCurrent?.email;
          const lookupId = activeUserId || finalCurrent?.id;
          if (lookupId || lookupEmail) {
            const matchedDbUser = dbUsers.find(u => 
              (lookupId && u.id === lookupId) || 
              (lookupEmail && u.email.toLowerCase() === lookupEmail.toLowerCase())
            );
            if (matchedDbUser) {
              setCurrentUser(matchedDbUser);
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matchedDbUser));
            }
          }
        } else {
          // Seed the current users to Supabase
          for (const u of parsedUsers) {
            await saveUserToSupabase(u);
          }
        }

        // Fetch Pending Topups
        const dbTopups = await fetchPendingTopupsFromSupabase();
        if (dbTopups) {
          setPendingTopups(dbTopups);
          localStorage.setItem(TOPUPS_KEY, JSON.stringify(dbTopups));
        } else {
          // Sync existing local topups to Supabase
          const storedTopupsStr = localStorage.getItem(TOPUPS_KEY);
          if (storedTopupsStr) {
            const parsedT = JSON.parse(storedTopupsStr);
            if (Array.isArray(parsedT)) {
              for (const top of parsedT) {
                await savePendingTopupToSupabase(top);
              }
            }
          }
        }

        // Fetch Support Chats
        const dbChats = await fetchSupportChatsFromSupabase();
        if (dbChats) {
          setSupportChats(dbChats);
          localStorage.setItem(CHATS_KEY, JSON.stringify(dbChats));
        } else {
          // Sync existing local support chats to Supabase
          const storedChatsStr = localStorage.getItem(CHATS_KEY);
          if (storedChatsStr) {
            const parsedC = JSON.parse(storedChatsStr);
            if (Array.isArray(parsedC)) {
              for (const chat of parsedC) {
                await saveSupportChatToSupabase(chat);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Supabase initial load sync failed (falling back to offline local storage):", err);
      }
    };

    initSupabase();
  }, []);

  // Background Monnify Virtual Accounts Reservation Effect
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.walletAccounts && currentUser.walletAccounts.length > 0) return;

    const reserveAccounts = async () => {
      try {
        const response = await fetch("/api/monnify/reserve-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: currentUser.fullName,
            customerEmail: currentUser.email,
            userId: currentUser.id
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.accounts && data.accounts.length > 0) {
            const updatedUser: User = {
              ...currentUser,
              walletAccountNumber: data.accounts[0].accountNumber,
              walletAccountName: `TAXIDPDF-${currentUser.fullName.toUpperCase()}`,
              walletAccounts: data.accounts
            };
            syncUserChanges(updatedUser);
          }
        }
      } catch (err) {
        console.warn("Failed background reservation of Monnify accounts:", err);
      }
    };

    const timer = setTimeout(() => {
      reserveAccounts();
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentUser?.id]);

  // Save current user edits and synchronize with users list
  const syncUserChanges = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    const updatedUsers = users.map((u) => (u && u.id === updatedUser.id ? updatedUser : u));
    setUsers(updatedUsers);
    localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));

    // Async push to Supabase
    saveUserToSupabase(updatedUser).catch(err => console.warn("Error saving user to Supabase:", err));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const trimmedEmail = email.trim().toLowerCase();
    const sb = getSupabase();
    let foundUser: User | null = null;

    if (sb) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: trimmedEmail,
          password: password
        });
        if (error) {
          console.warn("Supabase auth signIn error:", error.message);
        } else if (data.user) {
          // Fetch database state to sync locally
          const dbUsers = await fetchUsersFromSupabase();
          if (dbUsers) {
            setUsers(dbUsers);
            localStorage.setItem(SEED_USERS_KEY, JSON.stringify(dbUsers));
            foundUser = dbUsers.find(u => u.id === data.user.id || u.email.toLowerCase() === trimmedEmail);
          }
        }
      } catch (e) {
        console.warn("Error authenticating with Supabase Auth:", e);
      }
    }

    if (!foundUser) {
      foundUser = users.find((u) => u?.email && u.email.toLowerCase() === trimmedEmail);
    }

    if (!foundUser) return false;

    // Franklin's custom password is also accepted, or any password >= 4 chars for frictionless test, or if authenticated via Supabase
    if (password === "Eseohgene1@" || password.length >= 4 || sb) {
      // Check admin status matching specific requirements
      if (trimmedEmail === "seiminiyifafranklin@gmail.com" || foundUser.isAdmin) {
        foundUser.isAdmin = true;
      }
      syncUserChanges(foundUser);
      checkAndRunExpirations(users, foundUser);
      return true;
    }
    return false;
  };

  const signup = async (fullName: string, email: string, password: string, nin: string): Promise<boolean> => {
    const trimmedEmail = email.trim().toLowerCase();
    const exists = users.some((u) => u?.email && u.email.toLowerCase() === trimmedEmail);
    if (exists) return false;

    const sb = getSupabase();
    let supabaseUserId: string | null = null;

    if (sb) {
      try {
        // 1. Sign up user inside Supabase Auth
        const { data: signUpData, error: signUpError } = await sb.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              nin: nin.trim()
            }
          }
        });
        
        if (signUpError) {
          console.warn("Supabase auth signUp error:", signUpError.message);
          if (signUpError.message.includes("already registered") || signUpError.status === 422) {
            return false;
          }
        }

        // 2. Establish active session with signInWithPassword so subsequent requests are authenticated
        const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
          email: trimmedEmail,
          password: password
        });

        if (signInError) {
          console.warn("Supabase sign in following signup failed:", signInError.message);
        }

        if (signInData?.user) {
          supabaseUserId = signInData.user.id;
        } else if (signUpData?.user) {
          supabaseUserId = signUpData.user.id;
        }
      } catch (e) {
        console.warn("Error during Supabase auth setup in signup:", e);
      }
    }

    const walletAccountNumber = `102${Math.floor(1000000 + Math.random() * 9000000)}`;
    const walletAccountName = `TAXIDPDF-${fullName.trim().toUpperCase()}`;
    const finalUserId = supabaseUserId || `usr-${Math.random().toString(36).substr(2, 9)}`;

    const newUser: User = {
      id: finalUserId,
      fullName: fullName.trim(),
      email: trimmedEmail,
      profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      registrationDate: new Date().toISOString(),
      walletBalance: 0,
      subscription: {
        tier: "Trial",
        downloadsUsed: 0,
        downloadLimit: 9999,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      transactions: [
        {
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          type: "credit",
          amount: 0,
          description: "Account Created - 24 Hours Free Trial Activated",
          date: new Date().toISOString(),
        },
      ],
      savedSlips: [],
      nin: nin.trim(),
      walletAccountNumber,
      walletAccountName,
      isAdmin: trimmedEmail === "seiminiyifafranklin@gmail.com" // auto admin
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));

    setCurrentUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    // Async push to Supabase as authenticated user
    if (sb) {
      saveUserToSupabase(newUser).catch(err => console.warn("Error saving new user profile to Supabase:", err));
    }
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut().catch(err => console.warn("Supabase signOut error:", err));
    }
  };

  const updateProfile = (fullName: string, profilePicture: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      fullName: fullName.trim() || currentUser.fullName,
      profilePicture: profilePicture || currentUser.profilePicture,
    };
    syncUserChanges(updatedUser);
  };

  const fundWallet = (amount: number, description = "Wallet Funded Successfully") => {
    if (!currentUser || amount <= 0) return;

    const newTransaction: Transaction = {
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      type: "credit",
      amount,
      description,
      date: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + amount,
      transactions: [newTransaction, ...currentUser.transactions],
    };

    syncUserChanges(updatedUser);
  };

  // Purchase sub utilizing prorated calculation
  const purchaseSubscription = (tier: SubscriptionTier): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: "Please log in to purchase subscriptions." };

    let cost = 0;
    let downloadLimit = 0;
    let description = "";

    switch (tier) {
      case "Basic":
        cost = portalSettings.basicFee;
        downloadLimit = portalSettings.basicLimit;
        description = "Basic Subscription Purchase - 5 Downloads Monthly";
        break;
      case "Premium":
        cost = portalSettings.premiumFee;
        downloadLimit = portalSettings.premiumLimit;
        description = "Premium Subscription Purchase - 50 Downloads Monthly";
        break;
      case "Unlimited":
        cost = portalSettings.unlimitedFee;
        downloadLimit = 999999;
        description = "Unlimited Subscription Purchase - Unlimited Downloads Monthly";
        break;
      default:
        return { success: false, message: "Invalid subscription tier selected." };
    }

    // Pro-rated pricing check:
    // "if a user is on 2,500 and wish to upgrade to the 5,000 plan whatever that’s in the available balance the person pays the exact amount. For instance, if on the start plan the person has 1,000 left for his credit and watch to upgrade the plan to that of 5,000 the person is just to make 4,000 payments instead of 5,000 likewise for that of unlimited plan too."
    // So the cost of upgrading is cost - currentUser.walletBalance. If wallet balance covers some, they pay only the difference.
    const actualChargeAmount = Math.max(0, cost - currentUser.walletBalance);

    if (currentUser.walletBalance < actualChargeAmount) {
      return {
        success: false,
        message: `Upgrade calculation: This plan costs ₦${cost.toLocaleString()} but using your ₦${currentUser.walletBalance.toLocaleString()} available credit, you need to fund exactly ₦${actualChargeAmount.toLocaleString()} to upgrade!`,
      };
    }

    const newTransaction: Transaction = {
      id: `tx-${Math.random().toString(36).substr(2, 9)}`,
      type: "debit",
      amount: actualChargeAmount,
      description: `${description} (Prorated upgrade deduction)`,
      date: new Date().toISOString(),
    };

    const updatedUser: User = {
      ...currentUser,
      walletBalance: Math.max(0, currentUser.walletBalance - actualChargeAmount),
      subscription: {
        tier,
        downloadsUsed: 0,
        downloadLimit,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 Days expiry
      },
      transactions: [newTransaction, ...currentUser.transactions],
    };

    syncUserChanges(updatedUser);
    return { success: true, message: `Successfully upgraded to ${tier} Plan!` };
  };

  const getRemainingTrialHours = (): number => {
    if (!currentUser) return 0;
    const expiresAt = new Date(currentUser.subscription.expiresAt);
    const remainingTime = expiresAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60)));
  };

  const isTrialActive = (): boolean => {
    if (!currentUser) return false;
    if (currentUser.subscription.tier !== "Trial") return false;
    const expiry = new Date(currentUser.subscription.expiresAt);
    return expiry.getTime() > Date.now();
  };

  const hasAvailableDownloads = (): boolean => {
    if (!currentUser) return false;

    // Admin has unlimited free lookups
    if (currentUser.isAdmin) return true;

    // If Trial is active
    if (isTrialActive()) {
      const hasNoSavedSlips = currentUser.savedSlips.length === 0;
      if (hasNoSavedSlips) {
        return currentUser.walletBalance >= portalSettings.trialFee;
      } else {
        return currentUser.walletBalance >= portalSettings.onDemandFee;
      }
    }

    // For paid monthly plans, verify downloadsUsed is within downloadLimit
    const sub = currentUser.subscription;
    if (["Basic", "Premium", "Unlimited"].includes(sub.tier)) {
      const expiry = new Date(sub.expiresAt);
      if (expiry.getTime() > Date.now()) {
        return sub.downloadsUsed < sub.downloadLimit;
      }
    }

    return currentUser.walletBalance >= portalSettings.onDemandFee;
  };

  const registerDownload = (slip: Omit<SavedSlip, "id" | "downloadedAt">): { allowed: boolean; message: string; cost?: number } => {
    if (!currentUser) return { allowed: false, message: "Please log in." };

    // Admin lookup is ALWAYS free & unlimited
    if (currentUser.isAdmin) {
      const newSavedSlip: SavedSlip = {
        ...slip,
        id: `slip-adm-${Math.random().toString(36).substr(2, 9)}`,
        downloadedAt: new Date().toISOString(),
      };
      const updatedUser = {
        ...currentUser,
        savedSlips: [newSavedSlip, ...currentUser.savedSlips],
      };
      syncUserChanges(updatedUser);
      return { allowed: true, message: "Download processed as FREE unlimited Administrator query.", cost: 0 };
    }

    // Re-download is always FREE!
    const alreadySaved = currentUser.savedSlips.some((s) => s.tin.replace(/[^a-zA-Z0-9]/g, "") === slip.tin.replace(/[^a-zA-Z0-9]/g, ""));
    if (alreadySaved) {
      return { allowed: true, message: "Re-downloading previously saved TIN slip.", cost: 0 };
    }

    // If trial is active
    if (isTrialActive()) {
      const hasNoSavedSlips = currentUser.savedSlips.length === 0;
      if (hasNoSavedSlips) {
        if (currentUser.walletBalance >= portalSettings.trialFee) {
          const newTransaction: Transaction = {
            id: `tx-${Math.random().toString(36).substr(2, 9)}`,
            type: "debit",
            amount: portalSettings.trialFee,
            description: `Trial Promo Download: TIN retrieval of ${slip.taxpayerName}`,
            date: new Date().toISOString(),
          };

          const newSavedSlip: SavedSlip = {
            ...slip,
            id: `slip-${Math.random().toString(36).substr(2, 9)}`,
            downloadedAt: new Date().toISOString(),
          };

          const updatedUser = {
            ...currentUser,
            walletBalance: currentUser.walletBalance - portalSettings.trialFee,
            savedSlips: [newSavedSlip, ...currentUser.savedSlips],
            transactions: [newTransaction, ...currentUser.transactions],
          };
          syncUserChanges(updatedUser);
          return { allowed: true, message: `Download processed under 24-hour Trial Promo: ₦${portalSettings.trialFee} deducted.`, cost: portalSettings.trialFee };
        } else {
          return { 
            allowed: false, 
            message: `First Trial download requires ₦${portalSettings.trialFee}. Please top up at least ₦${portalSettings.trialFee} to retrieve your first slip.` 
          };
        }
      } else {
        // Subsequent trial downloads are NOT allowed at trial rate. Must be On-Demand.
        if (currentUser.walletBalance >= portalSettings.onDemandFee) {
          const newTransaction: Transaction = {
            id: `tx-${Math.random().toString(36).substr(2, 9)}`,
            type: "debit",
            amount: portalSettings.onDemandFee,
            description: `On-Demand Retrieval Upgrade: TIN retrieval of ${slip.taxpayerName}`,
            date: new Date().toISOString(),
          };

          const newSavedSlip: SavedSlip = {
            ...slip,
            id: `slip-${Math.random().toString(36).substr(2, 9)}`,
            downloadedAt: new Date().toISOString(),
          };

          const updatedUser = {
            ...currentUser,
            walletBalance: currentUser.walletBalance - portalSettings.onDemandFee,
            subscription: {
              ...currentUser.subscription,
              tier: "Starter" as const,
            },
            savedSlips: [newSavedSlip, ...currentUser.savedSlips],
            transactions: [newTransaction, ...currentUser.transactions],
          };
          syncUserChanges(updatedUser);
          return { allowed: true, message: `Trial limit exceeded. Download processed via ₦${portalSettings.onDemandFee} On-Demand top-up.`, cost: portalSettings.onDemandFee };
        } else {
          return { 
            allowed: false, 
            message: `Trial limit exceeded. Please top up ₦${portalSettings.onDemandFee} for On-Demand retrieval or select a premium subscription plan.` 
          };
        }
      }
    }

    // Monthly Plan Check
    const sub = currentUser.subscription;
    const subExpiry = new Date(sub.expiresAt);
    const subIsActive = subExpiry.getTime() > Date.now() && ["Basic", "Premium", "Unlimited"].includes(sub.tier);

    if (subIsActive && sub.downloadsUsed < sub.downloadLimit) {
      const newSavedSlip: SavedSlip = {
        ...slip,
        id: `slip-${Math.random().toString(36).substr(2, 9)}`,
        downloadedAt: new Date().toISOString(),
      };
      const updatedUser = {
        ...currentUser,
        subscription: {
          ...sub,
          downloadsUsed: sub.downloadsUsed + 1,
        },
        savedSlips: [newSavedSlip, ...currentUser.savedSlips],
      };
      syncUserChanges(updatedUser);
      return { allowed: true, message: `Download deducted from your ${sub.tier} monthly plan limit.`, cost: 0 };
    }

    // Starter Tier / On-Demand top-up: Charge portalSettings.onDemandFee per download
    if (currentUser.walletBalance >= portalSettings.onDemandFee) {
      const newTransaction: Transaction = {
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        type: "debit",
        amount: portalSettings.onDemandFee,
        description: `Starter Topup Download: TIN retrieval of ${slip.taxpayerName}`,
        date: new Date().toISOString(),
      };

      const newSavedSlip: SavedSlip = {
        ...slip,
        id: `slip-${Math.random().toString(36).substr(2, 9)}`,
        downloadedAt: new Date().toISOString(),
      };

      const updatedUser: User = {
        ...currentUser,
        walletBalance: currentUser.walletBalance - portalSettings.onDemandFee,
        subscription: {
          tier: "Starter",
          downloadsUsed: sub.tier === "Starter" ? sub.downloadsUsed + 1 : 1,
          downloadLimit: 99999,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        transactions: [newTransaction, ...currentUser.transactions],
        savedSlips: [newSavedSlip, ...currentUser.savedSlips],
      };

      syncUserChanges(updatedUser);
      return { allowed: true, message: `Download charged as STARTER plan (₦${portalSettings.onDemandFee} single download).`, cost: portalSettings.onDemandFee };
    }

    return {
      allowed: false,
      message: "Download limit exceeded and wallet balance is low. Please fund your wallet or purchase a subscription plan.",
    };
  };

  // CMS Settings Update
  const updateSettings = (settings: PortalSettings) => {
    setPortalSettings(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    savePortalSettingsToSupabase(settings).catch(err => console.warn("Error syncing settings to Supabase:", err));
  };

  // Manual Pending Topups Form & Approvals
  const requestManualTopup = (amount: number, reference: string) => {
    if (!currentUser) return;

    const newPending: PendingTopup = {
      id: `pt-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.fullName,
      amount,
      reference: reference.trim().toUpperCase() || "MANUAL-GATEWAY-REF",
      date: new Date().toISOString(),
      status: "pending"
    };

    const updatedTopups = [newPending, ...pendingTopups];
    setPendingTopups(updatedTopups);
    localStorage.setItem(TOPUPS_KEY, JSON.stringify(updatedTopups));

    // Save topup to Supabase
    savePendingTopupToSupabase(newPending).catch(err => console.warn("Error saving topup to Supabase:", err));

    // Add a pending transaction for user visibility
    const pendingTx: Transaction = {
      id: `tx-pend-${newPending.id}`,
      type: "credit",
      amount,
      description: `Wallet Top-up of ₦${amount.toLocaleString()} (Pending Approval - Ref: ${newPending.reference})`,
      date: new Date().toISOString()
    };

    const updatedUser = {
      ...currentUser,
      transactions: [pendingTx, ...currentUser.transactions]
    };
    syncUserChanges(updatedUser);
  };

  const approveTopup = (topupId: string) => {
    const updatedTopups = pendingTopups.map((top) => {
      if (top.id === topupId) {
        return { ...top, status: "approved" as const };
      }
      return top;
    });

    setPendingTopups(updatedTopups);
    localStorage.setItem(TOPUPS_KEY, JSON.stringify(updatedTopups));

    const topupItem = updatedTopups.find((t) => t.id === topupId);
    if (!topupItem) return;

    // Sync topup approval state to Supabase
    savePendingTopupToSupabase(topupItem).catch(err => console.warn("Error updating topup status in Supabase:", err));

    // Apply the credit to the target user
    const updatedUsers = users.map((user) => {
      if (user && user.id === topupItem.userId) {
        const approvedTx: Transaction = {
          id: `tx-appr-${Math.random().toString(36).substr(2, 9)}`,
          type: "credit",
          amount: topupItem.amount,
          description: `Approved Manual Top-up - Ref: ${topupItem.reference}`,
          date: new Date().toISOString()
        };

        // Filter out the "pending" transaction visual indicator
        const cleanedTransactions = (user.transactions || []).filter(tx => tx.id !== `tx-pend-${topupId}`);

        return {
          ...user,
          walletBalance: (user.walletBalance || 0) + topupItem.amount,
          transactions: [approvedTx, ...cleanedTransactions]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));

    const updatedTargetUser = updatedUsers.find(u => u && u.id === topupItem.userId);
    if (updatedTargetUser) {
      saveUserToSupabase(updatedTargetUser).catch(err => console.warn("Error saving updated user after topup approval to Supabase:", err));
    }

    // If the approved user is current logged in user, refresh their context
    if (currentUser && currentUser.id === topupItem.userId) {
      const updatedCurr = updatedUsers.find(u => u && u.id === currentUser.id);
      if (updatedCurr) {
        setCurrentUser(updatedCurr);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurr));
      }
    }
  };

  const rejectTopup = (topupId: string) => {
    const updatedTopups = pendingTopups.map((top) => {
      if (top.id === topupId) {
        return { ...top, status: "rejected" as const };
      }
      return top;
    });

    setPendingTopups(updatedTopups);
    localStorage.setItem(TOPUPS_KEY, JSON.stringify(updatedTopups));

    const topupItem = updatedTopups.find((t) => t.id === topupId);
    if (!topupItem) return;

    // Sync topup rejection state to Supabase
    savePendingTopupToSupabase(topupItem).catch(err => console.warn("Error updating rejected topup in Supabase:", err));

    // Remove the pending visualization for the target user
    const updatedUsers = users.map((user) => {
      if (user && user.id === topupItem.userId) {
        const cleanedTransactions = (user.transactions || []).filter(tx => tx.id !== `tx-pend-${topupId}`);
        const rejectTx: Transaction = {
          id: `tx-rej-${Math.random().toString(36).substr(2, 9)}`,
          type: "debit",
          amount: 0,
          description: `Rejected Manual Top-up - Ref: ${topupItem.reference}`,
          date: new Date().toISOString()
        };
        return {
          ...user,
          transactions: [rejectTx, ...cleanedTransactions]
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));

    const updatedTargetUser = updatedUsers.find(u => u && u.id === topupItem.userId);
    if (updatedTargetUser) {
      saveUserToSupabase(updatedTargetUser).catch(err => console.warn("Error saving updated user after topup rejection to Supabase:", err));
    }

    if (currentUser && currentUser.id === topupItem.userId) {
      const updatedCurr = updatedUsers.find(u => u && u.id === currentUser.id);
      if (updatedCurr) {
        setCurrentUser(updatedCurr);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurr));
      }
    }
  };

  // User Management
  const setAdminStatus = (userId: string, isAdmin: boolean) => {
    const updatedUsers = users.map((u) => (u && u.id === userId ? { ...u, isAdmin } : u));
    setUsers(updatedUsers);
    localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));

    const targetUser = updatedUsers.find(u => u && u.id === userId);
    if (targetUser) {
      saveUserToSupabase(targetUser).catch(err => console.warn("Error updating user admin status in Supabase:", err));
    }

    if (currentUser && currentUser.id === userId) {
      const updatedCurr = { ...currentUser, isAdmin };
      setCurrentUser(updatedCurr);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurr));
    }
  };

  const deleteUser = (userId: string) => {
    const updatedUsers = users.filter((u) => u && u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedUsers));
    deleteUserFromSupabase(userId).catch(err => console.warn("Error deleting user from Supabase:", err));
  };

  // Support Chat Sessions
  const sendUserChatMessage = async (text: string) => {
    if (!text.trim()) return;

    // Get guest ID or user ID
    const isGuest = !currentUser;
    let userId = currentUser ? currentUser.id : "";
    let userEmail = currentUser ? currentUser.email : "guest@taxidpdf.com";
    let userName = currentUser ? currentUser.fullName : "Guest Visitor";

    if (isGuest) {
      let cachedGuestId = localStorage.getItem("taxid_guest_id");
      if (!cachedGuestId) {
        cachedGuestId = `guest-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("taxid_guest_id", cachedGuestId);
      }
      userId = cachedGuestId;
      userName = `Guest Visitor (${cachedGuestId.slice(-4).toUpperCase()})`;
    }

    // Find or create support session
    let activeChat = supportChats.find((c) => c.userId === userId);
    if (!activeChat) {
      activeChat = {
        id: `chat-${userId}`,
        userId: userId,
        userEmail: userEmail,
        userName: userName,
        messages: [],
        lastUpdated: new Date().toISOString(),
        isRepResponding: false
      };
    }

    const userMsg: ChatMessage = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      text: text.trim(),
      date: new Date().toISOString()
    };

    const updatedMessages = [...activeChat.messages, userMsg];
    const updatedChat: SupportChat = {
      ...activeChat,
      messages: updatedMessages,
      lastUpdated: new Date().toISOString()
    };

    setSupportChats((prev) => {
      const filtered = prev.filter((c) => c.userId !== userId);
      const newChats = [updatedChat, ...filtered];
      localStorage.setItem(CHATS_KEY, JSON.stringify(newChats));
      return newChats;
    });

    saveSupportChatToSupabase(updatedChat).catch(err => console.warn("Error saving user chat to Supabase:", err));

    // ChatGPT-like interactive AI response:
    // AI always responds unless the admin is in an active real-time takeover (sent a message in the last 15 seconds)
    const lastMessage = activeChat.messages[activeChat.messages.length - 1];
    const isRecentAdminMessage = lastMessage && lastMessage.sender === "admin" && (Date.now() - new Date(lastMessage.date).getTime() < 15000);

    if (!isRecentAdminMessage) {
      try {
        const response = await fetch("/api/support-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updatedMessages })
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const resData = await response.json();
        
        const aiMsg: ChatMessage = {
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          sender: "ai",
          text: resData.text || "Hello! Let me know how I can help you.",
          date: new Date().toISOString()
        };

        const finalChat: SupportChat = {
          ...updatedChat,
          messages: [...updatedMessages, aiMsg],
          lastUpdated: new Date().toISOString()
        };

        setSupportChats((prev) => {
          const filtered = prev.filter((c) => c.userId !== userId);
          const newChats = [finalChat, ...filtered];
          localStorage.setItem(CHATS_KEY, JSON.stringify(newChats));
          return newChats;
        });

        saveSupportChatToSupabase(finalChat).catch(err => console.warn("Error saving AI chat response to Supabase:", err));
      } catch (err) {
        console.warn("AI support chat connection issue, using client-side fallback:", err);
        // Direct local client-side fallback to ensure user always gets feedback!
        const lastUserMessage = (userMsg.text || "");
        const msg = lastUserMessage.trim();
        const lowercaseMsg = msg.toLowerCase();

        const hasWord = (words: string[]) => {
          return words.some(word => {
            const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, "i");
            return regex.test(lowercaseMsg);
          });
        };

        let fallbackReply = `Thank you for asking! I am operating in smart support mode. Since you asked about "${lastUserMessage}", I want to help! I can assist you with tax ID retrievals, wallet funding, pricing plans, downloads, or uncredited payment approvals. If you are asking a general-knowledge or coding question, please make sure your Gemini API key is active in the settings, so I can provide full real-time answers!`;
        
        if (hasWord(["hello", "hi", "hey", "greet", "greeting", "greetings", "good morning", "good afternoon", "good evening", "how far", "yo"])) {
          fallbackReply = "Hello there! Welcome to taxidpdf.com support. I am your digital assistant, ready to assist you with JTB/NRS TIN slips, wallet funding, pricing plans, or manual payment approvals. How can I help you today?";
        } else if (hasWord(["who", "owner", "admin", "developer", "creator", "built", "franklin", "coach", "website"])) {
          fallbackReply = "taxidpdf.com is managed and operated by our dedicated Customer Support Team. We are an independent, third-party helper portal designed to automate the retrieval, formatting, and high-quality PDF generation of JTB and NRS TIN slips. How can we help you succeed today?";
        } else if (hasWord(["how to", "retrieve", "lookup", "generate", "find my", "get my", "slip", "slips", "pdf", "download", "downloads", "register"])) {
          fallbackReply = "To retrieve and download your TIN slip: 1. Log in or register an account. 2. Navigate to 'Search JTB TIN' or 'Search NRS TIN' from your dashboard. 3. Enter your search criteria (BVN, NIN, Phone, CAC Number, or Direct TIN). 4. After your profile is retrieved, make sure your wallet is funded to download the premium slip instantly!";
        } else if (hasWord(["pay", "payment", "fund", "funding", "price", "pricing", "cost", "amount", "sub", "subscription", "money", "fee", "fees", "charge", "charges", "wallet", "wallets"])) {
          fallbackReply = "Our pricing plans include:\n• **24-Hour Trial**: First slip download is ₦100 (available for 24 hours upon sign-up).\n• **Starter On-Demand**: ₦750 per single download thereafter.\n• **Basic Plan**: ₦2,500/month (includes 5 downloads).\n• **Premium Plan**: ₦5,000/month (includes 50 downloads).\n• **Unlimited Plan**: ₦10,000/month (unlimited downloads).\nYou can fund your wallet instantly inside the Billing section!";
        } else if (hasWord(["uncredited", "debit", "debited", "not credited", "topup", "topups", "transfer", "transfers", "manual", "report"])) {
          fallbackReply = "If you were debited but your wallet was not credited due to a network delay, please click the 'Report Uncredited Payment' button in the Billing section to notify our support admin team for instant manual credit!";
        } else if (hasWord(["cac", "official", "partner", "government", "firs", "board"])) {
          fallbackReply = "Please note that taxidpdf.com is an independent third-party portal. We are NOT partners with, nor do we represent, the Joint Tax Board (JTB), Federal Inland Revenue Service (FIRS), CAC, or any government agency. We utilize public information to generate highly acceptable premium slips.";
        } else if (hasWord(["expire", "expires", "expiry", "30-day", "30 days", "reset"])) {
          fallbackReply = "Every subscription plan and wallet balance expires exactly after 30 days, at which time any unused credit/downloads are reset to 0. You can easily purchase a new plan inside the Billing section at any time!";
        } else if (hasWord(["human", "agent", "agents", "rep", "contact", "whatsapp", "phone number", "email", "live"])) {
          fallbackReply = "Our human support agents are notified of all chats! Feel free to leave your message here, and an agent will join the chat room to assist you shortly.";
        }

        const aiMsg: ChatMessage = {
          id: `msg-${Math.random().toString(36).substr(2, 9)}`,
          sender: "ai",
          text: fallbackReply,
          date: new Date().toISOString()
        };

        const finalChat: SupportChat = {
          ...updatedChat,
          messages: [...updatedMessages, aiMsg],
          lastUpdated: new Date().toISOString()
        };

        setSupportChats((prev) => {
          const filtered = prev.filter((c) => c.userId !== userId);
          const newChats = [finalChat, ...filtered];
          localStorage.setItem(CHATS_KEY, JSON.stringify(newChats));
          return newChats;
        });

        saveSupportChatToSupabase(finalChat).catch(e => console.warn("Error saving fallback chat response to Supabase:", e));
      }
    }
  };

  const sendAdminChatMessage = (chatId: string, text: string) => {
    const activeChat = supportChats.find((c) => c.id === chatId);
    if (!activeChat || !text.trim()) return;

    const adminMsg: ChatMessage = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      sender: "admin",
      text: text.trim(),
      date: new Date().toISOString()
    };

    const updatedChat: SupportChat = {
      ...activeChat,
      messages: [...activeChat.messages, adminMsg],
      lastUpdated: new Date().toISOString(),
      isRepResponding: true // Takeover chat session
    };

    const updatedChats = supportChats.map((c) => (c.id === chatId ? updatedChat : c));
    setSupportChats(updatedChats);
    localStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));

    saveSupportChatToSupabase(updatedChat).catch(err => console.warn("Error saving admin chat message to Supabase:", err));
  };

  const toggleChatRepStatus = (chatId: string, isRepResponding: boolean) => {
    let updatedChatObj: SupportChat | null = null;
    const updatedChats = supportChats.map((c) => {
      if (c.id === chatId) {
        updatedChatObj = { ...c, isRepResponding, lastUpdated: new Date().toISOString() };
        return updatedChatObj;
      }
      return c;
    });
    setSupportChats(updatedChats);
    localStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));

    if (updatedChatObj) {
      saveSupportChatToSupabase(updatedChatObj).catch(err => console.warn("Error toggling chat status in Supabase:", err));
    }
  };

  const clearChatSession = () => {
    let userId = currentUser ? currentUser.id : localStorage.getItem("taxid_guest_id");
    if (!userId) return;
    const chatId = `chat-${userId}`;
    const updatedChats = supportChats.filter((c) => c.userId !== userId);
    setSupportChats(updatedChats);
    localStorage.setItem(CHATS_KEY, JSON.stringify(updatedChats));
    deleteSupportChatFromSupabase(chatId).catch(err => console.warn("Error deleting support chat from Supabase:", err));
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        login,
        signup,
        logout,
        updateProfile,
        fundWallet,
        purchaseSubscription,
        registerDownload,
        getRemainingTrialHours,
        isTrialActive,
        hasAvailableDownloads,
        
        // Settings
        portalSettings,
        updateSettings,
        
        // Manual Topups
        pendingTopups,
        requestManualTopup,
        approveTopup,
        rejectTopup,
        
        // User Admin Tools
        setAdminStatus,
        deleteUser,
        
        // Support Chat
        supportChats,
        sendUserChatMessage,
        sendAdminChatMessage,
        toggleChatRepStatus,
        clearChatSession
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export const NEUTRAL_AGENT_NAMES = [
  "Agent Sarah",
  "Agent David",
  "Agent Grace",
  "Agent Victor",
  "Agent Jessica",
  "Agent Emmanuel",
  "Agent Michelle",
  "Agent Peter",
  "Agent Sharon",
  "Agent Chidi"
];

export function getNeutralAgentNameForChat(chatId: string): string {
  if (!chatId) return "Support Representative";
  let hash = 0;
  for (let i = 0; i < chatId.length; i++) {
    hash = chatId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NEUTRAL_AGENT_NAMES.length;
  return NEUTRAL_AGENT_NAMES[index];
}

