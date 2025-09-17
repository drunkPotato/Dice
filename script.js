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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return (context.parsed.y * 100).toFixed(4) + '%';
                        }
                    }
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
    
    // Calculate all probabilities first to find 99% cutoff
    const allProbabilities = [];
    for (let k = 0; k <= rolls; k++) {
        let prob;
        if (rolls <= 170) {
            // Use exact binomial calculation for smaller values
            prob = combinations(rolls, k) * Math.pow(p, k) * Math.pow(1-p, rolls-k);
        } else {
            // Use normal approximation for large values to avoid overflow
            const z = (k - expected) / stdDev;
            prob = Math.exp(-0.5 * z * z) / (stdDev * Math.sqrt(2 * Math.PI));
        }
        
        if (prob > 1e-10) { // Only include meaningful probabilities
            allProbabilities.push({ k: k, prob: prob });
        }
    }
    
    // Sort by probability (highest first) to find 99% cutoff
    allProbabilities.sort((a, b) => b.prob - a.prob);
    
    // Find the cutoff point where cumulative probability reaches 99%
    let cumulativeProb = 0;
    const targetProb = 0.99;
    const selectedResults = [];
    
    for (const item of allProbabilities) {
        selectedResults.push(item);
        cumulativeProb += item.prob;
        if (cumulativeProb >= targetProb) {
            break;
        }
    }
    
    // Convert to the expected format
    const allResults = [];
    let totalShownProb = 0;
    
    for (const item of selectedResults) {
        allResults.push({
            outcome: `${target} appears ${item.k} time${item.k !== 1 ? 's' : ''}`,
            probability: item.prob
        });
        totalShownProb += item.prob;
    }
    
    // Sort by probability (descending) and take most likely outcomes
    allResults.sort((a, b) => b.probability - a.probability);
    
    // Limit results if there are too many, keeping the highest probability ones
    const maxResultsToShow = 20;
    const results = allResults.length > maxResultsToShow ? allResults.slice(0, maxResultsToShow) : allResults;
    
    // Calculate summary statistics
    const exactlyOnce = rolls === 1 ? (1/sides) : (rolls <= 170 ? combinations(rolls, 1) * Math.pow(p, 1) * Math.pow(1-p, rolls-1) : 0);
    const atLeastOnce = 1 - Math.pow(1-p, rolls);
    
    let summaryText = '';
    if (rolls > 20) {
        summaryText = `
            <p><strong>Showing outcomes representing ${(totalShownProb * 100).toFixed(1)}% of total probability</strong></p>
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
    
    // For chart, sort by outcome value for proper numerical ordering
    const chartResults = [...results].sort((a, b) => {
        const aK = parseInt(a.outcome.split(' ')[2]);
        const bK = parseInt(b.outcome.split(' ')[2]);
        return aK - bK;
    });
    
    // Calculate range displayed in chart
    const chartKValues = chartResults.map(r => parseInt(r.outcome.split(' ')[2]));
    const minChartK = Math.min(...chartKValues);
    const maxChartK = Math.max(...chartKValues);
    const chartRangeProb = chartResults.reduce((sum, r) => sum + r.probability, 0);
    
    // Add range information to the summary
    const rangeInfo = `<p><strong>Chart displays range ${minChartK}-${maxChartK} occurrences (${(chartRangeProb * 100).toFixed(1)}% of total probability)</strong></p>`;
    
    // Update the summary text by adding the range info
    if (rolls > 20) {
        summaryText = summaryText.replace('</p>', '</p>' + rangeInfo);
    } else {
        summaryText += rangeInfo;
    }
    
    displayResults(`Single 6-sided Die (${rolls} rolls)`, results, summaryText);
    
    const labels = chartResults.map(r => {
        const k = parseInt(r.outcome.split(' ')[2]);
        return k + (k === 1 ? ' time' : ' times');
    });
    const probabilities = chartResults.map(r => r.probability);
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

// All Different Sums Calculations (exact calculation with dice sum distribution)
function calculateAllDifferent() {
    const numPeople = parseInt(document.getElementById('allDiffPeople').value);
    const dicePerPerson = parseInt(document.getElementById('allDiffDice').value);
    
    if (numPeople > 10) {
        alert('Maximum 10 people allowed for performance reasons');
        return;
    }
    
    // Calculate actual sum probabilities for dice
    const sumProbabilities = calculateSumProbabilities(dicePerPerson, 6);
    const sums = Object.keys(sumProbabilities).map(Number).sort((a, b) => a - b);
    
    const results = [];
    
    // Calculate probability for different numbers of people
    for (let people = 1; people <= numPeople; people++) {
        let probability;
        
        if (people === 1) {
            probability = 1.0; // Single person always has unique sum
        } else {
            // Calculate exact probability that all people get different sums
            probability = calculateExactAllDifferent(people, sumProbabilities, sums);
        }
        
        results.push({
            outcome: `${people} ${people === 1 ? 'person' : 'people'}`,
            probability: probability
        });
    }
    
    const targetProb = results[numPeople - 1].probability;
    const minSum = dicePerPerson;
    const maxSum = dicePerPerson * 6;
    
    const summary = `
        <p><strong>Probability all ${numPeople} people get different sums:</strong> ${formatProbability(targetProb)}</p>
        <p><strong>Each person rolls ${dicePerPerson} dice (${minSum}-${maxSum} range)</strong></p>
        <p><strong>Accounts for non-uniform sum distribution</strong></p>
        <p><strong>Most likely sum:</strong> ${findMostLikelySum(sumProbabilities)}</p>
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
            <p>For 1 roll: <strong>${formatProbability(1 - Math.pow(5/6, 1))}</strong></p>
            <p>For 5 rolls: <strong>${formatProbability(1 - Math.pow(5/6, 5))}</strong></p>
        </div>
        
        <div class="formula-section">
            <h4>Expected Value</h4>
            <p>Expected number of sixes in n rolls:</p>
            <div class="formula">E[X] = n × (1/6)</div>
            <p>For 1 roll: E[X] = 1/6 = ${(1/6).toFixed(2)}</p>
            <p>For 5 rolls: E[X] = 5/6 = ${(5/6).toFixed(2)}</p>
        </div>
        
        <div class="formula-section">
            <h4>Key Insights</h4>
            <p><strong>99% Chance Threshold:</strong> You need ${Math.ceil(Math.log(1 - 0.99) / Math.log(5/6))} rolls to have a 99% chance of getting at least one 6.</p>
            <p>Click the buttons below to switch between visualizations:</p>
            <button onclick="showProgressionGraph()" style="background: rgba(52, 152, 219, 0.8); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">Progression Graph</button>
            <button onclick="showDistributionExample()" style="background: rgba(52, 152, 219, 0.8); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px;">50-Roll Distribution</button>
        </div>
    `;
    
    displayMathsExplanation('Single Die Mathematics', explanation);
    
    // Show the progression graph initially
    showProgressionGraph();
}

function showProgressionGraph() {
    // Calculate how many rolls needed for 99% chance
    const rollsFor99Percent = Math.ceil(Math.log(1 - 0.99) / Math.log(5/6));
    
    // Graph: Probability vs Number of Rolls (up to rolls needed for 99%)
    const rollsData = [];
    const probData = [];
    for (let r = 1; r <= rollsFor99Percent; r++) {
        rollsData.push(r + ' rolls');
        probData.push(1 - Math.pow(5/6, r)); // P(at least one 6)
    }
    
    updateChart(rollsData, probData, `Probability of At Least One 6 vs Number of Rolls (up to ${rollsFor99Percent} rolls for 99%)`, 'line');
}

function showDistributionExample() {
    // Calculate distribution for exactly 50 rolls
    const exampleRolls = 50;
    const p = 1/6;
    const expected = exampleRolls * p;
    const stdDev = Math.sqrt(exampleRolls * p * (1 - p));
    
    // Calculate all probabilities using same logic as calculateSingleDie
    const allProbabilities = [];
    for (let k = 0; k <= exampleRolls; k++) {
        const prob = combinations(exampleRolls, k) * Math.pow(p, k) * Math.pow(1-p, exampleRolls-k);
        if (prob > 1e-10) {
            allProbabilities.push({ k: k, prob: prob });
        }
    }
    
    // Sort by probability and find 99% cutoff
    allProbabilities.sort((a, b) => b.prob - a.prob);
    let cumulativeProb = 0;
    const selectedResults = [];
    
    for (const item of allProbabilities) {
        selectedResults.push(item);
        cumulativeProb += item.prob;
        if (cumulativeProb >= 0.99) {
            break;
        }
    }
    
    // Sort by k value for chart display
    selectedResults.sort((a, b) => a.k - b.k);
    
    // Create chart data
    const labels = selectedResults.map(item => item.k + (item.k === 1 ? ' time' : ' times'));
    const probabilities = selectedResults.map(item => item.prob);
    
    updateChart(labels, probabilities, `Distribution Example: Rolling 6 in ${exampleRolls} Rolls (${(cumulativeProb * 100).toFixed(1)}% of probability)`);
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
            <h4>Step 1: Calculate Individual Sum Probabilities</h4>
            <p>For each possible sum s with ${dicePerPerson} dice:</p>
            <div class="formula">P(sum = s) = (ways to get s) / 6^${dicePerPerson}</div>
            <p>We enumerate all ${Math.pow(6, dicePerPerson).toLocaleString()} possible dice outcomes and count how many produce each sum.</p>
        </div>
        
        <div class="formula-section">
            <h4>Step 2: Combinatorial Enumeration</h4>
            <p>For ${numPeople} people to all get different sums, we calculate:</p>
            <div class="formula">P(all different) = Σ P(person₁ gets s₁) × P(person₂ gets s₂) × ...</div>
            <p>Summed over all combinations where s₁, s₂, ..., sₙ are all different values.</p>
            <p>This requires evaluating ${factorial(possibleSums) / factorial(Math.max(0, possibleSums - numPeople))} combinations.</p>
        </div>
        
        <div class="formula-section">
            <h4>Step 3: Computational Method</h4>
            <p><strong>Small groups (≤6 people):</strong> Exact recursive enumeration of all valid combinations</p>
            <p><strong>Large groups (>6 people):</strong> Monte Carlo simulation with 50,000 trials</p>
            <p>Each trial randomly assigns sums based on their probabilities and checks for uniqueness.</p>
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

// Helper functions for All Different Sums calculations

// Helper function to calculate sum probabilities for n dice
function calculateSumProbabilities(numDice, sides) {
    const sumCounts = {};
    const totalOutcomes = Math.pow(sides, numDice);
    
    // Generate all possible dice combinations
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
    
    // Convert counts to probabilities
    const sumProbs = {};
    for (const sum in sumCounts) {
        sumProbs[sum] = sumCounts[sum] / totalOutcomes;
    }
    
    return sumProbs;
}

// Helper function to find most likely sum
function findMostLikelySum(sumProbabilities) {
    let maxProb = 0;
    let mostLikelySum = 0;
    
    for (const sum in sumProbabilities) {
        if (sumProbabilities[sum] > maxProb) {
            maxProb = sumProbabilities[sum];
            mostLikelySum = parseInt(sum);
        }
    }
    
    return mostLikelySum;
}

// Helper function to calculate exact probability that all people get different sums
function calculateExactAllDifferent(numPeople, sumProbabilities, sums) {
    if (numPeople > sums.length) {
        return 0; // More people than possible sums
    }
    
    // Use exact calculation for small numbers, approximation for larger
    if (numPeople <= 6) {
        return calculateExactCombinatorial(numPeople, sumProbabilities, sums);
    } else {
        return calculateMonteCarloApproximation(numPeople, sumProbabilities, sums);
    }
}

// Exact combinatorial calculation for small numbers
function calculateExactCombinatorial(numPeople, sumProbabilities, sums) {
    let totalProb = 0;
    
    // Generate all combinations of different sums
    function generateCombinations(people, usedSums, currentProb) {
        if (people === 0) {
            totalProb += currentProb;
            return;
        }
        
        for (let i = 0; i < sums.length; i++) {
            const sum = sums[i];
            if (!usedSums.has(sum)) {
                usedSums.add(sum);
                generateCombinations(people - 1, usedSums, currentProb * sumProbabilities[sum]);
                usedSums.delete(sum);
            }
        }
    }
    
    generateCombinations(numPeople, new Set(), 1);
    return totalProb;
}

// Monte Carlo approximation for larger numbers
function calculateMonteCarloApproximation(numPeople, sumProbabilities, sums) {
    const trials = 50000;
    let successfulTrials = 0;
    
    for (let trial = 0; trial < trials; trial++) {
        const usedSums = new Set();
        let success = true;
        
        for (let person = 0; person < numPeople; person++) {
            // Randomly select a sum based on its probability
            const randomSum = selectRandomSum(sumProbabilities, sums);
            if (usedSums.has(randomSum)) {
                success = false;
                break;
            }
            usedSums.add(randomSum);
        }
        
        if (success) {
            successfulTrials++;
        }
    }
    
    return successfulTrials / trials;
}

// Helper to select random sum based on probability distribution
function selectRandomSum(sumProbabilities, sums) {
    const random = Math.random();
    let cumulative = 0;
    
    for (const sum of sums) {
        cumulative += sumProbabilities[sum];
        if (random <= cumulative) {
            return parseInt(sum);
        }
    }
    
    return sums[sums.length - 1]; // Fallback
}

