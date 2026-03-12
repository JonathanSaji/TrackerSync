//require("dotenv").config();
require("dotenv").config({ quiet: true }); // Load .env without warning if it doesn't exist, quieter in terminal

const OpenAI = require("openai");


const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// loading json
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("data/subscriptions.json", "utf8"));

//convert data into sentences
function buildSubscriptionText(subscriptions) {
  return subscriptions
    .map(sub =>
      `${sub.name} costs $${sub.cost}/month, last used ${sub.lastUsed}, emotional value ${sub.emotionalValue}/10.`
    )
    .join(" ");
}


//console.log(data);
//console.log(data.subscriptions); // debugging line to check if subscriptions are loaded correctly

//build sentance with subscription data
const subscriptionText = buildSubscriptionText(data.subscriptions);



// Wrap everything in an async IIFE (Immediately Invoked Function Expression)
(async function runTest() {
  try {
    const response = await openai.chat.completions.create({
  model: "o3-mini",  // <-- THIS decides the model
  messages: [
    { role: "system", content: 
      `
      You are a professional financial assistant.
      Do not greet or ask questions.
      Give clear advice under 3 sentences.
      Base recommendations on subscription cost, usage, and emotional value, and consider the type of subscription—compare similar services (like Spotify vs YouTube Music) but avoid comparing fundamentally different ones (like ChatGPT vs Spotify).      If a new service is mentioned, compare it to existing subscriptions.
      If it is not in the data, give general advice.
        `.trim() //test
    },

    
    { 
        role: "user", 
        content: `
        Subscription data:
        ${subscriptionText}
        should i cancel disney+ // replace this with real input from ai chatbox textinput
      `.trim()
    }


  ] // message bracket
});

    console.log("AI Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error calling OpenAI:", err.message);
  }
})();