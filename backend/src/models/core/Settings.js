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
  qualificationOptions: {
    type: [String],
    default: [
      '10th Pass', 
      '12th Pass', 
      'Diploma Complete', 
      'Graduation complete', 
      'Master complete',
      'phD complete'
    ]
  },
  programMap: {
    type: Object,
    default: {
      '10th Pass': {
        'Diploma Programs': ['Diploma in Engineering', 'IT Diploma', 'Animation Diploma']
      },
      '12th Pass': {
        'Trending Programs': ['B.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation', 'Animation, VFX & Game Design'],
        'Traditional Programs': ['BBA', 'B.Com', 'BCA', 'B.Sc']
      },
      'Diploma Complete': {
        'Bachelor Programs': ['Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering']
      },
      'Graduation complete': {
        'Trending Master Programs': ['M.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation', 'Animation, VFX & Game Design'],
        'Traditional Master Programs': ['MBA', 'M.Com', 'MCA', 'M.Sc']
      },
      'Master complete': {
        'PhD Programs': ['PhD in Marketing', 'PhD in Civil Engineering', 'PhD in IT']
      },
      'phD complete': {
        'Post-Doc': ['Research Fellowship', 'Academic Leadership']
      }
    }
  },
  prdFlowSteps: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [
      { id: 'step_1', type: 'GREETING', title: 'Greeting Message', message: 'Hello 👋 Welcome to JV Marketing Support!', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60' },
      { id: 'step_2', type: 'NAME_CAPTURE', title: 'Name Request', message: 'Great! May I know your name?' },
      { id: 'step_3', type: 'QUALIFICATION', title: 'Qualification Choice', message: '{{name}}, please select your last qualification 👇' },
      { id: 'step_4', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Great, {{name}}! Please select your preferred program:' },
      { id: 'step_5', type: 'SUCCESS_PROOF', title: 'Success & Proof', message: '🎉 Success Stories, {{name}}!\n\nOur students are working in top companies 🚀', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60' },
      { id: 'step_6', type: 'CALL_TIME', title: 'Consultation Call', message: '{{name}}, what is your preferred time for a call? 📞', options: ['Morning', 'Afternoon', 'Evening'] }
    ] 
  }
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
