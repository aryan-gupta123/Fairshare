import React from 'react';
import { DollarSign, Info } from 'lucide-react';
import PriceInput from './PriceInput';

/**
 * TaxSettings Component
 * Handles tax input and split mode selection
 * Features:
 * - Tax amount input with validation
 * - Toggle between proportional and even split
 * - Helpful explanations
 */
const TaxSettings = ({ 
  tax, 
  taxMode, 
  onTaxChange, 
  onTaxModeChange 
}) => {
  return (
    <div className="card">
      <h3 className="card-title">
        <DollarSign size={24} />
        Tax & Settings
      </h3>

      <div className="form-group">
        <label htmlFor="tax-input" className="form-label">
          Total Tax Amount
        </label>
        <PriceInput
          id="tax-input"
          value={tax}
          onChange={onTaxChange}
          placeholder="$0.00"
          aria-describedby="tax-hint"
        />
        <p id="tax-hint" className="form-hint">
          <Info size={14} />
          Enter the total tax from your receipt
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">
          Tax Split Mode
        </label>
        <div className="button-group" role="radiogroup" aria-label="Tax split mode">
          <button
            className={`button ${taxMode === 'proportional' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => onTaxModeChange('proportional')}
            role="radio"
            aria-checked={taxMode === 'proportional'}
          >
            <span className="button-label">Proportional</span>
            {taxMode === 'proportional' && (
              <span className="button-check">✓</span>
            )}
          </button>
          <button
            className={`button ${taxMode === 'even' ? 'button-primary' : 'button-secondary'}`}
            onClick={() => onTaxModeChange('even')}
            role="radio"
            aria-checked={taxMode === 'even'}
          >
            <span className="button-label">Split Evenly</span>
            {taxMode === 'even' && (
              <span className="button-check">✓</span>
            )}
          </button>
        </div>
        <p className="form-hint">
          <Info size={14} />
          {taxMode === 'proportional' 
            ? 'Tax is split based on what each person ordered (fair for different order sizes)' 
            : 'Tax is split equally among all people (simpler calculation)'}
        </p>
      </div>
    </div>
  );
};

export default TaxSettings;
