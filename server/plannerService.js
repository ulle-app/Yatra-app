// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Major Indian cities coordinates for Source Location
const MAJOR_CITIES = {
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
    'patna': { lat: 25.5941, lng: 85.1376 },
    'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'raipur': { lat: 21.2514, lng: 81.6296 },
    'ranchi': { lat: 23.3441, lng: 85.3096 },
    'chandigarh': { lat: 30.7333, lng: 76.7794 }
};

// Estimate costs and time for different transport modes
const estimateTransport = (distanceKm) => {
    const options = [];

    // 1. Flight (Viable for > 250km)
    if (distanceKm > 250) {
        const cost = Math.round(3000 + (distanceKm * 5)); // Base + per km
        const time = Math.round(120 + (distanceKm / 800 * 60)); // 2hr airport buffer + flight time
        options.push({
            mode: 'Flight',
            cost,
            duration: formatDuration(time),
            icon: 'Plane'
        });
    }

    // 2. Train (Viable for all, cheapest)
    const trainCost = Math.round(150 + (distanceKm * 1.5));
    const trainTime = Math.round(distanceKm / 50 * 60); // Avg 50km/hr
    options.push({
        mode: 'Train',
        cost: trainCost,
        duration: formatDuration(trainTime),
        icon: 'Train'
    });

    // 3. Bus (Viable for < 800km)
    if (distanceKm < 800) {
        const busCost = Math.round(distanceKm * 2.5);
        const busTime = Math.round(distanceKm / 40 * 60); // Avg 40km/hr
        options.push({
            mode: 'Bus',
            cost: busCost,
            duration: formatDuration(busTime),
            icon: 'Bus'
        });
    }

    // 4. Taxi (Viable for < 400km)
    if (distanceKm < 400) {
        const taxiCost = Math.round(distanceKm * 12);
        const taxiTime = Math.round(distanceKm / 60 * 60); // Avg 60km/hr
        options.push({
            mode: 'Taxi',
            cost: taxiCost,
            duration: formatDuration(taxiTime),
            icon: 'Car'
        });
    }

    return options;
};

const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};

// Main Helper: Optimize Route
export const optimizeRoute = (sourceName, temples, preference) => {
    // 1. Get Source Coordinates
    const sourceLower = sourceName.toLowerCase();

    // Try exact match or partial match
    let sourceCoords = MAJOR_CITIES[sourceLower];
    if (!sourceCoords) {
        const foundCity = Object.keys(MAJOR_CITIES).find(city => sourceLower.includes(city));
        if (foundCity) sourceCoords = MAJOR_CITIES[foundCity];
    }

    if (!sourceCoords) {
        throw new Error('Source city not supported. Please choose a major Indian city.');
    }

    let route = [];
    let currentLoc = sourceCoords;
    let remainingTemples = [...temples];
    let totalCost = 0;
    let totalDistance = 0;

    // 2. Optimization Logic
    if (preference === 'crowd') {
        // Sort by crowd prediction (ascending)
        // Assuming each temple already has a 'crowd' object from the frontend/DB
        // If not, we'd need to fetch it, but usually the 'plan' array has it.
        // We'll trust the order passed or do simple sorting if they have numeric levels.
        // For now, let's strictly sort by prediction numeric value if available.
        route = remainingTemples.sort((a, b) => {
            const crowdA = a.crowd?.crowdPercentage || 50;
            const crowdB = b.crowd?.crowdPercentage || 50;
            return crowdA - crowdB;
        });
    } else {
        // 'cheapest' or 'fastest' -> Nearest Neighbor TSP Heuristic
        while (remainingTemples.length > 0) {
            let nearestIndex = -1;
            let minDist = Infinity;

            remainingTemples.forEach((temple, index) => {
                if (!temple.lat || !temple.lng) return;
                const dist = calculateDistance(currentLoc.lat, currentLoc.lng, temple.lat, temple.lng);
                if (dist < minDist) {
                    minDist = dist;
                    nearestIndex = index;
                }
            });

            if (nearestIndex !== -1) {
                const nextStop = remainingTemples[nearestIndex];

                // Calculate leg transport details
                const dist = calculateDistance(currentLoc.lat, currentLoc.lng, nextStop.lat, nextStop.lng);
                const transportOptions = estimateTransport(dist);

                // Pick best option based on preference
                let bestOption = transportOptions[0]; // Default
                if (preference === 'cheapest') {
                    bestOption = transportOptions.sort((a, b) => a.cost - b.cost)[0];
                } else if (preference === 'fastest') {
                    bestOption = transportOptions.sort((a, b) => {
                        // simple parse: "2h 30m" -> minutes
                        const getMins = (str) => {
                            const parts = str.split(' ');
                            let m = 0;
                            parts.forEach(p => {
                                if (p.includes('h')) m += parseInt(p) * 60;
                                if (p.includes('m')) m += parseInt(p);
                            });
                            return m;
                        };
                        return getMins(a.duration) - getMins(b.duration);
                    })[0];
                }

                // Add leg stats
                nextStop.transportTo = {
                    from: route.length === 0 ? sourceName : route[route.length - 1].name,
                    distance: Math.round(dist),
                    ...bestOption
                };

                route.push(nextStop);
                currentLoc = { lat: nextStop.lat, lng: nextStop.lng };
                totalDistance += dist;
                totalCost += bestOption.cost;

                remainingTemples.splice(nearestIndex, 1);
            } else {
                // Fallback for temples without lat/lng
                const fallback = remainingTemples.pop();
                route.push(fallback);
            }
        }
    }

    return {
        route,
        globalStats: {
            totalDistance: Math.round(totalDistance),
            totalCostEstimate: totalCost,
            source: sourceName
        }
    };
};
