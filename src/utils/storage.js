// src/utils/storage.js
import { INITIAL_USERS, INITIAL_SCENES, INITIAL_PRACTICES } from '../data/initial';

const KEYS = {
  USERS: 'ps_users',
  SCENES: 'ps_scenes',
  PRACTICES: 'ps_practices',
  RESULTS: 'ps_results',
  CURRENT_USER: 'ps_current_user',
};

// Version key — bump this when INITIAL_SCENES or INITIAL_PRACTICES change
// so existing users get fresh data automatically.
const DATA_VERSION = '2';

function init() {
  // If data version changed, reset scenes and practices to pick up new content
  if (localStorage.getItem('ps_data_version') !== DATA_VERSION) {
    localStorage.removeItem(KEYS.SCENES);
    localStorage.removeItem(KEYS.PRACTICES);
    localStorage.setItem('ps_data_version', DATA_VERSION);
  }

  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(KEYS.SCENES)) {
    localStorage.setItem(KEYS.SCENES, JSON.stringify(INITIAL_SCENES));
  }
  if (!localStorage.getItem(KEYS.PRACTICES)) {
    localStorage.setItem(KEYS.PRACTICES, JSON.stringify(INITIAL_PRACTICES));
  }
  if (!localStorage.getItem(KEYS.RESULTS)) {
    localStorage.setItem(KEYS.RESULTS, JSON.stringify([]));
  }

  // Ensure existing scenes always have sceneComponent field
  const scenes = JSON.parse(localStorage.getItem(KEYS.SCENES) || '[]').map(s => {
    if (!s.sceneComponent) {
      if (s.id === 'scene-lathe') return { ...s, sceneComponent: 'lathe' };
      if (s.id === 'scene-electrical') return { ...s, sceneComponent: 'electrical' };
      if (s.id === 'scene-welding') return { ...s, sceneComponent: 'welding' };
      return { ...s, sceneComponent: 'lathe' };
    }
    return s;
  });
  localStorage.setItem(KEYS.SCENES, JSON.stringify(scenes));
}

init();

export const Storage = {
  // Users
  getUsers: () => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  saveUsers: (users) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  addUser: (user) => {
    const users = Storage.getUsers();
    users.push(user);
    Storage.saveUsers(users);
  },
  updateUser: (id, updates) => {
    const users = Storage.getUsers().map(u => u.id === id ? { ...u, ...updates } : u);
    Storage.saveUsers(users);
  },
  deleteUser: (id) => {
    Storage.saveUsers(Storage.getUsers().filter(u => u.id !== id));
  },

  // Auth
  login: (email, password) => {
    const user = Storage.getUsers().find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },
  logout: () => localStorage.removeItem(KEYS.CURRENT_USER),
  getCurrentUser: () => JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || 'null'),

  // Scenes
  getScenes: () => JSON.parse(localStorage.getItem(KEYS.SCENES) || '[]'),
  saveScenes: (scenes) => localStorage.setItem(KEYS.SCENES, JSON.stringify(scenes)),
  addScene: (scene) => {
    const scenes = Storage.getScenes();
    scenes.push(scene);
    Storage.saveScenes(scenes);
  },
  deleteScene: (id) => {
    Storage.saveScenes(Storage.getScenes().filter(s => s.id !== id));
  },

  // Practices
  getPractices: () => JSON.parse(localStorage.getItem(KEYS.PRACTICES) || '[]'),
  savePractices: (practices) => localStorage.setItem(KEYS.PRACTICES, JSON.stringify(practices)),
  addPractice: (practice) => {
    const practices = Storage.getPractices();
    practices.push(practice);
    Storage.savePractices(practices);
  },
  updatePractice: (id, updates) => {
    const practices = Storage.getPractices().map(p => p.id === id ? { ...p, ...updates } : p);
    Storage.savePractices(practices);
  },
  deletePractice: (id) => {
    Storage.savePractices(Storage.getPractices().filter(p => p.id !== id));
  },

  // Results
  getResults: () => JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]'),
  saveResults: (results) => localStorage.setItem(KEYS.RESULTS, JSON.stringify(results)),
  addResult: (result) => {
    const results = Storage.getResults();
    results.push(result);
    Storage.saveResults(results);
  },
  getResultsForStudent: (studentId) => Storage.getResults().filter(r => r.studentId === studentId),
  getResultsForPractice: (practiceId) => Storage.getResults().filter(r => r.practiceId === practiceId),
};
