import archiver from 'archiver';
import { buildFileMap } from './templateEngine.js';

/**
 * Generate a ZIP file from session data and stream it to the response.
 */
export async function generateZip(session, res) {
  const files = buildFileMap(session);
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="claude-memory.zip"');

  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.on('error', (err) => {
    console.error('❌ ZIP generation error:', err);
    throw err;
  });

  archive.pipe(res);

  // Add all files to the ZIP under claude-memory-system/ prefix
  for (const [filePath, content] of Object.entries(files)) {
    const zipPath = `.claude/${filePath}`;
    archive.append(content, { name: zipPath });
  }

  await archive.finalize();
  return Object.keys(files).length;
}

/**
 * Get a preview of all files that would be generated (without creating ZIP).
 */
export function getFilePreview(session) {
  const files = buildFileMap(session);
  const preview = {};
  
  for (const [filePath, content] of Object.entries(files)) {
    preview[filePath] = {
      path: filePath,
      size: Buffer.byteLength(content, 'utf-8'),
      preview: content.substring(0, 500) + (content.length > 500 ? '\n...' : ''),
      fullContent: content,
      lines: content.split('\n').length
    };
  }

  // Build file tree structure
  const tree = buildTree(Object.keys(files));

  return { files: preview, tree, totalFiles: Object.keys(files).length };
}

function buildTree(paths) {
  const tree = {};
  for (const p of paths) {
    const parts = p.split('/');
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = null; // leaf (file)
      } else {
        if (!node[part]) node[part] = {};
        node = node[part];
      }
    }
  }
  return tree;
}
