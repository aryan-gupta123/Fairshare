import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, Share2, User, Users, Save, AlertCircle, Camera } from 'lucide-react';
import PersonCard from './components/PersonCard';
import SharedItemCard from './components/SharedItemCard';
import TaxSettings from './components/TaxSettings';
import SavedGroups from './components/SavedGroups';
import Summary from './components/Summary';
import ReceiptScanner from './components/ReceiptScanner';
import ItemSelection from './components/ItemSelection';
import { generateId } from './utils/formatters';
import { calculatePersonTotals, calculateGrandTotal, validateBillData } from './utils/calculations';
import { saveGroups, loadGroups, loadPreferences, saveRecentBill, loadRecentBills, deleteRecentBill } from './utils/storage';
import './styles.css';

/**
 * FairShare - Professional Bill Splitting App
 * Main application component with full state management
 */
function App() {
  // Core state
  const [people, setPeople] = useState([{ 
    id: generateId(), 
    name: '', 
    items: [], 
    tip: 15 
  }]);
  const [sharedItems, setSharedItems] = useState([]);
  const [tax, setTax] = useState('');
  const [taxMode, setTaxMode] = useState('proportional');
  
  // UI state
  const [savedGroups, setSavedGroups] = useState([]);
  const [savedBills, setSavedBills] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [billName, setBillName] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState(null);

  const showSuccessToast = useCallback((message) => {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-toast';
    successMsg.textContent = message;
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  }, []);

  // Load saved data on mount
  useEffect(() => {
    const groups = loadGroups();
    setSavedGroups(groups);
    setSavedBills(loadRecentBills());
    
    const prefs = loadPreferences();
    setTaxMode(prefs.taxMode);
  }, []);

  // Auto-save groups whenever they change
  useEffect(() => {
    saveGroups(savedGroups);
  }, [savedGroups]);

  // Person operations
  const addPerson = useCallback(() => {
    const newPerson = { 
      id: generateId(), 
      name: '', 
      items: [], 
      tip: 15 
    };
    setPeople(prev => [...prev, newPerson]);
  }, []);

  const removePerson = useCallback((id) => {
    setPeople(prev => {
      if (prev.length <= 1) return prev;
      
      // Remove person and update shared items
      const filtered = prev.filter(p => p.id !== id);
      
      // Update shared items to remove this person
      setSharedItems(items => items.map(item => ({
        ...item,
        splitBetween: item.splitBetween.filter(personId => personId !== id).length > 0
          ? item.splitBetween.filter(personId => personId !== id)
          : filtered.length > 0 ? [filtered[0].id] : []
      })));
      
      return filtered;
    });
  }, []);

  const updatePersonName = useCallback((id, name) => {
    setPeople(prev => prev.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  }, []);

  const updatePersonTip = useCallback((id, tip) => {
    setPeople(prev => prev.map(p => 
      p.id === id ? { ...p, tip: parseFloat(tip) || 0 } : p
    ));
  }, []);

  // Item operations
  const addItem = useCallback((personId) => {
    setPeople(prev => prev.map(p => 
      p.id === personId 
        ? { ...p, items: [...p.items, { id: generateId(), name: '', price: '' }] }
        : p
    ));
  }, []);

  const removeItem = useCallback((personId, itemId) => {
    setPeople(prev => prev.map(p => 
      p.id === personId 
        ? { ...p, items: p.items.filter(i => i.id !== itemId) }
        : p
    ));
  }, []);

  const updateItem = useCallback((personId, itemId, field, value) => {
    setPeople(prev => prev.map(p => 
      p.id === personId 
        ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : p
    ));
  }, []);

  // Shared item operations
  const addSharedItem = useCallback(() => {
    const newItem = { 
      id: generateId(), 
      name: '', 
      price: '', 
      splitBetween: people.map(p => p.id) 
    };
    setSharedItems(prev => [...prev, newItem]);
  }, [people]);

  const removeSharedItem = useCallback((id) => {
    setSharedItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateSharedItem = useCallback((id, field, value) => {
    setSharedItems(prev => prev.map(i => 
      i.id === id ? { ...i, [field]: value } : i
    ));
  }, []);

  const toggleSharedItemPerson = useCallback((itemId, personId) => {
    setSharedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const currentSplit = item.splitBetween;
        const isIncluded = currentSplit.includes(personId);
        
        // Don't allow removing the last person
        if (isIncluded && currentSplit.length === 1) {
          return item;
        }
        
        const newSplit = isIncluded
          ? currentSplit.filter(id => id !== personId)
          : [...currentSplit, personId];
        
        return { ...item, splitBetween: newSplit };
      }
      return item;
    }));
  }, []);

  // Group operations
  const saveGroup = useCallback(() => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    const group = {
      id: generateId(),
      name: groupName.trim(),
      people: people.map(p => ({ 
        name: p.name?.trim() || '', 
        tip: p.tip 
      })),
      lastUsed: Date.now()
    };

    setSavedGroups(prev => [...prev, group]);
    setGroupName('');
    
    showSuccessToast(`Group "${group.name}" saved!`);
  }, [groupName, people, showSuccessToast]);

  const loadGroup = useCallback((group) => {
    setPeople(group.people.map(p => ({
      id: generateId(),
      name: p.name,
      items: [],
      tip: p.tip || 15
    })));
    setSharedItems([]);
    setTax('');
    setShowSummary(false);
    
    // Update last used
    setSavedGroups(prev => prev.map(g => 
      g.id === group.id ? { ...g, lastUsed: Date.now() } : g
    ));
  }, []);

  const deleteGroup = useCallback((id) => {
    setSavedGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const saveBill = useCallback(() => {
    const fallbackName = `Bill ${new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}`;

    const nextBill = {
      id: generateId(),
      name: billName.trim() || fallbackName,
      people,
      sharedItems,
      tax,
      taxMode,
      grandTotal
    };

    const didSave = saveRecentBill(nextBill);
    if (!didSave) {
      return;
    }

    setSavedBills(loadRecentBills());
    setBillName('');
    showSuccessToast(`Saved "${nextBill.name}"`);
  }, [billName, people, sharedItems, tax, taxMode, grandTotal, showSuccessToast]);

  const loadBill = useCallback((bill) => {
    setPeople(bill.people || []);
    setSharedItems(bill.sharedItems || []);
    setTax(bill.tax || '');
    setTaxMode(bill.taxMode || 'proportional');
    setBillName(bill.name || '');
    setShowSummary(false);
    showSuccessToast(`Loaded "${bill.name}"`);
  }, [showSuccessToast]);

  const handleDeleteBill = useCallback((billId) => {
    const didDelete = deleteRecentBill(billId);
    if (!didDelete) {
      return;
    }

    setSavedBills(loadRecentBills());
  }, []);

  const handleReceiptProcessed = useCallback((receiptData) => {
    setScannedReceipt(receiptData);
    setShowReceiptScanner(false);

    if (Number(receiptData?.tax) > 0) {
      setTax(Number(receiptData.tax).toFixed(2));
    }

    setShowItemSelection(true);
  }, []);

  const handleItemSelectionComplete = useCallback((selectedData) => {
    const personalItems = selectedData.personalItems || {};
    const nextSharedItems = selectedData.sharedItems || [];

    setPeople((prev) => prev.map((person) => ({
      ...person,
      items: [
        ...(person.items || []),
        ...(personalItems[person.id] || [])
      ]
    })));

    if (nextSharedItems.length > 0) {
      setSharedItems((prev) => [...prev, ...nextSharedItems]);
    }

    setShowItemSelection(false);
    setScannedReceipt(null);
    setShowSummary(false);

    const personalCount = Object.values(personalItems).reduce(
      (sum, items) => sum + items.length,
      0
    );
    const sharedCount = nextSharedItems.length;
    const addedCount = personalCount + sharedCount;

    showSuccessToast(
      addedCount > 0
        ? `Receipt items added! ${addedCount} ${addedCount === 1 ? 'item' : 'items'} ready to split.`
        : 'Receipt scanned. Assign items to add them next time.'
    );
  }, [showSuccessToast]);

  // Calculate and show summary
  const handleCalculate = useCallback(() => {
    // Validate data
    const validation = validateBillData({ people, sharedItems, tax, taxMode });
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowErrors(true);
      setTimeout(() => setShowErrors(false), 5000);
      return;
    }
    
    setValidationErrors([]);
    setShowSummary(true);
    
    // Scroll to summary
    setTimeout(() => {
      document.querySelector('.summary-container')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }, [people, sharedItems, tax, taxMode]);

  // Calculate totals
  const totals = calculatePersonTotals(people, sharedItems, tax, taxMode);
  const grandTotal = calculateGrandTotal(totals);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header fade-in-up">
        <div className="header-content">
          <h1 className="app-title">
            <Receipt className="app-icon" size={44} />
            FairShare
          </h1>
          <p className="app-subtitle">
            Split bills fairly, pay instantly
          </p>
        </div>
      </header>

      <main className="app-main">
        <button
          className="button scan-receipt-button button-full-width"
          onClick={() => setShowReceiptScanner(true)}
        >
          <Camera size={22} />
          <span>Scan Receipt</span>
          <span className="new-badge">NEW!</span>
        </button>

        {/* Validation Errors */}
        {showErrors && validationErrors.length > 0 && (
          <div className="error-banner fade-in-up">
            <AlertCircle size={20} />
            <div className="error-content">
              <strong>Please fix these issues:</strong>
              <ul>
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Saved Groups */}
        {savedBills.length > 0 && (
          <div className="card slide-in">
            <h3 className="card-title">
              <Receipt size={20} />
              Saved Bills
              <span className="count-badge">{savedBills.length}</span>
            </h3>

            <div className="saved-groups-list">
              {savedBills.map((bill) => {
                const personalItemCount = bill.people.reduce((sum, person) => sum + ((person.items || []).length), 0);
                const itemCount = personalItemCount + (bill.sharedItems || []).length;

                return (
                  <div key={bill.id} className="saved-group-item">
                    <div className="group-info">
                      <div className="group-name">{bill.name}</div>
                      <div className="group-details">
                        <span className="group-members">
                          {bill.people.length} {bill.people.length === 1 ? 'person' : 'people'} • {itemCount} items
                        </span>
                        <span className="saved-bill-total">
                          Total ${Number(bill.grandTotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="group-actions">
                      <button
                        className="button button-secondary button-small"
                        onClick={() => loadBill(bill)}
                      >
                        Load
                      </button>
                      <button
                        className="button button-danger button-small"
                        onClick={() => handleDeleteBill(bill.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <SavedGroups 
          groups={savedGroups}
          onLoad={loadGroup}
          onDelete={deleteGroup}
        />

        {/* People Section */}
        <div className="card">
          <h3 className="card-title">
            <User size={24} />
            People & Items
          </h3>

          <div className="people-list">
            {people.map((person, index) => (
              <PersonCard
                key={person.id}
                person={person}
                index={index}
                onUpdateName={updatePersonName}
                onUpdateTip={updatePersonTip}
                onAddItem={addItem}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
                onRemove={removePerson}
                canRemove={people.length > 1}
              />
            ))}
          </div>

          <button
            className="button button-primary button-full-width"
            onClick={addPerson}
          >
            <Plus size={20} />
            Add Person
          </button>
        </div>

        {/* Shared Items Section */}
        <div className="card">
          <h3 className="card-title">
            <Share2 size={24} />
            Shared Items
          </h3>

          {sharedItems.length === 0 ? (
            <div className="empty-state">
              <p>No shared items yet.</p>
              <p className="empty-state-hint">
                Add appetizers, drinks, or anything split between people!
              </p>
            </div>
          ) : (
            <div className="shared-items-list">
              {sharedItems.map(item => (
                <SharedItemCard
                  key={item.id}
                  item={item}
                  people={people}
                  onUpdate={updateSharedItem}
                  onTogglePerson={toggleSharedItemPerson}
                  onRemove={removeSharedItem}
                />
              ))}
            </div>
          )}

          <button
            className="button button-primary button-full-width"
            onClick={addSharedItem}
          >
            <Plus size={20} />
            Add Shared Item
          </button>
        </div>

        {/* Tax & Settings */}
        <TaxSettings
          tax={tax}
          taxMode={taxMode}
          onTaxChange={setTax}
          onTaxModeChange={setTaxMode}
        />

        {/* Save Group */}
        <div className="card">
          <h3 className="card-title">
            <Users size={20} />
            Save This Group
          </h3>
          <div className="save-group-form">
            <input
              type="text"
              className="input-field"
              placeholder="Group name (e.g., 'Work Lunch Crew')"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
              onKeyPress={(e) => e.key === 'Enter' && saveGroup()}
            />
            <button
              className="button button-primary"
              onClick={saveGroup}
              disabled={!groupName.trim()}
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">
            <Receipt size={20} />
            Save This Bill
          </h3>
          <div className="save-group-form">
            <input
              type="text"
              className="input-field"
              placeholder="Bill name (optional)"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              maxLength={60}
              onKeyPress={(e) => e.key === 'Enter' && saveBill()}
            />
            <button
              className="button button-primary"
              onClick={saveBill}
            >
              <Save size={18} />
              Save Bill
            </button>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          className="button button-primary button-large button-full-width calculate-button"
          onClick={handleCalculate}
        >
          <Receipt size={24} />
          {showSummary ? 'Recalculate Split' : 'Calculate Split'}
        </button>

        {/* Summary */}
        {showSummary && (
          <Summary 
            totals={totals}
            grandTotal={grandTotal}
            onClose={() => setShowSummary(false)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with ❤️ for fair splits and happy friends</p>
      </footer>

      {showReceiptScanner && (
        <ReceiptScanner
          onReceiptProcessed={handleReceiptProcessed}
          onClose={() => setShowReceiptScanner(false)}
        />
      )}

      {showItemSelection && scannedReceipt && (
        <ItemSelection
          scannedItems={scannedReceipt.items || []}
          people={people}
          onComplete={handleItemSelectionComplete}
          onClose={() => {
            setShowItemSelection(false);
            setScannedReceipt(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
