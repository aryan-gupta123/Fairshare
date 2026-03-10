import React, { useMemo, useState } from 'react';
import { CheckCircle2, Users, X } from 'lucide-react';
import { generateId } from '../utils/formatters';

/**
 * ItemSelection modal
 * Lets users assign scanned receipt items to one or more people.
 */
const ItemSelection = ({ scannedItems, people, onComplete, onClose }) => {
  const [assignments, setAssignments] = useState(() => {
    return scannedItems.reduce((accumulator, item) => {
      accumulator[item.id] = [];
      return accumulator;
    }, {});
  });

  const assignedCount = useMemo(() => {
    return scannedItems.filter((item) => assignments[item.id]?.length > 0).length;
  }, [assignments, scannedItems]);

  const toggleAssignment = (itemId, personId) => {
    setAssignments((prev) => {
      const selectedPeople = prev[itemId] || [];
      const isSelected = selectedPeople.includes(personId);

      return {
        ...prev,
        [itemId]: isSelected
          ? selectedPeople.filter((id) => id !== personId)
          : [...selectedPeople, personId]
      };
    });
  };

  const handleDone = () => {
    const personalItems = {};
    const sharedItems = [];

    scannedItems.forEach((item) => {
      const selectedPeople = assignments[item.id] || [];

      if (selectedPeople.length === 1) {
        const personId = selectedPeople[0];
        personalItems[personId] = [
          ...(personalItems[personId] || []),
          {
            id: generateId(),
            name: item.name,
            price: Number(item.price).toFixed(2)
          }
        ];
      }

      if (selectedPeople.length > 1) {
        sharedItems.push({
          id: generateId(),
          name: item.name,
          price: Number(item.price).toFixed(2),
          splitBetween: selectedPeople
        });
      }
    });

    onComplete({ personalItems, sharedItems });
  };

  return (
    <div className="item-selection-overlay" role="dialog" aria-modal="true" aria-label="Assign receipt items">
      <div className="item-selection-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Who Ordered What?</h3>
            <p className="modal-subtitle">Tap one or more people for each scanned receipt item.</p>
          </div>
          <button className="button button-secondary button-small" onClick={onClose} aria-label="Close item selection">
            <X size={18} />
          </button>
        </div>

        <div className="people-chips">
          {people.map((person, index) => (
            <span key={person.id} className="people-chip">
              {person.name || `Person ${index + 1}`}
            </span>
          ))}
        </div>

        <div className="selectable-items-list">
          {scannedItems.map((item) => {
            const selectedPeople = assignments[item.id] || [];
            const isShared = selectedPeople.length > 1;

            return (
              <div
                key={item.id}
                className={`selectable-item ${isShared ? 'shared' : ''} ${selectedPeople.length === 0 ? 'unassigned' : ''}`}
              >
                <div className="selectable-item-header">
                  <div>
                    <div className="selectable-item-name">{item.name}</div>
                    <div className="selectable-item-price">${Number(item.price).toFixed(2)}</div>
                  </div>
                  {isShared && (
                    <span className="shared-pill">
                      <Users size={14} />
                      Shared
                    </span>
                  )}
                </div>

                <div className="person-selector-row">
                  {people.map((person, index) => {
                    const isSelected = selectedPeople.includes(person.id);

                    return (
                      <button
                        key={person.id}
                        type="button"
                        className={`person-selector ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleAssignment(item.id, person.id)}
                        aria-pressed={isSelected}
                      >
                        {person.name || `Person ${index + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="selection-summary">
          <div>
            <strong>{assignedCount}/{scannedItems.length}</strong> assigned
          </div>
          <div className={assignedCount === scannedItems.length ? 'selection-summary-good' : 'selection-summary-warning'}>
            {scannedItems.length - assignedCount} unassigned
          </div>
        </div>

        <div className="modal-actions">
          <button className="button button-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="button button-primary" onClick={handleDone} type="button">
            <CheckCircle2 size={18} />
            Done - Add to Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemSelection;
