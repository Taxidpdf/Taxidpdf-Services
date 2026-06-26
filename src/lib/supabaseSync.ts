import { getSupabase } from './supabase';
import { User, Transaction, SavedSlip, PendingTopup, PortalSettings, SupportChat, ChatMessage } from '../types';

/**
 * Deterministically converts any string ID into a valid PostgreSQL UUID.
 * This guarantees we don't violate UUID constraints in Supabase, whilst keeping mapping stable.
 */
function toUUID(str: string): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str;
  }
  // Simple hash to generate a stable hex string
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + ch;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + ch;
    hash2 |= 0;
  }
  const part1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const part2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const part3 = (Math.abs(hash1 + hash2)).toString(16).padStart(8, '0');
  return `${part1.slice(0, 8)}-${part2.slice(0, 4)}-4${part2.slice(4, 7)}-a${part3.slice(0, 3)}-${part3.slice(2, 10).padStart(12, '0')}`;
}

// =========================================================================
// 1. PROFILES & USER SYNC
// =========================================================================

export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) throw pErr;

    const { data: transactions, error: tErr } = await supabase.from('transactions').select('*');
    if (tErr) throw tErr;

    const { data: slips, error: sErr } = await supabase.from('saved_slips').select('*');
    if (sErr) throw sErr;

    return (profiles || []).map(p => {
      const userTransactions: Transaction[] = (transactions || [])
        .filter(t => t.user_id === p.id)
        .map(t => ({
          id: t.id,
          type: t.type as 'credit' | 'debit',
          amount: Number(t.amount),
          description: t.description,
          date: t.date
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const userSlips: SavedSlip[] = (slips || [])
        .filter(s => s.user_id === p.id)
        .map(s => ({
          id: s.id,
          taxpayerName: s.taxpayer_name,
          tin: s.tin,
          cacNumber: s.cac_number,
          registeredAddress: s.registered_address,
          downloadedAt: s.date_created
        }))
        .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());

      return {
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        profilePicture: p.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.full_name)}`,
        registrationDate: p.registration_date,
        walletBalance: Number(p.wallet_balance),
        subscription: {
          tier: p.subscription_tier as any,
          downloadsUsed: p.downloads_used ?? 0,
          downloadLimit: p.download_limit ?? 99999,
          expiresAt: p.subscription_expires_at,
        },
        transactions: userTransactions,
        savedSlips: userSlips,
        nin: p.nin || undefined,
        walletAccountNumber: "102" + p.id.replace(/[^0-9]/g, '').slice(0, 7).padEnd(7, '4'),
        walletAccountName: `TAXIDPDF-${p.full_name.trim().toUpperCase()}`,
        isAdmin: p.is_admin
      };
    });
  } catch (error) {
    console.warn("Error fetching users from Supabase (using local backup):", error);
    return null;
  }
}

export async function saveUserToSupabase(user: User): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const uuid = toUUID(user.id);

  try {
    // 1. Upsert Profile
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: uuid,
      full_name: user.fullName,
      email: user.email,
      profile_picture: user.profilePicture,
      registration_date: user.registrationDate,
      wallet_balance: user.walletBalance,
      nin: user.nin || null,
      is_admin: !!user.isAdmin,
      subscription_tier: user.subscription.tier,
      downloads_used: user.subscription.downloadsUsed,
      download_limit: user.subscription.downloadLimit,
      subscription_expires_at: user.subscription.expiresAt,
      updated_at: new Date().toISOString()
    });
    if (pErr) throw pErr;

    // 2. Sync Transactions
    if (user.transactions && user.transactions.length > 0) {
      const dbTransactions = user.transactions.map(t => ({
        id: toUUID(t.id),
        user_id: uuid,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date
      }));
      const { error: tErr } = await supabase.from('transactions').upsert(dbTransactions);
      if (tErr) throw tErr;
    }

    // 3. Sync Saved Slips
    if (user.savedSlips && user.savedSlips.length > 0) {
      const dbSlips = user.savedSlips.map(s => ({
        id: toUUID(s.id),
        user_id: uuid,
        taxpayer_name: s.taxpayerName,
        tin: s.tin,
        cac_number: s.cacNumber,
        registered_address: s.registeredAddress,
        date_created: s.downloadedAt
      }));
      const { error: sErr } = await supabase.from('saved_slips').upsert(dbSlips);
      if (sErr) throw sErr;
    }
  } catch (error) {
    console.warn("Error saving user to Supabase (using local backup):", error);
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const uuid = toUUID(userId);
    await supabase.from('profiles').delete().eq('id', uuid);
  } catch (error) {
    console.warn("Error deleting user from Supabase (using local backup):", error);
  }
}

// =========================================================================
// 2. PORTAL SETTINGS SYNC
// =========================================================================

export async function fetchPortalSettingsFromSupabase(): Promise<PortalSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('portal_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    return {
      trialFee: Number(data.trial_fee),
      onDemandFee: Number(data.on_demand_fee),
      basicFee: Number(data.basic_fee),
      premiumFee: Number(data.premium_fee),
      unlimitedFee: Number(data.unlimited_fee),
      basicLimit: data.basic_limit,
      premiumLimit: data.premium_limit,
      landingTitle: data.landing_title,
      landingDescription: data.landing_description,
      disclaimerText: data.disclaimer_text,
      supportEmail: data.support_email,
      formTitle: data.form_title,
      formDescription: data.form_description,
      footerDisclaimer: data.footer_disclaimer,
      footerCopyrightText: data.footer_copyright_text,
      faqs: Array.isArray(data.faqs) ? data.faqs.map((f: any) => ({ question: f.q || f.question, answer: f.a || f.answer })) : [],
      features: Array.isArray(data.features) ? data.features.map((f: any) => ({ title: f.title, desc: f.desc })) : [],
      newsList: Array.isArray(data.news_list) ? data.news_list.map((n: any) => ({ title: n.title, desc: n.desc })) : [],
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
    };
  } catch (error) {
    console.warn("Error fetching settings from Supabase (using local backup):", error);
    return null;
  }
}

export async function savePortalSettingsToSupabase(settings: PortalSettings): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const dbFaqs = settings.faqs.map(f => ({ q: f.question, a: f.answer }));
    const dbFeatures = settings.features.map(f => ({ title: f.title, desc: f.desc }));
    const dbNews = settings.newsList.map(n => ({ title: n.title, desc: n.desc }));

    const { error } = await supabase.from('portal_settings').upsert({
      id: 1,
      trial_fee: settings.trialFee,
      on_demand_fee: settings.onDemandFee,
      basic_fee: settings.basicFee,
      premium_fee: settings.premiumFee,
      unlimited_fee: settings.unlimitedFee,
      basic_limit: settings.basicLimit,
      premium_limit: settings.premiumLimit,
      landing_title: settings.landingTitle,
      landing_description: settings.landingDescription,
      disclaimer_text: settings.disclaimerText,
      support_email: settings.supportEmail,
      form_title: settings.formTitle,
      form_description: settings.formDescription,
      footer_disclaimer: settings.footerDisclaimer,
      footer_copyright_text: settings.footerCopyrightText,
      faqs: dbFaqs,
      features: dbFeatures,
      news_list: dbNews,
      benefits: settings.benefits,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  } catch (error) {
    console.warn("Error saving portal settings to Supabase (using local backup):", error);
  }
}

// =========================================================================
// 3. PENDING TOPUPS SYNC
// =========================================================================

export async function fetchPendingTopupsFromSupabase(): Promise<PendingTopup[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('pending_topups').select('*');
    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      userId: t.user_id,
      userEmail: t.user_email,
      userName: t.user_name,
      amount: Number(t.amount),
      reference: t.reference,
      date: t.date,
      status: t.status as 'pending' | 'approved' | 'rejected'
    }));
  } catch (error) {
    console.warn("Error fetching pending topups from Supabase (using local backup):", error);
    return null;
  }
}

export async function savePendingTopupToSupabase(topup: PendingTopup): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('pending_topups').upsert({
      id: toUUID(topup.id),
      user_id: toUUID(topup.userId),
      user_email: topup.userEmail,
      user_name: topup.userName,
      amount: topup.amount,
      reference: topup.reference,
      date: topup.date,
      status: topup.status
    });
    if (error) throw error;
  } catch (error) {
    console.warn("Error saving pending topup to Supabase (using local backup):", error);
  }
}

// =========================================================================
// 4. SUPPORT CHATS & MESSAGES SYNC
// =========================================================================

export async function fetchSupportChatsFromSupabase(): Promise<SupportChat[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: chats, error: cErr } = await supabase.from('support_chats').select('*');
    if (cErr) throw cErr;

    const { data: messages, error: mErr } = await supabase.from('chat_messages').select('*');
    if (mErr) throw mErr;

    return (chats || []).map(c => {
      const chatMessages: ChatMessage[] = (messages || [])
        .filter(m => m.chat_id === c.id)
        .map(m => ({
          id: m.id,
          sender: m.sender as 'user' | 'ai' | 'admin',
          text: m.text,
          date: m.timestamp
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        id: c.id,
        userId: c.user_id,
        userEmail: c.user_email,
        userName: c.user_name,
        messages: chatMessages,
        lastUpdated: c.updated_at,
        isRepResponding: c.is_rep_responding
      };
    });
  } catch (error) {
    console.warn("Error fetching support chats from Supabase (using local backup):", error);
    return null;
  }
}

export async function saveSupportChatToSupabase(chat: SupportChat): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const chatUuid = toUUID(chat.id);

  try {
    // 1. Upsert Support Chat Row
    const { error: cErr } = await supabase.from('support_chats').upsert({
      id: chatUuid,
      user_id: toUUID(chat.userId),
      user_email: chat.userEmail,
      user_name: chat.userName,
      is_rep_responding: !!chat.isRepResponding,
      created_at: chat.messages[0]?.date || new Date().toISOString(),
      updated_at: chat.lastUpdated || new Date().toISOString()
    });
    if (cErr) throw cErr;

    // 2. Upsert Support Chat Messages
    if (chat.messages && chat.messages.length > 0) {
      const dbMessages = chat.messages.map(m => ({
        id: toUUID(m.id),
        chat_id: chatUuid,
        sender: m.sender,
        text: m.text,
        timestamp: m.date
      }));
      const { error: mErr } = await supabase.from('chat_messages').upsert(dbMessages);
      if (mErr) throw mErr;
    }
  } catch (error) {
    console.warn("Error saving support chat to Supabase (using local backup):", error);
  }
}
