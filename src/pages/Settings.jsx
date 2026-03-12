import { Link } from 'react-router-dom';

export default function Settings() {
  return (
    <div className="page">
      <header className="page-header">
        <Link to="/" className="back-btn">← Zurück</Link>
        <h1>Einstellungen</h1>
      </header>

      <div className="settings-form">
        <p className="settings-info">
          Die KD Lernapp nutzt einen sicheren Backend-Server für die KI-Zusammenfassungen.
          Der API-Key ist serverseitig gespeichert und nicht im Browser sichtbar.
        </p>

        <label className="form-label">Version</label>
        <p className="form-hint">KD Lernapp v1.0</p>

        <label className="form-label">Daten</label>
        <p className="form-hint">
          Alle Projekte und Zusammenfassungen werden lokal in deinem Browser gespeichert.
        </p>
      </div>
    </div>
  );
}
