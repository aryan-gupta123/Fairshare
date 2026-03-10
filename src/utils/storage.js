/**
 * LocalStorage utilities with error handling and data validation
 * Safely handles storage quota exceeded and JSON parsing errors
 */

const STORAGE_KEYS = {
  GROUPS: 'fairshare_groups',
  PREFERENCES: 'fairshare_preferences',
  RECENT_BILLS: 'fairshare_recent_bills'
};

const MAX_GROUPS = 50; // Limit stored groups to prevent storage issues
const MAX_RECENT_BILLS = 10;

/**
 * Safely get item from localStorage with error handling
 */
const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely set item in localStorage with error handling
 */
const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // Try to clear old data
      clearOldData();
    } else {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
    return false;
  }
};

/**
 * Clear old data to free up space
 */
const clearOldData = () => {
  try {
    // Keep only most recent groups
    const groups = loadGroups();
    if (groups.length > MAX_GROUPS / 2) {
      const recent = groups.slice(0, MAX_GROUPS / 2);
      safeSetItem(STORAGE_KEYS.GROUPS, JSON.stringify(recent));
    }
  } catch (error) {
    console.error('Error clearing old data:', error);
  }
};

/**
 * Validate group data structure
 */
const isValidGroup = (group) => {
  return (
    group &&
    typeof group === 'object' &&
    group.id &&
    group.name &&
    typeof group.name === 'string' &&
    Array.isArray(group.people) &&
    group.people.every(p => 
      typeof p === 'object' &&
      typeof p.name === 'string' &&
      typeof p.tip === 'number'
    )
  );
};

/**
 * Validate saved bill data structure
 */
const isValidBill = (bill) => {
  return (
    bill &&
    typeof bill === 'object' &&
    bill.id &&
    typeof bill.name === 'string' &&
    Array.isArray(bill.people) &&
    Array.isArray(bill.sharedItems) &&
    (typeof bill.tax === 'string' || typeof bill.tax === 'number') &&
    (bill.taxMode === 'even' || bill.taxMode === 'proportional')
  );
};

/**
 * Save groups to localStorage
 * @param {Array} groups - Array of group objects
 * @returns {boolean} Success status
 */
export const saveGroups = (groups) => {
  try {
    if (!Array.isArray(groups)) {
      console.error('saveGroups: Invalid input - not an array');
      return false;
    }
    
    // Validate all groups
    const validGroups = groups.filter(isValidGroup);
    
    // Limit number of groups
    const limitedGroups = validGroups.slice(0, MAX_GROUPS);
    
    return safeSetItem(STORAGE_KEYS.GROUPS, JSON.stringify(limitedGroups));
  } catch (error) {
    console.error('Error saving groups:', error);
    return false;
  }
};

/**
 * Load groups from localStorage
 * @returns {Array} Array of group objects
 */
export const loadGroups = () => {
  try {
    const saved = safeGetItem(STORAGE_KEYS.GROUPS);
    if (!saved) return [];
    
    const groups = JSON.parse(saved);
    
    if (!Array.isArray(groups)) {
      console.error('loadGroups: Stored data is not an array');
      return [];
    }
    
    // Validate and filter groups
    return groups.filter(isValidGroup);
  } catch (error) {
    console.error('Error loading groups:', error);
    return [];
  }
};

/**
 * Save user preferences
 * @param {Object} preferences - User preference object
 */
export const savePreferences = (preferences) => {
  try {
    const defaultPrefs = {
      defaultTip: 15,
      taxMode: 'proportional',
      theme: 'light'
    };
    
    const validPrefs = {
      ...defaultPrefs,
      ...preferences
    };
    
    return safeSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(validPrefs));
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
};

/**
 * Load user preferences
 * @returns {Object} User preferences with defaults
 */
export const loadPreferences = () => {
  try {
    const saved = safeGetItem(STORAGE_KEYS.PREFERENCES);
    if (!saved) {
      return { defaultTip: 15, taxMode: 'proportional', theme: 'light' };
    }
    
    const prefs = JSON.parse(saved);
    
    return {
      defaultTip: typeof prefs.defaultTip === 'number' ? prefs.defaultTip : 15,
      taxMode: prefs.taxMode === 'even' ? 'even' : 'proportional',
      theme: prefs.theme || 'light'
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return { defaultTip: 15, taxMode: 'proportional', theme: 'light' };
  }
};

/**
 * Save a recent bill for history
 * @param {Object} bill - Bill data
 */
export const saveRecentBill = (bill) => {
  try {
    const recent = loadRecentBills();
    const billWithTimestamp = {
      ...bill,
      timestamp: Date.now()
    };
    
    const updated = [billWithTimestamp, ...recent.filter(existing => existing.id !== bill.id)]
      .filter(isValidBill)
      .slice(0, MAX_RECENT_BILLS);

    return safeSetItem(STORAGE_KEYS.RECENT_BILLS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent bill:', error);
    return false;
  }
};

/**
 * Replace the recent bill list in storage.
 * @param {Array} bills - Array of saved bills
 * @returns {boolean} Success status
 */
export const saveRecentBills = (bills) => {
  try {
    if (!Array.isArray(bills)) {
      console.error('saveRecentBills: Invalid input - not an array');
      return false;
    }

    const validBills = bills
      .filter(isValidBill)
      .slice(0, MAX_RECENT_BILLS);

    return safeSetItem(STORAGE_KEYS.RECENT_BILLS, JSON.stringify(validBills));
  } catch (error) {
    console.error('Error saving recent bills:', error);
    return false;
  }
};

/**
 * Load recent bills
 * @returns {Array} Array of recent bills
 */
export const loadRecentBills = () => {
  try {
    const saved = safeGetItem(STORAGE_KEYS.RECENT_BILLS);
    if (!saved) return [];
    
    const bills = JSON.parse(saved);
    return Array.isArray(bills) ? bills.filter(isValidBill) : [];
  } catch (error) {
    console.error('Error loading recent bills:', error);
    return [];
  }
};

/**
 * Delete a saved bill by id.
 * @param {string} billId - Bill id to delete
 * @returns {boolean} Success status
 */
export const deleteRecentBill = (billId) => {
  try {
    const updatedBills = loadRecentBills().filter((bill) => bill.id !== billId);
    return saveRecentBills(updatedBills);
  } catch (error) {
    console.error('Error deleting recent bill:', error);
    return false;
  }
};

/**
 * Clear all stored data
 */
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Export all data as JSON for backup
 */
export const exportData = () => {
  try {
    return {
      groups: loadGroups(),
      preferences: loadPreferences(),
      recentBills: loadRecentBills(),
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

/**
 * Import data from backup
 */
export const importData = (data) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data');
    }
    
    if (Array.isArray(data.groups)) {
      saveGroups(data.groups);
    }
    
    if (data.preferences) {
      savePreferences(data.preferences);
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
