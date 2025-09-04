# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mathematical analysis project that calculates probabilities related to dice rolling scenarios, specifically analyzing the probability that 4 people rolling different numbers of dice will all get different sums.

## Technology Stack

- **Language**: Python 3
- **Dependencies**: `numpy` (mathematical computations), `matplotlib` (plotting with text fallback)

## Development Commands

### Setup
```bash
# Install required dependencies
pip install numpy matplotlib

# Run the analysis
python yesyes.py
```

### Alternative minimal setup
```bash
# The code has text-based visualization fallback
pip install numpy
python yesyes.py
```

## Code Architecture

The project is implemented as a single Python file (`yesyes.py`) containing:

### Core Mathematical Functions
- `calculate_exact_probability(num_dice, num_people=4)` - Exact combinatorial calculation
- `birthday_paradox_approximation(num_possible_sums, num_people=4)` - Birthday paradox approximation
- `normal_approximation(num_dice, num_people=4)` - Normal distribution approximation for large dice counts
- `analyze_convergence()` - Mathematical convergence analysis
- `derive_formula()` - Formula derivation explanation
- `plot_analysis(results)` - Text-based visualization

### Known Issues
The main() function calls two undefined functions that need implementation:
- `show_rate_of_change(results)` - Should analyze rate of change in probabilities
- `find_asymptotic_limit()` - Should determine asymptotic behavior

## Mathematical Context

The project studies probability distributions where:
- Multiple people roll different numbers of dice
- Goal is calculating probability that all sums are unique
- Uses multiple approximation methods to validate exact calculations
- Analyzes convergence behavior as dice count increases

## File Structure

Single-file architecture with all functionality in `yesyes.py` (7,783 bytes).