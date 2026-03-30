import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-flash-latest';
const MAX_RETRIES = 3;
const BASE_DELAY = 1500;
const CALL_TIMEOUT = 30000; // 30 seconds

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────────────────────
//  HYBRID KEY ROTATION: Round-Robin + Failover
//  - Starts from a rotating index (load distribution)
//  - Falls back to next key on any error (reliability)
//  - Exponential backoff between full rotation attempts
// ──────────────────────────────────────────────────────────────
let rotationIndex = 0;

function getApiKeys() {
  const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2].filter(Boolean);
  if (keys.length === 0) {
    throw new Error('Server misconfiguration: No GEMINI_KEY_1 or GEMINI_KEY_2 found in environment.');
  }
  return keys;
}

async function callWithTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function callGemini(prompt) {
  const keys = getApiKeys();
  let lastError = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (let i = 0; i < keys.length; i++) {
      const keyIndex = (rotationIndex + i) % keys.length;
      const apiKey = keys[keyIndex];
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      try {
        const result = await callWithTimeout(
          model.generateContent(prompt),
          CALL_TIMEOUT
        );
        // Advance round-robin pointer only on success
        rotationIndex = (keyIndex + 1) % keys.length;
        return result.response.text();
      } catch (error) {
        lastError = error;
        console.warn(`[Gemini] Key[${keyIndex}] attempt ${attempt + 1} failed: ${error.message}`);
      }
    }

    // All keys failed this attempt — exponential backoff before next attempt
    if (attempt < MAX_RETRIES - 1) {
      const delay = BASE_DELAY * Math.pow(2, attempt);
      console.warn(`[Gemini] All keys failed attempt ${attempt + 1}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error(`All Gemini API keys failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
}

// ──────────────────────────────────────────────────────────────
//  STEP-SPECIFIC REFINEMENT PROMPTS
// ──────────────────────────────────────────────────────────────

export async function refineIdentity(answer) {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `You are a technical writing assistant generating Claude Code memory system files.
Given the following user identity information, generate TWO outputs as JSON:

User Input:
- Name: ${answer.name}
- Role: ${answer.role}
- Company: ${answer.company || 'Independent'}
- Location: ${answer.location || 'Not specified'}
- How they use Claude: ${answer.claudeUsage || 'General coding assistance'}
- Developer level: ${answer.devLevel || 'Intermediate'}
- Bio/About: ${answer.bio || ''}

Generate a JSON response with these exact keys:
{
  "meSection": "The ## Me section for CLAUDE.md (markdown, 5-10 lines, include a link to memory/people/{firstname-lowercase}-context.md)",
  "preferencesBase": "Initial preferences text based on dev level and usage style (3-5 lines)",
  "briefingGreeting": "A personalized initial briefing greeting for briefing.md (2-3 lines, warm tone, referencing their role and work style)",
  "selfContextFile": "Full content for memory/people/{firstname}-context.md with front-matter <!-- verified: ${today} | scope: Self context for {name} | salience: 5.00 | hits: 0 --> and <!-- keywords: --> plus detailed sections about their role, work style, and preferences"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences. No explanation text.`;
  return parseJSON(await callGemini(prompt));
}

export async function refinePeople(answer, existingContext) {
  const today = new Date().toISOString().split('T')[0];
  const peopleList = answer.people.map(p =>
    `- ${p.name}: ${p.role} at ${p.company || 'same company'}. Relationship: ${p.relationship || 'Colleague'}. Notes: ${p.notes || 'N/A'}`
  ).join('\n');

  const prompt = `You are a technical writing assistant for Claude Code memory files.

User context: ${existingContext.name}, ${existingContext.role} at ${existingContext.company}

People to create memory files for:
${peopleList}

Generate a JSON response:
{
  "peopleTable": "Markdown table for CLAUDE.md ## People section with columns: Who | Role | Key Context",
  "relationshipsFile": "Content for memory/assistant/relationships.md with front-matter <!-- verified: ${today} | scope: Relationship map | salience: 2.00 | hits: 0 --> and <!-- keywords: relationships, team, contacts, people --> then sections for each person",
  "personFiles": {
    "{slugified-name}.md": "Full markdown file for each person with front-matter <!-- verified: ${today} | scope: {Name} - {Role} at {Company} | salience: 1.50 | hits: 0 --> and <!-- keywords: {name}, {role keywords} --> then sections: ## Overview, ## Working Style, ## Key Context"
  }
}

For personFiles, generate one entry per person. Slugify names (e.g., "Sarah Chen" to "sarah-chen").
IMPORTANT: Return ONLY valid JSON. No markdown fences.`;
  return parseJSON(await callGemini(prompt));
}

export async function refineProjects(answer, existingContext) {
  const today = new Date().toISOString().split('T')[0];
  const projectList = answer.projects.map(p =>
    `- ${p.name}: ${p.description}. Status: ${p.status || 'Active'}. Tech: ${p.techStack || 'Not specified'}. Goals: ${p.goals || 'Not specified'}`
  ).join('\n');

  const prompt = `You are a technical writing assistant for Claude Code memory files.

User: ${existingContext.name}, ${existingContext.role}

Projects:
${projectList}

Generate JSON:
{
  "projectsTable": "Markdown table for CLAUDE.md ## Active Projects with columns: Name | Status | Tech Stack | Current Focus",
  "projectFiles": {
    "{slugified-name}.md": "Full markdown with front-matter <!-- verified: ${today} | scope: {Project Name} - {description} | salience: 2.00 | hits: 0 --> and <!-- keywords: {project keywords} --> then sections: ## Overview, ## Tech Stack, ## Current Status, ## Goals, ## Key Decisions"
  },
  "tasksContent": "Initial TASKS.md content with ## Active Tasks section listing actionable items from all projects",
  "routingTriggers": "One routing trigger per project in format: > When modifying {project}: Read memory/projects/{slug}.md first"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences.`;
  return parseJSON(await callGemini(prompt));
}

export async function refineTools(answer, existingContext) {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `You are a technical writing assistant for Claude Code memory files.

User: ${existingContext.name}, ${existingContext.role}
Tools they use daily: ${answer.tools.join(', ')}
IDEs: ${answer.ides || 'VS Code'}
Additional tools context: ${answer.toolNotes || 'None'}

Generate JSON:
{
  "toolsTable": "Markdown table for CLAUDE.md ## Tools with columns: Tool | Used For",
  "toolsFile": "Full content for memory/tools.md with front-matter <!-- verified: ${today} | scope: Daily tools and technology stack | salience: 1.50 | hits: 0 --> and <!-- keywords: tools, software, stack, IDE, ${answer.tools.slice(0, 5).join(', ')} --> then sections per tool category (Development, Communication, Productivity, etc.)"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences.`;
  return parseJSON(await callGemini(prompt));
}

export async function refineClients(answer, existingContext) {
  const today = new Date().toISOString().split('T')[0];

  if (!answer.clients || answer.clients.length === 0) {
    return {
      clientsTable: '| Client | Context |\n|--------|--------|\n| *No clients configured* | — |',
      clientsFile: `<!-- verified: ${today} | scope: Client relationships and context | salience: 1.00 | hits: 0 -->\n<!-- keywords: clients, customers, accounts -->\n\n# Clients\n\nNo clients configured yet.\n`
    };
  }

  const clientList = answer.clients.map(c =>
    `- ${c.name}: ${c.context || 'No additional context'}. Industry: ${c.industry || 'N/A'}. Relationship: ${c.relationship || 'Client'}`
  ).join('\n');

  const prompt = `You are a technical writing assistant for Claude Code memory files.

User: ${existingContext.name}, ${existingContext.role}

Clients:
${clientList}

Generate JSON:
{
  "clientsTable": "Markdown table for CLAUDE.md ## Clients with columns: Client | Context",
  "clientsFile": "Full content for memory/clients.md with front-matter <!-- verified: ${today} | scope: Client relationships and context | salience: 1.50 | hits: 0 --> and <!-- keywords: clients, ${answer.clients.map(c => c.name.toLowerCase()).join(', ')} --> then sections per client with ## {Client Name} and details"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences.`;
  return parseJSON(await callGemini(prompt));
}

export async function refinePreferences(answer, existingContext) {
  const prompt = `You are a technical writing assistant for Claude Code memory files.

User: ${existingContext.name}, ${existingContext.role}
Communication style: ${answer.communicationStyle || 'Direct and concise'}
Technical comfort: ${answer.technicalLevel || 'Intermediate'}
Workflow habits: ${answer.workflowHabits || 'Standard development workflow'}
What to track: ${answer.trackingPreferences || 'Projects, people, tools'}
Memory decay preference: ${answer.decayPreference || 'default'}
Additional preferences: ${answer.additionalPrefs || 'None'}

Generate JSON:
{
  "preferencesSection": "The ## Preferences section for CLAUDE.md (5-8 lines covering communication style, technical level, workflow habits, and any special instructions)",
  "decayConfig": {
    "semanticRate": ${answer.decayPreference === 'slow' ? 0.01 : answer.decayPreference === 'fast' ? 0.04 : 0.02},
    "episodicRate": ${answer.decayPreference === 'slow' ? 0.03 : answer.decayPreference === 'fast' ? 0.08 : 0.06}
  }
}

IMPORTANT: Return ONLY valid JSON. No markdown fences.`;
  return parseJSON(await callGemini(prompt));
}

export async function refineGlossary(answer, existingContext) {
  const today = new Date().toISOString().split('T')[0];

  if (!answer.terms || answer.terms.length === 0) {
    return {
      termsTable: '| Term | Meaning |\n|------|--------|\n| *No terms configured* | — |',
      glossaryFile: `<!-- verified: ${today} | scope: Domain-specific terms and abbreviations | salience: 1.00 | hits: 0 -->\n<!-- keywords: glossary, terms, abbreviations, jargon -->\n\n# Glossary\n\nNo terms configured yet.\n`
    };
  }

  const termList = answer.terms.map(t => `- ${t.term}: ${t.definition}`).join('\n');

  const prompt = `You are a technical writing assistant for Claude Code memory files.

User: ${existingContext.name}, ${existingContext.role}

Terms and definitions:
${termList}

Generate JSON:
{
  "termsTable": "Markdown table for CLAUDE.md ## Terms section with columns: Term | Meaning",
  "glossaryFile": "Full content for memory/glossary.md with front-matter <!-- verified: ${today} | scope: Domain-specific terms and abbreviations | salience: 1.50 | hits: 0 --> and <!-- keywords: glossary, terms, abbreviations, jargon, ${answer.terms.map(t => t.term.toLowerCase()).join(', ')} --> then organized sections of terms with ## sections by category if appropriate"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences.`;
  return parseJSON(await callGemini(prompt));
}

// ──────────────────────────────────────────────────────────────
//  PROCESS STEP — single dispatcher for route handlers
// ──────────────────────────────────────────────────────────────
export async function processStep(stepName, answer, existingContext) {
  switch (stepName) {
    case 'identity':
      return await refineIdentity(answer);
    case 'people':
      return await refinePeople(answer, existingContext);
    case 'projects':
      return await refineProjects(answer, existingContext);
    case 'tools':
      return await refineTools(answer, existingContext);
    case 'clients':
      return await refineClients(answer, existingContext);
    case 'preferences':
      return await refinePreferences(answer, existingContext);
    case 'glossary':
      return await refineGlossary(answer, existingContext);
    case 'review':
      return {};
    default:
      throw new Error(`Unknown step: ${stepName}`);
  }
}

// ──────────────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────────────
function parseJSON(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini JSON:', cleaned.substring(0, 500));
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
