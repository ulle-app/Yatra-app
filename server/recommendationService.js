import mongoose from 'mongoose';
import { calculateCrowdPredictionSync } from './index.js';

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Get personalized recommendations for a user
 * @param {string} userId
 * @returns {Promise<Array>} Recommended temples
 */
export const getRecommendations = async (userId) => {
    try {
        const User = mongoose.model('User');
        const Temple = mongoose.model('Temple');

        // 1. Fetch User Data
        const user = await User.findById(userId)
            .populate('favoriteTemples')
            .populate('visitHistory.temple');

        if (!user) return [];

        // 2. Build Preference Profile
        const deityScores = {};
        const stateScores = {};
        const excludedIds = new Set();

        // Helper to score attributes
        const scoreAttribute = (obj, attr, points) => {
            if (!attr) return;
            const key = attr.toLowerCase(); // Normalized key
            obj[key] = (obj[key] || 0) + points;
        };

        // Analyze Favorites (High weight)
        user.favoriteTemples.forEach(temple => {
            if (!temple) return;
            excludedIds.add(temple._id.toString());
            scoreAttribute(deityScores, temple.deity, 3);
            scoreAttribute(stateScores, temple.state, 2);
        });

        // Analyze Visits (Medium weight)
        user.visitHistory.forEach(visit => {
            const temple = visit.temple;
            if (!temple) return;
            excludedIds.add(temple._id.toString()); // Don't recommend recently visited? Or maybe yes?
            // Let's exclude visited ones to encourage discovery

            const ratingWeight = visit.rating ? (visit.rating - 2.5) : 1; // 5 stars = 2.5x, 1 star = negative
            if (ratingWeight > 0) {
                scoreAttribute(deityScores, temple.deity, 1 + ratingWeight);
                scoreAttribute(stateScores, temple.state, 0.5 + ratingWeight);
            }
        });

        // Determine Top Preferences
        const topDeities = Object.keys(deityScores).sort((a, b) => deityScores[b] - deityScores[a]).slice(0, 3);
        const topStates = Object.keys(stateScores).sort((a, b) => stateScores[b] - stateScores[a]).slice(0, 2);

        console.log(`User ${userId} preferences:`, { topDeities, topStates });

        // 3. Find Candidates
        let query = {
            _id: { $nin: Array.from(excludedIds) }
        };

        if (topDeities.length > 0 || topStates.length > 0) {
            const orConditions = [];

            // Match Deities (Primary factor) - escape regex to prevent ReDoS
            topDeities.forEach(deity => {
                orConditions.push({ deity: { $regex: escapeRegex(deity), $options: 'i' } });
            });

            // Match States (Secondary factor) - escape regex to prevent ReDoS
            topStates.forEach(state => {
                orConditions.push({ state: { $regex: escapeRegex(state), $options: 'i' } });
            });

            if (orConditions.length > 0) {
                query.$or = orConditions;
            }
        } else {
            // Cold start: Recommend highly rated popular temples if no preferences found
            query.rating = { $gte: 4.5 };
        }

        const candidates = await Temple.find(query).limit(20).lean();

        // 4. Rank Candidates
        const scoredCandidates = candidates.map(temple => {
            let score = 0;

            // Affinity Score
            if (temple.deity && deityScores[temple.deity.toLowerCase()]) {
                score += deityScores[temple.deity.toLowerCase()] * 2; // Matching Deity is huge
            }
            if (temple.state && stateScores[temple.state.toLowerCase()]) {
                score += stateScores[temple.state.toLowerCase()];
            }
            // Partial text match for deity (handle 'Lord Shiva' matching 'Shiva')
            topDeities.forEach(d => {
                if (temple.deity && temple.deity.toLowerCase().includes(d)) score += 3;
            });

            // Quality Score
            score += (temple.rating || 0) * 2;
            score += Math.log(temple.reviewCount || 1);

            return { ...temple, score };
        });

        // Sort and Take Top 5
        const topRecommendations = scoredCandidates
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        // Add crowd data to result for UI
        return topRecommendations.map(t => ({
            ...t,
            crowd: calculateCrowdPredictionSync(t), // Helper for UI
            reason: getReason(t, topDeities, topStates)
        }));

    } catch (error) {
        console.error('Recommendation Error:', error);
        return [];
    }
};

const getReason = (temple, topDeities, topStates) => {
    if (topDeities.some(d => temple.deity?.toLowerCase().includes(d))) return `Because you like ${temple.deity} temples`;
    if (topStates.some(s => temple.state?.toLowerCase().includes(s))) return `Popular in ${temple.state}`;
    return "Highly Rated & Popular";
};
