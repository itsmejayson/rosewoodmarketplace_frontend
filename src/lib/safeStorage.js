// Safe localStorage wrapper — falls back to an in-memory store when
// localStorage is blocked (Safari Private, Messenger in-app browser, etc.)
const memoryStore = {};

const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryStore[key];
    }
  },
};

export default safeStorage;
