# 🧾 FairShare - Professional Bill Splitting App

**Split restaurant bills fairly among friends with precision and ease**

A modern, fully-featured React application for splitting bills with support for individual items, shared items, tax handling, tip calculations, and payment integration.

## ✨ Features

### Core Functionality
- ✅ **Individual Items** - Each person adds what they ordered with prices
- ✅ **Shared Items** - Split appetizers, drinks, or any item between selected people
- ✅ **Smart Tax Splitting** - Choose between proportional (fair) or even split
- ✅ **Custom Tips** - Adjustable tip percentage per person (0-30%)
- ✅ **Precise Calculations** - Handles decimals perfectly, no rounding errors
- ✅ **Real-time Updates** - Instant recalculation as you type

### User Experience
- ✅ **Save Groups** - Remember your regular dining crews
- ✅ **Payment Links** - One-click Venmo, Cash App, PayPal integration
- ✅ **Copy to Clipboard** - Easy sharing of payment details
- ✅ **Input Validation** - Prevents invalid data entry
- ✅ **Empty States** - Helpful guidance when sections are empty
- ✅ **Error Handling** - Graceful error messages and recovery
- ✅ **Responsive Design** - Perfect on desktop, tablet, and mobile
- ✅ **Accessibility** - ARIA labels, keyboard navigation, screen reader support

### Technical Excellence
- ✅ **Modular Architecture** - Clean separation of concerns
- ✅ **Type-Safe Logic** - Comprehensive input validation
- ✅ **LocalStorage Persistence** - Data survives page refreshes
- ✅ **Performance Optimized** - React hooks with useCallback/useMemo
- ✅ **No External Dependencies** - Only React and Lucide icons
- ✅ **Production Ready** - Tested for edge cases

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone or download the project
cd fairshare-final

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
fairshare-final/
├── src/
│   ├── components/          # React components
│   │   ├── PersonCard.jsx       # Individual person with items
│   │   ├── SharedItemCard.jsx   # Shared items component
│   │   ├── TaxSettings.jsx      # Tax configuration
│   │   ├── SavedGroups.jsx      # Saved groups management
│   │   ├── Summary.jsx          # Bill split results
│   │   └── PriceInput.jsx       # Custom price input with validation
│   ├── utils/               # Utility functions
│   │   ├── formatters.js        # Input formatting & validation
│   │   ├── calculations.js      # Bill splitting logic
│   │   └── storage.js           # LocalStorage operations
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Entry point
│   └── styles.css           # Complete styling
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies & scripts
└── vite.config.js         # Vite configuration
```

## 🎯 How to Use

### Basic Flow
1. **Add People** - Click "Add Person" and enter names
2. **Add Items** - For each person, add what they ordered
3. **Adjust Tips** - Use the slider to set tip percentage per person
4. **Add Shared Items** - Add appetizers/drinks split between people
5. **Enter Tax** - Input the total tax from your receipt
6. **Calculate** - Click "Calculate Split" to see results
7. **Pay** - Use payment links or copy details

### Advanced Features

**Save Groups**
- Enter a group name (e.g., "Work Lunch Crew")
- Click "Save" to remember the people for next time
- Load saved groups with one click

**Tax Modes**
- **Proportional**: Tax split based on what each person ordered (fairest)
- **Even**: Tax split equally among all people (simpler)

**Shared Items**
- Add items like appetizers or pitchers
- Select which people to split the cost between
- Cost automatically divided among selected people

## 🔧 Configuration

### Customizing Default Values

Edit `src/utils/storage.js` to change defaults:

```javascript
const defaultPrefs = {
  defaultTip: 15,        // Default tip percentage
  taxMode: 'proportional' // or 'even'
};
```

### Styling

All styles are in `src/styles.css` with CSS variables for easy customization:

```css
:root {
  --primary: #667eea;
  --primary-dark: #764ba2;
  /* ... more variables */
}
```

## 🐛 Bug Fixes & Improvements

### Fixed Issues
- ✅ **Decimal Input Bug** - Now properly limits to 2 decimal places
- ✅ **Text Visibility** - All text is properly colored and visible
- ✅ **Checkbox Names** - Names display correctly, not as gray boxes
- ✅ **Rounding Errors** - Proper floating-point math handling
- ✅ **Empty State Handling** - Graceful handling of no data
- ✅ **Division by Zero** - Safe calculations with zero amounts

### Edge Cases Handled
- Person with no items
- Shared item with no one selected (prevented)
- Negative prices (rejected)
- Non-numeric input (filtered)
- Very large numbers (capped at $9999.99)
- Empty names (shows "Unnamed")
- Tip over 100% (capped at 100%)
- Tax with no items (splits evenly)

## 📱 Responsive Design

- **Desktop**: Full-width layout with hover effects
- **Tablet**: Optimized for touch with larger buttons
- **Mobile**: Single-column layout, full-width buttons
- **Print**: Clean printable summary (hides buttons)

## ♿ Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast text
- Focus indicators
- Semantic HTML

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Deploy the dist/ folder to Netlify
```

### Manual Build

```bash
# Create production build
npm run build

# Output in dist/ folder
# Upload to any static host
```

## 🔒 Privacy & Data

- **No backend** - All calculations happen in your browser
- **No tracking** - Zero analytics or tracking scripts
- **LocalStorage only** - Data never leaves your device
- **No account required** - Use immediately
- **No ads** - Clean, distraction-free experience

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run preview  # Preview production build
npm run lint     # Run ESLint (if configured)
```

### Tech Stack

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Lucide React** - Icon library
- **Vanilla CSS** - No CSS framework needed

### Adding Features

1. **New Component**: Create in `src/components/`
2. **New Utility**: Add to appropriate util file
3. **New Calculation**: Update `calculations.js`
4. **New Style**: Add to `styles.css`

## 🤝 Contributing

Contributions welcome! Areas for improvement:

1. **Receipt Scanning** - OCR integration (Google Cloud Vision)
2. **Backend** - User accounts & cloud sync (Firebase/Supabase)
3. **Mobile App** - React Native version
4. **Real Payment Integration** - Actual Venmo/PayPal APIs
5. **Multi-currency** - Support for different currencies
6. **Bill History** - Track past bills
7. **Analytics** - Spending insights
8. **Dark Mode** - Theme toggle

## 📄 License

MIT License - Free to use for personal or commercial projects

## 👨‍💻 Author

Built with ❤️ by [Your Name]

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev)
- Inspired by the need for fair bill splitting
- Thanks to all beta testers!

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Questions**: Check existing issues first
- **Feature Requests**: Open a discussion

## 🔮 Roadmap

### v2.0 (Future)
- [ ] Receipt photo scanning
- [ ] User accounts
- [ ] Bill history
- [ ] Multi-currency support
- [ ] Dark mode
- [ ] PWA (offline support)
- [ ] Real-time collaboration

### v2.1 (Later)
- [ ] Native mobile apps
- [ ] Payment tracking
- [ ] Spending analytics
- [ ] Restaurant recommendations
- [ ] Split templates

---

**⭐ Star this repo if you find it helpful!**

Made with precision, tested with care, built for fairness.
