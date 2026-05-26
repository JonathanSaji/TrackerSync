require("dotenv").config({ quiet: true });

const OpenAI = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set. Add it to your .env file before running this test.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey
});

(async function runTest() {
  try {
    const response = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: "Reply with exactly one short sentence saying the connection works."
        },
        {
          role: "user",
          content: "Test connection"
        }
      ]
    });

    console.log("AI Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("OpenAI test failed:");
    console.error("- message:", err.message);
    console.error("- code:", err.code || "n/a");
    console.error("- type:", err.type || "n/a");
    console.error("If you are on school Wi-Fi, the network may be blocking OpenAI traffic.");
    process.exit(1);
  }
})();