const { classify_intent, route_and_respond } = require('./router');

const testMessages = [
    "how do i sort a list of objects in python?",
    "explain this sql query for me",
    "This paragraph sounds awkward, can you help me fix it?",
    "I'm preparing for a job interview, any tips?",
    "what's the average of these numbers: 12, 45, 23, 67, 34",
    "Help me make this better.",
    "I need to write a function that takes a user id and returns their profile, but also i need help with my resume.",
    "hey",
    "Can you write me a poem about clouds?",
    "Rewrite this sentence to be more professional.",
    "I'm not sure what to do with my career.",
    "what is a pivot table",
    "fxi thsi bug pls: for i in range(10) print(i)",
    "How do I structure a cover letter?",
    "My boss says my writing is too verbose."
];

// Helper function to pause execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
    console.log("Starting routing tests (with rate-limit delays)...");

    for (let i = 0; i < testMessages.length; i++) {
        const msg = testMessages[i];
        console.log(`\n[${i + 1}/15] Processing: "${msg}"`);

        const intentObj = await classify_intent(msg);
        console.log(`Classified Intent:`, intentObj);

        await route_and_respond(msg, intentObj);

        // Pause for 5 seconds between tests to respect the 15 RPM free tier limit
        if (i < testMessages.length - 1) {
            console.log("Sleeping for 5 seconds to avoid API rate limits...");
            await sleep(5000);
        }
    }
    console.log("\nTests complete. Check route_log.jsonl");
}

runTests();