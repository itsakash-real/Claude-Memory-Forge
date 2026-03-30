import { useState, useEffect, useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import { api } from '../services/api';

export default function PreviewPanel() {
  const { sessionId, currentStep, loading, preview, setPreview } = useSession();
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api.getPreview(sessionId).then(data => setPreview(data)).catch(console.error);
  }, [sessionId, currentStep, setPreview]);

  const handleFileClick = async (path) => {
    setActiveFile(path);
    setLoadingFile(true);
    try {
      if (preview?.files[path]?.fullContent) {
        setFileContent(preview.files[path].fullContent);
      } else {
        const data = await api.getFilePreview(sessionId, path);
        setFileContent(data.fullContent);
      }
    } catch (err) {
      console.error(err);
      setFileContent('Failed to load file content.');
    } finally {
      setLoadingFile(false);
    }
  };

  const getStepForFile = (filePath) => {
    if (filePath.includes('people') || filePath.includes('relationships')) return 1;
    if (filePath.includes('projects') || filePath.includes('TASKS.md')) return 2;
    if (filePath.includes('tools')) return 3;
    if (filePath.includes('clients')) return 4;
    return 0;
  };

  const getDotState = (filePath) => {
    const step = getStepForFile(filePath);
    if (currentStep > step) return 'done';
    if (currentStep === step && loading) return 'generating';
    return 'grey';
  };

  const visibleTree = useMemo(() => {
    if (!preview || !preview.files) return null;
    if (currentStep === 0 && !loading) return null;
    const visiblePaths = Object.keys(preview.files).filter(path => {
      const step = getStepForFile(path);
      return currentStep > step || (currentStep === step && loading);
    });
    if (visiblePaths.length === 0) return null;
    const tree = {};
    for (const p of visiblePaths) {
      const parts = p.split('/');
      let node = tree;
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) node[parts[i]] = null;
        else { if (!node[parts[i]]) node[parts[i]] = {}; node = node[parts[i]]; }
      }
    }
    return tree;
  }, [preview, currentStep, loading]);

  const totalVisibleFiles = useMemo(() => {
    if (!visibleTree) return 0;
    let count = 0;
    const walk = (n) => { for (const [, v] of Object.entries(n)) { if (v === null) count++; else walk(v); }};
    walk(visibleTree);
    return count;
  }, [visibleTree]);

  useEffect(() => {
    if (activeFile && preview) {
      const step = getStepForFile(activeFile);
      if (!(currentStep > step || (currentStep === step && loading))) {
        setActiveFile(null);
        setFileContent(null);
      }
    }
  }, [visibleTree, activeFile, currentStep, loading, preview]);

  const FOLDER_ICONS = { people: '👤', projects: '📁', tools: '🔧', clients: '🏢', assistant: '🧠', hooks: '⚡', memory: '💾' };

  const renderTree = (node, pathPrefix = '') => {
    if (!node) return null;
    return Object.entries(node).map(([key, value]) => {
      const fullPath = pathPrefix ? `${pathPrefix}/${key}` : key;
      const isFile = value === null;
      if (!isFile) {
        return (
          <div key={fullPath} style={{ marginBottom: '6px', animation: 'stepIn 0.3s ease forwards' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase',
              color: 'var(--text3)', marginBottom: '3px', letterSpacing: '0.3px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <span style={{ fontSize: '11px' }}>{FOLDER_ICONS[key] || '📁'}</span> {key}
            </div>
            <div style={{ paddingLeft: '14px', borderLeft: '1px solid var(--border)' }}>
              {renderTree(value, fullPath)}
            </div>
          </div>
        );
      }
      const dotState = getDotState(fullPath);
      const isActive = activeFile === fullPath;
      return (
        <div key={fullPath} onClick={() => handleFileClick(fullPath)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            color: isActive ? 'var(--accent)' : 'var(--text2)',
            padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: isActive ? 'var(--accent-dim)' : 'transparent',
            transition: 'all 0.15s ease', animation: 'stepIn 0.3s ease forwards'
          }}>
          <span className={`file-dot ${dotState === 'generating' ? 'generating' : dotState === 'done' ? 'done' : ''}`} />
          {key}
        </div>
      );
    });
  };

  return (
    <div className="preview-panel" style={{
      width: '320px', position: 'sticky', top: '58px',
      height: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid var(--border)', background: 'var(--bg2)'
    }}>
      {/* Panel Header */}
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)'
        }}>Generated Files</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: 'var(--accent)', backgroundColor: 'var(--accent-dim)',
          border: '1px solid rgba(212,165,116,0.2)',
          padding: '3px 10px', borderRadius: '20px'
        }}>{totalVisibleFiles} files</span>
      </div>

      {/* File Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {visibleTree ? renderTree(visibleTree) : (
          <div style={{
            color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '13px',
            lineHeight: 1.7, padding: '20px 0', textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px', opacity: 0.4 }}>◇</div>
            Complete each step to see<br/>generated files appear here.
          </div>
        )}
      </div>

      {/* File Viewer */}
      <div style={{
        height: '220px', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', background: 'var(--bg)'
      }}>
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text2)',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {activeFile ? (
            <>
              <span className="file-dot done"/>
              {activeFile.split('/').pop()}
            </>
          ) : (
            <span style={{ color: 'var(--text3)' }}>File Viewer</span>
          )}
        </div>
        
        <div style={{
          flex: 1, overflowY: 'auto', padding: '14px 16px',
          fontFamily: 'var(--font-mono)', fontSize: '13px',
          color: 'var(--text3)', lineHeight: 1.65, whiteSpace: 'pre-wrap'
        }}>
          {!activeFile ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', opacity: 0.5 }}>
              <span style={{ fontSize: '20px' }}>◻</span>
              <span style={{ fontSize: '11px' }}>Select a file to preview</span>
            </div>
          ) : loadingFile ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ animation: 'spin 1s linear infinite', fontSize: '16px' }}>⟳</span>
            </div>
          ) : fileContent}
        </div>
      </div>
    </div>
  );
}
