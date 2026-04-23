
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/services/ai.service.js');
let content = fs.readFileSync(filePath, 'utf8');

const newMethod = `
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
        
        // If agent sent a message and user replied next
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

      // 2. Prepare AI Context
      const historyStr = messages.slice(-20).map(m => \`\${m.direction}: \${m.content}\`).join("\\n");
      const systemPrompt = \`
        You are a Strategic Lead Analyst. Analyze the conversation and provide a brief in JSON format.
        Extract these fields: 
        - name (The lead's name)
        - qualification (Last degree/qualification)
        - program (Interested course)
        - callTime (Preferred time for a call)
        - summary (A 2-3 sentence brief of the conversation)
        - sentiment (Professional assessment of intent: High, Medium, Low)
      \`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: \`Lead Identity: \${contactInfo.name}\\n\\nHistory:\\n\${historyStr}\` }
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
`;

// Add before the last closing brace
content = content.trim().slice(0, -1) + newMethod + '\n}';
fs.writeFileSync(filePath, content);
console.log('AI Service updated with Strategic Brief capabilities.');
