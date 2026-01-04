export const prompts = {
  systemIdentity: `You are the AI Real Estate Growth System, a proactive operations partner for top real estate teams. You analyze CRM, marketing, deal, and concierge data to drive revenue, create clarity, and remove friction for agents.

When users ask about properties, listings, homes, or request to see property images, acknowledge their request and mention that you're showing them a property image. Be conversational and helpful.`,

  leadQualification: `You are an elite real estate ISA. Analyze the incoming lead details below and respond with valid JSON describing the qualification outcome.
Lead data:
{{leadData}}

Respond using this JSON schema:
{
  "intent": "buy" | "sell" | "invest",
  "timeline": "immediate" | "1-3 months" | "3-6 months" | "6+ months",
  "budget": string,
  "lead_score": number between 0-100,
  "summary": string,
  "stage": "new" | "engaged" | "nurture" | "client"
}`,

  leadFollowUpMessage: `Craft a concise, high-converting follow-up message for a real estate lead. Use 120 words or fewer. Include a clear CTA and refer to the current stage.

Lead summary: {{summary}}
Stage: {{stage}}
Agent: {{agentName}}`,

  instagramCaption: `Write a luxury real estate Instagram caption. Make it punchy, on-brand, and end with 3 strategic hashtags.

Listing details:
{{details}}`,

  listingVideoScript: `Create a 45-second real estate listing walkthrough script. Include intro hook, three highlight moments, and a closing CTA.

Listing details:
{{details}}`,

  blogPost: `Write a 400-word blog post optimized for high-intent real estate buyers. Include an engaging intro, 3 key sections with subheadings, and a closing invitation to connect.

Listing or topic details:
{{details}}`,

  contractSummary: `You are a transaction coordinator. Analyze the contract excerpt and respond with valid JSON using the schema:
{
  "summary": string,
  "missingSignatures": string[]
}

Contract text:
{{documentText}}`,

  taskListGenerator: `You are a deal desk automation strategist. Based on the following contract summary, respond with valid JSON using the schema:
{
  "tasks": [
    {
      "title": string,
      "owner": string,
      "due_date": string | null,
      "priority": "high" | "medium" | "low"
    }
  ]
}

Contract summary:
{{summary}}`,

  clientUpdate: `Write a warm, proactive client update message. Reference the client name, current stage, and agent. Keep it under 130 words.

Client: {{clientName}}
Stage: {{stage}}
Agent: {{agentName}}`,

  reviewRequest: `Write a friendly review request message to a happy client. Mention the positive experience and provide a clear link placeholder.

Client: {{clientName}}
Agent: {{agentName}}`,

  referralFollowup: `Draft a concise referral follow-up asking the client for introductions. Maintain high-end concierge tone.

Client: {{clientName}}
Agent: {{agentName}}`,

  dailySummary: `You analyze real estate team performance data to produce a morning briefing. Use bullet points, highlight wins, risks, and suggested focus.

Data:
{{data}}`,
} as const;

export const testingFallbacks = {
  leadQualification: {
    intent: "buy",
    timeline: "1-3 months",
    budget: "$900k - $1.1M",
    lead_score: 86,
    summary: "Highly engaged relocation buyer relocating from Seattle, pre-approved and ready to tour modern homes in Austin next month.",
    stage: "engaged",
  },
  leadFollowUpMessage: `Hi there! Appreciate the details you shared—I've shortlisted three West Lake homes that mirror your wish list. Can we schedule a quick 15-minute call tomorrow to review them and lock in your tour window?`,
  marketing: `Experience the pinnacle of Hill Country living at 1188 Monarch Ridge. Floor-to-ceiling glass, a zero-edge pool, and a smart wellness suite create vacation energy every day. DM for private showings. #AustinLuxury #ElevatedLiving #MonarchRidge`,
  contractSummary: {
    summary:
      "Executed residential purchase agreement for 512 Monarch Ln at $1.45M with financing contingencies cleared. Closing is scheduled for March 28 with a 3-day inspection window remaining.",
    tasks: [
      {
        title: "Confirm appraisal delivery",
        owner: "agent",
        due_date: null,
        priority: "high",
      },
      {
        title: "Coordinate final walkthrough",
        owner: "transaction_coordinator",
        due_date: null,
        priority: "medium",
      },
    ],
    missingSignatures: ["Buyer initial on page 7", "Seller signature on addendum B"],
  },
  clientMessage: `Hi Jordan, quick concierge update as we move through inspections. The contractor visit is booked for Thursday at 11am, and lender docs are fully cleared. Let me know if you want me on the walkthrough call.`,
  insights: `• 3 hot leads surfaced overnight—prioritize outreach before noon.
• Deal desk flagged missing signatures on the Monarch Ridge contract.
• Concierge satisfaction sits at 92%; send one review request today.`,
  assistant: `Let's focus on the Monarch Ridge deal. Schedule a concierge check-in with Jordan after the inspection results and prep a social post highlighting the new staging photos.`,
};


