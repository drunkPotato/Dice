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
    
    // Clear chart
    if (chart) {
        chart.destroy();
        chart = null;
    }
}

// Utility functions
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
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

function updateChart(labels, probabilities, title) {
    const ctx = document.getElementById('probabilityChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Probability',
                data: probabilities,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
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

// Single Die Calculations
function calculateSingleDie() {
    const sides = 6; // Always use 6-sided die
    const rolls = parseInt(document.getElementById('singleDieRolls').value);
    const target = 6; // Always target 6
    
    const results = [];
    
    // Probability of getting target exactly k times in n rolls
    for (let k = 0; k <= rolls; k++) {
        const prob = combinations(rolls, k) * Math.pow(1/sides, k) * Math.pow((sides-1)/sides, rolls-k);
        results.push({
            outcome: `${target} appears ${k} time${k !== 1 ? 's' : ''}`,
            probability: prob
        });
    }
    
    // Summary statistics
    const exactlyOnce = results[1] ? results[1].probability : 0;
    const atLeastOnce = 1 - results[0].probability;
    const expected = rolls / sides;
    
    const summary = `
        <p><strong>Probability of getting ${target} at least once:</strong> ${formatProbability(atLeastOnce)}</p>
        <p><strong>Probability of getting ${target} exactly once:</strong> ${formatProbability(exactlyOnce)}</p>
        <p><strong>Expected occurrences:</strong> ${expected.toFixed(2)}</p>
    `;
    
    displayResults(`Single 6-sided Die (${rolls} rolls)`, results, summary);
    
    const labels = results.map(r => r.outcome.split(' ')[2] + ' times');
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
        alert(`Target sum must be between ${minSum} and ${maxSum}!`);
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
        alert('Target number cannot be greater than the number of sides!');
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

// Initialize without any calculation
document.addEventListener('DOMContentLoaded', function() {
    // Page loads with no results shown
});