# FairShare - Installation Guide

## 🚀 Quick Install (5 Minutes)

### Step 1: Copy the Files

1. Download/copy the entire `fairshare-final` folder
2. Place it wherever you want (Desktop, Documents, etc.)

### Step 2: Install Dependencies

Open Terminal/Command Prompt and navigate to the folder:

```bash
cd path/to/fairshare-final

# Install all dependencies
npm install
```

This will install:
- React & React DOM
- Vite (build tool)
- Lucide React (icons)

### Step 3: Run the App

```bash
npm run dev
```

Your browser will automatically open to `http://localhost:5173`

**That's it! You're done! 🎉**

---

## 📋 Prerequisites

Before you start, make sure you have:

### Required
- **Node.js** (version 18 or higher)
  - Download from: https://nodejs.org
  - Check version: `node --version`
- **npm** (comes with Node.js)
  - Check version: `npm --version`

### Optional
- **Git** (for version control)
- **VS Code** (recommended code editor)

---

## 🔄 Replacing Your Old App

If you already have a FairShare app running:

### Option 1: Fresh Start (Recommended)

1. **Backup your old version** (if needed)
   ```bash
   mv ~/Desktop/bill-splitter ~/Desktop/bill-splitter-backup
   ```

2. **Copy the new fairshare-final folder**

3. **Navigate and install**
   ```bash
   cd ~/Desktop/fairshare-final
   npm install
   npm run dev
   ```

### Option 2: Update in Place

1. **Navigate to your existing project**
   ```bash
   cd ~/Desktop/bill-splitter
   ```

2. **Delete old src folder**
   ```bash
   rm -rf src/
   ```

3. **Copy new src folder** from fairshare-final

4. **Copy new package.json, vite.config.js, index.html**

5. **Reinstall dependencies**
   ```bash
   rm -rf node_modules/
   npm install
   ```

6. **Run it**
   ```bash
   npm run dev
   ```

---

## 🐛 Troubleshooting

### "npm: command not found"
**Problem**: Node.js not installed or not in PATH

**Solution**:
1. Install Node.js from https://nodejs.org
2. Restart your terminal
3. Try `node --version` to verify

### "Cannot find module 'lucide-react'"
**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

### "Port 5173 is already in use"
**Problem**: Another app is using that port

**Solution**:
- Stop the other app (Ctrl+C in its terminal)
- Or change the port in `vite.config.js`:
  ```javascript
  server: {
    port: 3000 // or any other port
  }
  ```

### App shows blank screen
**Problem**: Build error or missing files

**Solution**:
1. Check browser console (F12) for errors
2. Make sure all files are in place
3. Try:
   ```bash
   rm -rf node_modules/
   npm install
   npm run dev
   ```

### Changes not showing up
**Problem**: Browser cache

**Solution**:
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Or clear browser cache

---

## 📁 File Structure Verification

After installation, you should have:

```
fairshare-final/
├── node_modules/          ✅ (created after npm install)
├── src/
│   ├── components/
│   │   ├── PersonCard.jsx
│   │   ├── SharedItemCard.jsx
│   │   ├── TaxSettings.jsx
│   │   ├── SavedGroups.jsx
│   │   ├── Summary.jsx
│   │   └── PriceInput.jsx
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── calculations.js
│   │   └── storage.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

### Missing Files?

If any src files are missing, the app won't work. Make sure you copied the entire `fairshare-final` folder.

---

## 🔧 Development Setup

### VS Code Setup (Recommended)

1. **Open the project**
   ```bash
   code fairshare-final
   ```

2. **Recommended Extensions**:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint

3. **Open integrated terminal**: View → Terminal (or Ctrl+`)

4. **Run**: `npm run dev`

### Other Editors

Any text editor works! Just run `npm run dev` from terminal.

---

## 🌐 Building for Production

### Create Production Build

```bash
npm run build
```

This creates optimized files in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

### Deploy

Upload the `dist/` folder to:
- **Vercel**: `vercel`
- **Netlify**: Drag & drop dist/ folder
- **GitHub Pages**: Use gh-pages package
- **Any static host**: Upload dist/ contents

---

## 🔄 Updating the App

When you make changes:

1. **Code changes**: Auto-reload in browser
2. **Add dependencies**: `npm install package-name`
3. **Remove dependencies**: `npm uninstall package-name`

---

## 💾 Backing Up Your Data

All saved groups are in browser localStorage. To backup:

1. Open app in browser
2. Open DevTools (F12)
3. Go to Application → Local Storage
4. Export `fairshare_groups` key
5. Save as JSON file

To restore: Import the JSON back into localStorage.

---

## ❓ Still Having Issues?

1. **Check Node version**: `node --version` (should be 18+)
2. **Check npm version**: `npm --version`
3. **Try clean install**:
   ```bash
   rm -rf node_modules/ package-lock.json
   npm install
   ```
4. **Check file permissions**: Make sure you can read/write files
5. **Try a different port**: Edit vite.config.js

---

## 📞 Getting Help

- Check the README.md for features and usage
- Look at browser console for errors (F12)
- Verify all files are present and not corrupted
- Make sure you're in the correct directory

---

## ✅ Verification Checklist

Before opening an issue, verify:

- [ ] Node.js installed (v18+)
- [ ] npm working (`npm --version`)
- [ ] In correct directory (`pwd` or `cd`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] No error messages in terminal
- [ ] Browser console has no errors (F12)
- [ ] All files present in src/ folder
- [ ] package.json exists and is valid JSON

---

**Happy splitting! 🎉**
