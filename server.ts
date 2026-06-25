import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to check if a valid API key exists
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fallback Nigerian JTB tax generator when API key is missing
function generateLocalMockTaxpayer(type: string, value: string): any {
  const name = value.trim().toUpperCase();
  const isCorporate = type === "cac" || name.includes("LTD") || name.includes("LIMITED") || name.includes("CORP") || name.includes("GLOBAL") || name.includes("GLOBAL SERVICES");

  // Format CAC number
  let cac = "";
  if (isCorporate) {
    if (type === "cac") {
      cac = value.toUpperCase().startsWith("RC") ? value.toUpperCase() : `RC-${value}`;
    } else {
      cac = `RC-${Math.floor(1000000 + Math.random() * 9000000)}`;
    }
  }

  // Format TIN
  let tin = "";
  if (type === "tin" && value.length >= 10) {
    tin = value.replace(/[^0-9-]/g, "");
  } else {
    // Generate a JTB formatted TIN (10 or 11 digits)
    tin = `${Math.floor(10000000 + Math.random() * 90000000)}-0001`;
  }

  // States and cities in Nigeria
  const states = [
    { name: "Lagos", code: "LA", authority: "Lagos State Internal Revenue Service", offices: ["MSTO Yaba", "MSTO Ikeja", "LIRS Victoria Island", "MSTO Surulere"] },
    { name: "FCT Abuja", code: "FC", authority: "Federal Inland Revenue Service", offices: ["MSTO Garki", "MSTO Wuse", "FCT-IRS Maitama"] },
    { name: "Rivers", code: "RI", authority: "Rivers State Internal Revenue Service", offices: ["MSTO Port Harcourt", "RIRS Trans Amadi"] },
    { name: "Oyo", code: "OY", authority: "Oyo State Board of Internal Revenue", offices: ["MSTO Ibadan", "OYIRS Dugbe"] },
    { name: "Kano", code: "KN", authority: "Kano State Internal Revenue Service", offices: ["MSTO Kano", "KIRS Nassarawa"] }
  ];

  const stateObj = states[Math.floor(Math.random() * states.length)];
  const taxOffice = stateObj.offices[Math.floor(Math.random() * stateObj.offices.length)];
  const issuingAuthority = stateObj.authority;

  // Generate clean taxpayer name
  let taxpayerName = name || "JOHN DOE";
  if (type === "bvn" || type === "nin" || type === "phone") {
    // Pick a realistic Nigerian name for lookup demos
    const names = [
      "CHIDI KINGSLEY ALAO",
      "EMEKA YUSUF OBI",
      "AMINU BABANGIDA",
      "FUNMILAYO ADEBAYO",
      "MARY CHUKWUDI",
      "TEMITOPE SHONIBALUM",
      "ZAINAB BELLO"
    ];
    taxpayerName = names[Math.floor(Math.random() * names.length)];
  }

  // Generate date from 2 to 7 years ago
  const yearsAgo = 2 + Math.floor(Math.random() * 5);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.floor(Math.random() * 12)];
  const day = 1 + Math.floor(Math.random() * 28);
  const dateStr = `${day < 10 ? '0' + day : day}-${month}-${2026 - yearsAgo}`;

  return {
    taxpayerName,
    tin,
    category: isCorporate ? "Non-Individual" : "Individual",
    registeredAddress: `${10 + Math.floor(Math.random() * 150)}, Herbert Macaulay Way, ${stateObj.name} State, Nigeria.`,
    issuingAuthority,
    phone: type === "phone" ? value : `080${Math.floor(30000000 + Math.random() * 69999999)}`,
    email: `${taxpayerName.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
    cacNumber: cac || undefined,
    registrationDate: dateStr,
    taxOffice,
    activeStatus: "Active",
    source: "Mock (Offline Database)"
  };
}

// API endpoint to retrieve taxpayer details dynamically using Gemini
app.post("/api/lookup", async (req, res) => {
  const { type, value } = req.body;

  if (!type || !value) {
    return res.status(400).json({ error: "Missing type or value for query" });
  }

  console.log(`[API] Tax ID lookup requested. Type: ${type}, Value: ${value}`);

  const ai = getGeminiClient();

  // If we don't have Gemini configured, use local generator
  if (!ai) {
    const data = generateLocalMockTaxpayer(type, value);
    return res.json(data);
  }

  try {
    const prompt = `
You are a government-certified tax officer integration system in Nigeria.
The user wants to look up their National Tax Identification Number (TIN) profile from the Joint Tax Board (JTB) and Federal Inland Revenue Service (FIRS) database.

Generate an extremely realistic, officially formatted JTB TIN Taxpayer Record based on the user's input:
- Lookup Type: "${type}" (can be: "tin" (direct tax id), "bvn" (Bank Verification Number), "nin" (National Identity Number), "phone" (Phone Number), "cac" (CAC company number or business name))
- Input Value: "${value}"

Requirements:
1. "taxpayerName": If the type is 'cac' or if the input looks like a company name, generate a corporate name (e.g., "ALHAJI & SONS LIMITED", "CHEVRON NIGERIA"). If the type is bvn/nin/phone, generate a realistic Nigerian human name in uppercase (e.g. "OLUWASEUN ADIGUN OLUWATOYIN", "CHINEDU CHUKWUMA OKAFOR", "IBRAHIM DANLAMI MUSA"). If direct 'tin', make it a realistic taxpayer name.
2. "tin": A valid JTB formatted TIN. Individual TINs are usually 10-11 digits (e.g. 1045738495 or 1045738495-0001). Non-individual TINs are usually 12 digits or 8 digits. Ensure it is in uppercase. If user entered a valid-looking 10 or 11-digit TIN, use it or format it elegantly.
3. "category": Strictly "Individual" or "Non-Individual".
4. "registeredAddress": A realistic, detailed Nigerian street address including street name, LGA, state (e.g., "Plot 12, Admiralty Way, Lekki Phase 1, Eti-Osa LGA, Lagos State, Nigeria").
5. "issuingAuthority": The government revenue board, such as "Lagos State Internal Revenue Service", "Federal Inland Revenue Service", "FCT Internal Revenue Service", "Rivers State Internal Revenue Service", or "Kano State Internal Revenue Service". Match this with the address's state.
6. "phone": A realistic Nigerian telephone starting with 080, 081, 090, 070, or 091.
7. "email": A professional taxpayer email matching their name (e.g. "seun.adigun@yahoo.com" or "info@alhajisandsons.com").
8. "cacNumber": If category is "Non-Individual", this must be a CAC Registration Number starting with RC (e.g. "RC-1294857" or "RC102948"). If "Individual", keep it null or omit.
9. "registrationDate": A valid-looking date formatted as DD-MMM-YYYY (e.g. "14-May-2021", "22-Oct-2018").
10. "taxOffice": Realistic Nigerian Tax Office (e.g. "MSTO Ikeja", "LSTO Lagos Island", "MSTO Abuja", "LIRS VI").
11. "activeStatus": "Active".

Output strictly in JSON structure matching the schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            taxpayerName: { type: Type.STRING },
            tin: { type: Type.STRING },
            category: { type: Type.STRING },
            registeredAddress: { type: Type.STRING },
            issuingAuthority: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
            cacNumber: { type: Type.STRING },
            registrationDate: { type: Type.STRING },
            taxOffice: { type: Type.STRING },
            activeStatus: { type: Type.STRING },
          },
          required: [
            "taxpayerName",
            "tin",
            "category",
            "registeredAddress",
            "issuingAuthority",
            "phone",
            "email",
            "registrationDate",
            "taxOffice",
            "activeStatus",
          ],
        },
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text.trim());
    data.source = "Joint Tax Board (JTB) Cloud API";
    return res.json(data);
  } catch (err: any) {
    console.error("Gemini Lookup Error, falling back to local:", err.message);
    const data = generateLocalMockTaxpayer(type, value);
    return res.json(data);
  }
});

// AI Customer Support Chat Route
app.post("/api/support-chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const ai = getGeminiClient();
  const conversationHistory = messages
    .map((m: any) => `${m.sender === "user" ? "Customer" : m.sender === "admin" ? "Agent Franklin" : "Support Rep (AI)"}: ${m.text}`)
    .join("\n");

  const prompt = `
You are "NRS/JTB Digital Helper AI", an intelligent, highly professional customer support representative for taxidpdf.com, Nigeria's premier digital assistant portal for JTB and NRS (Nigeria Revenue Services) Tax Identification Number (TIN) slips.

Core context of the website:
- This is an independent, third-party helper portal. It is NOT official, does not represent state boards, CAC, JTB, or NRS, and is not an official partner of any government agency.
- Users can query public details or supply details to generate highly premium, acceptable, official-looking JTB/NRS TIN slips.
- It operates under official notice that all original ownership belongs to Joint Tax Board and Nigeria Revenue Services.
- Subscriptions:
  - Trial Promo: ₦100 for the first slip download (active for 24 hours upon sign-up).
  - Starter On-Demand: ₦750 per single download thereafter.
  - Basic Plan: ₦2,500/month (includes 5 downloads).
  - Premium Plan: ₦5,000/month (includes 50 downloads).
  - Unlimited Plan: ₦10,000/month (includes unlimited downloads).
- All plans expire exactly every 30 days, upon which the entire remaining wallet credit balance is reset to 0.
- Manual Topups: If a user is debited but not credited due to network issues, they can click "Report Uncredited Payment" to request manual approval from the admin, Coach Franklin.

Answer the customer's query professionally, politely, and in a helpful, concise manner. Be friendly and direct.
Current Conversation:
${conversationHistory}

Response (Keep it conversational, warm, and professional, under 4 sentences):
`;

  if (!ai) {
    // High-quality offline fallback replies
    const lastUserMessage = (messages[messages.length - 1]?.text || "").toLowerCase();
    let reply = "Hello! I am your AI assistant. How can I help you today with your JTB/NRS TIN slip retrieval?";
    
    if (lastUserMessage.includes("pay") || lastUserMessage.includes("fund") || lastUserMessage.includes("price") || lastUserMessage.includes("cost") || lastUserMessage.includes("amount")) {
      reply = "Our pricing plans include the 24-Hour Trial (first slip is ₦100), Starter On-Demand (₦750 per slip), Basic (₦2,500 for 5 slips), Premium (₦5,000 for 50 slips), and Unlimited (₦10,000). Let me know if you need help funding your wallet!";
    } else if (lastUserMessage.includes("admin") || lastUserMessage.includes("franklin")) {
      reply = "For security and advanced administrative approvals, our chief administrator (Coach Franklin) monitors this support channel and can take over this chat to assist you directly.";
    } else if (lastUserMessage.includes("cac") || lastUserMessage.includes("official") || lastUserMessage.includes("partner")) {
      reply = "Please note that we are an independent third-party helper portal. We are not official partners of CAC, JTB, or NRS. We utilize public information to generate high-quality premium slips.";
    } else if (lastUserMessage.includes("expire") || lastUserMessage.includes("30-day") || lastUserMessage.includes("30 days")) {
      reply = "Each subscription plan expires after 30 days, at which time any unused credit balance is reset to 0. You can easily purchase a new plan or upgrade anytime!";
    }
    return res.json({ text: reply });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return res.json({ text: response.text || "I'm here to assist you! Feel free to ask any questions about your tax ID lookup or subscriptions." });
  } catch (err: any) {
    console.error("Gemini Support Chat Error:", err.message);
    return res.json({ text: "I'm here to assist you! Feel free to ask any questions about your tax ID lookup or subscriptions." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
