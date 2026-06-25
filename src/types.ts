export interface TaxpayerData {
  taxpayerName: string;
  tin: string;
  category: "Individual" | "Non-Individual";
  registeredAddress: string;
  issuingAuthority: string;
  phone: string;
  email: string;
  cacNumber?: string;
  registrationDate: string;
  taxOffice: string;
  activeStatus: "Active" | "Inactive";
  source?: string;
}

export type LookupType = "tin" | "bvn" | "nin" | "phone" | "cac";

export interface LookupOption {
  id: LookupType;
  label: string;
  placeholder: string;
  description: string;
  validationRegex: RegExp;
  errorMessage: string;
}

export type SubscriptionTier = "Trial" | "Starter" | "Basic" | "Premium" | "Unlimited";

export interface UserSubscription {
  tier: SubscriptionTier;
  downloadsUsed: number;
  downloadLimit: number;
  expiresAt: string; // ISO string
}

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string; // ISO string
}

export interface SavedSlip {
  id: string;
  taxpayerName: string;
  tin: string;
  cacNumber: string;
  registeredAddress: string;
  downloadedAt: string; // ISO string
}

export interface PendingTopup {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  reference: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string; // base64 or placeholder URL
  registrationDate: string; // ISO string
  walletBalance: number; // in Naira
  subscription: UserSubscription;
  transactions: Transaction[];
  savedSlips: SavedSlip[];
  nin?: string;
  walletAccountNumber?: string;
  walletAccountName?: string;
  isAdmin?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FeatureItem {
  title: string;
  desc: string;
}

export interface NewsItem {
  title: string;
  desc: string;
}

export interface PortalSettings {
  trialFee: number;
  onDemandFee: number;
  basicFee: number;
  premiumFee: number;
  unlimitedFee: number;
  basicLimit: number;
  premiumLimit: number;
  landingTitle: string;
  landingDescription: string;
  disclaimerText: string;
  supportEmail: string;
  formTitle: string;
  formDescription: string;
  footerDisclaimer: string;
  footerCopyrightText: string;
  faqs: FAQItem[];
  features: FeatureItem[];
  newsList: NewsItem[];
  benefits: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "admin";
  text: string;
  date: string;
}

export interface SupportChat {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  messages: ChatMessage[];
  lastUpdated: string;
  isRepResponding: boolean;
}
