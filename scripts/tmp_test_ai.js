require('dotenv').config({ path: './backend/.env' });
const aiService = require('./backend/src/services/ai.service');

async function testSumm() {
  console.log("Checking API Key setup...");
  if(!aiService.openai) {
    console.error("OpenAI not configured.");
    return;
  }
  
  const messages = [
    { direction: "INBOUND", content: "Hi, I am interested in admission." },
    { direction: "OUTBOUND", content: "Great! May I know your name?" },
    { direction: "INBOUND", content: "Akash" },
    { direction: "OUTBOUND", content: "Akash, which career path are you interested in?" },
    { direction: "INBOUND", content: "12th pass looking for options" }
  ];
  const contactInfo = {
    name: "Akash",
    qualification: "12th Pass",
    selectedProgram: ""
  };
  
  try {
    const sum = await aiService.summarizeConversation(messages, contactInfo);
    console.log("Summary result:", sum);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testSumm();
