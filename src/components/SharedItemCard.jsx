import React from 'react';
import { X } from 'lucide-react';
import PriceInput from './PriceInput';
import { validateName } from '../utils/formatters';

/**
 * SharedItemCard Component
 * Displays a shared item that can be split between selected people
 * Features:
 * - Item name and price input
 * - Checkbox selection for which people to split between
 * - Visual feedback for selections
 * - Empty state handling
 */
const SharedItemCard = ({ 
  item, 
  people, 
  onUpdate, 
  onTogglePerson, 
  onRemove 
}) => {
  const handleNameChange = (e) => {
    const validated = validateName(e.target.value, 100);
    onUpdate(item.id, 'name', validated);
  };

  const handleToggle = (personId) => {
    // Ensure at least one person is always selected
    const currentCount = item.splitBetween.length;
    if (currentCount === 1 && item.splitBetween.includes(personId)) {
      // Don't allow deselecting the last person
      return;
    }
    onTogglePerson(item.id, personId);
  };

  return (
    <div className="shared-item-card" role="region" aria-label={`Shared item: ${item.name || 'unnamed'}`}>
      <div className="item-row">
        <input
          type="text"
          className="input-field"
          placeholder="Shared item (e.g., Appetizer, Pitcher)"
          value={item.name || ''}
          onChange={handleNameChange}
          maxLength={100}
          aria-label="Shared item name"
        />
        <PriceInput
          value={item.price || ''}
          onChange={(value) => onUpdate(item.id, 'price', value)}
          aria-label={`Price for ${item.name || 'shared item'}`}
        />
        <button
          className="button button-danger button-small"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name || 'shared item'}`}
          title="Remove shared item"
        >
          <X size={16} />
        </button>
      </div>

      <div className="split-between-section">
        <div className="split-between-label">
          Split between: 
          {item.splitBetween.length === people.length ? (
            <span className="everyone-tag">Everyone</span>
          ) : (
            <span className="count-tag">{item.splitBetween.length} {item.splitBetween.length === 1 ? 'person' : 'people'}</span>
          )}
        </div>
        
        {people.length === 0 ? (
          <div className="empty-state-small">
            Add people first to split shared items
          </div>
        ) : (
          <div className="checkbox-group" role="group" aria-label="Select people to split item with">
            {people.map((person, index) => {
              const isChecked = item.splitBetween.includes(person.id);
              const isLastSelected = isChecked && item.splitBetween.length === 1;
              
              return (
                <label 
                  key={person.id} 
                  className={`checkbox-label ${isChecked ? 'checked' : ''} ${isLastSelected ? 'last-selected' : ''}`}
                  title={isLastSelected ? 'At least one person must be selected' : ''}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(person.id)}
                    disabled={isLastSelected}
                    aria-label={`Split with ${person.name || `person ${index + 1}`}`}
                  />
                  <span>{person.name || `Person ${index + 1}`}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedItemCard;
