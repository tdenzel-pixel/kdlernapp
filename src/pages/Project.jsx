import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSubject } from '../subjects';
import { summarizeImages } from '../api/claude';
import { jsPDF } from 'jspdf';

function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    if (line.startsWith('# ')) return <h2 key={i}>{line.slice(2)}</h2>;
    if (line.startsWith('## ')) return <h3 key={i}>{line.slice(3)}</h3>;
    if (line.startsWith('### ')) return <h4 key={i}>{line.slice(4)}</h4>;
    if (line.startsWith('- ') || line.startsWith('* '))
      return <li key={i}>{line.slice(2)}</li>;
    if (line.startsWith('**') && line.endsWith('**'))
      return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
    return <p key={i}>{line}</p>;
  });
}

export default function Project({ projects, onAddScan, onDeleteProject, onDeleteScan }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === id);
  const subject = project ? getSubject(project.subject) : null;

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [deleteProjectModal, setDeleteProjectModal] = useState(false);
  const [deleteScanTarget, setDeleteScanTarget] = useState(null);
  const fileInputRef = useRef(null);

  if (!project || !subject) {
    return (
      <div className="page">
        <Link to="/" className="back-btn">← Startseite</Link>
        <p>Projekt nicht gefunden.</p>
      </div>
    );
  }

  const totalPages = project.scans.reduce((sum, s) => sum + s.pageCount, 0);
  const combinedSummary = project.scans.map((s) => s.summary).join('\n\n---\n\n');

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const readers = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const [header, data] = dataUrl.split(',');
            const mediaType = header.match(/:(.*?);/)[1];
            resolve({ data, mediaType, preview: dataUrl, name: file.name });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((results) => setImages((prev) => [...prev, ...results]));
    e.target.value = '';
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleScan() {
    if (images.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const summary = await summarizeImages(images, subject.name);
      const scan = {
        id: Date.now().toString(),
        summary,
        pageCount: images.length,
        scannedAt: new Date().toISOString(),
      };
      onAddScan(project.id, scan);
      setImages([]);
      setShowScanner(false);
    } catch (err) {
      setError(err.message || 'Fehler beim Zusammenfassen.');
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteProject() {
    onDeleteProject(project.id);
    navigate(`/subject/${project.subject}`);
  }

  function confirmDeleteScan() {
    if (deleteScanTarget) {
      onDeleteScan(project.id, deleteScanTarget.id);
      setDeleteScanTarget(null);
    }
  }

  function handleExportPdf() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(project.name, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `${subject.name} · ${new Date(project.updatedAt).toLocaleDateString('de-DE')} · ${project.scans.length} Scans · ${totalPages} Seiten`,
      margin, y
    );
    y += 12;
    doc.setTextColor(0);

    const lines = combinedSummary.split('\n');
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      if (line === '---') { y += 4; doc.setDrawColor(200); doc.line(margin, y, pageWidth - margin, y); y += 6; continue; }
      if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); y += 4;
        const w = doc.splitTextToSize(line.slice(2), maxWidth); doc.text(w, margin, y); y += w.length * 6 + 2;
      } else if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); y += 3;
        const w = doc.splitTextToSize(line.slice(3), maxWidth); doc.text(w, margin, y); y += w.length * 5.5 + 2;
      } else if (line.startsWith('### ')) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); y += 2;
        const w = doc.splitTextToSize(line.slice(4), maxWidth); doc.text(w, margin, y); y += w.length * 5 + 2;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const w = doc.splitTextToSize(line.slice(2), maxWidth - 6);
        doc.text('\u2022', margin, y); doc.text(w, margin + 6, y); y += w.length * 4.5 + 1.5;
      } else if (line.trim() === '') {
        y += 3;
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const w = doc.splitTextToSize(line, maxWidth); doc.text(w, margin, y); y += w.length * 4.5 + 1.5;
      }
    }

    const filename = project.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '_');
    doc.save(`${filename}.pdf`);
  }

  return (
    <div className="page">
      <header className="page-header">
        <Link to={`/subject/${project.subject}`} className="back-btn">← {subject.name}</Link>
        <h1>{project.name}</h1>
        <p className="subtitle">
          {subject.icon} {subject.name} · {project.scans.length} {project.scans.length === 1 ? 'Scan' : 'Scans'} · {totalPages} {totalPages === 1 ? 'Seite' : 'Seiten'}
        </p>
        <div className="header-actions">
          <button className="btn btn-pdf" onClick={handleExportPdf} disabled={project.scans.length === 0}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Als PDF exportieren
          </button>
          <button className="btn-icon-delete" onClick={() => setDeleteProjectModal(true)} title="Projekt löschen">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </header>

      {project.scans.length === 0 ? (
        <div className="empty-state">
          <p>Noch keine Scans. Füge deine ersten Notizen hinzu!</p>
          <button className="btn btn-primary" onClick={() => setShowScanner(true)}>Blätter scannen</button>
        </div>
      ) : (
        <>
          <article className="summary-content">
            {project.scans.map((scan, idx) => (
              <div key={scan.id} className="scan-section">
                <div className="scan-section-header">
                  <span className="scan-section-label">
                    Scan {idx + 1} · {scan.pageCount} {scan.pageCount === 1 ? 'Seite' : 'Seiten'} · {new Date(scan.scannedAt).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <button className="btn-delete-inline" onClick={() => setDeleteScanTarget(scan)} title="Scan löschen">✕</button>
                </div>
                {renderMarkdown(scan.summary)}
                {idx < project.scans.length - 1 && <hr className="scan-divider" />}
              </div>
            ))}
          </article>
        </>
      )}

      <button className="fab" style={{ '--accent': subject.color }} onClick={() => setShowScanner(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Weitere Blätter hinzufügen
      </button>

      {showScanner && (
        <div className="modal-overlay" onClick={() => { if (!loading) { setShowScanner(false); setImages([]); setError(''); } }}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>Blätter scannen</h2>
            <p className="modal-desc">Lade Fotos deiner Notizen hoch und lass sie zusammenfassen.</p>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} hidden />

            {images.length === 0 ? (
              <button className="btn btn-upload" onClick={() => fileInputRef.current.click()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Bilder auswählen (mehrere möglich)
              </button>
            ) : (
              <>
                <div className="form-label-row">
                  <span className="form-label">Vorschau</span>
                  <span className="page-count">{images.length} {images.length === 1 ? 'Seite' : 'Seiten'}</span>
                </div>
                <div className="image-previews">
                  {images.map((img, i) => (
                    <div key={i} className="preview-item">
                      <span className="preview-number">{i + 1}</span>
                      <img src={img.preview} alt={img.name} />
                      <button className="preview-remove" onClick={() => removeImage(i)}>✕</button>
                    </div>
                  ))}
                  <button className="preview-add" onClick={() => fileInputRef.current.click()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Mehr
                  </button>
                </div>
              </>
            )}

            {error && <p className="error-message">{error}</p>}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowScanner(false); setImages([]); setError(''); }} disabled={loading}>
                Abbrechen
              </button>
              <button className="btn btn-primary" onClick={handleScan} disabled={loading || images.length === 0}>
                {loading ? (
                  <span className="spinner-wrap"><span className="spinner" /> Zusammenfassen...</span>
                ) : (
                  `${images.length} ${images.length === 1 ? 'Seite' : 'Seiten'} zusammenfassen`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProjectModal && (
        <div className="modal-overlay" onClick={() => setDeleteProjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Projekt löschen</h2>
            <p className="modal-desc">
              Willst du &laquo;{project.name}&raquo; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteProjectModal(false)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={handleDeleteProject}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {deleteScanTarget && (
        <div className="modal-overlay" onClick={() => setDeleteScanTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Scan löschen</h2>
            <p className="modal-desc">
              Willst du diesen Scan ({deleteScanTarget.pageCount} {deleteScanTarget.pageCount === 1 ? 'Seite' : 'Seiten'}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteScanTarget(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={confirmDeleteScan}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
