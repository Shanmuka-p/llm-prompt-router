require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const prompts = JSON.parse(fs.readFileSync('./prompts.json', 'utf8'));

async function classify_intent(message) {
    const systemPrompt = `Your task is to classify the user's intent. Based on the user message below, choose one of the following labels: code, data, writing, career, unclear. Respond with a single JSON object containing two keys: 'intent' (the label you chose) and 'confidence' (a float from 0.0 to 1.0, representing your certainty). Do not provide any other text or explanation.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            response_format: { type: "json_object" },
            temperature: 0.0
        });

        const resultObj = JSON.parse(response.choices[0].message.content);

        if (!resultObj.intent || resultObj.confidence === undefined) {
            throw new Error("Invalid schema");
        }
        return resultObj;
    } catch (error) {
        // Fulfills requirement: gracefully handle malformed responses
        return { intent: "unclear", confidence: 0.0 };
    }
}

// Append this to router.js

async function route_and_respond(message, intentObj) {
    const { intent, confidence } = intentObj;
    let finalResponse = "";

    // Fulfills requirement: Do not guess if unclear, ask clarification
    if (intent === "unclear" || !prompts[intent]) {
        finalResponse = "Are you asking for help with coding, data analysis, writing, or career advice?";
    } else {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: prompts[intent] },
                { role: "user", content: message }
            ],
            temperature: 0.7
        });
        finalResponse = response.choices[0].message.content;
    }

    log_route(intent, confidence, message, finalResponse);
    return finalResponse;
}

function log_route(intent, confidence, user_message, final_response) {
    const logEntry = { intent, confidence, user_message, final_response };
    fs.appendFileSync('route_log.jsonl', JSON.stringify(logEntry) + '\n');
}



module.exports = { classify_intent, prompts, openai , route_and_respond };