import React, { useState, useEffect } from 'react';
import { validatePriceInput, formatCurrency } from '../utils/formatters';

/**
 * PriceInput Component
 * Handles price input with proper decimal validation and formatting
 * Features:
 * - Only allows valid number input
 * - Limits to 2 decimal places
 * - Auto-formats on blur
 * - Prevents invalid characters
 */
const PriceInput = ({ 
  value, 
  onChange, 
  placeholder = '$0.00',
  disabled = false,
  className = '',
  ...props 
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with parent when value changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = validatePriceInput(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format to 2 decimals on blur if there's a value
    if (localValue && localValue !== '' && localValue !== '.') {
      const num = parseFloat(localValue);
      if (!isNaN(num) && num >= 0) {
        const formatted = formatCurrency(num);
        setLocalValue(formatted);
        onChange(formatted);
      }
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
    e.target.select();
  };

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(e.keyCode) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    
    // Ensure it's a number or decimal point
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
        (e.keyCode < 96 || e.keyCode > 105) && 
        e.keyCode !== 190 && e.keyCode !== 110) {
      e.preventDefault();
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={`input-field ${className}`}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      autoComplete="off"
      {...props}
    />
  );
};

export default PriceInput;
