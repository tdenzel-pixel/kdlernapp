import { Link } from 'react-router-dom';
import { SUBJECTS } from '../subjects';

export default function Home({ projects }) {
  return (
    <div className="page">
      <header className="page-header">
        <h1>KD Lernapp</h1>
        <p className="subtitle">Wähle ein Fach</p>
      </header>
      <div className="subject-grid">
        {SUBJECTS.map((subject) => {
          const count = projects.filter((p) => p.subject === subject.id).length;
          return (
            <Link
              to={`/subject/${subject.id}`}
              key={subject.id}
              className="subject-card"
              style={{ '--accent': subject.color }}
            >
              <span className="subject-icon">{subject.icon}</span>
              <span className="subject-name">{subject.name}</span>
              {count > 0 && <span className="subject-badge">{count}</span>}
            </Link>
          );
        })}
      </div>
      <Link to="/scan" className="fab">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Scannen
      </Link>
    </div>
  );
}
