const ENTRIES_KEY = 'mindspace_entries';
const TIPS_KEY = 'mindspace_tips';

/**
 * Save a new entry to localStorage
 * @param {Object} entry 
 */
export const saveEntry = (entry) => {
  try {
    const entries = getEntries();
    entries.push({ ...entry, id: Date.now().toString(), createdAt: new Date().toISOString() });
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event('mindspace_storage_update'));
  } catch (error) {
    console.error('Failed to save entry:', error);
  }
};

/**
 * Get all entries from localStorage
 * @returns {Array} List of entries
 */
export const getEntries = () => {
  try {
    const data = localStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get entries:', error);
    return [];
  }
};

/**
 * Save a new tip to localStorage
 * @param {Object} tip 
 */
export const saveTip = (tip) => {
  try {
    const tips = getTips();
    tips.push({ ...tip, id: Date.now().toString(), createdAt: new Date().toISOString() });
    localStorage.setItem(TIPS_KEY, JSON.stringify(tips));
  } catch (error) {
    console.error('Failed to save tip:', error);
  }
};

/**
 * Get all tips from localStorage
 * @returns {Array} List of tips
 */
export const getTips = () => {
  try {
    const data = localStorage.getItem(TIPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get tips:', error);
    return [];
  }
};
