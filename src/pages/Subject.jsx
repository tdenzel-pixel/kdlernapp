import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSubject } from '../subjects';

export default function Subject({ projects, onCreateProject, onDeleteProject }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const subject = getSubject(id);
  const subjectProjects = projects.filter((p) => p.subject === id);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (!subject) return <div className="page"><p>Fach nicht gefunden.</p></div>;

  function handleCreate() {
    if (!newName.trim()) return;
    const projectId = onCreateProject(newName.trim(), id);
    setShowCreate(false);
    setNewName('');
    navigate(`/project/${projectId}`);
  }

  function confirmDelete() {
    if (deleteTarget) {
      onDeleteProject(deleteTarget.id);
      setDeleteTarget(null);
    }
  }

  function getTotalPages(project) {
    return project.scans.reduce((sum, s) => sum + s.pageCount, 0);
  }

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/" className="back-btn">← Zurück</Link>
        <h1><span>{subject.icon}</span> {subject.name}</h1>
        <p className="subtitle">{subjectProjects.length} {subjectProjects.length === 1 ? 'Projekt' : 'Projekte'}</p>
      </header>

      {subjectProjects.length === 0 ? (
        <div className="empty-state">
          <p>Noch keine Projekte.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Neues Projekt</button>
        </div>
      ) : (
        <div className="entries-list">
          {subjectProjects.map((project) => (
            <div key={project.id} className="entry-card">
              <Link to={`/project/${project.id}`} className="entry-link">
                <h3 className="entry-name">{project.name}</h3>
                <div className="entry-header">
                  <span className="entry-date">
                    {new Date(project.updatedAt).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                  <div className="entry-stats">
                    <span className="entry-pages">{project.scans.length} {project.scans.length === 1 ? 'Scan' : 'Scans'}</span>
                    <span className="entry-pages">{getTotalPages(project)} {getTotalPages(project) === 1 ? 'Seite' : 'Seiten'}</span>
                  </div>
                </div>
                {project.scans.length > 0 && (
                  <p className="entry-preview">{project.scans[0].summary.slice(0, 120)}...</p>
                )}
              </Link>
              <button
                className="btn-delete"
                onClick={() => setDeleteTarget(project)}
                title="Löschen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button className="fab" style={{ '--accent': subject.color }} onClick={() => setShowCreate(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Neues Projekt
      </button>

      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setNewName(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Neues Projekt</h2>
            <p className="modal-desc">Wie soll das Projekt heißen?</p>
            <input
              type="text"
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. Kapitel 3 – Fotosynthese"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setNewName(''); }}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>Erstellen</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Projekt löschen</h2>
            <p className="modal-desc">
              Willst du &laquo;{deleteTarget.name}&raquo; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Abbrechen</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
