/**
 * ClaudeForge API Test Script
 * Run: node test.js YOUR_GEMINI_API_KEY
 */

const API = 'http://localhost:3001/api';
const API_KEY = process.argv[2];

if (!API_KEY) {
  console.log('❌ Usage: node test.js YOUR_GEMINI_API_KEY');
  process.exit(1);
}

async function post(url, body) {
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function get(url) {
  const res = await fetch(`${API}${url}`);
  return res.json();
}

async function run() {
  console.log('\n⚡ ClaudeForge API Test\n');

  // 1. Health check
  console.log('1️⃣  Health check...');
  try {
    const hRes = await fetch('http://localhost:3001/health');
    const hData = await hRes.json();
    console.log('   ✅', hData);
  } catch (e) {
    console.log('   ❌ Backend not running on port 3001! Start it first.');
    console.log('   Run: npm run dev (from Novacode root)');
    return;
  }

  // 2. Validate API key
  console.log('\n2️⃣  Validating API key...');
  const validation = await post('/validate-key', { apiKey: API_KEY });
  console.log('   ', validation.valid ? '✅ Key valid!' : `❌ Key invalid: ${validation.error}`);
  if (!validation.valid) return;

  // 3. Start session
  console.log('\n3️⃣  Starting session...');
  const session = await post('/session/start', { apiKey: API_KEY });
  console.log('   ✅ Session:', session.sessionId);
  const sid = session.sessionId;

  // 4. Submit Identity (Step 0)
  console.log('\n4️⃣  Submitting identity (calling Gemini)...');
  const t1 = Date.now();
  const step1 = await post(`/session/${sid}/answer`, {
    stepIndex: 0,
    answer: {
      name: 'Akash',
      role: 'Full Stack Developer',
      company: 'Indie',
      location: 'India',
      claudeUsage: 'Building web apps, debugging, code reviews',
      devLevel: 'advanced',
      bio: 'I love building tools and shipping fast'
    }
  });
  console.log(`   ✅ Step 1 done in ${((Date.now() - t1) / 1000).toFixed(1)}s`);
  console.log('   Refined keys:', step1.refinedKeys);

  // 5. Submit People (Step 1) - empty
  console.log('\n5️⃣  Submitting people (skip)...');
  const step2 = await post(`/session/${sid}/answer`, {
    stepIndex: 1,
    answer: { people: [] }
  });
  console.log('   ✅ Step 2 done');

  // 6. Submit Projects (Step 2) - one project
  console.log('\n6️⃣  Submitting project (calling Gemini)...');
  const t3 = Date.now();
  const step3 = await post(`/session/${sid}/answer`, {
    stepIndex: 2,
    answer: {
      projects: [{
        name: 'ClaudeForge',
        description: 'A web app to generate Claude memory systems',
        status: 'active',
        techStack: 'React, Express, Gemini API',
        goals: 'Ship v1'
      }]
    }
  });
  console.log(`   ✅ Step 3 done in ${((Date.now() - t3) / 1000).toFixed(1)}s`);
  console.log('   Refined keys:', step3.refinedKeys);

  // 7. Tools (Step 3)
  console.log('\n7️⃣  Submitting tools (calling Gemini)...');
  const step4 = await post(`/session/${sid}/answer`, {
    stepIndex: 3,
    answer: { tools: ['VS Code', 'Git', 'Node.js', 'React'], ides: 'VS Code', toolNotes: '' }
  });
  console.log('   ✅ Step 4 done');

  // 8. Clients (Step 4) - skip
  console.log('\n8️⃣  Skipping clients...');
  await post(`/session/${sid}/answer`, { stepIndex: 4, answer: { clients: [] } });
  console.log('   ✅ Skipped');

  // 9. Preferences (Step 5)
  console.log('\n9️⃣  Submitting preferences...');
  await post(`/session/${sid}/answer`, {
    stepIndex: 5,
    answer: { communicationStyle: 'concise', technicalLevel: 'advanced', workflowHabits: 'Ship fast', trackingPreferences: 'Projects', decayPreference: 'default', additionalPrefs: '' }
  });
  console.log('   ✅ Done');

  // 10. Glossary (Step 6) - skip
  console.log('\n🔟  Skipping glossary...');
  await post(`/session/${sid}/answer`, { stepIndex: 6, answer: { terms: [] } });
  console.log('   ✅ Skipped');

  // 11. Review (Step 7)
  console.log('\n1️⃣1️⃣  Submitting review step...');
  await post(`/session/${sid}/answer`, { stepIndex: 7, answer: {} });

  // 12. Preview files
  console.log('\n1️⃣2️⃣  Getting file preview...');
  const preview = await get(`/session/${sid}/preview`);
  console.log(`   ✅ ${preview.totalFiles} files generated:`);
  for (const [path, info] of Object.entries(preview.files)) {
    console.log(`      📄 ${path} (${info.lines} lines, ${info.size} bytes)`);
  }

  // 13. Download ZIP
  console.log('\n1️⃣3️⃣  Testing ZIP download...');
  const zipRes = await fetch(`${API}/session/${sid}/download`);
  const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
  const fs = await import('fs');
  const path = await import('path');
  const outPath = path.join(process.cwd(), 'claude-memory-system.zip');
  fs.writeFileSync(outPath, zipBuffer);
  console.log(`   ✅ ZIP saved: ${outPath} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);

  console.log('\n🎉 All tests passed! Your ClaudeForge is working.\n');
}

run().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
