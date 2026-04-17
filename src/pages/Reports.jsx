import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Eye, X, Download, Image, File } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { generateId } from '../utils/storage';

export default function Reports() {
  const [reports, setReports] = usePatientData('medical_reports', []);
  const [viewing, setViewing] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReports(prev => [...prev, {
          id: generateId(), name: file.name, type: file.type,
          size: file.size, data: e.target.result,
          uploadedAt: new Date().toISOString(), notes: '',
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); };
  const deleteReport = (id) => { setReports(prev => prev.filter(r => r.id !== id)); if (viewing?.id === id) setViewing(null); };
  const updateNotes = (id, notes) => setReports(prev => prev.map(r => r.id === id ? { ...r, notes } : r));
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  const isImage = (t) => t?.startsWith('image/');
  const isPDF = (t) => t === 'application/pdf';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>Medical Reports</h1>
        <p style={{ fontSize: '0.85rem' }}>Upload and manage your MRI scans, X-rays, and medical documents</p>
      </div>

      {/* Upload Zone */}
      <div
        style={{
          background: 'white', borderRadius: '16px',
          border: `2px dashed ${dragActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
          padding: '32px 20px', textAlign: 'center', transition: 'all 0.2s',
          backgroundColor: dragActive ? 'var(--color-bg-alt)' : 'white',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload size={28} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--color-accent)' }} />
        <h4 style={{ marginBottom: '4px' }}>Upload Medical Reports</h4>
        <p style={{ fontSize: '0.82rem', marginBottom: '14px' }}>
          Drag & drop your MRI scans, X-rays, or medical documents here
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginBottom: '14px' }}>
          Supported: Images (JPG, PNG), PDFs — stored locally on your device
        </p>
        <button onClick={() => fileInputRef.current.click()} style={{
          background: 'var(--color-secondary)', color: 'white',
          padding: '10px 20px', borderRadius: '50px', border: 'none',
          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '1.5px', cursor: 'pointer',
        }}>
          Browse Files
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.dcm"
          onChange={(e) => handleFiles(e.target.files)} style={{ display: 'none' }} />
      </div>

      {/* Privacy */}
      <div style={{
        background: 'var(--color-bg-alt)', borderRadius: '10px', padding: '12px 14px',
        fontSize: '0.75rem', color: 'var(--color-text)', display: 'flex', gap: '8px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1rem' }}>🔒</span>
        <div>
          <strong style={{ color: 'var(--color-secondary)' }}>Privacy First:</strong> All files are stored locally in your browser. Nothing is uploaded to any server.
        </div>
      </div>

      {/* Report List */}
      {reports.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>Your Reports ({reports.length})</h3>
          {reports.map(report => (
            <div key={report.id} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid var(--color-border)', padding: '14px',
              display: 'flex', gap: '14px', flexWrap: 'wrap',
            }}>
              <div
                onClick={() => setViewing(report)}
                style={{
                  width: '100px', height: '80px', borderRadius: '10px',
                  background: 'var(--color-bg-alt)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                }}
              >
                {isImage(report.type) ? (
                  <img src={report.data} alt={report.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isPDF(report.type) ? (
                  <FileText size={28} style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <File size={28} style={{ color: 'var(--color-tertiary)' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>{report.name}</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
                      {formatSize(report.size)} — Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <IconBtn onClick={() => setViewing(report)} icon={<Eye size={13} />} />
                    <a href={report.data} download={report.name} style={{
                      padding: '6px', borderRadius: '8px', background: 'var(--color-bg-alt)',
                      color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Download size={13} /></a>
                    <IconBtn onClick={() => deleteReport(report.id)} icon={<Trash2 size={13} />} danger />
                  </div>
                </div>
                <textarea value={report.notes} onChange={(e) => updateNotes(report.id, e.target.value)}
                  placeholder="Add notes (e.g., 'ACL MRI — partial tear Grade 2')"
                  rows={2} style={{ marginTop: '8px', fontSize: '0.78rem' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {reports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Image size={40} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--color-border)' }} />
          <h4>No Reports Yet</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Upload your first MRI scan or medical document above</p>
        </div>
      )}

      {/* Viewer Modal */}
      {viewing && (
        <div onClick={() => setViewing(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px',
            maxWidth: '900px', maxHeight: '90vh', width: '100%', overflow: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid var(--color-border)',
            }}>
              <h4 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewing.name}</h4>
              <button onClick={() => setViewing(null)} style={{
                padding: '6px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', color: 'var(--color-secondary)',
              }}><X size={18} /></button>
            </div>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              {isImage(viewing.type) ? (
                <img src={viewing.data} alt={viewing.name} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} />
              ) : isPDF(viewing.type) ? (
                <iframe src={viewing.data} style={{ width: '100%', height: '75vh', borderRadius: '8px', border: 'none' }} title={viewing.name} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <File size={40} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--color-tertiary)' }} />
                  <p>Preview not available</p>
                  <a href={viewing.data} download={viewing.name} style={{ color: 'var(--color-accent)', fontSize: '0.85rem' }}>Download to view</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ onClick, icon, danger }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px', borderRadius: '8px', border: 'none',
      background: danger ? '#FFF3F0' : 'var(--color-bg-alt)',
      color: danger ? '#E57373' : 'var(--color-accent)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
    }}>{icon}</button>
  );
}
