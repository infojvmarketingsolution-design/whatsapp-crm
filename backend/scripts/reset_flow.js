const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Settings = require('../src/models/core/Settings');

async function run() {
  await mongoose.connect(process.env.CORE_DB_URI);
  console.log("Connected to Core DB");

  const defaultPrompts = {
    greetingMessage: 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀\n\nMay I know your name?',
    greetingImage: '',
    namePrompt: 'Great! May I know your name?',
    programListPrompt: '{{name}}, which career path or program are you interested in?',
    successProofMessage: '🎉 Success Stories, {{name}}!\n\nOur students are already working in top companies 🚀\nYou could be next!',
    successProofImage: '',
    callTimePrompt: '{{name}}, what is your preferred time for our counsellor to call you? 📞',
    agentTransferPrompt: 'Transferring you to a human agent... 👨‍💻',
    fallbackMessage: "I'm sorry, I didn't quite get that. Could you please rephrase?",
    qualificationOptions: ['10th Pass', '12th Pass', 'Graduate', 'Working Professional'],
    programMap: {
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
    },
    prdFlowSteps: [
      { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Greeting & Name', message: 'Welcome to Gandhinagar University 🎓\nWe’re excited to help you choose the right career path.\nFirst, may I know your name?', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
      { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Choice', message: 'Nice to meet you {{name}} 😊\nPlease select your qualification.' },
      { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.' },
      { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: 'Great choice 🚀\nWhen should our counselor call you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
      { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counsellor will call you at your preferred time 📞' }
    ]
  };

  const res = await Settings.updateMany({}, {
    $set: { 'automation.aiPrompts': defaultPrompts }
  });

  console.log(`Successfully reset flow for ${res.modifiedCount} tenant workspaces.`);
  process.exit(0);
}

run().catch(console.error);
