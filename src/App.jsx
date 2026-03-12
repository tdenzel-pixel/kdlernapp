import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import Home from './pages/Home';
import Subject from './pages/Subject';
import Project from './pages/Project';
import Scan from './pages/Scan';
import Settings from './pages/Settings';
import './App.css';

export default function App() {
  const [projects, setProjects] = useLocalStorage('kd-projects', []);

  function createProject(name, subjectId) {
    const project = {
      id: Date.now().toString(),
      name,
      subject: subjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scans: [],
    };
    setProjects((prev) => [...prev, project]);
    return project.id;
  }

  function addScan(projectId, scan) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, scans: [...p.scans, scan], updatedAt: new Date().toISOString() }
          : p
      )
    );
  }

  function deleteProject(projectId) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  function deleteScan(projectId, scanId) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, scans: p.scans.filter((s) => s.id !== scanId), updatedAt: new Date().toISOString() }
          : p
      )
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="bottom-nav">
          <Link to="/" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            Home
          </Link>
          <Link to="/scan" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Scan
          </Link>
          <Link to="/settings" className="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home projects={projects} />} />
            <Route path="/subject/:id" element={
              <Subject projects={projects} onCreateProject={createProject} onDeleteProject={deleteProject} />
            } />
            <Route path="/project/:id" element={
              <Project projects={projects} onAddScan={addScan} onDeleteProject={deleteProject} onDeleteScan={deleteScan} />
            } />
            <Route path="/scan" element={
              <Scan projects={projects} onCreateProject={createProject} onAddScan={addScan} />
            } />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
