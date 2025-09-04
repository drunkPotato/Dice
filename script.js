let chart = null;

// Toggle experiment sections
function toggleExperiment(experimentId) {
    const controls = document.getElementById(experimentId);
    const header = controls.previousElementSibling;
    const arrow = header.querySelector('.toggle-arrow');
    
    if (controls.classList.contains('collapsed')) {
        controls.classList.remove('collapsed');
        arrow.textContent = '▼';
    } else {
        controls.classList.add('collapsed');
        arrow.textContent = '▶';
        // Clear results when collapsing
        clearResults();
    }
}

function clearResults() {
    const container = document.getElementById('results-container');
    container.innerHTML = `
        <div class="no-results-message">
            <p>Select an experiment and click Calculate to see results.</p>
        </div>
    `;
    destroyChart();
}

// Utility functions with memoization
const factorialCache = {};
function factorial(n) {
    if (n <= 1) return 1;
    if (factorialCache[n]) return factorialCache[n];
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    factorialCache[n] = result;
    return result;
}

function combinations(n, k) {
    if (k > n) return 0;
    return factorial(n) / (factorial(k) * factorial(n - k));
}

function formatProbability(prob) {
    if (prob >= 0.1) return (prob * 100).toFixed(2) + '%';
    if (prob >= 0.001) return (prob * 100).toFixed(4) + '%';
    return prob.toExponential(3);
}

function getProbabilityClass(prob) {
    if (prob >= 0.1) return 'probability-high';
    if (prob >= 0.01) return 'probability-medium';
    return 'probability-low';
}

function displayResults(title, data, summary = null) {
    const container = document.getElementById('results-container');
    
    let html = '';
    
    if (summary) {
        html += `<div class="result-summary">
            <h3>${title}</h3>
            ${summary}
        </div>`;
    }
    
    if (data.length > 0) {
        html += `<table class="results-table">
            <thead>
                <tr>
                    <th>Outcome</th>
                    <th>Probability</th>
                    <th>Decimal</th>
                </tr>
            </thead>
            <tbody>`;
        
        data.forEach(row => {
            const probClass = getProbabilityClass(row.probability);
            html += `<tr>
                <td>${row.outcome}</td>
                <td class="${probClass}">${formatProbability(row.probability)}</td>
                <td>${row.probability.toFixed(6)}</td>
            </tr>`;
        });
        
        html += `</tbody></table>`;
    }
    
    container.innerHTML = html;
}

function destroyChart() {
    if (chart) {
        chart.destroy();
        chart = null;
    }
}

function updateChart(labels, probabilities, title, chartType = 'bar') {
    const ctx = document.getElementById('probabilityChart').getContext('2d');
    destroyChart();
    
    chart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: '',
                data: probabilities,
                backgroundColor: chartType === 'line' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                fill: chartType === 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(2) + '%';
                        }
                    }
                }
            }
        }
    });
}

function displayMathsExplanation(title, explanation) {
    const container = document.getElementById('results-container');
    container.innerHTML = `
        <div class="maths-explanation">
            <h3>${title}</h3>
            ${explanation}
        </div>
    `;
}

// Single Die Calculations
function calculateSingleDie() {
    const sides = 6; // Always use 6-sided die
    const rolls = parseInt(document.getElementById('singleDieRolls').value);
    const target = 6; // Always target 6
    
    if (rolls > 1000) {
        alert('Maximum 1000 rolls allowed for performance reasons');
        return;
    }
    
    // Calculate expected value and standard deviation for binomial distribution
    const p = 1/sides;
    const expected = rolls * p;
    const variance = rolls * p * (1 - p);
    const stdDev = Math.sqrt(variance);
    
    // For large rolls, focus on the 95% confidence interval around the expected value
    let startK, endK;
    if (rolls <= 50) {
        // For small rolls, show all outcomes
        startK = 0;
        endK = rolls;
    } else {
        // For large rolls, show 95% of probability mass around expected value
        startK = Math.max(0, Math.floor(expected - 2 * stdDev));
        endK = Math.min(rolls, Math.ceil(expected + 2 * stdDev));
    }
    
    const allResults = [];
    let totalShownProb = 0;
    
    // Calculate probabilities for the selected range
    for (let k = startK; k <= endK; k++) {
        let prob;
        if (rolls <= 170) {
            // Use exact binomial calculation for smaller values
            prob = combinations(rolls, k) * Math.pow(p, k) * Math.pow(1-p, rolls-k);
        } else {
            // Use normal approximation for large values to avoid overflow
            const z = (k - expected) / stdDev;
            prob = Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
        }
        
        if (prob > 1e-10) { // Only show probabilities above threshold
            allResults.push({
                outcome: `${target} appears ${k} time${k !== 1 ? 's' : ''}`,
                probability: prob
            });
            totalShownProb += prob;
        }
    }
    
    // Sort by probability (descending) and take most likely outcomes
    allResults.sort((a, b) => b.probability - a.probability);
    
    const results = allResults;
    
    // Calculate summary statistics
    const exactlyOnce = rolls === 1 ? (1/sides) : (rolls <= 170 ? combinations(rolls, 1) * Math.pow(p, 1) * Math.pow(1-p, rolls-1) : 0);
    const atLeastOnce = 1 - Math.pow(1-p, rolls);
    
    let summaryText = '';
    if (rolls > 50) {
        summaryText = `
            <p><strong>Showing results with highest probabilities (≈${(totalShownProb * 100).toFixed(1)}% of total probability)</strong></p>
            <p><strong>Expected occurrences:</strong> ${expected.toFixed(2)} ± ${(1.96 * stdDev).toFixed(2)} (95% confidence)</p>
            <p><strong>Most likely outcome:</strong> ${Math.round(expected)} occurrences</p>
            <p><strong>Probability of getting ${target} at least once:</strong> ${formatProbability(atLeastOnce)}</p>
        `;
    } else {
        summaryText = `
            <p><strong>Probability of getting ${target} at least once:</strong> ${formatProbability(atLeastOnce)}</p>
            <p><strong>Probability of getting ${target} exactly once:</strong> ${formatProbability(exactlyOnce)}</p>
            <p><strong>Expected occurrences:</strong> ${expected.toFixed(2)}</p>
        `;
    }
    
    displayResults(`Single 6-sided Die (${rolls} rolls)`, results, summaryText);
    
    const labels = results.map(r => {
        const k = parseInt(r.outcome.split(' ')[2]);
        return k + (k === 1 ? ' time' : ' times');
    });
    const probabilities = results.map(r => r.probability);
    updateChart(labels, probabilities, `Distribution of rolling 6 (${rolls} rolls)`);
}

// Multiple Dice Sum Calculations
function calculateMultipleDice() {
    const numDice = parseInt(document.getElementById('multiDiceCount').value);
    const sides = parseInt(document.getElementById('multiDieSides').value);
    const target = parseInt(document.getElementById('multiDiceTarget').value);
    
    const minSum = numDice;
    const maxSum = numDice * sides;
    
    if (target < minSum || target > maxSum) {
        alert(`Target sum must be between ${minSum} and ${maxSum} for ${numDice} × ${sides}-sided dice!`);
        return;
    }
    
    if (numDice > 10) {
        alert('Maximum 10 dice allowed for performance reasons');
        return;
    }
    
    // Calculate all possible sums and their probabilities
    const sumCounts = {};
    const totalOutcomes = Math.pow(sides, numDice);
    
    // Generate all possible combinations
    function generateCombinations(dice, currentSum) {
        if (dice === 0) {
            sumCounts[currentSum] = (sumCounts[currentSum] || 0) + 1;
            return;
        }
        
        for (let i = 1; i <= sides; i++) {
            generateCombinations(dice - 1, currentSum + i);
        }
    }
    
    generateCombinations(numDice, 0);
    
    const results = [];
    for (let sum = minSum; sum <= maxSum; sum++) {
        const count = sumCounts[sum] || 0;
        const probability = count / totalOutcomes;
        if (probability > 0) {
            results.push({
                outcome: `Sum = ${sum}`,
                probability: probability
            });
        }
    }
    
    // Find target probability
    const targetProb = sumCounts[target] / totalOutcomes || 0;
    const targetCount = sumCounts[target] || 0;
    
    const summary = `
        <p><strong>Probability of sum = ${target}:</strong> ${formatProbability(targetProb)}</p>
        <p><strong>Ways to get sum = ${target}:</strong> ${targetCount} out of ${totalOutcomes}</p>
        <p><strong>Most likely sum:</strong> ${Math.round((numDice * (sides + 1)) / 2)}</p>
    `;
    
    displayResults(`${numDice} × ${sides}-sided Dice Sum`, results, summary);
    
    const labels = results.map(r => r.outcome.split(' = ')[1]);
    const probabilities = results.map(r => r.probability);
    updateChart(labels, probabilities, `Sum distribution for ${numDice} × ${sides}-sided dice`);
}

// Consecutive Same Number Calculations
function calculateConsecutive() {
    const sides = parseInt(document.getElementById('consecutiveDieSides').value);
    const consecutive = parseInt(document.getElementById('consecutiveCount').value);
    const target = parseInt(document.getElementById('consecutiveTarget').value);
    
    if (target > sides) {
        alert(`Target number ${target} cannot be greater than the number of sides (${sides})!`);
        return;
    }
    
    if (consecutive > 15) {
        alert('Maximum 15 consecutive rolls allowed for performance reasons');
        return;
    }
    
    // Probability of getting exactly n consecutive target numbers
    const exactProb = Math.pow(1/sides, consecutive);
    
    // Probability in different numbers of total rolls
    const results = [];
    for (let totalRolls = consecutive; totalRolls <= consecutive + 10; totalRolls++) {
        let prob;
        if (totalRolls === consecutive) {
            prob = exactProb;
        } else {
            // Approximate probability of getting consecutive sequence in n rolls
            const positions = totalRolls - consecutive + 1;
            prob = 1 - Math.pow(1 - exactProb, positions);
        }
        
        results.push({
            outcome: `In ${totalRolls} rolls`,
            probability: prob
        });
    }
    
    const summary = `
        <p><strong>Probability of exactly ${consecutive} consecutive ${target}s:</strong> ${formatProbability(exactProb)}</p>
        <p><strong>This is 1 in ${Math.round(1/exactProb)} chance</strong></p>
    `;
    
    displayResults(`${consecutive} Consecutive ${target}s on ${sides}-sided die`, results, summary);
    
    const labels = results.map(r => r.outcome);
    const probabilities = results.map(r => r.probability);
    updateChart(labels, probabilities, `Probability of ${consecutive} consecutive ${target}s`);
}

// All Different Sums Calculations (from original code)
function calculateAllDifferent() {
    const numPeople = parseInt(document.getElementById('allDiffPeople').value);
    const dicePerPerson = parseInt(document.getElementById('allDiffDice').value);
    
    // This uses simplified approximation - could be enhanced with exact calculation
    const minSum = dicePerPerson;
    const maxSum = dicePerPerson * 6;
    const possibleSums = maxSum - minSum + 1;
    
    // Birthday paradox approximation
    let prob = 1;
    for (let i = 0; i < numPeople; i++) {
        prob *= (possibleSums - i) / possibleSums;
    }
    
    const results = [];
    
    // Show probability for different numbers of people (1 to numPeople)
    for (let people = 1; people <= numPeople; people++) {
        let p;
        if (people === 1) {
            p = 1.0; // Single person always has unique sum
        } else {
            p = 1;
            for (let i = 0; i < people; i++) {
                p *= (possibleSums - i) / possibleSums;
            }
        }
        results.push({
            outcome: `${people} ${people === 1 ? 'person' : 'people'}`,
            probability: p
        });
    }
    
    const summary = `
        <p><strong>Probability all ${numPeople} people get different sums:</strong> ${formatProbability(prob)}</p>
        <p><strong>Each person rolls ${dicePerPerson} dice</strong></p>
        <p><strong>Possible sums range:</strong> ${minSum} to ${maxSum} (${possibleSums} possibilities)</p>
    `;
    
    displayResults(`All Different Sums`, results, summary);
    
    const labels = results.map(r => r.outcome);
    const probabilities = results.map(r => r.probability);
    updateChart(labels, probabilities, `Probability of all different sums (${dicePerPerson} dice each)`);
}

// Mathematics Explanation Functions

function showMathsSingleDie() {
    const rolls = parseInt(document.getElementById('singleDieRolls').value);
    
    const explanation = `
        <div class="formula-section">
            <h4>Binomial Distribution</h4>
            <p>The probability of getting exactly <strong>k</strong> sixes in <strong>n</strong> rolls follows a binomial distribution:</p>
            <div class="formula">P(X = k) = C(n,k) × (1/6)^k × (5/6)^(n-k)</div>
            <p>Where:</p>
            <ul>
                <li><strong>C(n,k)</strong> = n! / (k!(n-k)!) is the binomial coefficient</li>
                <li><strong>1/6</strong> is the probability of rolling a 6</li>
                <li><strong>5/6</strong> is the probability of NOT rolling a 6</li>
            </ul>
        </div>
        
        <div class="formula-section">
            <h4>At Least One Success</h4>
            <p>Probability of getting at least one 6:</p>
            <div class="formula">P(X ≥ 1) = 1 - P(X = 0) = 1 - (5/6)^n</div>
            <p>For ${rolls} rolls: <strong>${formatProbability(1 - Math.pow(5/6, rolls))}</strong></p>
        </div>
        
        <div class="formula-section">
            <h4>Expected Value</h4>
            <p>Expected number of sixes in n rolls:</p>
            <div class="formula">E[X] = n × (1/6) = ${rolls}/6 = ${(rolls/6).toFixed(2)}</div>
        </div>
    `;
    
    displayMathsExplanation('Single Die Mathematics', explanation);
    
    // Graph: Probability vs Number of Rolls (1 to 15)
    const rollsData = [];
    const probData = [];
    for (let r = 1; r <= 15; r++) {
        rollsData.push(r + ' rolls');
        probData.push(1 - Math.pow(5/6, r)); // P(at least one 6)
    }
    
    updateChart(rollsData, probData, 'Probability of At Least One 6 vs Number of Rolls', 'line');
}

function showMathsMultipleDice() {
    const numDice = parseInt(document.getElementById('multiDiceCount').value);
    const targetSum = parseInt(document.getElementById('multiDiceTarget').value);
    
    const minSum = numDice;
    const maxSum = numDice * 6;
    const totalOutcomes = Math.pow(6, numDice);
    
    const explanation = `
        <div class="formula-section">
            <h4>Combinatorial Analysis</h4>
            <p>For ${numDice} dice, there are <strong>6^${numDice} = ${totalOutcomes}</strong> total possible outcomes.</p>
            <p>Sum range: ${minSum} to ${maxSum}</p>
        </div>
        
        <div class="formula-section">
            <h4>Sum Distribution</h4>
            <p>The probability of getting sum <strong>s</strong> is:</p>
            <div class="formula">P(Sum = s) = (Ways to get s) / ${totalOutcomes}</div>
            <p>The number of ways follows a generating function approach or stars and bars combinatorics.</p>
        </div>
        
        <div class="formula-section">
            <h4>Normal Approximation</h4>
            <p>For large numbers of dice, the sum approaches a normal distribution:</p>
            <ul>
                <li><strong>Mean (μ)</strong> = ${numDice} × 3.5 = ${(numDice * 3.5).toFixed(1)}</li>
                <li><strong>Variance (σ²)</strong> = ${numDice} × 35/12 = ${(numDice * 35/12).toFixed(2)}</li>
                <li><strong>Standard Deviation (σ)</strong> = ${Math.sqrt(numDice * 35/12).toFixed(2)}</li>
            </ul>
        </div>
    `;
    
    displayMathsExplanation('Multiple Dice Sum Mathematics', explanation);
    
    // Graph: Probability vs Number of Dice (1 to 8) for current target sum
    const diceData = [];
    const probData = [];
    for (let d = 1; d <= 8; d++) {
        if (targetSum >= d && targetSum <= d * 6) {
            diceData.push(d + ' dice');
            // Simplified calculation for demonstration
            const total = Math.pow(6, d);
            let ways = 1; // Simplified - in reality this would be complex combinatorics
            if (d > 1) {
                ways = Math.max(1, Math.floor(total / (6 * d - 1))); // Rough approximation
            }
            probData.push(ways / total);
        }
    }
    
    updateChart(diceData, probData, `Probability of Sum = ${targetSum} vs Number of Dice`, 'line');
}

function showMathsConsecutive() {
    const dieSides = parseInt(document.getElementById('consecutiveDieSides').value);
    const consecutive = parseInt(document.getElementById('consecutiveCount').value);
    const target = parseInt(document.getElementById('consecutiveTarget').value);
    
    const exactProb = Math.pow(1/dieSides, consecutive);
    
    const explanation = `
        <div class="formula-section">
            <h4>Independent Events</h4>
            <p>Each die roll is independent. The probability of rolling ${target} exactly ${consecutive} times in a row:</p>
            <div class="formula">P(${consecutive} consecutive ${target}s) = (1/${dieSides})^${consecutive} = ${exactProb.toExponential(3)}</div>
            <p>This is <strong>1 in ${Math.round(1/exactProb).toLocaleString()}</strong> chance.</p>
        </div>
        
        <div class="formula-section">
            <h4>Geometric Series</h4>
            <p>In a sequence of n rolls, the probability of getting the consecutive sequence at least once is more complex and involves:</p>
            <div class="formula">P(at least once in n rolls) ≈ 1 - (1 - p)^(n-k+1)</div>
            <p>Where p is the probability of the consecutive sequence and k is the length.</p>
        </div>
        
        <div class="formula-section">
            <h4>Waiting Time</h4>
            <p>Expected number of rolls until first occurrence:</p>
            <div class="formula">E[T] = (${dieSides}^${consecutive} - 1) / (${dieSides-1}) + ${consecutive}</div>
            <p>≈ ${Math.round((Math.pow(dieSides, consecutive) - 1) / (dieSides - 1) + consecutive).toLocaleString()} rolls</p>
        </div>
    `;
    
    displayMathsExplanation('Consecutive Rolls Mathematics', explanation);
    
    // Graph: Probability vs Consecutive Count (1 to 8)
    const consData = [];
    const probData = [];
    for (let c = 1; c <= 8; c++) {
        consData.push(c + ' consecutive');
        probData.push(Math.pow(1/dieSides, c));
    }
    
    updateChart(consData, probData, `Probability vs Consecutive ${target}s on ${dieSides}-sided Die`, 'line');
}

function showMathsAllDifferent() {
    const numPeople = parseInt(document.getElementById('allDiffPeople').value);
    const dicePerPerson = parseInt(document.getElementById('allDiffDice').value);
    
    const minSum = dicePerPerson;
    const maxSum = dicePerPerson * 6;
    const possibleSums = maxSum - minSum + 1;
    
    const explanation = `
        <div class="formula-section">
            <h4>Birthday Paradox</h4>
            <p>This is a variation of the famous birthday paradox. With ${possibleSums} possible sums, what's the probability that ${numPeople} people all get different sums?</p>
            <div class="formula">P(all different) = ${possibleSums}! / ((${possibleSums}-${numPeople})! × ${possibleSums}^${numPeople})</div>
        </div>
        
        <div class="formula-section">
            <h4>Step-by-Step Calculation</h4>
            <p>Probability that all ${numPeople} people get different sums:</p>
            <div class="formula">P = (${possibleSums}/${possibleSums}) × (${possibleSums-1}/${possibleSums}) × ... × (${Math.max(1, possibleSums-numPeople+1)}/${possibleSums})</div>
            <ul>
                <li>First person: Any sum (probability = 1)</li>
                <li>Second person: Different from first (probability = ${possibleSums-1}/${possibleSums})</li>
                <li>Third person: Different from first two (probability = ${possibleSums-2}/${possibleSums})</li>
                <li>And so on...</li>
            </ul>
        </div>
        
        <div class="formula-section">
            <h4>Collision Probability</h4>
            <p>The probability that at least two people get the same sum:</p>
            <div class="formula">P(collision) = 1 - P(all different)</div>
            <p>This grows surprisingly quickly as the number of people increases!</p>
        </div>
    `;
    
    displayMathsExplanation('All Different Sums Mathematics', explanation);
    
    // Graph: Probability vs Number of People (1 to 12)
    const peopleData = [];
    const probData = [];
    for (let p = 1; p <= 12; p++) {
        if (p <= possibleSums) {
            peopleData.push(p + ' people');
            let prob = 1;
            for (let i = 0; i < p; i++) {
                prob *= (possibleSums - i) / possibleSums;
            }
            probData.push(prob);
        }
    }
    
    updateChart(peopleData, probData, 'Probability All Different vs Number of People', 'line');
}

