import Groq from 'groq-sdk';
import mongoose from 'mongoose';
import { calculateCrowdPredictionSync } from './index.js'; // We'll need to export this from index.js

const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is missing. AI Chatbot features will be disabled.');
}

// Escape special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper to find relevant temples based on query
const findRelevantTemples = async (query) => {
    const Temple = mongoose.model('Temple');

    // Simple keyword search - sanitize input
    const terms = query.toLowerCase()
        .split(' ')
        .filter(t => t.length > 3 && t.length < 50) // Limit term length
        .slice(0, 5) // Max 5 search terms
        .map(escapeRegex); // Escape special characters

    if (terms.length === 0) return [];

    // Construct regex for each term (sanitized)
    const regexConditions = terms.map(term => ({
        $or: [
            { name: { $regex: term, $options: 'i' } },
            { location: { $regex: term, $options: 'i' } },
            { deity: { $regex: term, $options: 'i' } }
        ]
    }));

    // Find temples matching at least one term
    const temples = await Temple.find({ $or: regexConditions }).limit(3).lean();
    return temples;
};

export const generateResponse = async (userQuery, userId = null) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return "I'm sorry, my AI brain is currently disconnected (API Key missing). Please ask the administrator to configure the Groq API.";
        }

        // 1. Retrieval (RAG)
        const temples = await findRelevantTemples(userQuery);

        // 2. Context Construction
        let context = "";
        if (temples.length > 0) {
            context += "Here is real-time information about relevant temples:\n\n";

            for (const temple of temples) {
                // Calculate live crowd prediction
                const crowd = calculateCrowdPredictionSync(temple); // Use sync ver to avoid circular dep issues if possible

                context += `**${temple.name}** (${temple.location})\n`;
                context += `- Deity: ${temple.deity}\n`;
                context += `- Timings: ${temple.timings}\n`;
                context += `- Best Time: ${crowd.bestTimeToday}\n`;
                context += `- Current Status: ${crowd.crowdLevel.toUpperCase()} crowds (${crowd.crowdPercentage}% capacity). Wait time approx ${crowd.waitTime}.\n`;
                if (crowd.festival) context += `- Special Event: ${crowd.festival} (Expect higher crowds)\n`;
                context += "\n";
            }
        }

        // 3. System Prompt
        const systemPrompt = `You are 'Nandi', the intelligent assistant for the Temple Yatra App.
Your goal is to help pilgrims plan their visits, understand crowd levels, and learn about temples.
Answer the user's question based on the provided context below.
If the context doesn't have the answer, use your general knowledge but mention that it's general info.
Keep answers concise, helpful, and respectful of spiritual sentiments.
If the user asks about 'current' status or 'crowd', ALWAYS use the provided context data.

CONTEXT DATA:
${context || "No specific temple data found for this query."}
`;

        // 4. Generation
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userQuery }
            ],
            model: 'llama-3.3-70b-versatile', // Fast and capable
            temperature: 0.7,
            max_tokens: 500
        });

        return completion.choices[0]?.message?.content || "I couldn't generate a response.";

    } catch (error) {
        console.error('AI Service Error:', error);
        return "I'm having trouble connecting to the divine knowledge base right now. Please try again later.";
    }
};
