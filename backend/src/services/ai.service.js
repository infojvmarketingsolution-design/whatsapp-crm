const { OpenAI } = require('openai');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.openai = new OpenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Detects intent from the user message.
   * Returns: 'START_FLOW', 'QUESTION', 'AGENT_TRANSFER', 'UNCLEAR'
   */
  async detectIntent(message) {
    if (!message) return 'UNCLEAR';

    // Rule-based fallback (Instant response)
    const msg = message.toLowerCase().trim();
    const startKeywords = ['hi', 'hello', 'interested', 'start', 'i want to join', 'courses', 'hey'];
    const agentKeywords = ['agent', 'human', 'speak to someone', 'call me', 'talk to person'];
    
    if (startKeywords.some(k => msg.includes(k))) return 'START_FLOW';
    if (agentKeywords.some(k => msg.includes(k))) return 'AGENT_TRANSFER';

    // If OpenAI is configured, use it for deeper NLP
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: "You are an AI intent classifier for an educational CRM. Classify the user message into one of these categories: START_FLOW (user wants to know about courses/start setup), QUESTION (user asks a specific question), AGENT_TRANSFER (user wants a human), UNCLEAR (anything else). Reply with ONLY the category name." 
            },
            { role: "user", content: message }
          ],
          max_tokens: 10,
          temperature: 0
        });

        const intent = response.choices[0].message.content.trim().toUpperCase();
        if (['START_FLOW', 'QUESTION', 'AGENT_TRANSFER', 'UNCLEAR'].includes(intent)) {
          return intent;
        }
      } catch (err) {
        console.error('[AI Service] OpenAI Intent Error:', err.message);
      }
    }

    return 'UNCLEAR';
  }

  /**
   * Extracts data from user message based on the current step.
   */
  async extractData(message, fieldType) {
    if (!this.openai || !message) return message;

    try {
      let prompt = "";
      if (fieldType === 'NAME') {
        prompt = "Extract the person's name from this message. If not found, reply with the original message. Reply with ONLY the name.";
      } else if (fieldType === 'QUALIFICATION') {
        prompt = "User is asked for qualification. Based on their reply, pick one: '10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'. If unclear, reply with the original message.";
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a data extractor. Be precise. No conversational filler." },
          { role: "user", content: `${prompt}\n\nMessage: ${message}` }
        ],
        temperature: 0
      });

      return response.choices[0].message.content.trim();
    } catch (err) {
      console.error('[AI Service] Extraction Error:', err.message);
      return message;
    }
  }

  /**
   * Generates a conversational answer to a user's question.
   */
  async askAI(question, context = "") {
    if (!this.openai) return "I'm sorry, I'm currently in rule-based mode and can't answer complex questions. Let me connect you to an agent!";

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: `You are JV Marketing Education Support chatbot. Use the context below to answer. If you don't know, say you'll connect them to an agent. Context: ${context}` 
          },
          { role: "user", content: question }
        ]
      });

      return response.choices[0].message.content;
    } catch (err) {
      return "I'm having trouble thinking right now. Let me get a human to help you!";
    }
  }

  /**
   * Summarizes a conversation history into 3 key points.
   */
  async summarizeConversation(messages, contactInfo) {
    if (!this.openai) return null;

    try {
      const historyStr = messages.map(m => `${m.direction}: ${m.content}`).join("\n");
      const contactContext = `Name: ${contactInfo.name}, Qualification: ${contactInfo.qualification}, Selected Program: ${contactInfo.selectedProgram}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are an AI assistant for a WhatsApp CRM. Categorize and summarize the conversation into exactly 3 bullet points: 1) CURRENT GOAL, 2) KEY PAIN POINT/CONCERN, 3) RECOMMENDED NEXT STEP. Be extremely concise. Reply in JSON format: { \"goal\": \"...\", \"painPoint\": \"...\", \"nextStep\": \"...\" }" 
          },
          { role: "user", content: `Context: ${contactContext}\n\nHistory:\n${historyStr}` }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (err) {
      console.error('[AI Service] Summarization Error:', err.message);
      return null;
    }
  }

  /**
   * Calculates a lead score (0-100) based on data completeness and intent.
   */
  async calculateLeadScore(contact, messages = []) {
    let score = 0;

    // 1. Data Points (Max 50)
    if (contact.name) score += 5;
    if (contact.qualification) score += 15;
    if (contact.selectedProgram) score += 20;
    if (contact.preferredCallTime) score += 10;

    // 2. Interaction signals (Scanning messages)
    const history = messages.slice(-10).map(m => m.content).join(" ").toLowerCase();
    
    // Buying Signals
    const hotKeywords = ['scholarship', 'fees', 'cost', 'discount', 'admission', 'apply now', 'urgent', 'asap', 'when can i start'];
    const hasHotSignals = hotKeywords.some(k => history.includes(k));
    if (hasHotSignals) score += 30;

    // Volume Signal
    if (messages.length > 5) score += 10;

    // Cap at 100
    score = Math.min(score, 100);

    // Determine Heat Level
    let heatLevel = 'Cold';
    if (score >= 70) heatLevel = 'Hot';
    else if (score >= 40) heatLevel = 'Warm';

    return { score, heatLevel };
  }
}

module.exports = new AIService();
