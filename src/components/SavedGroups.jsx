import React, { useState } from 'react';
import { Users, Trash2, Calendar } from 'lucide-react';

/**
 * SavedGroups Component
 * Displays and manages saved dining groups
 * Features:
 * - List all saved groups
 * - Load group members
 * - Delete groups with confirmation
 * - Show last used date
 */
const SavedGroups = ({ 
  groups, 
  onLoad, 
  onDelete 
}) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!groups || groups.length === 0) {
    return null;
  }

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="card slide-in">
      <h3 className="card-title">
        <Users size={20} />
        Saved Groups
        <span className="count-badge">{groups.length}</span>
      </h3>
      
      <div className="saved-groups-list">
        {groups.map(group => (
          <div key={group.id} className="saved-group-item">
            <div className="group-info">
              <div className="group-name">{group.name}</div>
              <div className="group-details">
                <span className="group-members">
                  {group.people.map(p => p.name).filter(Boolean).join(', ') || 'No names'}
                </span>
                {group.lastUsed && (
                  <span className="group-date">
                    <Calendar size={12} />
                    {formatDate(group.lastUsed)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="group-actions">
              <button 
                className="button button-secondary button-small"
                onClick={() => onLoad(group)}
                aria-label={`Load group ${group.name}`}
              >
                Load
              </button>
              <button 
                className={`button ${confirmDelete === group.id ? 'button-danger-solid' : 'button-danger'} button-small`}
                onClick={() => handleDelete(group.id)}
                aria-label={confirmDelete === group.id ? `Confirm delete ${group.name}` : `Delete group ${group.name}`}
                title={confirmDelete === group.id ? 'Click again to confirm' : 'Delete group'}
              >
                <Trash2 size={16} />
                {confirmDelete === group.id && <span className="confirm-text">Sure?</span>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedGroups;
