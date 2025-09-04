# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive web-based dice probability calculator hosted on GitHub Pages. Users can explore various dice probability scenarios through an intuitive 3-panel interface with real-time calculations and visualizations.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charting**: Chart.js for interactive visualizations
- **Hosting**: GitHub Pages (static site)
- **No backend dependencies** - all calculations run client-side

## Development Commands

### Local Development
```bash
# Simple file opening
open index.html

# Or serve locally (recommended)
python -m http.server 8000
# Then open http://localhost:8000

# Or with Node.js
npx http-server
```

### Git Operations
```bash
git add .
git commit -m "Your changes"
git push origin main
```

## File Structure

```
/
├── index.html          # Main application interface
├── style.css          # Responsive 3-panel layout styling  
├── script.js          # Probability calculations and UI logic
└── CLAUDE.md          # This documentation file
```

## Code Architecture

### 3-Panel Interface Layout
- **Left Panel**: Collapsible experiment controls with parameter inputs
- **Middle Panel**: Results table with formatted probability data (400px width)
- **Right Panel**: Interactive Chart.js visualizations (flexible width)

### Core JavaScript Functions

**UI Management:**
- `toggleExperiment(id)` - Collapsible experiment sections
- `clearResults()` - Reset display when experiments collapse
- `displayResults()` - Format and show probability tables
- `updateChart()` - Create/update Chart.js visualizations

**Mathematical Calculations:**
- `factorial(n)` - Optimized with memoization for performance
- `combinations(n, k)` - Binomial coefficient calculations
- `calculateSingleDie()` - Probability of rolling 6 on standard die
- `calculateMultipleDice()` - Sum distributions for multiple dice
- `calculateConsecutive()` - Consecutive same number probabilities  
- `calculateAllDifferent()` - Probability all people get different sums

### Experiments Available

1. **Single Die** - Rolling 6 on standard die over multiple attempts
2. **Multiple Dice Sum** - Probability distributions for dice sums
3. **Consecutive Same Number** - Probability of consecutive identical rolls
4. **All Different Sums** - Probability all people get unique sums (birthday paradox)

## UI Behavior

- All experiments start collapsed by default
- Results only appear after clicking Calculate buttons
- Collapsing any experiment clears all results and charts
- Responsive design adapts to mobile/tablet screens
- Hover effects and smooth animations throughout

## Key Features

- **Real-time calculations** - No server requests needed
- **Interactive charts** - Hover for precise values
- **Probability formatting** - Intelligent display (%, scientific notation)
- **Input validation** - Prevents invalid parameter combinations
- **Memoized calculations** - Performance optimized for repeated use

## Mathematical Context

Implements various probability calculation methods:
- Exact combinatorial analysis
- Birthday paradox approximations  
- Binomial distribution calculations
- Normal distribution approximations for large numbers