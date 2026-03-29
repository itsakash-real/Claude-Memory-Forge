import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Load a template file from the templates directory.
 */
export function loadTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Replace placeholders in a template with values.
 * Placeholders are in the format {{KEY}}
 */
export function interpolate(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value || '');
  }
  return result;
}

/**
 * Build the complete CLAUDE.md from refined sections
 */
export function buildClaudeMd(refinedSections, answers) {
  const today = new Date().toISOString().split('T')[0];
  const userName = answers.identity?.name || 'User';
  const firstName = userName.split(' ')[0].toLowerCase();

  const meSection = refinedSections.meSection || `[Name: ${userName}]\n> Deep context: memory/people/${firstName}-context.md`;
  const peopleTable = refinedSections.peopleTable || '| Who | Role | Key Context |\n|-----|------|-------------|';
  const projectsTable = refinedSections.projectsTable || '| Name | Status | Tech Stack | Current Focus |\n|------|--------|-----------|---------------|';
  const termsTable = refinedSections.termsTable || '| Term | Meaning |\n|------|---------|';
  const toolsTable = refinedSections.toolsTable || '| Tool | Used For |\n|------|----------|';
  const clientsTable = refinedSections.clientsTable || '| Client | Context |\n|--------|---------|';
  const preferencesSection = refinedSections.preferencesSection || 'Communication: Direct and concise\nTechnical level: Intermediate';
  const routingTriggers = refinedSections.routingTriggers || '';

  const decayConfig = refinedSections.decayConfig || { semanticRate: 0.02, episodicRate: 0.06 };
  const semanticPct = Math.round(decayConfig.semanticRate * 100);
  const episodicPct = Math.round(decayConfig.episodicRate * 100);
  const semanticDays = Math.round(Math.log(0.1) / Math.log(1 - decayConfig.semanticRate));
  const episodicDays = Math.round(Math.log(0.1) / Math.log(1 - decayConfig.episodicRate));

  return `# MANDATORY: Session Start
Before doing ANYTHING else, run these in order:
1. \`python3 memory/memory_engine.py index\`
2. \`python3 memory/memory_check.py\`
3. Read \`memory/assistant/briefing.md\`

---

# Memory

## Me
${meSection}

## People (Active Collaborators)
${peopleTable}

> Full team: memory/people/

## Active Projects
${projectsTable}

> Archive: memory/projects/

## Terms
${termsTable}

> Full glossary: memory/glossary.md

## Tools
${toolsTable}

> Full toolset: memory/tools.md

## Clients
${clientsTable}

> Full list: memory/clients.md

## Preferences
${preferencesSection}

## System Routing
${routingTriggers}

> When modifying memory system: Read memory/SETUP.md first

---

## Memory System

This workspace uses a persistent memory system with a Python-based search engine.

### Scripts
| Script | Purpose |
|--------|---------|
| \`memory/memory_engine.py\` | SQLite + FTS5 search engine over markdown files |
| \`memory/memory_check.py\` | Health validator (front-matter, size, staleness) |
| \`memory/memory_maintain.sh\` | Daily maintenance (re-index, decay, flush, health) |
| \`memory/memory_hook.sh\` | Pre-message hook (index, search, inject context) |
| \`memory/_inject_alerts.py\` | Injects health alerts into briefing.md |

### Assistant Files (\`memory/assistant/\`)
| File | Purpose |
|------|---------|
| \`thinking.md\` | Chain of reasoning across sessions/cycles |
| \`briefing.md\` | Condensed operational primer |
| \`patterns.md\` | Feedback analysis on suggestion quality |
| \`relationships.md\` | People graph from communications |
| \`timeline.md\` | Key events log (30-day window) |

### Salience Scoring
- Start: 1.0 | Boost per access: +0.1 | Cap: 5.0
- Semantic decay (people, tools, glossary): ${semanticPct}%/day (~${semanticDays} days to dormant)
- Episodic decay (projects, status, meetings): ${episodicPct}%/day (~${episodicDays} days to dormant)
- Dormant threshold: 0.1 (memory still exists, just hidden from search)
- Database is disposable — rebuilds from markdown in seconds

### Keyword Enrichment
When writing/updating memory files, always include:
\`\`\`
<!-- keywords: 5-10 synonyms and related terms -->
\`\`\`

### Session Memory Extraction
The extraction system runs automatically (every 15 min). You do NOT need to manually save every fact. Still checkpoint to status.md for session handoff.

---

## Memory Rules

1. **Front-matter required** on all memory files:
   \`<!-- verified: YYYY-MM-DD | scope: description | salience: X.XX | hits: N -->\`
   14-day staleness threshold.

2. **Keyword enrichment**: 5-10 synonyms and related terms per file.

3. **Two-layer sync**: summaries in CLAUDE.md, detail in memory files. Edits require manual sync.

4. **Three files, three roles**:
   - \`status.md\` = short-term session handoff
   - \`briefing.md\` = operational primer from scheduled task
   - \`thinking.md\` = chain of reasoning

5. **Session continuity**: Read \`memory/status.md\` to pick up where the last session left off.

---

## Checkpoint Discipline (MANDATORY)

Claude cannot detect when the context window is getting full. To prevent losing work:

- **After every major deliverable**: write current state to \`memory/status.md\`
- **During long sessions (20+ messages)**: proactively checkpoint
- **Before any risky operation**: save progress first
- **What to checkpoint**: current task, what's done, what's pending, key decisions
- **Format**: update the \`## Current\` section of status.md. Overwrite, don't append.

---

*Generated by ClaudeForge on ${today}*
`;
}

/**
 * Build the complete file map for ZIP generation
 */
export function buildFileMap(session) {
  const { answers, refinedSections, generatedFiles } = session;
  const today = new Date().toISOString().split('T')[0];
  const files = {};

  // 1. CLAUDE.md
  files['CLAUDE.md'] = buildClaudeMd(refinedSections, answers);

  // 2. TASKS.md
  files['TASKS.md'] = refinedSections.tasksContent || 
    `# Active Tasks\n\n## Current Sprint\n- [ ] Review and customize CLAUDE.md\n- [ ] Set up MCP connectors (Gmail, Calendar, Slack)\n- [ ] Configure hooks in Claude Code settings\n- [ ] Run first session with memory system\n\n## Backlog\n- [ ] Set up scheduled tasks\n- [ ] Customize memory decay rates\n- [ ] Add detailed project files\n`;

  // 3. Memory Engine (static Python file)
  files['memory/memory_engine.py'] = buildMemoryEngine(refinedSections.decayConfig);

  // 4. Memory Check (static)
  files['memory/memory_check.py'] = getMemoryCheckScript();

  // 5. Memory Maintain (static)
  files['memory/memory_maintain.sh'] = getMemoryMaintainScript();

  // 6. Memory Hook (static)
  files['memory/memory_hook.sh'] = getMemoryHookScript();

  // 7. Inject Alerts (static)
  files['memory/_inject_alerts.py'] = getInjectAlertsScript();

  // 8. SETUP.md
  files['memory/SETUP.md'] = getSetupMd(answers);

  // 9. Assistant files
  files['memory/assistant/thinking.md'] = `<!-- verified: ${today} | scope: Chain of reasoning across sessions | salience: 3.00 | hits: 0 -->\n<!-- keywords: thinking, reasoning, analysis, observations -->\n\n# Thinking\n\n*This file will be populated by the scheduled refresh task. It contains the assistant's chain of reasoning across cycles.*\n`;
  
  files['memory/assistant/briefing.md'] = refinedSections.briefingGreeting ?
    `<!-- verified: ${today} | scope: Operational briefing for current session | salience: 3.00 | hits: 0 -->\n<!-- keywords: briefing, status, today, priorities, overview -->\n\n# Session Briefing\n\n${refinedSections.briefingGreeting}\n\n## Priorities\n*Run the hourly refresh task to populate this section with your email, calendar, and task data.*\n\n## Quick Context\n*This section will be auto-populated with relevant context from your connected services.*\n` :
    `<!-- verified: ${today} | scope: Operational briefing for current session | salience: 3.00 | hits: 0 -->\n<!-- keywords: briefing, status, today, priorities, overview -->\n\n# Session Briefing\n\nWelcome! Your memory system is set up and ready to go.\n\n## Getting Started\n1. Set up MCP connectors for Gmail, Calendar, Slack\n2. Configure the scheduled tasks\n3. Start having conversations — the system learns over time\n`;

  files['memory/assistant/patterns.md'] = `<!-- verified: ${today} | scope: Feedback analysis on suggestion quality | salience: 1.00 | hits: 0 -->\n<!-- keywords: patterns, feedback, suggestions, acceptance, rejection -->\n\n# Patterns\n\n## Suggestion Feedback\n*No feedback data yet. This file will be populated as you accept/reject suggestions.*\n\n## Trends\n*Tracking starts after the first scheduled refresh cycle.*\n`;

  files['memory/assistant/relationships.md'] = refinedSections.relationshipsFile ||
    `<!-- verified: ${today} | scope: Relationship map | salience: 2.00 | hits: 0 -->\n<!-- keywords: relationships, team, contacts, people -->\n\n# Relationships\n\n*No relationships configured yet. Add people through the wizard or by creating files in memory/people/.*\n`;

  files['memory/assistant/timeline.md'] = `<!-- verified: ${today} | scope: Key events log | salience: 1.50 | hits: 0 -->\n<!-- keywords: timeline, events, history, log, milestones -->\n\n# Timeline\n\n## Active (Last 30 Days)\n| Date | Event | Source |\n|------|-------|--------|\n| ${today} | Memory system initialized | ClaudeForge |\n\n## Archive (30-90 Days)\n*Empty — system just initialized.*\n`;

  // 10. Person files (from Gemini refinement)
  if (refinedSections.personFiles) {
    for (const [filename, content] of Object.entries(refinedSections.personFiles)) {
      files[`memory/people/${filename}`] = content;
    }
  }

  // Self-context file
  if (refinedSections.selfContextFile) {
    const firstName = (answers.identity?.name || 'user').split(' ')[0].toLowerCase();
    files[`memory/people/${firstName}-context.md`] = refinedSections.selfContextFile;
  }

  // 11. Project files (from Gemini refinement)
  if (refinedSections.projectFiles) {
    for (const [filename, content] of Object.entries(refinedSections.projectFiles)) {
      files[`memory/projects/${filename}`] = content;
    }
  }

  // 12. Tools, Glossary, Clients files
  files['memory/tools.md'] = refinedSections.toolsFile ||
    `<!-- verified: ${today} | scope: Daily tools and technology stack | salience: 1.00 | hits: 0 -->\n<!-- keywords: tools, software, stack -->\n\n# Tools\n\n*Configure your tools in the wizard to populate this file.*\n`;

  files['memory/glossary.md'] = refinedSections.glossaryFile ||
    `<!-- verified: ${today} | scope: Domain-specific terms | salience: 1.00 | hits: 0 -->\n<!-- keywords: glossary, terms -->\n\n# Glossary\n\n*No terms configured.*\n`;

  files['memory/clients.md'] = refinedSections.clientsFile ||
    `<!-- verified: ${today} | scope: Client relationships | salience: 1.00 | hits: 0 -->\n<!-- keywords: clients -->\n\n# Clients\n\n*No clients configured.*\n`;

  // 13. Status file
  files['memory/status.md'] = `<!-- verified: ${today} | scope: Session handoff state | salience: 2.00 | hits: 0 -->\n<!-- keywords: status, current, handoff, session, working -->\n\n# Session Status\n\n## Current\nMemory system just initialized via ClaudeForge. Ready for first session.\n\n## Last Session\nN/A — first session pending.\n\n## Pending\n- Set up MCP connectors\n- Configure hooks\n- Set up scheduled tasks\n`;

  // 14. Hooks
  files['memory/hooks/session_start.sh'] = getSessionStartHook();
  files['memory/hooks/session_end.sh'] = getSessionEndHook();
  files['memory/hooks/pre_compact.sh'] = getPreCompactHook();

  // 15. Extraction
  files['memory/extraction/parse_sessions.py'] = getParseSessionsScript();
  files['memory/extraction/extraction_prompt.md'] = getExtractionPrompt(answers);
  files['memory/extraction/session_markers.json'] = '{}';
  files['memory/extraction/.last_extraction'] = '0';

  // 16. Empty directories (represented by .gitkeep files)
  files['memory/tools/.gitkeep'] = '';
  files['memory/health/.gitkeep'] = '';
  files['memory/meetings/.gitkeep'] = '';

  // 17. Scheduled task prompts (Layer 3)
  files['scheduled-tasks/hourly-refresh-prompt.md'] = getHourlyRefreshPrompt(answers);
  files['scheduled-tasks/extraction-prompt.md'] = getExtractionTaskPrompt(answers);
  files['scheduled-tasks/maintenance-prompt.md'] = getMaintenanceTaskPrompt();

  // 18. Quickstart guide
  files['QUICKSTART.md'] = getQuickstartGuide(answers);

  // Merge any additional generated files
  Object.assign(files, generatedFiles);

  return files;
}

// ============================================================
// STATIC FILE GENERATORS
// ============================================================

function buildMemoryEngine(decayConfig) {
  const semanticRate = decayConfig?.semanticRate || 0.02;
  const episodicRate = decayConfig?.episodicRate || 0.06;

  return `#!/usr/bin/env python3
"""
Memory Engine — SQLite + FTS5 full-text search over markdown files.
Zero pip dependencies (uses built-in sqlite3).
Generated by ClaudeForge.
"""

import os
import sys
import re
import sqlite3
import hashlib
import time
import json
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────
MEMORY_DIR = Path(__file__).parent
WORKSPACE_DIR = MEMORY_DIR.parent
SALIENCE_CAP = 5.0
SALIENCE_FLOOR = 0.0
DORMANT_THRESHOLD = 0.1
ACCESS_BOOST = 0.1
SEMANTIC_DECAY = ${semanticRate}   # per day
EPISODIC_DECAY = ${episodicRate}   # per day
HIT_CAP = 10000

SEMANTIC_DIRS = {'people', 'tools', 'health', 'assistant'}
SEMANTIC_FILES = {'glossary.md', 'clients.md', 'tools.md'}
EPISODIC_DIRS = {'projects', 'meetings'}

DB_CANDIDATES = [
    Path.home() / '.cache' / 'memory-engine' / 'memory.db',
    MEMORY_DIR / 'memory.db'
]

# ── Database Setup ─────────────────────────────────────────────
def get_db_path():
    for candidate in DB_CANDIDATES:
        try:
            candidate.parent.mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(str(candidate))
            conn.execute('CREATE TABLE IF NOT EXISTS _test (id INTEGER)')
            conn.execute('DROP TABLE _test')
            conn.close()
            return candidate
        except Exception:
            continue
    raise RuntimeError('No writable database location found')

def get_connection():
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path))
    conn.execute('PRAGMA journal_mode=WAL')
    return conn

def init_db(conn):
    conn.execute('''CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL,
        file_hash TEXT,
        heading TEXT,
        content TEXT,
        salience REAL DEFAULT 1.0,
        hits INTEGER DEFAULT 0,
        last_accessed REAL,
        is_semantic INTEGER DEFAULT 0
    )''')
    try:
        conn.execute('''CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts
            USING fts5(content, tokenize='porter unicode61')''')
    except Exception:
        pass
    conn.commit()

# ── Front-matter Parsing ──────────────────────────────────────
FRONTMATTER_RE = re.compile(
    r'<!--\\s*verified:\\s*(\\S+)\\s*\\|\\s*scope:\\s*([^|>]+)'
    r'(?:\\|\\s*salience:\\s*([\\d.]+))?'
    r'(?:\\s*\\|\\s*hits:\\s*(\\d+))?'
    r'\\s*-->'
)
KEYWORDS_RE = re.compile(r'<!--\\s*keywords:\\s*(.+?)\\s*-->')

def parse_frontmatter(text):
    m = FRONTMATTER_RE.search(text)
    if not m:
        return None
    return {
        'verified': m.group(1),
        'scope': m.group(2).strip(),
        'salience': float(m.group(3)) if m.group(3) else 1.0,
        'hits': int(m.group(4)) if m.group(4) else 0
    }

def parse_keywords(text):
    m = KEYWORDS_RE.search(text)
    return m.group(1).strip() if m else ''

# ── File Classification ───────────────────────────────────────
def is_semantic(file_path):
    rel = os.path.relpath(file_path, MEMORY_DIR)
    parts = Path(rel).parts
    if len(parts) > 1 and parts[0] in SEMANTIC_DIRS:
        return True
    if Path(rel).name in SEMANTIC_FILES:
        return True
    return False

# ── Chunking ──────────────────────────────────────────────────
def chunk_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    
    fm = parse_frontmatter(text)
    keywords = parse_keywords(text)
    salience = min(fm['salience'] if fm else 1.0, SALIENCE_CAP)
    hits = min(fm['hits'] if fm else 0, HIT_CAP)
    
    # Special: CLAUDE.md always at max salience
    if Path(file_path).name == 'CLAUDE.md':
        salience = SALIENCE_CAP
    
    chunks = []
    sections = re.split(r'^(## .+)$', text, flags=re.MULTILINE)
    
    if len(sections) <= 1:
        content = text
        if keywords:
            content += f'\\n[keywords: {keywords}]'
        chunks.append({
            'heading': Path(file_path).stem,
            'content': content,
            'salience': salience,
            'hits': hits
        })
    else:
        current_heading = Path(file_path).stem
        current_content = sections[0]
        if current_content.strip():
            c = current_content
            if keywords:
                c += f'\\n[keywords: {keywords}]'
            chunks.append({
                'heading': current_heading,
                'content': c,
                'salience': salience,
                'hits': hits
            })
        for i in range(1, len(sections), 2):
            heading = sections[i].strip('# ').strip()
            content = sections[i + 1] if i + 1 < len(sections) else ''
            if keywords:
                content += f'\\n[keywords: {keywords}]'
            chunks.append({
                'heading': heading,
                'content': content.strip(),
                'salience': salience,
                'hits': hits
            })
    
    return chunks

# ── Indexing ──────────────────────────────────────────────────
def file_hash(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()

def index_files(conn):
    conn.execute('DELETE FROM chunks')
    conn.execute('DELETE FROM chunks_fts')
    
    indexed = 0
    for root, dirs, files in os.walk(MEMORY_DIR):
        # Skip hidden dirs and extraction dir
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        for fname in files:
            if not fname.endswith('.md'):
                continue
            fpath = os.path.join(root, fname)
            try:
                chunks = chunk_file(fpath)
                fhash = file_hash(fpath)
                sem = 1 if is_semantic(fpath) else 0
                for chunk in chunks:
                    conn.execute(
                        'INSERT INTO chunks (file_path, file_hash, heading, content, salience, hits, last_accessed, is_semantic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        (fpath, fhash, chunk['heading'], chunk['content'],
                         chunk['salience'], chunk['hits'], time.time(), sem)
                    )
                    # Strip keywords before FTS indexing display
                    clean = re.sub(r'\\n\\[keywords:.*?\\]', '', chunk['content'])
                    conn.execute(
                        'INSERT INTO chunks_fts (content) VALUES (?)',
                        (clean,)
                    )
                indexed += 1
            except Exception as e:
                print(f'  ⚠ Error indexing {fpath}: {e}', file=sys.stderr)
    
    # Also index CLAUDE.md from workspace root
    claude_md = WORKSPACE_DIR / 'CLAUDE.md'
    if claude_md.exists():
        try:
            chunks = chunk_file(str(claude_md))
            fhash = file_hash(str(claude_md))
            for chunk in chunks:
                chunk['salience'] = SALIENCE_CAP
                conn.execute(
                    'INSERT INTO chunks (file_path, file_hash, heading, content, salience, hits, last_accessed, is_semantic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (str(claude_md), fhash, chunk['heading'], chunk['content'],
                     SALIENCE_CAP, 0, time.time(), 1)
                )
                clean = re.sub(r'\\n\\[keywords:.*?\\]', '', chunk['content'])
                conn.execute(
                    'INSERT INTO chunks_fts (content) VALUES (?)',
                    (clean,)
                )
            indexed += 1
        except Exception as e:
            print(f'  ⚠ Error indexing CLAUDE.md: {e}', file=sys.stderr)
    
    conn.commit()
    return indexed

# ── Search ────────────────────────────────────────────────────
def sanitize_query(query):
    return re.sub(r'[^\\w\\s]', ' ', query).strip()

def search(conn, query, limit=10):
    clean_query = sanitize_query(query)
    if not clean_query:
        return []
    
    terms = clean_query.split()
    fts_query = ' OR '.join(terms)
    
    try:
        rows = conn.execute('''
            SELECT c.file_path, c.heading, c.content, c.salience, c.hits,
                   rank * -1 as relevance
            FROM chunks_fts f
            JOIN chunks c ON f.rowid = c.rowid
            WHERE chunks_fts MATCH ?
            AND c.salience >= ?
            ORDER BY (relevance * c.salience) DESC
            LIMIT ?
        ''', (fts_query, DORMANT_THRESHOLD, limit)).fetchall()
        
        # Boost accessed chunks
        for row in rows:
            conn.execute(
                'UPDATE chunks SET hits = MIN(hits + 1, ?), salience = MIN(salience + ?, ?), last_accessed = ? WHERE file_path = ? AND heading = ?',
                (HIT_CAP, ACCESS_BOOST, SALIENCE_CAP, time.time(), row[0], row[1])
            )
        conn.commit()
        
        results = []
        for row in rows:
            content = row[2]
            # Strip keywords from display
            content = re.sub(r'\\n\\[keywords:.*?\\]', '', content)
            results.append({
                'file': row[0],
                'heading': row[1],
                'content': content.strip(),
                'salience': row[3],
                'hits': row[4]
            })
        return results
    except Exception as e:
        print(f'  ⚠ Search error: {e}', file=sys.stderr)
        return []

# ── Recent Memories ───────────────────────────────────────────
def get_recent(conn, limit=5):
    rows = conn.execute('''
        SELECT file_path, heading, content, salience
        FROM chunks
        WHERE salience >= ?
        ORDER BY last_accessed DESC
        LIMIT ?
    ''', (DORMANT_THRESHOLD, limit)).fetchall()
    
    results = []
    for row in rows:
        content = re.sub(r'\\n\\[keywords:.*?\\]', '', row[2])
        results.append({
            'file': row[0],
            'heading': row[1],
            'content': content.strip(),
            'salience': row[3]
        })
    return results

# ── Salience Decay ────────────────────────────────────────────
def apply_decay(conn):
    rows = conn.execute('SELECT rowid, salience, is_semantic FROM chunks WHERE salience > ?', (DORMANT_THRESHOLD,)).fetchall()
    updated = 0
    for rowid, sal, sem in rows:
        rate = SEMANTIC_DECAY if sem else EPISODIC_DECAY
        new_sal = max(sal * (1 - rate), SALIENCE_FLOOR)
        conn.execute('UPDATE chunks SET salience = ? WHERE rowid = ?', (new_sal, rowid))
        updated += 1
    conn.commit()
    return updated

# ── Flush Salience to Files ───────────────────────────────────
def flush_to_files(conn):
    file_scores = {}
    rows = conn.execute('SELECT file_path, salience, hits FROM chunks').fetchall()
    for fpath, sal, hits in rows:
        if fpath not in file_scores:
            file_scores[fpath] = {'max_sal': sal, 'total_hits': hits}
        else:
            file_scores[fpath]['max_sal'] = max(file_scores[fpath]['max_sal'], sal)
            file_scores[fpath]['total_hits'] += hits
    
    flushed = 0
    for fpath, scores in file_scores.items():
        try:
            if not os.path.exists(fpath):
                continue
            with open(fpath, 'r', encoding='utf-8') as f:
                text = f.read()
            
            fm = parse_frontmatter(text)
            if fm is None:
                continue
            
            new_sal = min(scores['max_sal'], SALIENCE_CAP)
            new_hits = min(scores['total_hits'], HIT_CAP)
            
            old_fm = FRONTMATTER_RE.search(text)
            if old_fm:
                new_fm_str = f'<!-- verified: {fm["verified"]} | scope: {fm["scope"]} | salience: {new_sal:.2f} | hits: {new_hits} -->'
                text = text[:old_fm.start()] + new_fm_str + text[old_fm.end():]
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(text)
                flushed += 1
        except Exception as e:
            print(f'  ⚠ Flush error for {fpath}: {e}', file=sys.stderr)
    
    return flushed

# ── Context Injection ─────────────────────────────────────────
def inject_context(conn, query):
    results = search(conn, query, limit=5)
    recent = get_recent(conn, limit=3)
    
    # Deduplicate
    seen = set()
    all_items = []
    for r in results + recent:
        key = (r['file'], r['heading'])
        if key not in seen:
            seen.add(key)
            all_items.append(r)
    
    if not all_items:
        return ''
    
    lines = ['<memory_context>']
    for item in all_items[:8]:
        rel_path = os.path.relpath(item['file'], WORKSPACE_DIR)
        lines.append(f'--- {rel_path} :: {item["heading"]} (salience: {item.get("salience", 1.0):.1f}) ---')
        lines.append(item['content'][:500])
        lines.append('')
    lines.append('</memory_context>')
    return '\\n'.join(lines)

# ── CLI ───────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 2:
        print('Usage: memory_engine.py <command> [args]')
        print('Commands: index, search <query>, decay, flush, context <query>')
        sys.exit(1)
    
    cmd = sys.argv[1]
    conn = get_connection()
    init_db(conn)
    
    if cmd == 'index':
        count = index_files(conn)
        print(f'✅ Indexed {count} files')
    
    elif cmd == 'search':
        query = ' '.join(sys.argv[2:])
        results = search(conn, query)
        for r in results:
            print(f'  📄 {r["file"]} :: {r["heading"]} (sal: {r["salience"]:.2f})')
            print(f'     {r["content"][:100]}...')
    
    elif cmd == 'decay':
        updated = apply_decay(conn)
        print(f'✅ Applied decay to {updated} chunks')
    
    elif cmd == 'flush':
        flushed = flush_to_files(conn)
        print(f'✅ Flushed salience to {flushed} files')
    
    elif cmd == 'context':
        query = ' '.join(sys.argv[2:])
        ctx = inject_context(conn, query)
        print(ctx)
    
    else:
        print(f'Unknown command: {cmd}')
        sys.exit(1)
    
    conn.close()

if __name__ == '__main__':
    main()
`;
}

function getMemoryCheckScript() {
  return `#!/usr/bin/env python3
"""
Memory Health Check — validates the memory system.
Generated by ClaudeForge.
"""

import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

MEMORY_DIR = Path(__file__).parent
WORKSPACE_DIR = MEMORY_DIR.parent
STALENESS_DAYS = 14
MAX_FILE_SIZE = 8192  # bytes
MAX_CLAUDE_MD_LINES = 480

FRONTMATTER_RE = re.compile(
    r'<!--\\s*verified:\\s*(\\S+)\\s*\\|\\s*scope:\\s*([^|>]+)'
)

def check_health():
    issues = []
    warnings = []
    
    # Check CLAUDE.md exists and line count
    claude_md = WORKSPACE_DIR / 'CLAUDE.md'
    if claude_md.exists():
        lines = claude_md.read_text(encoding='utf-8').splitlines()
        if len(lines) > MAX_CLAUDE_MD_LINES:
            issues.append(f'CLAUDE.md is {len(lines)} lines (max: {MAX_CLAUDE_MD_LINES})')
    else:
        issues.append('CLAUDE.md not found in workspace root')
    
    # Check memory files
    stale_count = 0
    missing_fm = 0
    oversized = 0
    
    for root, dirs, files in os.walk(MEMORY_DIR):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__' and d != 'extraction']
        for fname in files:
            if not fname.endswith('.md') or fname == 'SETUP.md':
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    text = f.read()
                
                # Check front-matter
                m = FRONTMATTER_RE.search(text)
                if not m:
                    missing_fm += 1
                    warnings.append(f'Missing front-matter: {os.path.relpath(fpath, MEMORY_DIR)}')
                else:
                    # Check staleness
                    try:
                        verified = datetime.strptime(m.group(1), '%Y-%m-%d')
                        if datetime.now() - verified > timedelta(days=STALENESS_DAYS):
                            stale_count += 1
                    except ValueError:
                        pass
                
                # Check size
                size = os.path.getsize(fpath)
                if size > MAX_FILE_SIZE:
                    oversized += 1
                    warnings.append(f'Oversized ({size}B): {os.path.relpath(fpath, MEMORY_DIR)}')
            except Exception as e:
                issues.append(f'Error reading {fname}: {e}')
    
    # Report
    print('🏥 Memory Health Check')
    print(f'   Files with missing front-matter: {missing_fm}')
    print(f'   Stale files (>{STALENESS_DAYS} days): {stale_count}')
    print(f'   Oversized files: {oversized}')
    
    if issues:
        print(f'   ❌ Issues ({len(issues)}):')
        for issue in issues:
            print(f'      - {issue}')
    
    if warnings:
        print(f'   ⚠️  Warnings ({len(warnings)}):')
        for w in warnings[:10]:
            print(f'      - {w}')
    
    if not issues and not warnings:
        print('   ✅ All checks passed!')
    
    return len(issues)

if __name__ == '__main__':
    sys.exit(check_health())
`;
}

function getMemoryMaintainScript() {
  return `#!/bin/bash
# Memory Maintenance — re-index, decay, flush, health check.
# Generated by ClaudeForge.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔧 Running memory maintenance..."

# Step 1: Re-index
echo "  📇 Re-indexing files..."
python3 "$SCRIPT_DIR/memory_engine.py" index

# Step 2: Apply decay
echo "  📉 Applying salience decay..."
python3 "$SCRIPT_DIR/memory_engine.py" decay

# Step 3: Flush scores to files
echo "  💾 Flushing salience to front-matter..."
python3 "$SCRIPT_DIR/memory_engine.py" flush

# Step 4: Health check
echo "  🏥 Running health check..."
python3 "$SCRIPT_DIR/memory_check.py"

# Step 5: Inject alerts
echo "  🔔 Injecting alerts..."
python3 "$SCRIPT_DIR/_inject_alerts.py"

# Step 6: Check briefing freshness
if [ -f "$SCRIPT_DIR/assistant/briefing.md" ]; then
    if [ "$(uname)" = "Darwin" ]; then
        BRIEFING_AGE=$(( $(date +%s) - $(stat -f %m "$SCRIPT_DIR/assistant/briefing.md") ))
    else
        BRIEFING_AGE=$(( $(date +%s) - $(stat -c %Y "$SCRIPT_DIR/assistant/briefing.md") ))
    fi
    if [ "$BRIEFING_AGE" -gt 7200 ]; then
        echo "  ⚠️  Briefing is $(($BRIEFING_AGE / 3600))h old — scheduled task may not be running"
    fi
fi

echo "✅ Maintenance complete!"
`;
}

function getMemoryHookScript() {
  return `#!/bin/bash
# Pre-message hook — index, search, inject context.
# Runs before every message sent to Claude.
# Generated by ClaudeForge.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Parse query from stdin (Claude Code sends JSON)
QUERY=$(python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt',''))" 2>/dev/null)

if [ -z "$QUERY" ]; then
    exit 0
fi

# Re-index changed files (fast, skips unchanged)
python3 "$SCRIPT_DIR/memory_engine.py" index 2>/dev/null

# Search and inject context
python3 "$SCRIPT_DIR/memory_engine.py" context "$QUERY"

# Flush salience scores (crash safety)
python3 "$SCRIPT_DIR/memory_engine.py" flush 2>/dev/null
`;
}

function getInjectAlertsScript() {
  return `#!/usr/bin/env python3
"""
Inject health alerts into briefing.md.
Generated by ClaudeForge.
"""

import os
import subprocess
import sys
from pathlib import Path

MEMORY_DIR = Path(__file__).parent
BRIEFING_PATH = MEMORY_DIR / 'assistant' / 'briefing.md'

def inject():
    # Run health check and capture output
    result = subprocess.run(
        [sys.executable, str(MEMORY_DIR / 'memory_check.py')],
        capture_output=True, text=True
    )
    
    output = result.stdout
    if '❌' not in output and '⚠️' not in output:
        return  # No alerts to inject
    
    if not BRIEFING_PATH.exists():
        return
    
    briefing = BRIEFING_PATH.read_text(encoding='utf-8')
    
    # Remove old alerts section
    alert_marker = '## ⚠️ System Alerts'
    if alert_marker in briefing:
        idx = briefing.index(alert_marker)
        next_section = briefing.find('\\n## ', idx + 1)
        if next_section > 0:
            briefing = briefing[:idx] + briefing[next_section:]
        else:
            briefing = briefing[:idx]
    
    # Add new alerts
    alert_lines = [line for line in output.splitlines() if '❌' in line or '⚠️' in line or '- ' in line]
    if alert_lines:
        alerts_section = f'\\n{alert_marker}\\n' + '\\n'.join(alert_lines) + '\\n'
        briefing = briefing.rstrip() + '\\n' + alerts_section
        BRIEFING_PATH.write_text(briefing, encoding='utf-8')

if __name__ == '__main__':
    inject()
`;
}

function getSessionStartHook() {
  return `#!/bin/bash
# Session start hook — rebuild index, health check, load briefing.
# Generated by ClaudeForge.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Starting session..."

# Rebuild search index
python3 "$SCRIPT_DIR/memory_engine.py" index 2>/dev/null

# Run health check
python3 "$SCRIPT_DIR/memory_check.py" 2>/dev/null

# Output briefing for context
if [ -f "$SCRIPT_DIR/assistant/briefing.md" ]; then
    echo ""
    echo "📋 Session Briefing:"
    cat "$SCRIPT_DIR/assistant/briefing.md"
fi
`;
}

function getSessionEndHook() {
  return `#!/bin/bash
# Session end hook — flush salience and prompt status update.
# Generated by ClaudeForge.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Flush salience scores
python3 "$SCRIPT_DIR/memory_engine.py" flush 2>/dev/null

echo ""
echo "💾 Session ending. Please update memory/status.md with:"
echo "   - What you were working on"
echo "   - What's done vs pending"
echo "   - Key decisions made"
`;
}

function getPreCompactHook() {
  return `#!/bin/bash
# Pre-compaction hook — save state before context window compression.
# Generated by ClaudeForge.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Output current status for context preservation
if [ -f "$SCRIPT_DIR/status.md" ]; then
    echo ""
    echo "📌 Current status (save before compaction):"
    cat "$SCRIPT_DIR/status.md"
fi

echo ""
echo "⚠️ Context window is being compressed. Please:"
echo "   1. Save current progress to memory/status.md"
echo "   2. Note any state that would be painful to reconstruct"
echo "   3. Checkpoint key decisions and pending items"
`;
}

function getParseSessionsScript() {
  return `#!/usr/bin/env python3
"""
Session transcript parser — reads Claude Code JSONL transcripts
and extracts human + assistant text for memory extraction.
Generated by ClaudeForge.
"""

import json
import os
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
MARKERS_FILE = SCRIPT_DIR / 'session_markers.json'

def find_session_files():
    """Find Claude Code session transcript files."""
    candidates = [
        Path.home() / '.claude' / 'projects',
        Path.home() / '.config' / 'claude' / 'projects',
    ]
    sessions = []
    for base in candidates:
        if base.exists():
            for f in base.rglob('*.jsonl'):
                sessions.append(f)
    return sessions

def load_markers():
    if MARKERS_FILE.exists():
        return json.loads(MARKERS_FILE.read_text())
    return {}

def save_markers(markers):
    MARKERS_FILE.write_text(json.dumps(markers, indent=2))

def parse_session(filepath, byte_offset=0):
    """Parse a session file from a byte offset, return condensed text."""
    lines = []
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        f.seek(byte_offset)
        for line in f:
            try:
                entry = json.loads(line.strip())
                role = entry.get('role', '')
                if role in ('human', 'assistant'):
                    content = entry.get('content', '')
                    if isinstance(content, list):
                        text_parts = [p.get('text', '') for p in content if isinstance(p, dict) and p.get('type') == 'text']
                        content = '\\n'.join(text_parts)
                    if content.strip():
                        lines.append(f'[{role.upper()}]: {content.strip()}')
            except json.JSONDecodeError:
                continue
        new_offset = f.tell()
    return '\\n\\n'.join(lines), new_offset

def main():
    parser = argparse.ArgumentParser(description='Parse session transcripts')
    parser.add_argument('--since', default='2h', help='Time window (e.g., 2h, 1d)')
    args = parser.parse_args()
    
    # Parse time window
    if args.since.endswith('h'):
        delta = timedelta(hours=int(args.since[:-1]))
    elif args.since.endswith('d'):
        delta = timedelta(days=int(args.since[:-1]))
    else:
        delta = timedelta(hours=2)
    
    cutoff = datetime.now() - delta
    markers = load_markers()
    
    sessions = find_session_files()
    all_text = []
    
    for session_file in sessions:
        mtime = datetime.fromtimestamp(os.path.getmtime(session_file))
        if mtime < cutoff:
            continue
        
        key = str(session_file)
        offset = markers.get(key, 0)
        
        text, new_offset = parse_session(session_file, offset)
        if text:
            all_text.append(f'--- Session: {session_file.name} ---\\n{text}')
            markers[key] = new_offset
    
    save_markers(markers)
    
    if all_text:
        print('\\n\\n'.join(all_text))
    else:
        print('')  # Empty = no new content

if __name__ == '__main__':
    main()
`;
}

function getExtractionPrompt(answers) {
  const name = answers?.identity?.name || 'User';
  return `# Memory Extraction Prompt

You are a memory extraction agent for ${name}'s memory system.
You are a precise, skeptical librarian. Extract ONLY genuinely durable facts from session transcripts.

## Filters
1. **48-hour test**: Will this still matter in 48 hours? No/maybe = skip.
2. **Novelty test**: Already in memory? Skip.

## What IS durable
- New people (name, role, relationship)
- Project decisions (tech choices, architecture, scope changes)
- Tools adopted or abandoned
- Preference changes
- Client updates
- Life events

## What is NOT durable
- Debugging sessions
- Task coordination chatter
- Brainstorming (unless a decision was made)
- Claude's suggestions (only user's confirmed decisions)

## Output Format
For each extracted fact, write to the appropriate file:
- People → memory/people/{name}.md
- Projects → memory/projects/{project}.md
- Tools → memory/tools.md
- Terms → memory/glossary.md
- Clients → memory/clients.md

Always include proper front-matter and keywords.
When in doubt, don't extract.
`;
}

function getSetupMd(answers) {
  const name = answers?.identity?.name || 'User';
  return `# Memory System Setup Guide

Generated by ClaudeForge for ${name}.

## Quick Start

### 1. Place files
Copy this entire folder to your Claude workspace (e.g., \`~/Documents/Claude/\`).

### 2. Verify the engine works
\`\`\`bash
cd ~/Documents/Claude
python3 memory/memory_engine.py index
python3 memory/memory_check.py
\`\`\`

### 3. Set up MCP connectors
\`\`\`bash
claude mcp add-oauth
\`\`\`
Add Gmail, Google Calendar, and Slack.

### 4. Configure hooks
Tell Claude Code to add hooks:
- Pre-message: \`memory/memory_hook.sh\`
- Session start: \`memory/hooks/session_start.sh\`
- Session end: \`memory/hooks/session_end.sh\`
- Pre-compaction: \`memory/hooks/pre_compact.sh\`

### 5. Set up scheduled tasks
Use the prompts in \`scheduled-tasks/\` directory.

## Architecture
- **memory_engine.py**: SQLite + FTS5 search engine (zero pip dependencies)
- **memory_check.py**: Health validator
- **memory_maintain.sh**: Daily maintenance
- **memory_hook.sh**: Pre-message context injection
- **assistant/**: Auto-generated reasoning and briefing files
- **people/**: One file per person
- **projects/**: One file per project
`;
}

function getHourlyRefreshPrompt(answers) {
  const name = answers?.identity?.name || 'User';
  return `# Hourly Refresh Task Prompt

You are ${name}'s life assistant. You run every hour.

Each cycle: pull data, read your prior thinking, reason about what changed, update memory files + dashboard data.

\`thinking.md\` is your most important deliverable.

**TWO VOICES**: \`thinking.md\` = analytically honest ("Day 10, activation energy problem"). Everything user-facing = warm, encouraging, no pressure language. Friend, not boss.

**PATHS**: All relative to workspace root. Never hardcode.

## Steps

**Step 0**: Read memory/assistant/thinking.md (FIRST), briefing.md, patterns.md, relationships.md, timeline.md.

**Steps 1-5**: Pull email (7d, max 15, filter spam), calendar (all calendars, 10d, merge+dedup), extract email action items to TASKS.md, pull Slack (to:me + configured channels, max 15), pull iMessages/Reminders via AppleScript if available.

**Step 6 THINK**: Before classifying anything, reason:
(a) What changed? (b) What patterns across sources? (c) What should user know unprompted? (d) Project assessments? (e) Relationship reads? (f) What would you advise today? Ground in evidence.

**Step 9**: Update assistant files with hard byte budgets:
- thinking.md (6144B): dated entry, last 5 cycles, sections: Seeing/Advise/Tracking
- patterns.md (4096B): 7-day feedback stats
- relationships.md (4096B): top 15 contacts
- timeline.md (8192B): 30d active + 90d archive
- briefing.md (3072B): dense primer. Write .tmp first, then rename.

**Step 13**: Run \`bash memory/memory_maintain.sh\`

## Schedule
Run hourly during waking hours (e.g., 9 AM to 10 PM).
Start with just email and calendar, add sources over time.
`;
}

function getExtractionTaskPrompt(answers) {
  const name = answers?.identity?.name || 'User';
  return `# Session Memory Extraction Task Prompt

You are a memory extraction agent for ${name}'s memory system. You are a precise, skeptical librarian. Extract ONLY genuinely durable facts from session transcripts.

## Steps

**Step 0**: Cooldown check. If \`.last_extraction\` < 900s old, stop.

**Step 1**: Run \`python3 memory/extraction/parse_sessions.py --since 2h\`. No content = stop.

**Step 2**: Read CLAUDE.md + briefing.md only. Don't bulk-read.

**Step 3**: Extract facts. Apply two filters:
- 48-hour test: still matter in 48h? No/maybe = skip.
- Novelty test: already in memory? Skip.

Durable: new people, project decisions, tools adopted, preference changes, client updates, life events.
NOT durable: debugging, task coordination, brainstorming, Claude's suggestions (only user's confirmed decisions).

**Step 4**: Write with reconciliation:
- New fact: create/append to correct file (people/, projects/, tools/, glossary.md, clients.md). Proper front-matter + keywords on all files.
- Changed fact: read target first, surgical update, add \`<!-- updated: YYYY-MM-DD via session extraction -->\`
- Conflict: flag for review, don't silently overwrite.

**Step 5**: Update status.md ## Current as session handoff (2-3 lines).

**Step 6**: Run \`memory_engine.py index\` + \`memory_check.py\`

## Rules
When in doubt, don't extract. Never overwrite without reading. Preserve existing structure. Skip your own prior extraction sessions.

## Schedule
Run every 15 minutes. Use a lighter model (e.g., Flash) to save usage.
`;
}

function getMaintenanceTaskPrompt() {
  return `# Daily Maintenance Task Prompt

Mechanical maintenance for the memory system.
Do NOT update status.md or write summaries.

Run: \`bash memory/memory_maintain.sh\`

This re-indexes files, applies salience decay, flushes scores to front-matter, runs health check, checks briefing freshness, and injects alerts into briefing.md.

If any step fails, report which step and the error. Do not fix files automatically.

## Schedule
Run daily, or let the hourly refresh call it as its last step.
`;
}

function getQuickstartGuide(answers) {
  const name = answers?.identity?.name || 'User';
  return `# 🚀 ClaudeForge Quickstart — ${name}'s Memory System

Welcome! This is your personalized Claude Code persistent memory system. Here's how to get it running.

## Step 1: Place the files

Copy this entire folder to your Claude workspace directory:

\`\`\`bash
# Example: copy to ~/Documents/Claude/
cp -r ./claude-memory-system/* ~/Documents/Claude/
\`\`\`

> **Important**: Use a single unified workspace folder for everything. One folder, one CLAUDE.md, one memory/ directory.

## Step 2: Verify the engine works

\`\`\`bash
cd ~/Documents/Claude
python3 memory/memory_engine.py index
# Should output: ✅ Indexed N files

python3 memory/memory_check.py
# Should output: ✅ All checks passed!
\`\`\`

## Step 3: Set up MCP connectors

\`\`\`bash
claude mcp add-oauth
\`\`\`

Add Gmail, Google Calendar, and Slack. This takes about 2 minutes.

## Step 4: Configure hooks in Claude Code

Tell Claude Code to add these hooks:
- **Pre-message**: \`memory/memory_hook.sh\`
- **Session start**: \`memory/hooks/session_start.sh\`
- **Session end**: \`memory/hooks/session_end.sh\`
- **Pre-compaction**: \`memory/hooks/pre_compact.sh\`

You can set these up by telling Claude Code: "I want to add hooks for session start, session end, pre-compaction, and pre-message" and pointing it at the scripts.

## Step 5: Set up scheduled tasks

Use the prompts in \`scheduled-tasks/\` to configure:
1. **Hourly refresh** — checks email, calendar, Slack, reasons about your life
2. **15-min extraction** — saves durable facts from your conversations automatically
3. **Daily maintenance** — applies decay, flushes scores, runs health checks

## What's in this folder?

| File/Folder | Purpose |
|-------------|---------|
| \`CLAUDE.md\` | Your routing index — Claude reads this first every session |
| \`TASKS.md\` | Active task list |
| \`memory/memory_engine.py\` | Search engine (zero dependencies) |
| \`memory/assistant/\` | Auto-generated reasoning and briefing files |
| \`memory/people/\` | One file per person you work with |
| \`memory/projects/\` | One file per active project |
| \`memory/hooks/\` | Hook scripts for session lifecycle |
| \`memory/extraction/\` | Session transcript extractor |
| \`scheduled-tasks/\` | Prompt templates for scheduled tasks |

## How it works

Every time you start a Claude Code session, the system:
1. Rebuilds the search index from your markdown files
2. Runs a health check
3. Loads your operational briefing
4. Before each message, searches for relevant memories and injects them as context

Your memories have **salience scores** that decay over time. Stuff you use often stays prominent. Stuff you stop caring about naturally fades. Use it again and it snaps back.

---

*Generated by ClaudeForge • Your data stays on your machine • All files are plain markdown you can read and edit*
`;
}
