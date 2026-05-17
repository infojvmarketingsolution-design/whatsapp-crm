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
  qualificationOptions: { type: [String], default: ['10th Pass', '12th Pass', 'Graduate', 'Working Professional'] },
  programMap: {
    type: Object,
    default: {
      '10th Pass': {
        'Diploma Programs': ['IT Diploma', 'Mechanical Diploma', 'Civil Diploma']
      },
      '12th Pass': {
        'Trending Programs': ['B.Sc Cyber Security', 'B.Sc AI & ML', 'B.Sc Animation', 'B.Sc Cloud Automation', 'B.Sc Software Development', 'B.Sc Blockchain Technology', 'B.Sc Data Analytics'],
        'Traditional Programs': ['B.Com', 'B.Tech', 'BBA']
      },
      'Graduate': {
        'Master Programs': ['MBA', 'MCA', 'M.Tech', 'M.Sc']
      },
      'Working Professional': {
        'Executive Programs': ['Executive MBA', 'Certification Courses']
      }
    }
  },
  prdFlowSteps: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [
      { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Greeting & Name', message: 'Welcome to Gandhinagar University 🎓\nWe’re excited to help you choose the right career path.\nFirst, may I know your name?', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
      { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Choice', message: 'Nice to meet you {{name}} 😊\nPlease select your qualification.' },
      { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.' },
      { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: 'Great choice 🚀\nWhen should our counselor call you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
      { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counsellor will call you at your preferred time 📞' }
    ] 
  },
  aiSystemInstructions: { type: String, default: '' },
  aiPlacementInfo: { type: String, default: '' },
  aiHostelInfo: { type: String, default: '' },
  aiScholarshipInfo: { type: String, default: '' },
  aiFeeInfo: { type: String, default: '' },
  aiBrochureUrl: { type: String, default: '' }
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

const AutoAssignmentRuleSchema = new mongoose.Schema({
  type: { type: String, enum: ['ROLE', 'USER'], default: 'ROLE' },
  targetId: { type: String, required: true }, // Role key or User ID
  targetName: { type: String, default: '' },
  limitPerDay: { type: Number, default: 0 }, // 0 means unlimited
});

const CRMSettingsSchema = new mongoose.Schema({
  defaultPipelineId: { type: String, default: null },
  duplicateDetection: { type: Boolean, default: true },
  autoAssignment: { type: Boolean, default: false },
  autoAssignmentRules: { type: [AutoAssignmentRuleSchema], default: [] }
});

const AutomationSettingsSchema = new mongoose.Schema({
  botEnabled: { type: Boolean, default: false },
  botMode: { type: String, enum: ['PRD', 'CUSTOM', 'AI'], default: 'PRD' },
  customGreetingFlowId: { type: String, default: null },
  fallbackToHuman: { type: Boolean, default: true },
  workingHours: { type: Object, default: {} },
  rateLimit: { type: Number, default: 0 },
  aiPrompts: { type: AIPromptsSchema, default: () => ({}) }
});

const RoleAccessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  allAccess: { type: Boolean, default: false },
  permissions: { type: [String], default: [] }
}, { _id: false });

const FirewallRuleSchema = new mongoose.Schema({
  action: { type: String, enum: ['Accept', 'Drop', 'Reject'], default: 'Accept' },
  protocol: { type: String, default: 'All' },
  port: { type: String, default: '' },
  source: { type: String, default: 'IP' },
  sourceDetail: { type: String, default: '' }
});

const SettingsSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  workspace: { type: WorkspaceSettingsSchema, default: () => ({}) },
  whatsapp: { type: WhatsAppSettingsSchema, default: () => ({}) },
  crm: { type: CRMSettingsSchema, default: () => ({}) },
  automation: { type: AutomationSettingsSchema, default: () => ({}) },
  security: {
    autoBackup: { type: Boolean, default: true },
    gdprConsentTracker: { type: Boolean, default: true },
    dataRetention: { type: String, default: '365' },
    firewallRules: { type: [FirewallRuleSchema], default: [] }
  },
  notifications: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },
  customization: {
    themeColor: { type: String, default: '#10b981' }, // Teal default
    customLogin: { type: Boolean, default: false },
    logoUrl: { type: String, default: null }
  },
  roleAccess: {
    type: Map,
    of: RoleAccessSchema,
    default: () => ({
      'ADMIN': { 
        name: 'Admin',
        allAccess: true,
        permissions: [
          'dashboard', 'tasks', 'pipeline', 'chat', 'contacts', 'campaigns', 'ai-chatbot', 'flows', 'templates', 'agents', 'web-widgets', 'api', 'settings',
          'workspace', 'whatsapp', 'crm', 'users', 'billing', 'integrations', 'automations', 'security', 'notifications', 'customization'
        ]
      },
      'TELECALLER': { name: 'Telecaller', allAccess: false, permissions: ['dashboard', 'tasks', 'pipeline', 'chat', 'contacts', 'chat_show_assigned_only'] },
      'MANAGER_COUNSELLOUR': { name: 'Manager/Counsellour', allAccess: false, permissions: ['dashboard', 'tasks', 'pipeline', 'chat', 'contacts', 'campaigns'] },
      'AGENT': { name: 'Standard Agent', allAccess: false, permissions: ['dashboard', 'tasks', 'chat', 'contacts', 'chat_show_assigned_only'] },
      'BUSINESS_HEAD': { 
        name: 'Business Head', 
        allAccess: true, 
        permissions: [
          'dashboard', 'tasks', 'pipeline', 'chat', 'contacts', 'campaigns', 'ai-chatbot', 'flows', 'templates', 'agents', 'web-widgets', 'api', 'settings',
          'workspace', 'whatsapp', 'crm', 'users'
        ] 
      }
    })
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
