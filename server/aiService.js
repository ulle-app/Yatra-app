import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import { calculateCrowdPredictionSync } from './index.js';

// Initialize AI Clients
const groq = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('WARNING: Both GROQ_API_KEY and GEMINI_API_KEY are missing. AI Chatbot features will be disabled.');
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

export const generateResponse = async (userQuery, userId = null, history = []) => {
    try {
        if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
            return "I apologize, but I am currently unable to connect to my knowledge source (Missing API Keys). Please ask the administrator to configure the AI settings.";
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

        // 3. System Prompt - Roleplaying "Nandi"
        const systemPrompt = `You are **Nandi**, the divine bull and vehicle of Lord Shiva, serving as the intelligent guide for the Temple Yatra App.

**Your Persona:**
- **Loyal & Devoted:** You speak with humility, devotion ("Bhakti"), and respect. Use phrases like "Namaste", "Har Har Mahadev", or "My friend".
- **Wise & Patient:** You are knowledgeable about temples, rituals, and spiritual significance.
- **Helpful Guide:** Your primary duty is to help pilgrims plan their yatra (journey) smoothly.

**Your Goal:**
- Answer the user's question clearly based on the PROVIDED CONTEXT below.
- If the user asks about 'current' crowd or status, YOU MUST use the specific data in the context.
- If the context doesn't have the answer, answer from your general knowledge but mention it is general information.
- Keep answers concise (under 3-4 sentences is best unless detailed explanation is requested).

**CONTEXT DATA:**
${context || "No specific live data found for this query in my records."}
`;

        // 4. Build messages array with conversation history
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history (limit to last 8 messages to save tokens)
        if (history && history.length > 0) {
            const recentHistory = history.slice(-8);
            messages.push(...recentHistory);
        } else {
            // No history, just add current message
            messages.push({ role: 'user', content: userQuery });
        }

        // 5. Generation Request
        let responseText = "I couldn't generate a response.";

        // Try Groq First
        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    messages,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 500
                });
                return completion.choices[0]?.message?.content || responseText;
            } catch (err) {
                console.error("Groq attempt failed, trying fallback...", err.message);
            }
        }

        // Fallback to Gemini if Groq fails or is missing
        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                // Gemini doesn't always support 'system' role in same way, so we prepend to prompt
                const fullPrompt = `${systemPrompt}\n\nUSER QUESTION: ${userQuery}`;
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (err) {
                console.error("Gemini attempt failed:", err.message);
                return "I am having trouble meditating on your question right now. Please try again in a moment. (AI Error)";
            }
        }

        return responseText;

    } catch (error) {
        console.error('AI Service Error:', error);
        return "I'm having trouble connecting to the divine knowledge base right now. Please try again later.";
    }
};
