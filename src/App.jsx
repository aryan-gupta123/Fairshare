import React, { useState, useEffect } from 'react';
import { X, Plus, Users, Receipt, DollarSign, Share2, Trash2, User, Copy, Check } from 'lucide-react';

export default function BillSplitter() {
  const [people, setPeople] = useState([{ id: 1, name: '', items: [], tip: 15 }]);
  const [sharedItems, setSharedItems] = useState([]);
  const [tax, setTax] = useState('');
  const [taxMode, setTaxMode] = useState('proportional');
  const [savedGroups, setSavedGroups] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [groupName, setGroupName] = useState('');

  // Load saved groups from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('billSplitterGroups');
    if (saved) {
      setSavedGroups(JSON.parse(saved));
    }
  }, []);

  // Add person
  const addPerson = () => {
    setPeople([...people, { id: Date.now(), name: '', items: [], tip: 15 }]);
  };

  // Remove person
  const removePerson = (id) => {
    if (people.length > 1) {
      setPeople(people.filter(p => p.id !== id));
    }
  };

  // Update person name
  const updatePersonName = (id, name) => {
    setPeople(people.map(p => p.id === id ? { ...p, name } : p));
  };

  // Update person tip
  const updatePersonTip = (id, tip) => {
    setPeople(people.map(p => p.id === id ? { ...p, tip: parseFloat(tip) || 0 } : p));
  };

  // Add item to person
  const addItem = (personId) => {
    setPeople(people.map(p => 
      p.id === personId 
        ? { ...p, items: [...p.items, { id: Date.now(), name: '', price: '' }] }
        : p
    ));
  };

  // Remove item from person
  const removeItem = (personId, itemId) => {
    setPeople(people.map(p => 
      p.id === personId 
        ? { ...p, items: p.items.filter(i => i.id !== itemId) }
        : p
    ));
  };

  // Update item
  const updateItem = (personId, itemId, field, value) => {
    setPeople(people.map(p => 
      p.id === personId 
        ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : p
    ));
  };

  // Add shared item
  const addSharedItem = () => {
    setSharedItems([...sharedItems, { id: Date.now(), name: '', price: '', splitBetween: people.map(p => p.id) }]);
  };

  // Remove shared item
  const removeSharedItem = (id) => {
    setSharedItems(sharedItems.filter(i => i.id !== id));
  };

  // Update shared item
  const updateSharedItem = (id, field, value) => {
    setSharedItems(sharedItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Toggle person in shared item
  const toggleSharedItemPerson = (itemId, personId) => {
    setSharedItems(sharedItems.map(item => {
      if (item.id === itemId) {
        const splitBetween = item.splitBetween.includes(personId)
          ? item.splitBetween.filter(id => id !== personId)
          : [...item.splitBetween, personId];
        return { ...item, splitBetween: splitBetween.length > 0 ? splitBetween : [personId] };
      }
      return item;
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const results = people.map(person => {
      // Personal items subtotal
      const itemsSubtotal = person.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      
      // Shared items portion
      const sharedSubtotal = sharedItems.reduce((sum, item) => {
        if (item.splitBetween.includes(person.id)) {
          return sum + (parseFloat(item.price) || 0) / item.splitBetween.length;
        }
        return sum;
      }, 0);

      const subtotal = itemsSubtotal + sharedSubtotal;
      
      // Calculate tax
      const taxAmount = parseFloat(tax) || 0;
      let personTax = 0;
      
      if (taxMode === 'proportional') {
        const totalSubtotal = people.reduce((sum, p) => {
          const pItems = p.items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
          const pShared = sharedItems.reduce((s, item) => {
            if (item.splitBetween.includes(p.id)) {
              return s + (parseFloat(item.price) || 0) / item.splitBetween.length;
            }
            return s;
          }, 0);
          return sum + pItems + pShared;
        }, 0);
        personTax = totalSubtotal > 0 ? (subtotal / totalSubtotal) * taxAmount : 0;
      } else {
        personTax = taxAmount / people.length;
      }

      // Calculate tip on their portion (subtotal + tax)
      const tipAmount = ((subtotal + personTax) * person.tip) / 100;
      
      const total = subtotal + personTax + tipAmount;

      return {
        id: person.id,
        name: person.name || 'Unnamed',
        subtotal,
        tax: personTax,
        tip: tipAmount,
        total
      };
    });

    return results;
  };

  // Save group
  const saveGroup = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    const group = {
      id: Date.now(),
      name: groupName,
      people: people.map(p => ({ name: p.name, tip: p.tip }))
    };

    const updated = [...savedGroups, group];
    setSavedGroups(updated);
    localStorage.setItem('billSplitterGroups', JSON.stringify(updated));
    setGroupName('');
    alert('Group saved!');
  };

  // Load group
  const loadGroup = (group) => {
    setPeople(group.people.map((p, i) => ({
      id: Date.now() + i,
      name: p.name,
      items: [],
      tip: p.tip || 15
    })));
    setSharedItems([]);
    setTax('');
  };

  // Delete group
  const deleteGroup = (id) => {
    const updated = savedGroups.filter(g => g.id !== id);
    setSavedGroups(updated);
    localStorage.setItem('billSplitterGroups', JSON.stringify(updated));
  };

  // Generate payment link
  const generatePaymentLink = (platform, amount, personName, payerName) => {
    const note = `Bill split - ${personName}`;
    const formattedAmount = amount.toFixed(2);
    
    switch(platform) {
      case 'venmo':
        return `venmo://paycharge?txn=pay&amount=${formattedAmount}&note=${encodeURIComponent(note)}`;
      case 'cashapp':
        return `https://cash.app/$/${formattedAmount}`;
      case 'paypal':
        return `https://paypal.me/${formattedAmount}`;
      default:
        return '';
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totals = calculateTotals();
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '"Urbanist", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }

        .slide-in {
          animation: slideIn 0.3s ease-out;
        }

        .card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .card:hover {
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          font-family: 'Urbanist', sans-serif;
          font-weight: 500;
          transition: all 0.2s ease;
          background: white;
          color: #1f2937;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Urbanist', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .button:active {
          transform: translateY(0);
        }

        .button-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .button-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .button-danger {
          background: #fee;
          color: #dc2626;
        }

        .button-small {
          padding: 8px 16px;
          font-size: 14px;
        }

        .person-card {
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          border: 2px solid #e0e7ff;
        }

        .item-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
        }

        .shared-item-card {
          background: linear-gradient(135deg, #fff8f0 0%, #fff0f0 100%);
          border: 2px solid #ffe0d0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .summary-card {
          background: linear-gradient(135deg, #f0fff4 0%, #f0fdf4 100%);
          border: 2px solid #d1fae5;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .payment-button {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          font-family: 'Urbanist', sans-serif;
        }

        .venmo-button {
          background: #008CFF;
          color: white;
        }

        .cashapp-button {
          background: #00D632;
          color: white;
        }

        .paypal-button {
          background: #0070BA;
          color: white;
        }

        .copy-button {
          background: #6b7280;
          color: white;
        }

        .payment-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .saved-group-item {
          background: white;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 2px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .saved-group-item:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          color: #374151;
        }

        .checkbox-label:hover {
          border-color: #667eea;
        }

        .checkbox-label span {
          color: #374151;
        }

        .checkbox-label input:checked + span {
          color: #667eea;
        }

        .checkbox-label input:checked {
          accent-color: #667eea;
        }
      `}</style>

      <div style={{ maxWidth: '1400px', width: '90%', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: 'white', 
            margin: '0 0 16px 0',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <Receipt style={{ display: 'inline', marginRight: '12px', marginBottom: '-8px' }} size={44} />
            FairShare
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontWeight: '500',
            margin: 0
          }}>
            Split bills fairly, pay instantly
          </p>
        </div>

        {/* Saved Groups */}
        {savedGroups.length > 0 && (
          <div className="card slide-in">
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#1f2937', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={20} />
              Saved Groups
            </h3>
            {savedGroups.map(group => (
              <div key={group.id} className="saved-group-item">
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    {group.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {group.people.map(p => p.name).join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="button button-secondary button-small"
                    onClick={() => loadGroup(group)}
                  >
                    Load
                  </button>
                  <button 
                    className="button button-danger button-small"
                    onClick={() => deleteGroup(group.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* People Section */}
        <div className="card">
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <User size={24} />
            People & Items
          </h3>

          {people.map((person, index) => (
            <div key={person.id} className="person-card slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Person ${index + 1} name`}
                  value={person.name}
                  onChange={(e) => updatePersonName(person.id, e.target.value)}
                  style={{ flex: 1, marginRight: '12px' }}
                />
                {people.length > 1 && (
                  <button
                    className="button button-danger button-small"
                    onClick={() => removePerson(person.id)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
                  Tip Percentage: {person.tip}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={person.tip}
                  onChange={(e) => updatePersonTip(person.id, e.target.value)}
                  style={{ width: '100%', accentColor: '#667eea' }}
                />
              </div>

              {person.items.map(item => (
                <div key={item.id} className="item-row">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(person.id, item.id, 'name', e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    className="input-field"
                    placeholder="$0.00"
                    value={item.price}
                    onChange={(e) => updateItem(person.id, item.id, 'price', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="button button-danger button-small"
                    onClick={() => removeItem(person.id, item.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              <button
                className="button button-secondary button-small"
                onClick={() => addItem(person.id)}
                style={{ marginTop: '8px' }}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
          ))}

          <button
            className="button button-primary"
            onClick={addPerson}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Plus size={20} />
            Add Person
          </button>
        </div>

        {/* Shared Items Section */}
        <div className="card">
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Share2 size={24} />
            Shared Items
          </h3>

          {sharedItems.map(item => (
            <div key={item.id} className="shared-item-card">
              <div className="item-row">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Shared item name"
                  value={item.name}
                  onChange={(e) => updateSharedItem(item.id, 'name', e.target.value)}
                  style={{ flex: 2 }}
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder="$0.00"
                  value={item.price}
                  onChange={(e) => updateSharedItem(item.id, 'price', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="button button-danger button-small"
                  onClick={() => removeSharedItem(item.id)}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
                  Split between:
                </div>
                <div className="checkbox-group">
                  {people.map(person => (
                    <label key={person.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={item.splitBetween.includes(person.id)}
                        onChange={() => toggleSharedItemPerson(item.id, person.id)}
                      />
                      <span>{person.name || `Person ${people.indexOf(person) + 1}`}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            className="button button-primary"
            onClick={addSharedItem}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Plus size={20} />
            Add Shared Item
          </button>
        </div>

        {/* Tax & Settings */}
        <div className="card">
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <DollarSign size={24} />
            Tax & Settings
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
              Total Tax Amount
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="$0.00"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
              Tax Split Mode
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className={`button ${taxMode === 'proportional' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setTaxMode('proportional')}
              >
                Proportional
              </button>
              <button
                className={`button ${taxMode === 'even' ? 'button-primary' : 'button-secondary'}`}
                onClick={() => setTaxMode('even')}
              >
                Split Evenly
              </button>
            </div>
          </div>
        </div>

        {/* Save Group */}
        <div className="card">
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: '#1f2937', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={20} />
            Save This Group
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Group name (e.g., 'Work Lunch Crew')"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="button button-primary"
              onClick={saveGroup}
            >
              Save
            </button>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          className="button button-primary"
          onClick={() => setShowSummary(!showSummary)}
          style={{ 
            width: '100%', 
            justifyContent: 'center',
            fontSize: '18px',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          <Receipt size={24} />
          {showSummary ? 'Hide Summary' : 'Calculate Split'}
        </button>

        {/* Summary */}
        {showSummary && (
          <div className="card fade-in-up">
            <h3 style={{ 
              fontSize: '28px', 
              fontWeight: '800', 
              color: '#1f2937', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Split Summary
            </h3>

            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', marginBottom: '8px' }}>
                Total Bill
              </div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'white' }}>
                ${grandTotal.toFixed(2)}
              </div>
            </div>

            {totals.map((person, index) => (
              <div key={person.id} className="summary-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '22px', fontWeight: '700', color: '#065f46', marginBottom: '12px' }}>
                    {person.name}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Subtotal</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>${person.subtotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Tax</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>${person.tax.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Tip</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>${person.tip.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#065f46', fontWeight: '700' }}>TOTAL</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#065f46' }}>${person.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '2px solid #d1fae5', paddingTop: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '12px' }}>
                    Payment Options
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      className="payment-button venmo-button"
                      onClick={() => window.open(generatePaymentLink('venmo', person.total, person.name, 'Payer'), '_blank')}
                    >
                      Venmo
                    </button>
                    <button
                      className="payment-button cashapp-button"
                      onClick={() => window.open(generatePaymentLink('cashapp', person.total, person.name, 'Payer'), '_blank')}
                    >
                      Cash App
                    </button>
                    <button
                      className="payment-button paypal-button"
                      onClick={() => window.open(generatePaymentLink('paypal', person.total, person.name, 'Payer'), '_blank')}
                    >
                      PayPal
                    </button>
                    <button
                      className="payment-button copy-button"
                      onClick={() => copyToClipboard(
                        `${person.name} owes $${person.total.toFixed(2)} (Subtotal: $${person.subtotal.toFixed(2)} + Tax: $${person.tax.toFixed(2)} + Tip: $${person.tip.toFixed(2)})`,
                        person.id
                      )}
                    >
                      {copiedId === person.id ? <Check size={16} /> : <Copy size={16} />}
                      {copiedId === person.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', fontWeight: '500' }}>
            Built with ❤️ for fair splits and happy friends
          </p>
        </div>
      </div>
    </div>
  );
}
