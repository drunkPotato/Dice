import numpy as np
import matplotlib.pyplot as plt
from itertools import combinations, product
from math import factorial, log, exp
from collections import defaultdict

def calculate_exact_probability(num_dice, num_people=4):
    """
    Calculate exact probability using combinatorial method
    """
    # Calculate sum frequencies for n dice
    frequencies = defaultdict(int)
    for outcome in product(range(1, 7), repeat=num_dice):
        dice_sum = sum(outcome)
        frequencies[dice_sum] += 1
    
    total_outcomes = (6 ** num_dice) ** num_people
    all_sums = list(frequencies.keys())
    
    if len(all_sums) < num_people:
        return 0.0, len(all_sums)
    
    favorable_outcomes = 0
    for combo in combinations(all_sums, num_people):
        ways = 1
        for s in combo:
            ways *= frequencies[s]
        favorable_outcomes += ways * factorial(num_people)
    
    probability = favorable_outcomes / total_outcomes
    return probability, len(all_sums)

def birthday_paradox_approximation(num_possible_sums, num_people=4):
    """
    Approximate using birthday paradox formula (assumes uniform distribution)
    P(all different) ≈ n!/(n-k)! / n^k where n=sums, k=people
    """
    if num_possible_sums < num_people:
        return 0.0
    
    prob = 1.0
    for i in range(num_people):
        prob *= (num_possible_sums - i) / num_possible_sums
    return prob

def normal_approximation(num_dice, num_people=4):
    """
    For large num_dice, dice sums approach normal distribution
    Mean = 3.5 * num_dice, Variance = 35/12 * num_dice
    """
    if num_dice < 5:  # Not accurate for small dice counts
        return None
        
    mean = 3.5 * num_dice
    variance = (35/12) * num_dice
    std_dev = np.sqrt(variance)
    
    # With normal distribution, probability depends on how spread out the distribution is
    # relative to the number of people we need to fit
    # This is a rough approximation
    effective_range = 6 * std_dev  # ~99.7% of distribution
    density = num_people / effective_range
    
    # Very rough approximation - not mathematically rigorous
    return max(0, 1 - density**2)

def analyze_convergence():
    """
    Analyze why the probability converges and find the pattern
    """
    print("MATHEMATICAL ANALYSIS: Why Does Probability Plateau?")
    print("="*60)
    
    dice_range = range(1, 21)
    results = []
    
    print(f"{'Dice':<4} {'Exact %':<8} {'Sums':<5} {'Birthday %':<11} {'Mean':<6} {'StdDev':<8} {'CV':<6}")
    print("-" * 65)
    
    for num_dice in dice_range:
        # Calculate exact probability
        exact_prob, num_sums = calculate_exact_probability(num_dice)
        
        # Birthday paradox approximation
        birthday_prob = birthday_paradox_approximation(num_sums)
        
        # Distribution parameters
        mean = 3.5 * num_dice
        std_dev = np.sqrt((35/12) * num_dice)
        cv = std_dev / mean  # Coefficient of variation
        
        print(f"{num_dice:<4} {exact_prob*100:<8.2f} {num_sums:<5} {birthday_prob*100:<11.2f} {mean:<6.1f} {std_dev:<8.2f} {cv:<6.3f}")
        
        results.append({
            'dice': num_dice,
            'exact_prob': exact_prob,
            'num_sums': num_sums,
            'birthday_prob': birthday_prob,
            'mean': mean,
            'std_dev': std_dev,
            'cv': cv
        })
    
    return results

def derive_formula():
    """
    Derive and explain the mathematical formula
    """
    print("\n" + "="*60)
    print("MATHEMATICAL FORMULA DERIVATION")
    print("="*60)
    
    print("EXACT FORMULA:")
    print("P(all different) = Σ[C(n,4) × ∏f(si) × 4!] / (6^k)^4")
    print()
    print("Where:")
    print("• n = number of possible sums with k dice")
    print("• C(n,4) = combinations of choosing 4 different sums") 
    print("• f(si) = frequency of sum si when rolling k dice")
    print("• 4! = permutations (which person gets which sum)")
    print("• (6^k)^4 = total possible outcomes for 4 people")
    print()
    
    print("SUM RANGE:")
    print("• Minimum sum: k (all dice show 1)")
    print("• Maximum sum: 6k (all dice show 6)")
    print("• Number of possible sums: 5k + 1")
    print("• Mean sum: 3.5k")
    print("• Standard deviation: √(35k/12) ≈ 1.71√k")
    print()
    
    print("WHY IT PLATEAUS:")
    print("1. As k increases, number of possible sums grows linearly: ~5k")
    print("2. But the distribution becomes MORE concentrated around the mean")
    print("3. Coefficient of variation DECREASES: CV = 1.71√k / 3.5k = 0.49/√k")
    print("4. So even though there are more possible sums, they're less evenly distributed")
    print("5. The 'effective' number of likely sums grows slower than the total")
    print()
    
    print("APPROXIMATION FOR LARGE k:")
    print("When k is large, most probability mass is concentrated near 3.5k")
    print("The effective range is roughly ±3σ = ±3√(35k/12)")
    print("P(all different) ≈ 1 - e^(-effective_sums²/8)")
    print("This converges to a limit as k → ∞")

def plot_analysis(results):
    """
    Create text-based visualizations since matplotlib isn't available
    """
    print("\n" + "="*60)
    print("VISUALIZATION: PROBABILITY CURVE")
    print("="*60)
    
    # Create a simple text-based plot
    dice_counts = [r['dice'] for r in results]
    probs = [r['exact_prob'] * 100 for r in results]
    
    # Scale for text plot (50 chars wide)
    max_prob = max(probs)
    min_prob = min(probs)
    
    print(f"Probability vs Number of Dice (Scale: {min_prob:.1f}% to {max_prob:.1f}%)")
    print("-" * 60)
    
    for i, (dice, prob) in enumerate(zip(dice_counts, probs)):
        # Calculate bar length (0-50 chars)
        bar_length = int(((prob - min_prob) / (max_prob - min_prob)) * 50)
        bar = "█" * bar_length
        print(f"{dice:2d} dice |{bar:<50}| {prob:5.2f}%")
    
    print("\n" + "="*60)
    print("RATE OF CHANGE VISUALIZATION")  
    print("="*60)
    
    # Show changes between consecutive dice counts
    changes = []
    for i in range(1, len(probs)):
        change = probs[i] - probs[i-1]
        changes.append(change)
    
    if changes:
        max_change = max(changes)
        print(f"Change in Probability (Scale: 0% to {max_change:.2f}%)")
        print("-" * 60)
        
        for i, change in enumerate(changes):
            dice = dice_counts[i+1]
            bar_length = int((change / max_change) * 50) if max_change > 0 else 0
            bar = "▓" * bar_length
            print(f"{dice:2d} dice |{bar:<50}| +{change:5.3f}%")

def main():
    # Analyze the mathematical behavior
    results = analyze_convergence()
    
    # Show rate of change
    show_rate_of_change(results)
    
    # Derive the formula
    derive_formula()
    
    # Find asymptotic behavior
    find_asymptotic_limit()
    
    # Create text-based plots
    plot_analysis(results)
    
    print("\n" + "="*60)
    print("KEY INSIGHTS")
    print("="*60)
    print("1. Formula: P = Σ[C(5k+1,4) × ∏f(si) × 4!] / (6^k)^4")
    print("2. More dice = more possible sums, but less uniform distribution")
    print("3. Coefficient of variation decreases as 1/√k")
    print("4. Probability increases but with diminishing returns") 
    print("5. Practical plateau reached around 20-30 dice")
    print("6. Theoretical limit approaches 100% as k → ∞")
    print("7. The trade-off: More sums available vs. more concentrated distribution")

if __name__ == "__main__":
    main()