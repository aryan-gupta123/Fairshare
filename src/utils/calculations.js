/**
 * Bill splitting calculation logic
 * All calculations handle edge cases and invalid inputs gracefully
 */

import { parsePrice, roundToTwo } from './formatters';

/**
 * Calculate totals for each person in the bill split
 * Handles all edge cases:
 * - Empty items
 * - Invalid prices
 * - Division by zero
 * - No people selected for shared items
 * 
 * @param {Array} people - Array of people objects
 * @param {Array} sharedItems - Array of shared item objects
 * @param {string|number} tax - Total tax amount
 * @param {string} taxMode - 'proportional' or 'even'
 * @returns {Array} Array of person totals with breakdown
 */
export const calculatePersonTotals = (people, sharedItems, tax, taxMode) => {
  try {
    // Input validation
    if (!Array.isArray(people) || people.length === 0) {
      return [];
    }
    
    const taxAmount = parsePrice(tax);
    const validSharedItems = Array.isArray(sharedItems) ? sharedItems : [];
    
    const results = people.map(person => {
      // Calculate personal items subtotal
      const itemsSubtotal = Array.isArray(person.items)
        ? person.items.reduce((sum, item) => {
            return sum + parsePrice(item.price);
          }, 0)
        : 0;
      
      // Calculate shared items portion
      const sharedSubtotal = validSharedItems.reduce((sum, item) => {
        // Check if this person is included in the split
        if (Array.isArray(item.splitBetween) && 
            item.splitBetween.includes(person.id) &&
            item.splitBetween.length > 0) {
          const itemPrice = parsePrice(item.price);
          return sum + (itemPrice / item.splitBetween.length);
        }
        return sum;
      }, 0);

      const subtotal = roundToTwo(itemsSubtotal + sharedSubtotal);
      
      // Calculate tax for this person
      let personTax = 0;
      
      if (taxMode === 'proportional') {
        // Calculate total subtotal across all people
        const totalSubtotal = people.reduce((sum, p) => {
          const pItems = Array.isArray(p.items)
            ? p.items.reduce((s, i) => s + parsePrice(i.price), 0)
            : 0;
          
          const pShared = validSharedItems.reduce((s, item) => {
            if (Array.isArray(item.splitBetween) && 
                item.splitBetween.includes(p.id) &&
                item.splitBetween.length > 0) {
              return s + (parsePrice(item.price) / item.splitBetween.length);
            }
            return s;
          }, 0);
          
          return sum + pItems + pShared;
        }, 0);
        
        // Calculate proportional tax (avoid division by zero)
        if (totalSubtotal > 0 && subtotal > 0) {
          personTax = (subtotal / totalSubtotal) * taxAmount;
        } else if (totalSubtotal === 0 && taxAmount > 0) {
          // If no one ordered anything but there's tax, split evenly
          personTax = taxAmount / people.length;
        }
      } else {
        // Split tax evenly
        personTax = taxAmount / people.length;
      }
      
      personTax = roundToTwo(personTax);

      // Calculate tip on their portion (subtotal + tax)
      const tipPercentage = parseFloat(person.tip) || 0;
      const tipBase = subtotal + personTax;
      const tipAmount = roundToTwo((tipBase * tipPercentage) / 100);
      
      const total = roundToTwo(subtotal + personTax + tipAmount);

      return {
        id: person.id,
        name: person.name?.trim() || 'Unnamed',
        subtotal: Math.max(0, subtotal),
        tax: Math.max(0, personTax),
        tip: Math.max(0, tipAmount),
        tipPercentage,
        total: Math.max(0, total)
      };
    });

    return results;
  } catch (error) {
    console.error('Error calculating totals:', error);
    // Return safe default
    return people.map(person => ({
      id: person.id,
      name: person.name || 'Unnamed',
      subtotal: 0,
      tax: 0,
      tip: 0,
      tipPercentage: person.tip || 0,
      total: 0
    }));
  }
};

/**
 * Calculate grand total from person totals
 * @param {Array} personTotals - Array of calculated person totals
 * @returns {number} Grand total
 */
export const calculateGrandTotal = (personTotals) => {
  if (!Array.isArray(personTotals) || personTotals.length === 0) {
    return 0;
  }
  
  const total = personTotals.reduce((sum, person) => {
    return sum + (parseFloat(person.total) || 0);
  }, 0);
  
  return roundToTwo(total);
};

/**
 * Calculate even split for quick splitting
 * @param {Array} people - Array of people
 * @param {Array} sharedItems - Array of shared items
 * @param {string|number} tax - Total tax
 * @returns {number} Amount per person
 */
export const calculateEvenSplit = (people, sharedItems, tax) => {
  try {
    if (!Array.isArray(people) || people.length === 0) {
      return 0;
    }
    
    const taxAmount = parsePrice(tax);
    
    // Calculate total from all personal items
    const allItemsTotal = people.reduce((sum, person) => {
      if (!Array.isArray(person.items)) return sum;
      return sum + person.items.reduce((s, item) => s + parsePrice(item.price), 0);
    }, 0);
    
    // Calculate total from shared items
    const sharedTotal = Array.isArray(sharedItems)
      ? sharedItems.reduce((sum, item) => sum + parsePrice(item.price), 0)
      : 0;
    
    const total = allItemsTotal + sharedTotal + taxAmount;
    const perPerson = total / people.length;
    
    return roundToTwo(perPerson);
  } catch (error) {
    console.error('Error in even split calculation:', error);
    return 0;
  }
};

/**
 * Validate bill data before calculations
 * @param {Object} billData - Object containing people, items, tax, etc.
 * @returns {Object} Validation result with isValid and errors
 */
export const validateBillData = (billData) => {
  const errors = [];
  
  if (!billData.people || billData.people.length === 0) {
    errors.push('At least one person is required');
  }
  
  // Check if any person has items or if there are shared items
  const hasAnyItems = billData.people.some(p => 
    Array.isArray(p.items) && p.items.length > 0
  ) || (Array.isArray(billData.sharedItems) && billData.sharedItems.length > 0);
  
  if (!hasAnyItems) {
    errors.push('Add at least one item to split');
  }
  
  // Validate tax
  const tax = parsePrice(billData.tax);
  if (tax < 0) {
    errors.push('Tax cannot be negative');
  }
  
  // Validate tip percentages
  billData.people.forEach((person, index) => {
    const tip = parseFloat(person.tip);
    if (isNaN(tip) || tip < 0 || tip > 100) {
      errors.push(`Person ${index + 1}: Tip must be between 0% and 100%`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
