const mongoose = require('mongoose');

const AIPromptsSchema = new mongoose.Schema({
  greetingMessage: { type: String, default: 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀\n\nMay I know your name?' },
  greetingImage: { type: String, default: '' },
  namePrompt: { type: String, default: 'Great! May I know your name?' },
  programListPrompt: { type: String, default: '{{name}}, which career path or program are you interested in?' },
  successProofMessage: { type: String, default: '🎉 Success Stories, {{name}}!\n\nOur students are already working in top companies 🚀\nYou could be next!' },
  successProofImage: { type: String, default: '' },
  callTimePrompt: { type: String, default: '{{name}}, what is your preferred time for our counsellor to call you? 📞' },
  agentTransferPrompt: { type: String, default: 'Transferring you to a human agent... 👨‍💻' },
  fallbackMessage: { type: String, default: "I'm sorry, I didn't quite get that. Could you please rephrase?" },
  qualificationOptions: { type: [String], default: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'] },
  programMap: { type: mongoose.Schema.Types.Mixed, default: {
    '10th Pass': { 'Diploma Programs': ['Diploma in Engineering', 'IT Diploma', 'Animation Diploma'] },
    '12th Pass': { 
      'Trending Programs': ['B.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation', 'Animation, VFX & Game Design'],
      'Traditional Programs': ['BBA', 'B.Com', 'BCA', 'B.Sc']
    },
    'Diploma Completed': { 'Bachelor Programs': ['Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering'] },
    'Graduation Completed': { 
      'Trending Master Programs': ['M.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation', 'Animation, VFX & Game Design'],
      'Traditional Master Programs': ['MBA', 'M.Com', 'MCA', 'M.Sc']
    },
    'Master Completed': { 'PhD Programs': ['PhD in Marketing', 'PhD in Civil Engineering', 'PhD in IT'] }
  } }
});


const WorkspaceSettingsSchema = new mongoose.Schema({
  name: { type: String, default: 'My Workspace' },
  logoUrl: { type: String, default: null },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  industry: { type: String, default: 'Other' },
  customDomain: { type: String, default: null },
});

const WhatsAppSettingsSchema = new mongoose.Schema({
  phoneNumberId: { type: String, default: null },
  wabaId: { type: String, default: null },
  accessToken: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  defaultSender: { type: String, default: null },
  optInHandling: { type: Boolean, default: false }
});

const CRMSettingsSchema = new mongoose.Schema({
  defaultPipelineId: { type: String, default: null },
  duplicateDetection: { type: Boolean, default: true },
  autoAssignment: { type: Boolean, default: false }
});

const AutomationSettingsSchema = new mongoose.Schema({
  botEnabled: { type: Boolean, default: false },
  botMode: { type: String, enum: ['PRD', 'CUSTOM'], default: 'PRD' },
  customGreetingFlowId: { type: String, default: null },
  fallbackToHuman: { type: Boolean, default: true },
  workingHours: { type: Object, default: {} },
  rateLimit: { type: Number, default: 0 },
  aiPrompts: { type: AIPromptsSchema, default: () => ({}) }
});

const SettingsSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  workspace: { type: WorkspaceSettingsSchema, default: () => ({}) },
  whatsapp: { type: WhatsAppSettingsSchema, default: () => ({}) },
  crm: { type: CRMSettingsSchema, default: () => ({}) },
  automation: { type: AutomationSettingsSchema, default: () => ({}) },
  notifications: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },
  customization: {
    themeColor: { type: String, default: '#10b981' }, // Teal default
    customLogin: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
