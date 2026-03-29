import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash-lite';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createGeminiClient(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

async function callGeminiWithRetry(model, prompt, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      if (i === retries - 1) {
        const geminiError = new Error(`Gemini API failed after ${retries} attempts: ${error.message}`);
        geminiError.name = 'GeminiError';
        throw geminiError;
      }
      console.warn(`⚠️ Gemini attempt ${i + 1} failed, retrying in ${RETRY_DELAY * (i + 1)}ms...`);
      await sleep(RETRY_DELAY * (i + 1));
    }
  }
}

// ============================================================
// STEP-SPECIFIC REFINEMENT PROMPTS
// ============================================================

export async function refineIdentity(apiKey, answer) {
  const model = createGeminiClient(apiKey);
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

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function refinePeople(apiKey, answer, existingContext) {
  const model = createGeminiClient(apiKey);
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

For personFiles, generate one entry per person. Slugify names (e.g., "Sarah Chen" → "sarah-chen").
IMPORTANT: Return ONLY valid JSON. No markdown fences.`;

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function refineProjects(apiKey, answer, existingContext) {
  const model = createGeminiClient(apiKey);
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

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function refineTools(apiKey, answer, existingContext) {
  const model = createGeminiClient(apiKey);
  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are a technical writing assistant for Claude Code memory files.

User: ${existingContext.name}, ${existingContext.role}
Tools they use daily: ${answer.tools.join(', ')}
IDEs: ${answer.ides || 'VS Code'}
Additional tools context: ${answer.toolNotes || 'None'}

Generate JSON:
{
  "toolsTable": "Markdown table for CLAUDE.md ## Tools with columns: Tool | Used For",
  "toolsFile": "Full content for memory/tools.md with front-matter <!-- verified: ${today} | scope: Daily tools and technology stack | salience: 1.50 | hits: 0 --> and <!-- keywords: tools, software, stack, IDE, ${answer.tools.slice(0,5).join(', ')} --> then sections per tool category (Development, Communication, Productivity, etc.)"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences.`;

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function refineClients(apiKey, answer, existingContext) {
  const model = createGeminiClient(apiKey);
  const today = new Date().toISOString().split('T')[0];

  if (!answer.clients || answer.clients.length === 0) {
    return {
      clientsTable: '| Client | Context |\n|--------|--------|\n| *No clients configured* | — |',
      clientsFile: `<!-- verified: ${today} | scope: Client relationships and context | salience: 1.00 | hits: 0 -->\n<!-- keywords: clients, customers, accounts -->\n\n# Clients\n\nNo clients configured yet. Add client information as your work evolves.\n`
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

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function refinePreferences(apiKey, answer, existingContext) {
  const model = createGeminiClient(apiKey);

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

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function refineGlossary(apiKey, answer, existingContext) {
  const model = createGeminiClient(apiKey);
  const today = new Date().toISOString().split('T')[0];

  if (!answer.terms || answer.terms.length === 0) {
    return {
      termsTable: '| Term | Meaning |\n|------|--------|\n| *No terms configured* | — |',
      glossaryFile: `<!-- verified: ${today} | scope: Domain-specific terms and abbreviations | salience: 1.00 | hits: 0 -->\n<!-- keywords: glossary, terms, abbreviations, jargon -->\n\n# Glossary\n\nNo domain-specific terms configured yet. Add terms as they come up in your work.\n`
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

  const text = await callGeminiWithRetry(model, prompt);
  return parseJSON(text);
}

export async function validateApiKey(apiKey) {
  try {
    const model = createGeminiClient(apiKey);
    const result = await model.generateContent('Say "ok" only.');
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// ============================================================
// HELPERS
// ============================================================

function parseJSON(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', cleaned.substring(0, 200));
    throw new Error('Failed to parse AI response. Please try again.');
  }
}
