import { useState, useRef } from 'react';
import { Upload, FileText, Eye, X, Trash2 } from 'lucide-react';
import { usePatientData } from '../../hooks/usePatientData';
import { useAuth } from '../../contexts/AuthContext';
import { addHealthReport, addBodyMetric } from '../../lib/firestore';
import { generateId } from '../../utils/storage';
import MetricExtractor from './MetricExtractor';

const REPORT_TYPES = ['InBody', 'DEXA', 'Blood Work', 'Other'];

export default function HealthReports() {
  const { user } = useAuth();
  const [reports, setReports] = usePatientData('health_reports', []);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportType, setReportType] = useState('InBody');
  const [showExtractor, setShowExtractor] = useState(false);
  const [viewing, setViewing] = useState(null);
  const fileRef = useRef(null);

  const handleFiles = (files) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
      });
      setShowExtractor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSave = async (extractedMetrics) => {
    const reportId = generateId();
    const report = {
      id: reportId,
      type: reportType.toLowerCase().replace(' ', ''),
      name: selectedFile.name,
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      fileData: selectedFile.data,
      extractedMetrics,
      date: new Date().toISOString().split('T')[0],
    };
    setReports(prev => [report, ...prev]);

    // Also create a body metrics entry if we have weight/BF data
    if (extractedMetrics && (extractedMetrics.weight || extractedMetrics.bodyFatPct)) {
      const metric = {
        id: generateId(),
        date: report.date,
        source: reportType.toLowerCase().replace(' ', ''),
        weight: extractedMetrics.weight || null,
        bodyFatPct: extractedMetrics.bodyFatPct || null,
        muscleMass: extractedMetrics.muscleMass || null,
        bmi: extractedMetrics.bmi || null,
        bmr: extractedMetrics.bmr || null,
        reportId,
      };
      if (user?.uid) {
        try { await addBodyMetric(user.uid, metric); } catch (e) { console.error(e); }
      }
    }

    if (user?.uid) {
      try { await addHealthReport(user.uid, report); } catch (e) { console.error(e); }
    }

    setSelectedFile(null);
    setShowExtractor(false);
  };

  const isImage = (t) => t?.startsWith('image/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Report type selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {REPORT_TYPES.map(t => (
          <button key={t} onClick={() => setReportType(t)} style={{
            padding: '6px 14px', borderRadius: '50px',
            background: reportType === t ? 'var(--color-accent)' : 'white',
            color: reportType === t ? 'white' : 'var(--color-text)',
            border: `1px solid ${reportType === t ? 'var(--color-accent)' : 'var(--color-border)'}`,
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      {!showExtractor && (
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: '14px', padding: '32px 20px', textAlign: 'center',
            background: dragActive ? 'rgba(112,142,134,0.05)' : 'white',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <Upload size={28} style={{ color: 'var(--color-accent)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '4px' }}>
            Upload {reportType} Report
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
            Drag & drop or tap to select (photo or PDF)
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
        </div>
      )}

      {/* Metric extractor */}
      {showExtractor && selectedFile && (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {selectedFile.name}
            </div>
            <button onClick={() => { setShowExtractor(false); setSelectedFile(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
              <X size={16} />
            </button>
          </div>
          {isImage(selectedFile.type) && (
            <img src={selectedFile.data} alt="Report preview"
              style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', marginBottom: '12px', background: 'var(--color-bg-alt)' }} />
          )}
          <MetricExtractor reportType={reportType} onSave={handleSave} onCancel={() => { setShowExtractor(false); setSelectedFile(null); }} />
        </div>
      )}

      {/* Reports list */}
      {reports.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Report History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reports.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px', background: 'white',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FileText size={18} color="var(--color-accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{r.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text)' }}>
                    {r.type} &bull; {r.date}
                    {r.extractedMetrics?.weight && ` &bull; ${r.extractedMetrics.weight} lbs`}
                  </div>
                </div>
                {r.fileData && isImage(r.fileType) && (
                  <button onClick={() => setViewing(viewing === r.id ? null : r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }}>
                    <Eye size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {viewing && (() => {
        const r = reports.find(r => r.id === viewing);
        return r?.fileData ? (
          <div onClick={() => setViewing(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
          }}>
            <img src={r.fileData} alt={r.name} style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px' }} />
          </div>
        ) : null;
      })()}
    </div>
  );
}
