/**
 * Receipt OCR utilities
 * Parses OCR text into bill items and runs Tesseract in the browser.
 */

import Tesseract from 'tesseract.js';
import { generateId, roundToTwo } from './formatters.js';

const PRICE_REGEX_GLOBAL = /\$?\s*(\d+[.,]\d{2})/g;
const TAX_KEYWORDS = ['tax', 'gst', 'hst', 'sales tax', 'vat'];
const TOTAL_KEYWORDS = ['total', 'amount due', 'balance due', 'grand total'];
const SUBTOTAL_KEYWORDS = ['subtotal', 'sub total'];
const HEADER_KEYWORDS = [
  'receipt',
  'thank',
  'cashier',
  'date',
  'time',
  'table',
  'server',
  'guest',
  'order',
  'invoice',
  'change',
  'payment',
  'visa',
  'mastercard',
  'approved',
  'shattuck',
  'berkeley',
  'store',
  'phone'
];
const MODIFIER_WORDS = ['mild', 'medium', 'spicy', 'extra spicy', 'hot', 'cold'];
const WEIGHT_UNITS = /(lb|1b|tb|kg|g|oz)/i;

const normalizeLine = (line) => {
  return String(line || '')
    .replace(/[|]/g, ' ')
    .replace(/(\d),(\d{2})/g, '$1.$2')
    .replace(/(?<=\d)\s+(?=\d{2}$)/g, '.')
    .replace(/\b1b\b/gi, 'lb')
    .replace(/\btb\b/gi, 'lb')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractPriceMatches = (line) => {
  return [...normalizeLine(line).matchAll(PRICE_REGEX_GLOBAL)].map((match) => ({
    value: parseFloat(match[1].replace(',', '.')),
    match: match[0],
    index: match.index ?? 0
  })).filter((match) => isFinite(match.value));
};

const containsKeyword = (line, keywords) => {
  const lowered = normalizeLine(line).toLowerCase();
  return keywords.some((keyword) => lowered.includes(keyword));
};

const shouldSkipLine = (line) => {
  const normalized = normalizeLine(line).toLowerCase();

  if (!normalized) return true;
  if (normalized.length < 2) return true;
  if (/^[\W_]+$/.test(normalized)) return true;

  return HEADER_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const isWeightDetailLine = (line) => {
  const normalized = normalizeLine(line).toLowerCase();

  return (
    /\/\s*(lb|kg|g|oz)/i.test(normalized) ||
    (normalized.includes(' x ') && WEIGHT_UNITS.test(normalized)) ||
    (/^\$?\d+[.,]\d{2}/.test(normalized) && WEIGHT_UNITS.test(normalized))
  );
};

const isModifierLine = (line) => {
  const normalized = normalizeLine(line).toLowerCase();
  if (MODIFIER_WORDS.includes(normalized)) {
    return true;
  }

  const tokens = normalized.split(' ').filter(Boolean);
  return tokens.length <= 2 && MODIFIER_WORDS.includes(tokens[0]);
};

const looksLikeStandalonePrice = (line) => {
  const normalized = normalizeLine(line);
  return /^\$?\d+[.,]\d{2}$/.test(normalized);
};

const extractWholeDollarPrice = (line) => {
  const normalized = normalizeLine(line);
  const match = normalized.match(/\$(\d{1,3})(?![.,]\d{2})/);

  if (!match) {
    return null;
  }

  return {
    value: parseFloat(match[1]),
    index: match.index ?? 0
  };
};

const extractTrailingCents = (line) => {
  const normalized = normalizeLine(line);
  const matches = [...normalized.matchAll(/(?:^|\D)(\d{2})(?=\D|$)/g)];
  const lastMatch = matches[matches.length - 1];
  return lastMatch ? parseInt(lastMatch[1], 10) : null;
};

const cleanupTokens = (rawName) => {
  let cleaned = normalizeLine(rawName)
    .replace(/[^\p{L}\p{N}\s&\-'/().]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let tokens = cleaned.split(' ').filter(Boolean);

  while (tokens.length > 1 && /^(\d+|[#%&$]+|[A-Z]{1,2})$/u.test(tokens[0])) {
    tokens.shift();
  }

  while (tokens.length > 2 && tokens[0].length <= 2) {
    tokens.shift();
  }

  while (tokens.length > 1 && /^[a-z]$/u.test(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  while (tokens.length > 2 && tokens[tokens.length - 1].length <= 2) {
    tokens.pop();
  }

  cleaned = tokens.join(' ')
    .replace(/^\d+\s*x\s*/i, '')
    .replace(/^\d+\s+/, '')
    .trim();

  return cleaned;
};

const buildItemName = (line, priceMatch, pendingName) => {
  const normalized = normalizeLine(line);
  const baseName = cleanupTokens(normalized.slice(0, priceMatch.index));
  const combinedName = cleanupTokens([pendingName, baseName].filter(Boolean).join(' '));

  return combinedName;
};

const isLikelyItemLabel = (line) => {
  const normalized = normalizeLine(line);
  const letterCount = (normalized.match(/\p{L}/gu) || []).length;
  const digitCount = (normalized.match(/\d/g) || []).length;
  const tokens = normalized.split(' ').filter(Boolean);
  const longTokenCount = tokens.filter((token) => token.replace(/[^\p{L}]/gu, '').length >= 3).length;

  if (shouldSkipLine(normalized)) return false;
  if (isModifierLine(normalized)) return false;
  if (containsKeyword(normalized, [...TAX_KEYWORDS, ...SUBTOTAL_KEYWORDS, ...TOTAL_KEYWORDS])) return false;
  if (isWeightDetailLine(normalized)) return false;
  if (letterCount < 4) return false;
  if (normalized.includes(':')) return false;
  if (/\bca\b/i.test(normalized) || /\bave\b/i.test(normalized) || /\bphone\b/i.test(normalized)) return false;
  if (/\b\d{5}\b/.test(normalized)) return false;
  if (digitCount > 8 && digitCount > letterCount) return false;
  if (digitCount > 3 && digitCount >= letterCount / 2) return false;
  if (longTokenCount < 2) return false;

  return true;
};

const preprocessReceiptImage = async (imageFile) => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return imageFile;
  }

  const bitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  const scale = 2;

  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const grayscale = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const contrasted = grayscale > 175 ? 255 : grayscale < 120 ? 0 : grayscale;
    pixels[index] = contrasted;
    pixels[index + 1] = contrasted;
    pixels[index + 2] = contrasted;
  }

  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

/**
 * Parse OCR text into bill data.
 * @param {string} text - Raw OCR text
 * @returns {{items: Array, tax: number, subtotal: number, total: number}}
 */
export const parseReceiptText = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  const items = [];
  let tax = 0;
  let subtotal = 0;
  let total = 0;
  let pendingName = '';
  let pendingWholeDollarPrice = null;

  lines.forEach((line) => {
    const normalized = normalizeLine(line);
    const lowered = normalized.toLowerCase();
    const priceMatches = extractPriceMatches(normalized);
    const lastPriceMatch = priceMatches[priceMatches.length - 1];

    const looksLikeTaxRateOnly = (
      containsKeyword(normalized, TAX_KEYWORDS) &&
      lastPriceMatch &&
      priceMatches.length === 1 &&
      !normalized.includes('$') &&
      (
        (normalized.includes('%') && !normalized.endsWith(lastPriceMatch.match.trim())) ||
        (normalized.includes('(') && normalized.includes(')'))
      )
    );

    if (looksLikeTaxRateOnly) {
      pendingName = '';
      pendingWholeDollarPrice = null;
      return;
    }

    if (containsKeyword(normalized, TAX_KEYWORDS) && lastPriceMatch) {
      tax = Math.max(tax, roundToTwo(lastPriceMatch.value));
      pendingName = '';
      pendingWholeDollarPrice = null;
      return;
    }

    if (containsKeyword(normalized, SUBTOTAL_KEYWORDS) && lastPriceMatch) {
      subtotal = Math.max(subtotal, roundToTwo(lastPriceMatch.value));
      pendingName = '';
      pendingWholeDollarPrice = null;
      return;
    }

    if (containsKeyword(normalized, TOTAL_KEYWORDS) && lastPriceMatch) {
      total = Math.max(total, roundToTwo(lastPriceMatch.value));
      pendingName = '';
      pendingWholeDollarPrice = null;
      return;
    }

    if (shouldSkipLine(normalized)) {
      return;
    }

    if (isModifierLine(normalized)) {
      if (items.length > 0 && !items[items.length - 1].name.toLowerCase().includes(lowered)) {
        items[items.length - 1].name = `${items[items.length - 1].name} (${normalized})`;
      }
      return;
    }

    if (isWeightDetailLine(normalized)) {
      if (pendingName && pendingWholeDollarPrice !== null) {
        const cents = extractTrailingCents(normalized);
        if (cents !== null) {
          items.push({
            id: generateId(),
            name: pendingName,
            price: roundToTwo(pendingWholeDollarPrice + (cents / 100))
          });
          pendingName = '';
          pendingWholeDollarPrice = null;
        }
      } else if (pendingName && priceMatches.length >= 2) {
        items.push({
          id: generateId(),
          name: pendingName,
          price: roundToTwo(lastPriceMatch.value)
        });
        pendingName = '';
        pendingWholeDollarPrice = null;
      }
      return;
    }

    if (!lastPriceMatch) {
      const wholeDollarMatch = extractWholeDollarPrice(normalized);

      if (wholeDollarMatch && isLikelyItemLabel(normalized)) {
        pendingName = cleanupTokens(normalized.slice(0, wholeDollarMatch.index));
        pendingWholeDollarPrice = wholeDollarMatch.value;
        return;
      }

      if (!looksLikeStandalonePrice(normalized) && isLikelyItemLabel(normalized)) {
        pendingName = cleanupTokens([pendingName, normalized].filter(Boolean).join(' '));
      }
      return;
    }

    const itemName = buildItemName(normalized, lastPriceMatch, pendingName);
    pendingName = '';
    pendingWholeDollarPrice = null;

    if (!itemName || itemName.length < 2) {
      return;
    }

    items.push({
      id: generateId(),
      name: itemName,
      price: roundToTwo(lastPriceMatch.value)
    });
  });

  const filteredItems = items.filter((item) => {
    const lowered = item.name.toLowerCase();

    if (item.price <= 0) return false;
    if (/\/\s*(lb|kg|g|oz)/i.test(lowered)) return false;
    if (WEIGHT_UNITS.test(lowered) && /\bx\b/i.test(lowered)) return false;
    return !TOTAL_KEYWORDS.some((keyword) => lowered.includes(keyword));
  });

  const calculatedSubtotal = subtotal || roundToTwo(
    filteredItems.reduce((sum, item) => sum + item.price, 0)
  );

  const calculatedTotal = total || roundToTwo(calculatedSubtotal + tax);

  return {
    items: filteredItems,
    tax: roundToTwo(tax),
    subtotal: calculatedSubtotal,
    total: calculatedTotal
  };
};

/**
 * Run OCR on an image and parse the resulting text.
 * @param {File|Blob|string} imageFile - Receipt image
 * @param {(progress: number) => void} onProgress - Progress callback
 * @returns {Promise<Object>} Parsed OCR result
 */
export const processReceiptImage = async (imageFile, onProgress = () => {}) => {
  try {
    onProgress(5);
    const processedImage = await preprocessReceiptImage(imageFile);
    onProgress(12);

    const result = await Tesseract.recognize(processedImage, 'eng', {
      logger: (message) => {
        if (message.status === 'recognizing text' && typeof message.progress === 'number') {
          onProgress(Math.max(12, Math.min(100, Math.round(message.progress * 88) + 12)));
        }
      },
      preserve_interword_spaces: '1'
    });

    const parsed = parseReceiptText(result.data?.text || '');
    const validation = validateReceiptData(parsed);

    return {
      success: validation.errors.length === 0,
      items: parsed.items,
      tax: parsed.tax,
      subtotal: parsed.subtotal,
      total: parsed.total,
      warnings: validation.warnings,
      errors: validation.errors,
      rawText: result.data?.text || '',
      error: validation.errors[0] || null
    };
  } catch (error) {
    console.error('Receipt OCR failed:', error);
    return {
      success: false,
      items: [],
      tax: 0,
      subtotal: 0,
      total: 0,
      warnings: [],
      errors: ['We could not read that receipt. Try a clearer photo.'],
      error: error.message || 'OCR processing failed'
    };
  }
};

/**
 * Validate parsed receipt data quality.
 * @param {{items: Array, tax: number, subtotal: number, total: number}} data - Parsed receipt data
 * @returns {{errors: string[], warnings: string[]}}
 */
export const validateReceiptData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('No receipt items were found. Try a sharper, flatter photo.');
  }

  if (Array.isArray(data?.items) && data.items.length > 0 && data.items.length < 2) {
    warnings.push('Only a few items were found. Double-check the scan before using it.');
  }

  if (!data || !data.tax) {
    warnings.push('No tax was detected. You can still enter tax manually.');
  }

  if (data?.subtotal && data?.items?.length) {
    const itemTotal = roundToTwo(data.items.reduce((sum, item) => sum + (item.price || 0), 0));
    if (Math.abs(itemTotal - data.subtotal) > 3) {
      warnings.push('The scan total looks a little off. Review the imported items before adding them.');
    }
  }

  return { errors, warnings };
};
