import { NextRequest } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

// Track if Python backend is available (check once, cache result)
let pythonAvailable: boolean | null = null;
let lastPythonCheck = 0;

async function isPythonRunning(): Promise<boolean> {
  const now = Date.now();
  // Cache check for 10 seconds
  if (pythonAvailable !== null && now - lastPythonCheck < 10000) {
    return pythonAvailable;
  }
  try {
    const res = await fetch(`${FASTAPI_URL}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    pythonAvailable = res.ok;
    lastPythonCheck = now;
    return pythonAvailable;
  } catch {
    pythonAvailable = false;
    lastPythonCheck = now;
    return false;
  }
}

// ─── Smart Knowledge Base with Pattern Matching ─────────────────

type QAPair = {
  patterns: RegExp[];
  answer: string;
};

const QA_DATABASE: QAPair[] = [
  // Greetings
  {
    patterns: [/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|greetings|sup|yo)/i],
    answer: `Hello! 👋 I'm the Sanitation Co-Governance AI Assistant.\n\nI can help you with:\n• Platform features and overview\n• Complaint statuses and reporting\n• Escalation and SLA policies\n• Community verification\n• Ward information and SERI scores\n\nWhat would you like to know?`,
  },
  // How are you
  {
    patterns: [/how are you|how('s| is) it going|what('s| is) up/i],
    answer: `I'm doing great, thanks for asking! 😊\n\nI'm here to help you with the Sanitation Co-Governance Platform. Ask me anything about complaints, statuses, escalation, or the platform itself!`,
  },
  // What is this platform
  {
    patterns: [/what (is|does) (this|the) (platform|system|app|website|project)/i, /about (this|the) platform/i, /tell me about (this|the) platform/i, /describe (this|the) platform/i, /overview/i],
    answer: `The **Sanitation Co-Governance Platform** is a citizen-focused digital platform for reporting, tracking, and collaboratively verifying sanitation-related complaints.\n\n🎯 **Key Features:**\n• Complaint submission with photo & GPS\n• Real-time status tracking\n• Automatic escalation after 30 days SLA\n• Community verification of resolved complaints\n• Citizen satisfaction ratings\n• SERI monitoring per ward\n• Analytics with charts\n• CSV, Excel, PDF report exports\n\n🌍 Supports **SDG 6** (Clean Water and Sanitation)`,
  },
  // Platform purpose
  {
    patterns: [/purpose|why (was|is) (this|it) (built|created|made|developed)/i, /what is the (goal|aim|objective)/i],
    answer: `The platform aims to:\n\n✅ Improve citizen participation in sanitation governance\n✅ Make complaints easier to report\n✅ Improve transparency in complaint handling\n✅ Help administrators monitor sanitation issues\n✅ Enable citizens to track complaint progress\n✅ Support community-based verification\n✅ Improve accountability in sanitation service delivery`,
  },
  // SDG
  {
    patterns: [/sdg|sustainable development/i],
    answer: `The platform supports **SDG 6 (Clean Water and Sanitation)** by:\n\n• Promoting digital citizen participation\n• Enabling better management of sanitation issues\n• Allowing citizens to report and track sanitation problems\n• Supporting community verification of resolved issues\n\nThis directly contributes to improving sanitation governance at the local level.`,
  },
  // Complaint statuses
  {
    patterns: [/complaint status|statuses|status.*complaint/i, /what are the.*status/i, /types of status/i],
    answer: `A complaint can have 4 statuses:\n\n🟡 **Pending** - Submitted but not yet actively processed\n🔵 **In Progress** - Currently being investigated or addressed\n🟢 **Resolved** - Issue has been addressed and marked as resolved\n🔴 **Escalated** - Exceeded the 30-day SLA threshold, needs urgent attention`,
  },
  // Pending
  {
    patterns: [/\bpending\b.*mean|what.*\bpending\b|explain.*\bpending\b/i],
    answer: `**Pending** means the complaint has been submitted by a citizen but has not yet been actively processed by the administration.\n\nThis is the initial status when a complaint is first created. It will move to "In Progress" when an administrator starts working on it.`,
  },
  // In Progress
  {
    patterns: [/\bin progress\b|in-progress/i],
    answer: `**In Progress** means the complaint is currently being investigated or addressed by the relevant department.\n\nAdministrators update complaints to this status when they start working on resolving the reported sanitation issue.`,
  },
  // Resolved
  {
    patterns: [/\bresolved\b.*mean|what.*\bresolved\b|explain.*\bresolved\b/i],
    answer: `**Resolved** means the reported sanitation issue has been addressed and marked as resolved by the administration.\n\nAfter resolution:\n• Citizens can provide satisfaction ratings (1-5 stars)\n• Community members can verify the work quality\n• If verification score is below 2.5, the complaint gets reopened`,
  },
  // Escalated
  {
    patterns: [/\escalat/i],
    answer: `**Escalated** means the complaint has exceeded the defined SLA threshold (30 days) and requires additional attention.\n\n⚡ **Automatic Escalation:**\n• Pending and In Progress complaints are checked every 60 seconds\n• If a complaint remains unresolved beyond 30 days, it's automatically escalated\n• Escalated complaints are flagged on the admin dashboard for urgent action`,
  },
  // SLA
  {
    patterns: [/sla|service.level|threshold|30\s*days/i],
    answer: `**SLA (Service Level Agreement) Threshold: 30 days**\n\n📋 How it works:\n• All complaints have a 30-day resolution target\n• The system checks every 60 seconds for overdue complaints\n• Any Pending/In Progress complaint older than 30 days is auto-escalated\n• Escalated complaints appear with a red alert on the admin dashboard`,
  },
  // Community verification
  {
    patterns: [/community verification|verify|verification.*complaint/i],
    answer: `**Community Verification** ensures resolved work was properly completed.\n\n✅ **How it works:**\n• Citizens can score resolved complaints (1-5)\n• If score < 2.5 → complaint is REOPENED (moved back to In Progress)\n• If score ≥ 2.5 → verification passes\n\nThis creates a feedback loop ensuring accountability and work quality.`,
  },
  // Citizen satisfaction
  {
    patterns: [/satisfaction|rate|rating|feedback|stars/i],
    answer: `**Citizen Satisfaction Rating** (1-5 stars)\n\n⭐ After a complaint is resolved, citizens can rate their satisfaction:\n• 1-2 stars: Poor experience\n• 3 stars: Average experience\n• 4-5 stars: Great experience\n\nRatings help measure the quality of sanitation service delivery and are factored into the SERI score.`,
  },
  // How to report
  {
    patterns: [/how.*report|submit.*complaint|file.*complaint|create.*complaint|new complaint|reporting a/i],
    answer: `📝 **How to Report a Complaint:**\n\n1. Register/Login as a Citizen\n2. Go to your Dashboard\n3. Select your **Ward**\n4. Choose the **Complaint Type**\n5. Describe the issue in detail\n6. Optionally upload a **Photo**\n7. Optionally capture **GPS Location**\n8. Click **Submit**\n\nYou'll get a unique ID (like CMP-001) and can track the status anytime!`,
  },
  // Complaint types
  {
    patterns: [/complaint type|types of complaint|what can i report|kinds of complaint/i],
    answer: `📋 **Supported Complaint Types:**\n\n• 🗑️ Illegal Dumping\n• 🚛 Missed Collection\n• 🗃️ Overflowing Bins\n• 🧹 Street Sweeping\n• ☣️ Hazardous Waste\n• 🚰 Drain Blockage\n• 🚻 Public Toilet Maintenance\n• 🐛 Pest Control`,
  },
  // Complaint fields
  {
    patterns: [/what information|what.*provide|what.*submit|fields|details.*complaint/i],
    answer: `When submitting a complaint, citizens provide:\n\n• **Ward** (which area)\n• **Complaint Type** (category)\n• **Description** (detailed explanation)\n• **Photo** (optional - visual evidence)\n• **GPS Location** (optional - coordinates)\n\nEach complaint gets a unique ID, reporting date, and citizen who created it.`,
  },
  // Ward
  {
    patterns: [/ward|wards|which ward|areas|localities/i],
    answer: `🏘️ **8 Wards in the System:**\n\n1. Ward 1 - Central\n2. Ward 2 - Northside\n3. Ward 3 - Eastgate\n4. Ward 4 - Southpark\n5. Ward 5 - Westfield\n6. Ward 6 - Hilltop\n7. Ward 7 - Riverside\n8. Ward 8 - Industrial\n\nEach ward is monitored independently with its own SERI score.`,
  },
  // SERI
  {
    patterns: [/seri|sanitation equity|risk index/i],
    answer: `**SERI = Sanitation Equity & Risk Index** (0-100)\n\n📊 Calculated per ward based on:\n• **Recurrence rate** (20%) - How often complaints repeat\n• **Resolution time** (20%) - Average days to resolve\n• **Satisfaction** (25%) - Citizen rating average\n• **Fairness** (15%) - Proportional distribution\n• **Verification** (20%) - Community verification scores\n\n🟢 Good: 70-100\n🟡 Moderate: 40-69\n🔴 High Risk: 0-39`,
  },
  // Users / Roles
  {
    patterns: [/user|role|who.*use|citizen.*admin|administrator/i],
    answer: `👥 **Two User Roles:**\n\n**1. Citizen:**\n• Register and login\n• Submit complaints\n• Track complaint status\n• Rate satisfaction (1-5)\n• Verify resolved complaints\n\n**2. Administrator:**\n• View all complaints\n• Update complaint statuses\n• Monitor escalation\n• Access analytics & reports\n• Export data (CSV/Excel/PDF)`,
  },
  // Admin features
  {
    patterns: [/admin|administrator.*can|admin.*feature|admin.*dashboard/i],
    answer: `🛡️ **Administrator Features:**\n\n• View and manage all complaints\n• Update complaint statuses\n• Monitor SERI scores per ward\n• Governance risk alerts (30d+ unresolved)\n• Recurrence detection\n• Silent zone detection\n• Analytics with charts\n• Export CSV, Excel, PDF reports\n• Community verification monitoring`,
  },
  // Citizen features
  {
    patterns: [/citizen.*can|citizen.*feature|citizen.*dashboard/i],
    answer: `👤 **Citizen Features:**\n\n• Register and login\n• Submit complaints with photos & GPS\n• Track complaint status in real-time\n• View complaint history\n• Rate satisfaction (1-5 stars)\n• Verify resolved complaints (1-5 score)\n• View ward transparency scores\n• Access the AI chatbot for help`,
  },
  // Features
  {
    patterns: [/features|what.*can.*do|capabilities|functions/i],
    answer: `🚀 **Platform Features:**\n\n📋 Complaint Management\n• Submit with photo & GPS\n• Real-time status tracking\n• Auto-escalation after 30 days\n\n✅ Community Verification\n• Score resolved complaints\n• Auto-reopen if quality is low\n\n📊 Analytics\n• SERI scores per ward\n• Charts and trends\n• Recurrence detection\n• Silent zone alerts\n\n📥 Reports\n• CSV, Excel, PDF exports\n• Ward governance reports\n\n🤖 AI Chatbot\n• Answer platform questions\n• Look up complaint details`,
  },
  // Complaint lookup
  {
    patterns: [/cmp[-\s]?\d+/i],
    answer: `🔍 **Complaint Lookup**\n\nTo look up a specific complaint, please check the Complaints section in your dashboard. You can filter by:\n• Status (Pending/In Progress/Resolved/Escalated)\n• Ward\n• User\n\nFor AI-powered complaint lookup with detailed analysis, the Python backend server provides the full agent capabilities.`,
  },
  // How are you / general chat
  {
    patterns: [/how are you|what's up|how do you do/i],
    answer: `I'm doing well, thank you! 😊\n\nI'm here to help you navigate the Sanitation Co-Governance Platform. Whether you have questions about complaints, statuses, verification, or anything else — I've got you covered!\n\nWhat would you like to know?`,
  },
  // Thank you
  {
    patterns: [/thank|thanks|thx|appreciate/i],
    answer: `You're welcome! 😊\n\nIf you have any more questions about the platform, feel free to ask anytime. Happy to help!`,
  },
  // Help
  {
    patterns: [/\bhelp\b|what can you do|your capabilities|commands/i],
    answer: `🤖 **I can help you with:**\n\n🏠 **Platform** - Overview, features, purpose, SDG 6\n📋 **Complaints** - Reporting, types, statuses, tracking\n⬆️ **Escalation** - SLA thresholds, auto-escalation\n✅ **Verification** - Community verification process\n⭐ **Satisfaction** - Rating system\n🏘️ **Wards** - Available wards\n📊 **SERI** - Sanitation Equity & Risk Index\n👥 **Roles** - Citizen vs Administrator features\n\nJust ask anything related to these topics!`,
  },
];

function findAnswer(message: string): string | null {
  const q = message.trim();

  // Check each QA pair
  for (const qa of QA_DATABASE) {
    for (const pattern of qa.patterns) {
      if (pattern.test(q)) {
        return qa.answer;
      }
    }
  }

  return null;
}

// ─── GET (Health Check) ────────────────────────────────────────
export async function GET() {
  const pythonOk = await isPythonRunning();
  return Response.json({
    status: "ok",
    service: "sanitation-ai-chatbot",
    mode: pythonOk ? "full-ai" : "knowledge-base",
    llm: pythonOk ? "available" : "standalone",
  });
}

// ─── POST (Chat) ───────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, complaints } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check knowledge base FIRST (instant)
    const kbAnswer = findAnswer(message);
    if (kbAnswer) {
      const sseBody = [
        `data: ${JSON.stringify({ type: "token", content: kbAnswer })}`,
        `data: ${JSON.stringify({ type: "done" })}`,
      ].join("\n\n");
      return new Response(sseBody + "\n\n", {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Knowledge base didn't match — try Python AI backend
    const pythonOk = await isPythonRunning();
    if (pythonOk) {
      try {
        const streamResponse = await fetch(`${FASTAPI_URL}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, complaints }),
          signal: AbortSignal.timeout(60000),
        });

        if (streamResponse.ok && streamResponse.body) {
          return new Response(streamResponse.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }
      } catch {
        // Python failed, fall through to default
      }
    }

    // Default: no match, no AI
    const fallback = `I'm not sure how to answer that. I can help with:\n\n• **Platform** - "What is this platform?"\n• **Complaints** - "How to report a complaint?"\n• **Statuses** - "What are complaint statuses?"\n• **Escalation** - "What is escalation?"\n• **Verification** - "What is community verification?"\n• **Wards** - "What wards are available?"\n• **SERI** - "What is SERI?"\n• **Help** - "What can you do?"\n\nTry asking about any of these!`;

    const sseBody = [
      `data: ${JSON.stringify({ type: "token", content: fallback })}`,
      `data: ${JSON.stringify({ type: "done" })}`,
    ].join("\n\n");

    return new Response(sseBody + "\n\n", {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch {
    const sseBody = [
      `data: ${JSON.stringify({ type: "error", content: "Something went wrong. Please try again." })}`,
      `data: ${JSON.stringify({ type: "done" })}`,
    ].join("\n\n");
    return new Response(sseBody + "\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
