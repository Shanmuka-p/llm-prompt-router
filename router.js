require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load the expert personas from our external config
const prompts = JSON.parse(fs.readFileSync('./prompts.json', 'utf8'));

/**
 * Step 1: Classify the user's intent using Gemini
 */
async function classify_intent(message) {
    const systemInstruction = `Your task is to classify the user's intent. Based on the user message below, choose one of the following labels: code, data, writing, career, unclear.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                // Force Gemini to return valid JSON matching this exact structure
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        intent: { type: "STRING" },
                        confidence: { type: "NUMBER" }
                    },
                    required: ["intent", "confidence"]
                },
                temperature: 0.0 // Low temperature for consistent classification
            }
        });

        const resultObj = JSON.parse(response.text);
        return resultObj;

    } catch (error) {
        // Fulfills the core requirement: gracefully handle errors
        console.error(`[Gemini API Error for message "${message}"]:`, error.message);
        return { intent: "unclear", confidence: 0.0 };
    }
}

/**
 * Step 2: Route the request and generate the final response
 */
async function route_and_respond(message, intentObj) {
    const { intent, confidence } = intentObj;

    // Optional Stretch Goal: Confidence Threshold
    const finalIntent = (confidence < 0.6) ? "unclear" : intent;

    let finalResponse = "";

    // Core Requirement: Do not guess if unclear, ask a clarifying question
    if (finalIntent === "unclear" || !prompts[finalIntent]) {
        finalResponse = "I'm not quite sure how to help with that. Are you asking for help with coding, data analysis, writing, or career advice?";
    } else {
        // Route to the correct expert persona
        const systemInstruction = prompts[finalIntent];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7
            }
        });

        finalResponse = response.text;
    }

    // Log the interaction
    log_route(intent, confidence, message, finalResponse);

    return finalResponse;
}

/**
 * Helper function to log interactions to route_log.jsonl
 */
function log_route(intent, confidence, user_message, final_response) {
    const logEntry = {
        intent,
        confidence,
        user_message,
        final_response,
        timestamp: new Date().toISOString()
    };

    fs.appendFileSync('route_log.jsonl', JSON.stringify(logEntry) + '\n');
}

module.exports = {
    classify_intent,
    route_and_respond
};