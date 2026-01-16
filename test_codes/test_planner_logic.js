
const { optimizeRoute } = require('../server/plannerService.js');

// Mock Data
const temples = [
    {
        _id: '1',
        name: 'Kashi Vishwanath',
        location: 'Varanasi',
        lat: 25.3109,
        lng: 83.0107,
        crowd: { crowdPercentage: 80 } // High Crowd
    },
    {
        _id: '2',
        name: 'Somnath',
        location: 'Gujarat',
        lat: 20.8880,
        lng: 70.4010,
        crowd: { crowdPercentage: 20 } // Low Crowd
    },
    {
        _id: '3',
        name: 'Tirupati',
        location: 'Andhra Pradesh',
        lat: 13.6288,
        lng: 79.4192,
        crowd: { crowdPercentage: 90 } // Very High Crowd
    }
];

const source = 'Delhi';

console.log('--- Testing Optimization Logic ---');

// Test 1: Crowd Preference (Should sort by crowd ascending: Somnath -> Kashi -> Tirupati)
try {
    const crowdResult = optimizeRoute(source, [...temples], 'crowd');
    const names = crowdResult.route.map(t => t.name);
    console.log('1. Crowd Preference Order:', names.join(' -> '));
    if (names[0] === 'Somnath' && names[2] === 'Tirupati') {
        console.log('   [PASS] Sorted by crowd levels correctly.');
    } else {
        console.error('   [FAIL] Crowd sorting incorrect.');
    }
} catch (e) {
    console.error('   [FAIL] Error in crowd optimization:', e.message);
}

// Test 2: Cheapest (Nearest Neighbor Approx)
try {
    const cheapResult = optimizeRoute(source, [...temples], 'cheapest');
    console.log('2. Cheapest Route Cost:', cheapResult.globalStats.totalCostEstimate);
    console.log('   Route:', cheapResult.route.map(t => t.name).join(' -> '));
    // Validating simple logic: Delhi closest to Varanasi, then probably Somnath or Tirupati
    if (cheapResult.route.length === 3) {
        console.log('   [PASS] Returned full route.');
    }
} catch (e) {
    console.error('   [FAIL] Error in cheapest optimization:', e.message);
}

// Test 3: Fastest
try {
    const fastResult = optimizeRoute(source, [...temples], 'fastest');
    console.log('3. Fastest Route:', fastResult.route.map(t => t.name).join(' -> '));
    // Check if transport modes are assigned
    if (fastResult.route[0].transportTo) {
        console.log('   [PASS] Transport details assigned:', fastResult.route[0].transportTo.mode);
    } else {
        console.error('   [FAIL] Transport details missing.');
    }
} catch (e) {
    console.error('   [FAIL] Error in fastest optimization:', e.message);
}

// Test 4: Invalid Source
try {
    optimizeRoute('Mars', [...temples], 'cheapest');
    console.error('4. [FAIL] Should have thrown error for invalid city.');
} catch (e) {
    console.log('4. [PASS] Invalid city threw error:', e.message);
}
