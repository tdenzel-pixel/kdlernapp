import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBJECTS } from '../subjects';
import { summarizeImages } from '../api/claude';
import { compressImage } from '../utils/compressImage';

export default function Scan({ projects, onCreateProject, onAddScan }) {
  const [mode, setMode] = useState('choose');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const subjectProjects = projects.filter((p) => p.subject === selectedSubject);

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    Promise.all(files.map((file) => compressImage(file))).then((results) =>
      setImages((prev) => [...prev, ...results])
    );
    e.target.value = '';
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!selectedSubject) { setError('Bitte wähle ein Fach.'); return; }
    if (mode === 'new' && !newProjectName.trim()) { setError('Bitte gib einen Projektnamen ein.'); return; }
    if (mode === 'existing' && !selectedProject) { setError('Bitte wähle ein Projekt.'); return; }
    if (images.length === 0) { setError('Bitte lade mindestens ein Bild hoch.'); return; }
    setLoading(true);
    setError('');

    try {
      const subjectName = SUBJECTS.find((s) => s.id === selectedSubject).name;
      const summary = await summarizeImages(images, subjectName);
      const scan = {
        id: Date.now().toString(),
        summary,
        pageCount: images.length,
        scannedAt: new Date().toISOString(),
      };

      let targetProjectId;
      if (mode === 'new') {
        targetProjectId = onCreateProject(newProjectName.trim(), selectedSubject);
      } else {
        targetProjectId = selectedProject;
      }

      onAddScan(targetProjectId, scan);
      navigate(`/project/${targetProjectId}`);
    } catch (err) {
      setError(err.message || 'Fehler beim Zusammenfassen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Zurück</button>
        <h1>Notizen scannen</h1>
      </header>

      <div className="scan-form">
        <label className="form-label">1. Fach wählen</label>
        <div className="subject-select-grid">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              className={`subject-chip ${selectedSubject === s.id ? 'active' : ''}`}
              style={{ '--accent': s.color }}
              onClick={() => { setSelectedSubject(s.id); setSelectedProject(''); setMode('choose'); }}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        {selectedSubject && (
          <>
            <label className="form-label">2. Projekt</label>
            <div className="project-mode-btns">
              <button
                className={`btn ${mode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMode('new')}
              >
                Neues Projekt
              </button>
              {subjectProjects.length > 0 && (
                <button
                  className={`btn ${mode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('existing')}
                >
                  Zu Projekt hinzufügen
                </button>
              )}
            </div>

            {mode === 'new' && (
              <input
                type="text"
                className="input"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Projektname eingeben..."
                autoFocus
              />
            )}

            {mode === 'existing' && (
              <div className="project-select-list">
                {subjectProjects.map((p) => (
                  <button
                    key={p.id}
                    className={`project-select-item ${selectedProject === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedProject(p.id)}
                  >
                    <span className="project-select-name">{p.name}</span>
                    <span className="project-select-meta">{p.scans.length} Scans</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {(mode === 'new' || mode === 'existing') && (
          <>
            <div className="form-label-row">
              <label className="form-label">3. Seiten hochladen</label>
              {images.length > 0 && (
                <span className="page-count">{images.length} {images.length === 1 ? 'Seite' : 'Seiten'}</span>
              )}
            </div>
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
            )}

            {error && <p className="error-message">{error}</p>}

            <button
              className="btn btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={loading || images.length === 0}
            >
              {loading ? (
                <span className="spinner-wrap"><span className="spinner" /> Zusammenfassen...</span>
              ) : (
                `${images.length} ${images.length === 1 ? 'Seite' : 'Seiten'} zusammenfassen`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
