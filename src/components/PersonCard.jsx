import React from 'react';
import { X, Plus, User } from 'lucide-react';
import PriceInput from './PriceInput';
import { validateName } from '../utils/formatters';

/**
 * PersonCard Component
 * Displays a single person with their items and tip percentage
 * Features:
 * - Name input with validation
 * - Adjustable tip slider
 * - Multiple items with name and price
 * - Empty state messaging
 * - Accessible labels
 */
const PersonCard = ({ 
  person, 
  index, 
  onUpdateName, 
  onUpdateTip, 
  onAddItem, 
  onUpdateItem, 
  onRemoveItem, 
  onRemove, 
  canRemove 
}) => {
  const handleNameChange = (e) => {
    const validated = validateName(e.target.value, 50);
    onUpdateName(person.id, validated);
  };

  const handleTipChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    onUpdateTip(person.id, Math.max(0, Math.min(100, value)));
  };

  const handleItemNameChange = (itemId, value) => {
    const validated = validateName(value, 100);
    onUpdateItem(person.id, itemId, 'name', validated);
  };

  return (
    <div className="person-card slide-in" role="region" aria-label={`${person.name || `Person ${index + 1}`} items`}>
      <div className="person-card-header">
        <div className="person-name-input-wrapper">
          <User size={18} className="person-icon" />
          <input
            type="text"
            className="input-field person-name-input"
            placeholder={`Person ${index + 1} name`}
            value={person.name || ''}
            onChange={handleNameChange}
            maxLength={50}
            aria-label={`Name for person ${index + 1}`}
          />
        </div>
        {canRemove && (
          <button
            className="button button-danger button-small"
            onClick={() => onRemove(person.id)}
            aria-label={`Remove ${person.name || `person ${index + 1}`}`}
            title="Remove person"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="tip-slider-section">
        <label 
          htmlFor={`tip-slider-${person.id}`}
          className="tip-label"
        >
          Tip: <span className="tip-value">{person.tip}%</span>
        </label>
        <input
          id={`tip-slider-${person.id}`}
          type="range"
          min="0"
          max="30"
          step="1"
          value={person.tip}
          onChange={handleTipChange}
          className="tip-slider"
          aria-label={`Tip percentage for ${person.name || `person ${index + 1}`}`}
        />
        <div className="tip-markers">
          <span>0%</span>
          <span>15%</span>
          <span>30%</span>
        </div>
      </div>

      <div className="items-section">
        {!person.items || person.items.length === 0 ? (
          <div className="empty-state">
            <p>No items yet.</p>
            <p className="empty-state-hint">
              Add what {person.name || 'this person'} ordered!
            </p>
          </div>
        ) : (
          <div className="items-list">
            {person.items.map((item, itemIndex) => (
              <div key={item.id} className="item-row">
                <input
                  type="text"
                  className="input-field item-name-input"
                  placeholder={`Item ${itemIndex + 1}`}
                  value={item.name || ''}
                  onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                  maxLength={100}
                  aria-label={`Item ${itemIndex + 1} name for ${person.name || `person ${index + 1}`}`}
                />
                <PriceInput
                  value={item.price || ''}
                  onChange={(value) => onUpdateItem(person.id, item.id, 'price', value)}
                  className="item-price-input"
                  aria-label={`Price for ${item.name || `item ${itemIndex + 1}`}`}
                />
                <button
                  className="button button-danger button-small"
                  onClick={() => onRemoveItem(person.id, item.id)}
                  aria-label={`Remove ${item.name || `item ${itemIndex + 1}`}`}
                  title="Remove item"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="button button-secondary button-small add-item-button"
        onClick={() => onAddItem(person.id)}
        aria-label={`Add item for ${person.name || `person ${index + 1}`}`}
      >
        <Plus size={16} />
        Add Item
      </button>
    </div>
  );
};

export default PersonCard;
