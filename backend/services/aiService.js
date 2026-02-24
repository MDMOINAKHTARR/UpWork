require('dotenv').config();

const SYSTEM_INSTRUCTION = `You are a Master Venture Architect and OSINT Analyst with 20 years of experience advising seed-stage startups, venture capital firms, and accelerators. You combine deep market intelligence, Reddit community analysis, Business Model Canvas frameworks, and investor-grade financial modeling to transform raw startup ideas into actionable, fundable blueprints. You always output valid minified JSON with zero markdown. Every insight is specific, data-driven, and grounded in real market dynamics.`;

async function callGroq(prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 75000); // 75s timeout

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(`Groq API error: ${data.error?.message || response.statusText}`);
    }
    return data.choices[0].message.content;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Groq API timed out after 75 seconds. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractJSON(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
  const trimmed = text.trim();
  return JSON.parse(trimmed.startsWith('{') || trimmed.startsWith('[') ? trimmed : text);
}

async function generateIdeas(domain, skills, experience, targetUsers) {
  const prompt = `You are a Master Venture Architect. A founder has described their profile below. Generate 3 distinct, high-potential startup concepts — each targeting a fundamentally different sub-problem. Avoid generic ideas.

FOUNDER PROFILE:
- Domain/Interest: ${domain}
- Target Audience: ${targetUsers || 'Not specified'}
- Skills: ${skills || 'Not specified'}
- Experience Level: ${experience || 'Beginner'}

REQUIREMENTS FOR EACH IDEA:
- title: A sharp startup name (max 8 words)
- problem: The specific, quantifiable, non-obvious problem (2-3 sentences). Include a number or stat if possible.
- targetUsers: A precise user persona — NOT a broad group (1-2 sentences)
- solution: The core technical or operational mechanism (2-3 sentences)
- tagline: A punchy, memorable one-liner under 10 words

Return ONLY a valid JSON array of exactly 3 objects with these exact keys: title, problem, targetUsers, solution, tagline`;

  try {
    const text = await callGroq(prompt);
    const parsed = extractJSON(text);
    // Groq's response_format:'json_object' always returns an object,
    // never a raw array. Extract the array from whatever key it used.
    if (Array.isArray(parsed)) return parsed;
    // Look for first array value in the returned object (e.g. {ideas:[...]})
    const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
    if (arrayValue) return arrayValue;
    throw new Error('Unexpected response shape from Groq');
  } catch (e) {
    console.error("Groq Error in generateIdeas:", e.message);
    throw new Error("Failed to generate ideas. Please try again.");
  }
}

async function generateStrategicDirections(idea, userElaboration, founderComments) {
  const commentsBlock = founderComments && founderComments.length > 0
    ? `\n\nCRITICAL — FOUNDER'S CORRECTIONS & FEEDBACK (you MUST incorporate ALL of these into every direction):\n${founderComments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}\n\nEvery strategic direction MUST reflect and address the founder's feedback above. Do NOT ignore any of these points.`
    : '';
  const prompt = `You are a Lead Venture Strategist & Multi-Agent Orchestrator with 20 years of incubation experience. A founder has selected a startup idea and provided additional context. Generate THREE distinct "Strategic Directions" for evolving this idea.

SELECTED IDEA:
- Title: ${idea.title}
- Problem: ${idea.problem}
- Solution: ${idea.solution}
- Target Users: ${idea.targetUsers}
- Tagline: ${idea.tagline}

FOUNDER'S ELABORATION:
"${userElaboration || 'No additional context provided.'}"
${commentsBlock}

GENERATE 3 STRATEGIC DIRECTIONS. Each must be fundamentally different in approach:

1. One should be lean/bootstrapped/specialist-focused
2. One should be technology-heavy/AI-powered/platform-play
3. One should be community/network-effect/viral-growth focused

For each direction provide:
- directionName: A catchy name (e.g. "The Lean Specialist", "The AI Powerhouse", "The Community-First Loop")
- corePivot: How this direction differs from a generic version of the idea (2-3 sentences)
- keyStack: A unique technology, framework, or strategy that gives THIS specific version an unfair advantage (1-2 sentences)
- description: A 2-3 sentence investor-ready summary of what this version looks like

Return ONLY valid minified JSON with this exact structure:
{"directions": [{"directionName": "string", "corePivot": "string", "keyStack": "string", "description": "string"}]}`;

  try {
    const text = await callGroq(prompt);
    const parsed = extractJSON(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.directions && Array.isArray(parsed.directions)) return parsed.directions;
    const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
    if (arrayValue) return arrayValue;
    throw new Error('Unexpected response shape from Groq');
  } catch (e) {
    console.error("Groq Error in generateStrategicDirections:", e.message);
    throw new Error("Failed to generate strategic directions. Please try again.");
  }
}

async function analyzeIdeaBusinessBlueprint(idea, skills, timeAvailable, budgetLevel, experienceLevel, strategicDirection, userElaboration) {
  const { getDemandTrend } = require('./trendService');

  let trendContext = '';
  try {
    const keywordPrompt = `Extract exactly ONE highly searchable Google Trends keyword (1-3 words max) that represents the core industry or technology of this startup idea. Return ONLY the keyword, no quotes, no extra text. Idea: ${idea.title} - ${idea.problem}`;
    const keyword = await callGroq(keywordPrompt).then(res => res.trim().replace(/['"]/g, ''));
    const trendData = await getDemandTrend(keyword);

    trendContext = `\n\nGOOGLE TRENDS DEMAND DATA for "${keyword}":\nTrend Direction: ${trendData.trendDirection}\nSummary: ${trendData.summary}\nFactor this real-world demand trend strongly into your Market Readiness score and overall analysis. You must also include this exact trend data in the output JSON under the "demandTrend" key.`;
  } catch (e) {
    console.warn("Could not fetch demand trend context:", e);
  }

  const directionContext = strategicDirection
    ? `\n\nCHOSEN STRATEGIC DIRECTION:\n- Direction: ${strategicDirection.directionName}\n- Core Pivot: ${strategicDirection.corePivot}\n- Key Stack: ${strategicDirection.keyStack}\n- Description: ${strategicDirection.description}\n\nIMPORTANT: The entire analysis MUST be focused through the lens of this chosen strategic direction. Every recommendation, tech choice, competitor analysis, and roadmap must align with this specific strategic approach.`
    : '';
  const elaborationContext = userElaboration
    ? `\n\nFOUNDER'S VISION & ELABORATION:\n"${userElaboration}"\n\nFactor the founder's specific vision, constraints, and preferences into every section of the analysis.`
    : '';
  const prompt = `You are a Master Venture Architect and OSINT Analyst. Subject this startup idea to a rigorous 5-phase Venture Evolution process.${directionContext}${elaborationContext}${trendContext}

USER IDEA: "${idea.title} — ${idea.problem} — ${idea.solution}"
TARGET USERS: ${idea.targetUsers}

BUILDER PROFILE:
- Skills: ${skills || 'Not specified'}
- Time Available: ${timeAvailable || 'Not specified'}
- Budget: ${budgetLevel || 'Not specified'}
- Experience: ${experienceLevel || 'Beginner'}

=== PHASE 1: REDDIT & WEB OSINT SIMULATION ===
Simulate a search across relevant subreddits. Identify:
- redditOsint.subreddits: 3 relevant subreddits (names only, e.g. "r/Startups")
- redditOsint.complaints: 3 specific verbatim-style community complaints about existing solutions (e.g. "Existing apps feel too clinical and don't understand student life")
- redditOsint.sentiment: Overall community sentiment about this problem space

=== PHASE 2: STRATEGIC ANALYSIS ===
- pain: Quantify the problem with a real stat or number
- antidote: The specific technical mechanism solving the pain
- marketGap: White space analysis based on Reddit pain points. Use \\n• bullet format
- usp: The startup's "Unfair Advantage" — what makes it uncopyable (proprietary data, unique integration, Edge-AI, regulatory moat)
- scores: Object with 5 sub-scores (each 0-100 integer) and a rationale:
  - technicalFeasibility: Can this be built with the stated skills, budget, and time? (0=impossible, 100=trivially easy)
  - marketReadiness: Is the market ready? How strong are demand signals? (0=no demand, 100=desperate market)
  - regulatoryRisk: Regulatory/compliance barriers — INVERTED scale (0=heavily regulated, 100=no regulatory barriers)
  - competitiveAdvantage: Strength of moat/USP vs existing competitors (0=no moat, 100=unassailable moat)
  - executionComplexity: MVP shipping complexity — INVERTED scale (0=extremely complex, 100=simple to build)
  - scoreRationale: 2-3 sentences explaining the key factors behind each score. Be specific and honest.
- realityCheck: One brutally honest risk sentence
- scalabilityPath: How does this grow from 100 → 100,000 users? Describe viral loops or B2B expansion

=== PHASE 3: BUSINESS MODEL CANVAS (9 Blocks) ===
- bmc.keyPartners: ["3-4 specific partners (e.g. university health boards, insurance providers)"]
- bmc.keyActivities: ["3 core activities"]
- bmc.keyResources: ["3 core resources"]
- bmc.valueProposition: "Single sentence describing the core value delivered"
- bmc.customerRelationships: ["2-3 relationship types"]
- bmc.channels: ["3 distribution channels"]
- bmc.customerSegments: ["2-3 specific user segments"]
- bmc.revenueStreams: ["2-3 revenue streams with realistic numbers"]
- bmc.costStructure: ["3 major cost items with estimated amounts"]

=== PHASE 4: 12-WEEK EXECUTION BLUEPRINT ===
- roadmap: 3 phases:
  - week "1-4": goal "MVP Build & Compliance" — killerFeature (the one core interaction), tasks array
  - week "5-8": goal "Pilot & Feedback Loop" — targetGroup (specific high-concentration group), tasks array
  - week "9-12": goal "Monetization & Investment Prep" — seedAsk (pre-seed amount needed e.g. "₹1,00,00,000"), kpis (3 specific metrics before raising), tasks array

=== PHASE 5: INVESTOR DOSSIER ===
- pricingTiers: Array of 2-3 tiers. Each: tier (name), price (e.g. "₹4,999/mo"), features (array of 3 features)
- preSeedCapital: { total: "₹X,XXX", breakdown: ["Item — ₹X,XXX", ...] }
- exitStrategy: "Who acquires this in 5 years and why? Name 2-3 specific potential acquirers"

=== COMPETITOR INTELLIGENCE ===
- competitors: 3 real competitors. Each: name, pricing (real pricing), coreFeatures (array of 2-3), breach (specific UX/tech failure to exploit)

=== TECH STACK ===
- techStack: Array of stack choices with brief reasons
- edgeTool: ONE specific named API/library giving a defensible technical edge
- dataStrategy: Proprietary data collected that becomes the long-term moat

Return ONLY valid minified JSON with ALL these exact keys:
{
  "startupName": "string",
  "tagline": "string",
  "summary": "3-sentence investor-ready pitch",
  "demandTrend": {"keyword": "string", "trendDirection": "string", "summary": "string"},
  "pain": "string",
  "antidote": "string",
  "redditOsint": {"subreddits": ["string"], "complaints": ["string"], "sentiment": "string"},
  "marketGap": "string with \\n• bullets",
  "usp": "string",
  "scores": {"technicalFeasibility": integer, "marketReadiness": integer, "regulatoryRisk": integer, "competitiveAdvantage": integer, "executionComplexity": integer, "scoreRationale": "string"},
  "realityCheck": "string",
  "scalabilityPath": "string",
  "competitors": [{"name": "string", "pricing": "string", "coreFeatures": ["string"], "breach": "string"}],
  "bmc": {
    "keyPartners": ["string"], "keyActivities": ["string"], "keyResources": ["string"],
    "valueProposition": "string", "customerRelationships": ["string"], "channels": ["string"],
    "customerSegments": ["string"], "revenueStreams": ["string"], "costStructure": ["string"]
  },
  "pricingTiers": [{"tier": "string", "price": "string", "features": ["string"]}],
  "preSeedCapital": {"total": "string", "breakdown": ["string"]},
  "exitStrategy": "string",
  "roadmap": [
    {"week": "1-4", "goal": "MVP Build & Compliance", "killerFeature": "string", "tasks": ["string"]},
    {"week": "5-8", "goal": "Pilot & Feedback Loop", "targetGroup": "string", "tasks": ["string"]},
    {"week": "9-12", "goal": "Monetization & Investment Prep", "seedAsk": "string", "kpis": ["string"], "tasks": ["string"]}
  ],
  "techStack": ["string"],
  "edgeTool": "string",
  "dataStrategy": "string",
  "monetization": ["string with LTV context"]
}`;

  try {
    const text = await callGroq(prompt);
    return extractJSON(text);
  } catch (e) {
    console.error("Groq Error in analyzeIdeaBusinessBlueprint:", e.message);
    throw new Error("Failed to perform deep analysis. Please try again.");
  }
}

async function expandIdea(idea, userElaboration, budget, previousComments) {
  const commentsContext = previousComments && previousComments.length > 0
    ? `\n\nPREVIOUS FEEDBACK FROM FOUNDER (incorporate ALL of these corrections):\n${previousComments.map((c, i) => `${i + 1}. "${c}"`).join('\n')}\n\nYou MUST address every piece of feedback above. Adjust the expansion accordingly.`
    : '';
  const prompt = `You are a Lead Venture Strategist. A founder has selected a startup idea and provided context. Expand this idea into a detailed, investor-ready concept.

SELECTED IDEA:
- Title: ${idea.title}
- Problem: ${idea.problem}
- Solution: ${idea.solution}
- Target Users: ${idea.targetUsers}
- Tagline: ${idea.tagline}

FOUNDER'S ELABORATION:
"${userElaboration || 'No additional context provided.'}"

BUDGET: ${budget || 'Not specified'}
${commentsContext}

Expand this into a comprehensive startup concept. Return ONLY valid minified JSON with these exact keys:
{
  "expandedTitle": "A refined, market-ready startup name",
  "expandedProblem": "A 3-4 sentence deep-dive into the problem with data/stats",
  "expandedSolution": "A 3-4 sentence detailed solution with technical specifics",
  "expandedTargetUsers": "Precise user personas — 2-3 specific segments with demographics",
  "uniqueAngle": "What makes this fundamentally different from anything else (2 sentences)",
  "revenueModel": "Primary monetization strategy with projected price points aligned to the budget",
  "estimatedBudget": "Breakdown of how the stated budget would be allocated (3-4 items)",
  "coreTechApproach": "The core technical architecture in 2-3 sentences",
  "marketSize": "TAM/SAM/SOM estimate in one sentence",
  "competitiveEdge": "The one thing competitors cannot easily replicate"
}`;

  try {
    const text = await callGroq(prompt);
    return extractJSON(text);
  } catch (e) {
    console.error("Groq Error in expandIdea:", e.message);
    throw new Error("Failed to expand idea. Please try again.");
  }
}

module.exports = { generateIdeas, generateStrategicDirections, expandIdea, analyzeIdeaBusinessBlueprint };
