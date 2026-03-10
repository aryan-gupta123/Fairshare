import React, { useState } from 'react';
import { Copy, Check, X, ExternalLink } from 'lucide-react';

/**
 * Summary Component
 * Displays calculated bill split with payment options
 * Features:
 * - Breakdown of subtotal, tax, tip per person
 * - Grand total
 * - Payment links for Venmo, Cash App, PayPal
 * - Copy to clipboard
 * - Empty state handling
 */
const Summary = ({ 
  totals, 
  grandTotal, 
  onClose 
}) => {
  const [copiedId, setCopiedId] = useState(null);

  const generatePaymentLink = (platform, amount, personName) => {
    const note = encodeURIComponent(`Bill split - ${personName}`);
    const formattedAmount = amount.toFixed(2);
    
    switch(platform) {
      case 'venmo':
        // Venmo deep link
        return `venmo://paycharge?txn=pay&amount=${formattedAmount}&note=${note}`;
      case 'cashapp':
        // Cash App link
        return `https://cash.app/$pay/${formattedAmount}`;
      case 'paypal':
        // PayPal.me link (requires username, so just show amount)
        return `https://www.paypal.com/paypalme///${formattedAmount}`;
      default:
        return '';
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatPaymentText = (person) => {
    return `${person.name} owes $${person.total.toFixed(2)}\n` +
           `Subtotal: $${person.subtotal.toFixed(2)}\n` +
           `Tax: $${person.tax.toFixed(2)}\n` +
           `Tip (${person.tipPercentage}%): $${person.tip.toFixed(2)}\n` +
           `Total: $${person.total.toFixed(2)}`;
  };

  return (
    <div className="summary-container fade-in-up">
      <div className="card">
        <div className="summary-header">
          <h3 className="summary-title">Split Summary</h3>
          <button
            className="button button-secondary button-small"
            onClick={onClose}
            aria-label="Close summary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grand-total-card">
          <div className="grand-total-label">Total Bill</div>
          <div className="grand-total-amount">${grandTotal.toFixed(2)}</div>
          <div className="grand-total-split">
            Split {totals.length} {totals.length === 1 ? 'way' : 'ways'}
          </div>
        </div>

        {totals.length === 0 ? (
          <div className="empty-state-summary">
            <p>No items to calculate.</p>
            <p className="empty-state-hint">Add people and items to see the split!</p>
          </div>
        ) : (
          <div className="person-totals-list">
            {totals.map((person, index) => (
              <div 
                key={person.id} 
                className="person-total-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="person-total-header">
                  <h4 className="person-total-name">{person.name}</h4>
                  <div className="person-total-amount">
                    ${person.total.toFixed(2)}
                  </div>
                </div>

                <div className="person-total-breakdown">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Subtotal</span>
                    <span className="breakdown-value">${person.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-label">Tax</span>
                    <span className="breakdown-value">${person.tax.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-label">Tip ({person.tipPercentage}%)</span>
                    <span className="breakdown-value">${person.tip.toFixed(2)}</span>
                  </div>
                </div>

                <div className="payment-section">
                  <div className="payment-label">Payment Options</div>
                  <div className="payment-buttons">
                    <a
                      href={generatePaymentLink('venmo', person.total, person.name)}
                      className="payment-button venmo-button"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Pay ${person.name} via Venmo`}
                    >
                      <span>Venmo</span>
                      <ExternalLink size={14} />
                    </a>
                    <a
                      href={generatePaymentLink('cashapp', person.total, person.name)}
                      className="payment-button cashapp-button"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Pay ${person.name} via Cash App`}
                    >
                      <span>Cash App</span>
                      <ExternalLink size={14} />
                    </a>
                    <a
                      href={generatePaymentLink('paypal', person.total, person.name)}
                      className="payment-button paypal-button"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Pay ${person.name} via PayPal`}
                    >
                      <span>PayPal</span>
                      <ExternalLink size={14} />
                    </a>
                    <button
                      className="payment-button copy-button"
                      onClick={() => copyToClipboard(formatPaymentText(person), person.id)}
                      aria-label={`Copy payment details for ${person.name}`}
                    >
                      {copiedId === person.id ? (
                        <>
                          <Check size={16} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
