export const SUBJECTS = [
  { id: 'it', name: 'IT', icon: '💻', color: '#6366f1' },
  { id: 'deutsch', name: 'Deutsch', icon: '📖', color: '#ec4899' },
  { id: 'geo', name: 'Geo', icon: '🌍', color: '#22c55e' },
  { id: 'mathe', name: 'Mathe', icon: '🔢', color: '#f59e0b' },
  { id: 'musik', name: 'Musik', icon: '🎵', color: '#a855f7' },
  { id: 'werken', name: 'Werken', icon: '🔧', color: '#f97316' },
  { id: 'bio', name: 'Bio', icon: '🧬', color: '#10b981' },
  { id: 'religion', name: 'Religion', icon: '🕊️', color: '#8b5cf6' },
  { id: 'geschichte', name: 'Geschichte', icon: '🏛️', color: '#ef4444' },
  { id: 'englisch', name: 'Englisch', icon: '🇬🇧', color: '#3b82f6' },
  { id: 'sport', name: 'Sport', icon: '⚽', color: '#14b8a6' },
];

export function getSubject(id) {
  return SUBJECTS.find((s) => s.id === id);
}
