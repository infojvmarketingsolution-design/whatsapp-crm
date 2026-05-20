const { OpenAI } = require('openai');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.openai = new OpenAI({ apiKey: this.apiKey });
    } else {
      console.warn('[AI Service] ⚠️ OpenAI API Key is missing. AI features will be disabled.');
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
        if (err.message.includes('429')) {
          console.error('[AI Service] 🔴 OpenAI Quota Exceeded. Falling back to rule-based intent.');
          return 'UNCLEAR';
        }
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
        prompt = "User is asked for qualification. Based on their reply, pick one: '10th Pass', '12th Pass', 'Diploma Complete', 'Graduation Complete', 'Master Complete', 'PhD Complete'. If unclear, reply with the original message.";
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
      if (err.message.includes('429')) {
        console.error('[AI Service] 🔴 Extraction Quota Exceeded. Returning raw message.');
      } else {
        console.error('[AI Service] Extraction Error:', err.message);
      }
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
       if (err.message.includes('429')) {
          return "I'm currently receiving a lot of messages, let me connect you to a human counselor who can help you immediately! 👨‍💻";
       }
      return "I'm having trouble thinking right now. Let me get a human to help you!";
    }
  }

  /**
   * Summarizes a conversation history into 3 key points.
   */
  async summarizeConversation(messages, contactInfo) {
    if (!this.openai) {
      console.error('[AI Service] ❌ Summarization failed: OpenAI API key is missing.');
      return null;
    }

    try {
      if (!messages || messages.length === 0) {
        return { goal: 'None', painPoint: 'No conversation history found', nextStep: 'Start the conversation' };
      }

      const historyStr = messages.map(m => `${m.direction}: ${m.content}`).join("\n");
      const contactContext = `Name: ${contactInfo.name}, Qualification: ${contactInfo.qualification}, Selected Program: ${contactInfo.selectedProgram}`;

      console.log(`[AI Service] Summarizing conversation for ${contactInfo.name} (${messages.length} messages)`);

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
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
    
    let botQuestionsAnswered = 0;
    const trackedFields = [
      'name', 'email', 'qualification', 'selectedStream', 'selectedProgram', 
      'preferredCallTime', 'budget', 'purchaseTimeline', 'decisionMakerStatus',
      'profession', 'companyName', 'city', 'state'
    ];
    trackedFields.forEach(field => {
      if (contact[field]) botQuestionsAnswered++;
    });
    if (contact.flowVariables && typeof contact.flowVariables === 'object') {
      botQuestionsAnswered += Object.keys(contact.flowVariables).length;
    }

    // 1. Data Points (Max 50)
    if (contact.name) score += 5;
    if (contact.qualification) score += 15;
    if (contact.selectedProgram) score += 20;
    if (contact.preferredCallTime) score += 10;

    const hasAllAnswers = contact.name && contact.qualification && contact.selectedProgram && contact.preferredCallTime;

    // 2. Interaction signals (Scanning messages)
    const history = messages.slice(-10).map(m => m.content).join(" ").toLowerCase();
    
    // Buying Signals
    const hotKeywords = ['scholarship', 'fees', 'cost', 'discount', 'admission', 'apply now', 'urgent', 'asap', 'when can i start'];
    const hasHotSignals = hotKeywords.some(k => history.includes(k));
    if (hasHotSignals) score += 30;

    // Volume Signal
    if (messages.length > 5) score += 10;

    // Cap at 100
    if (hasAllAnswers) {
        score = 100; // 100% priority lead
    } else {
        score = Math.min(score, 100);
    }

    // Determine Heat Level
    let heatLevel = 'Cold';
    if (score >= 70 || hasAllAnswers) heatLevel = 'Hot';
    else if (score >= 40) heatLevel = 'Warm';

    return { score, heatLevel, botQuestionsAnswered };
  }

  /**
   * Generates a comprehensive Strategic Brief for a contact.
   * Includes behavior analysis (response speed) and fact extraction.
   */
  async generateStrategicBrief(messages, contactInfo) {
    if (!this.openai) return null;

    try {
      // 1. Calculate Average Response Time (User Velocity)
      let totalDelay = 0;
      let replyCount = 0;
      
      for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i-1];
        
        if (previous.direction === 'OUTBOUND' && current.direction === 'INBOUND') {
          const delay = new Date(current.createdAt) - new Date(previous.createdAt);
          totalDelay += delay;
          replyCount++;
        }
      }
      
      const avgDelayMinutes = replyCount > 0 ? Math.round((totalDelay / replyCount) / 60000) : null;
      let velocity = "N/A";
      if (avgDelayMinutes !== null) {
        if (avgDelayMinutes < 5) velocity = "⚡ High Velocity (Instant)";
        else if (avgDelayMinutes < 60) velocity = "🟢 Responsive (Within 1hr)";
        else if (avgDelayMinutes < 1440) velocity = "🟡 Steady (Same Day)";
        else velocity = "🔴 Delayed (Slow)";
      }

      const historyStr = messages.slice(-20).map(m => `${m.direction}: ${m.content}`).join("\n");
      const systemPrompt = `
        You are a Strategic Lead Analyst. Analyze the conversation and provide a brief in JSON format.
        Extract these fields: 
        - name (The lead's name)
        - qualification (Last degree/qualification)
        - program (Interested course)
        - callTime (Preferred time for a call)
        - summary (A 2-3 sentence brief of the conversation)
        - sentiment (Professional assessment of intent: High, Medium, Low)
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Lead Identity: ${contactInfo.name}\n\nHistory:\n${historyStr}` }
        ],
        response_format: { type: "json_object" }
      });

      const aiResult = JSON.parse(response.choices[0].message.content);
      return { ...aiResult, responseVelocity: velocity, avgDelayMinutes };
    } catch (err) {
      console.error('[AI Service] Strategic Brief Error:', err.message);
      return null;
    }
  }

  /**
   * 🤖 ADVANCED AI ADMISSION COUNSELLOR
   * Processes conversational queries, tracks context, performs qualification detection,
   * dynamically recommends courses, answers FAQs, updates lead scoring, and triggers agent handoffs.
   */
  async processAdvancedAIConversation({ tenantId, universityName, contact, messages, messageText }) {
    if (!this.openai) {
      return {
        reply: "I'm sorry, I'm currently running in low-power mode. Let me connect you with a human counsellor right away! 👨‍💻",
        shouldTransfer: true
      };
    }

    try {
      // Load dynamic settings from DB
      const Settings = require('../models/core/Settings');
      const settings = await Settings.findOne({ tenantId });
      const customAi = settings?.automation?.aiPrompts || {};

      const placement = customAi.aiPlacementInfo || `${universityName} has over 90% placement rates, with top packages exceeding 12 Lakhs per annum. Recruiting partners include TCS, Infosys, and top startups.`;
      const hostel = customAi.aiHostelInfo || `Clean and premium hostels with AC/Non-AC options, hot water, Wi-Fi, and nutritious mess food.`;
      const scholarship = customAi.aiScholarshipInfo || `Up to 50% waiver based on merit (12th Board / Graduation GPA) or financial needs.`;
      const fees = customAi.aiFeeInfo || `B.Sc Trending courses are ~85k/year, Traditional courses ~45k/year. M.Sc courses are ~95k/year.`;
      
      const customPromptInstructions = customAi.aiSystemInstructions 
        ? `CORE CUSTOM WORKSPACE INSTRUCTIONS:\n${customAi.aiSystemInstructions}\n` 
        : '';

      // 1. Compile recent message history for context-awareness
      const historyStr = messages.slice(-8).map(m => `${m.direction === 'INBOUND' ? 'Student' : 'Counsellor'}: ${m.content}`).join("\n");

      // 2. Comprehensive system instructions for Advanced AI features
      const systemPrompt = `
You are the highly intelligent Advanced AI Admission Counsellor for ${universityName}.
Your objective is to consult students naturally, understand their needs, suggest matching programs, answer FAQs, and score leads dynamically.

${customPromptInstructions}

CAPABILITIES:
1. NATURAL MULTILINGUAL CONVERSATION: Warm, empathetic, and human-like. Silently understand and correct spelling mistakes. Respond in the language used by the student (English, Hindi, Gujarati, or a mixed blend like Hinglish / Gujlish).
2. DYNAMIC WORKFLOW & RECOMMENDATIONS:
   - Identify qualification: (e.g. B.Com/Graduation ➔ Master Programs; 12th Pass ➔ Bachelor/Trending Programs).
   - If they select Cyber Security: Suggest "B.Sc IT in Cyber Security & Digital Forensics" or "M.Sc IT in Cyber Security & Digital Forensics".
   - If they select Animation: Suggest VFX, Gaming, 3D Design, or Film Editing.
3. SMART FAQ KNOWLEDGE:
   - Placement: ${placement}
   - Hostel: ${hostel}
   - Scholarships: ${scholarship}
   - Fees: ${fees}
4. SENTIMENT & COUUNSELLOR TRANSFER: Detect user sentiments (confused, frustrated, interested, urgent). Trigger human counsellor transfer (shouldTransfer = true) if the user is frustrated, highly confused, or directly asks to talk to a person/counsellor.
5. LEAD SCORING RULES:
   - Interested in trending program (e.g. Cyber Security, Cloud, Data Analytics, AI & ML): +20 points
   - Asked about placements, scholarships, or hostels: +15 points
   - Provided call time / requested phone counselling: +30 points
   - Continued positive interaction: +10 points
6. BROCHURE SHARING: If the student asks for course details, brochure, or syllabus, set brochureToShare to "Admission Brochure".

Return your reply ONLY in a valid JSON object format matching this structure:
{
  "reply": "Your warm, natural conversational reply here.",
  "detectedQualification": "12th Pass" | "Graduation" | "Diploma Completed" | "Master Completed" | null,
  "detectedProgram": "Full program name recommended" | null,
  "detectedCallTime": "Time string if provided" | null,
  "sentiment": "interested" | "confused" | "frustrated" | "urgent" | "neutral",
  "scoreAddition": number,
  "shouldTransfer": boolean,
  "brochureToShare": "Admission Brochure" | null
}
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Conversation History:\n${historyStr}\n\nStudent's latest message:\n${messageText}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const parsedResult = JSON.parse(response.choices[0].message.content);
      console.log(`[AI Counsellor] Parsed JSON Output:`, JSON.stringify(parsedResult));
      return parsedResult;
    } catch (err) {
      console.error('[AI Counsellor] Error during OpenAI execution:', err.message);
      return {
        reply: "I'd love to tell you more about our programs. Can we connect you with a human counsellor to guide you better? 📞",
        shouldTransfer: false
      };
    }
  }
}

module.exports = new AIService();