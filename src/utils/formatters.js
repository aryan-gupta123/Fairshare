/**
 * Utility functions for formatting and validating user inputs
 * Handles all edge cases for price inputs, names, and validation
 */

/**
 * Format a number as currency with exactly 2 decimal places
 * @param {number|string} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return num.toFixed(2);
};

/**
 * Validate and clean price input to ensure proper decimal format
 * - Removes non-numeric characters except decimal point
 * - Limits to 2 decimal places
 * - Prevents multiple decimal points
 * - Handles edge cases like ".5" -> "0.5"
 * 
 * @param {string} value - Raw input value
 * @returns {string} Cleaned and validated input
 */
export const validatePriceInput = (value) => {
  // Allow empty string
  if (value === '') return '';
  
  // Convert to string if number
  let cleaned = String(value);
  
  // Remove any non-numeric characters except decimal point
  cleaned = cleaned.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points - keep only first one
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  // Handle leading decimal point: ".5" -> "0.5"
  if (cleaned.startsWith('.')) {
    cleaned = '0' + cleaned;
  }
  
  // Prevent negative numbers
  if (parseFloat(cleaned) < 0) return '';
  
  // Prevent values over 9999.99 (reasonable max for a single item)
  if (parseFloat(cleaned) > 9999.99) {
    return '9999.99';
  }
  
  return cleaned;
};

/**
 * Parse price string to float with safety checks
 * @param {string|number} value - Value to parse
 * @returns {number} Parsed number or 0 if invalid
 */
export const parsePrice = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.max(0, num);
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value) => {
  return `${value}%`;
};

/**
 * Validate and clean person/item name
 * - Trims whitespace
 * - Limits length
 * - Removes special characters that could cause issues
 * 
 * @param {string} name - Raw name input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Cleaned name
 */
export const validateName = (name, maxLength = 50) => {
  if (!name) return '';
  
  // Trim and limit length
  let cleaned = name.trim().substring(0, maxLength);
  
  // Remove any control characters or problematic characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  
  return cleaned;
};

/**
 * Generate a unique ID with better uniqueness guarantee
 * Combines timestamp with random number and counter
 */
let idCounter = 0;
export const generateId = () => {
  idCounter = (idCounter + 1) % 1000;
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idCounter}`;
};

/**
 * Safely round number to 2 decimal places
 * Handles floating point precision issues
 */
export const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Check if a value is a valid positive number
 */
export const isValidPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && isFinite(num);
};

/**
 * Format large numbers with commas for readability
 */
export const formatWithCommas = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
