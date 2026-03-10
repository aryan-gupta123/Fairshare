import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Camera, CheckCircle2, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { processReceiptImage, validateReceiptData } from '../utils/receiptOCR';
import PriceInput from './PriceInput';
import { generateId, validateName } from '../utils/formatters';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * ReceiptScanner modal
 * Handles camera/upload input, OCR progress, and review before assignment.
 */
const ReceiptScanner = ({ onReceiptProcessed, onClose }) => {
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [screen, setScreen] = useState('upload');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);

  const scanSummary = useMemo(() => {
    const itemCount = result?.items?.length || 0;
    const hasTax = Number(result?.tax) > 0;
    return `Found ${itemCount} ${itemCount === 1 ? 'item' : 'items'}${hasTax ? ' + tax' : ''}`;
  }, [result]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetScanner = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }

    setScreen('upload');
    setProgress(0);
    setErrorMessage('');
    setResult(null);
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const validateFile = (file) => {
    if (!file) {
      return 'Please choose a receipt photo first.';
    }

    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'Receipt image must be smaller than 10MB.';
    }

    return '';
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    const validationError = validateFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      setScreen('error');
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setScreen('processing');
    setProgress(0);
    setErrorMessage('');

    const processed = await processReceiptImage(file, setProgress);
    const qualityCheck = validateReceiptData(processed);

    if (!processed.success && qualityCheck.errors.length > 0) {
      setErrorMessage(qualityCheck.errors[0]);
      setScreen('error');
      return;
    }

    setResult({
      ...processed,
      warnings: qualityCheck.warnings
    });
    setProgress(100);
    setScreen('results');
  };

  const handleUseReceipt = () => {
    if (!result) return;

    onReceiptProcessed({
      items: result.items,
      tax: result.tax,
      subtotal: result.subtotal,
      total: result.total,
      rawText: result.rawText,
      imageName: selectedFile?.name || 'receipt'
    });
  };

  const updateScannedItem = (itemId, field, value) => {
    setResult((prev) => {
      const nextItems = prev.items.map((item) => (
        item.id === itemId ? { ...item, [field]: value } : item
      ));

      const subtotal = Number(nextItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2));
      const tax = parseFloat(prev.tax) || 0;

      return {
        ...prev,
        items: nextItems,
        subtotal,
        total: Number((subtotal + tax).toFixed(2))
      };
    });
  };

  const deleteScannedItem = (itemId) => {
    setResult((prev) => {
      const nextItems = prev.items.filter((item) => item.id !== itemId);
      const subtotal = Number(nextItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2));
      const tax = parseFloat(prev.tax) || 0;

      return {
        ...prev,
        items: nextItems,
        subtotal,
        total: Number((subtotal + tax).toFixed(2))
      };
    });
  };

  const addManualItem = () => {
    setResult((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: generateId(),
          name: '',
          price: ''
        }
      ]
    }));
  };

  const updateTax = (value) => {
    setResult((prev) => {
      const subtotal = Number(prev.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2));
      const tax = parseFloat(value) || 0;

      return {
        ...prev,
        tax: value,
        subtotal,
        total: Number((subtotal + tax).toFixed(2))
      };
    });
  };

  return (
    <div className="receipt-scanner-overlay" role="dialog" aria-modal="true" aria-label="Receipt scanner">
      <div className="receipt-scanner-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Scan Receipt</h3>
            <p className="modal-subtitle">Snap a photo or upload an image to extract items automatically.</p>
          </div>
          <button className="button button-secondary button-small" onClick={onClose} aria-label="Close receipt scanner">
            <X size={18} />
          </button>
        </div>

        {screen === 'upload' && (
          <div className="scanner-screen fade-in">
            <div className="upload-options">
              <button
                className="upload-button"
                onClick={() => cameraInputRef.current?.click()}
                type="button"
              >
                <Camera size={30} />
                <span className="upload-button-title">Take Photo</span>
                <span className="upload-button-hint">Use your camera for a quick scan</span>
              </button>

              <button
                className="upload-button"
                onClick={() => uploadInputRef.current?.click()}
                type="button"
              >
                <Upload size={30} />
                <span className="upload-button-title">Upload Photo</span>
                <span className="upload-button-hint">Choose an image from your device</span>
              </button>
            </div>

            <div className="scanner-tips">
              <h4>Best scan results</h4>
              <ul>
                <li>Use good lighting and avoid shadows.</li>
                <li>Lay the receipt flat before taking the photo.</li>
                <li>Keep the full receipt visible in frame.</li>
              </ul>
            </div>
          </div>
        )}

        {screen === 'processing' && (
          <div className="scanner-screen processing-screen fade-in">
            <div className="spinner" aria-hidden="true">
              <Loader2 size={32} />
            </div>
            <h4>Scanning Receipt...</h4>
            <p>{progress}% complete</p>
            <div className="progress-bar" aria-label="OCR processing progress">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="processing-hint">OCR can take 10-30 seconds depending on image quality.</p>
          </div>
        )}

        {screen === 'results' && result && (
          <div className="scanner-screen fade-in">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="receipt-preview"
              />
            )}

            <div className={`scan-status ${result.warnings?.length ? 'scan-status-warning' : 'scan-status-success'}`}>
              {result.warnings?.length ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <div>
                <strong>{scanSummary}</strong>
                <p>
                  Tax: ${Number(result.tax || 0).toFixed(2)}
                  {Number(result.total || 0) > 0 ? ` • Total: $${Number(result.total).toFixed(2)}` : ''}
                </p>
              </div>
            </div>

            {result.warnings?.length > 0 && (
              <div className="scan-warning-list">
                {result.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            <div className="scanner-edit-header">
              <div>
                <h4>Review scanned items</h4>
                <p>Edit or delete anything the OCR got wrong before importing.</p>
              </div>
              <button className="button button-secondary button-small" onClick={addManualItem} type="button">
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="scanner-tax-editor">
              <label className="form-label" htmlFor="scanner-tax">Tax from receipt</label>
              <PriceInput
                id="scanner-tax"
                value={result.tax || ''}
                onChange={updateTax}
                placeholder="$0.00"
              />
            </div>

            <div className="items-list-scanned items-list-editable">
              {result.items.map((item, index) => (
                <div key={item.id} className="scanned-item scanned-item-editable">
                  <span className="scanned-item-number">{index + 1}</span>
                  <input
                    type="text"
                    className="input-field scanned-item-input"
                    value={item.name}
                    onChange={(event) => updateScannedItem(item.id, 'name', validateName(event.target.value, 100))}
                    placeholder="Item name"
                    maxLength={100}
                  />
                  <PriceInput
                    value={item.price || ''}
                    onChange={(value) => updateScannedItem(item.id, 'price', value)}
                    className="scanned-item-price-input"
                    placeholder="$0.00"
                  />
                  <button
                    className="button button-danger button-small"
                    onClick={() => deleteScannedItem(item.id)}
                    type="button"
                    aria-label={`Delete scanned item ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {result.rawText && (
              <details className="scanner-debug-details">
                <summary>View OCR text</summary>
                <pre>{result.rawText}</pre>
              </details>
            )}

            <div className="modal-actions">
              <button className="button button-secondary" onClick={resetScanner} type="button">
                Try Another Photo
              </button>
              <button className="button button-primary" onClick={handleUseReceipt} type="button" disabled={result.items.length === 0}>
                Use This Receipt
              </button>
            </div>
          </div>
        )}

        {screen === 'error' && (
          <div className="scanner-screen error-screen fade-in">
            <div className="scan-error-icon">
              <AlertCircle size={36} />
            </div>
            <h4>Scan Failed</h4>
            <p>{errorMessage || 'We could not read that receipt image.'}</p>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={resetScanner} type="button">
                Try Again
              </button>
              <button className="button button-primary" onClick={onClose} type="button">
                Close
              </button>
            </div>
          </div>
        )}

        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-file-input"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ReceiptScanner;
