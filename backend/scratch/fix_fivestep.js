const mongoose = require('mongoose');
const Settings = require('../src/models/core/Settings');

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
  const settings = await Settings.findOne({ tenantId: 'fivestep_599984' });
  if (settings && settings.automation && settings.automation.aiPrompts && settings.automation.aiPrompts.programMap) {
    const map = settings.automation.aiPrompts.programMap;
    if (map.Services) {
      settings.automation.aiPrompts.programMap = map.Services;
      settings.markModified('automation.aiPrompts.programMap');
      await settings.save();
      console.log('Fixed fivestep_599984 programMap by removing top-level Services key');
    } else {
      console.log('No Services key found, replacing entirely based on user input...');
      settings.automation.aiPrompts.programMap = {
        "Coaching": {
          "Spoken English": { "Modes": ["Online", "Offline"] },
          "Computer Courses": { "Programs": ["Short Term Courses", "Internships", "Placement Assistance"] },
          "Paramedical Courses": { "Programs": ["Patient Care Assistant", "Nursing Assistant", "General Duty Assistant", "O.T. Assistant", "Medical Laboratory Technician"] }
        },
        "International Coaching": {
          "IELTS": ["Online", "Offline"],
          "PTE": ["Online", "Offline"],
          "Duolingo": ["Online", "Offline"],
          "German Language": ["Online", "Offline"],
          "French Language": ["Online", "Offline"],
          "GRE": ["Online", "Offline"],
          "SAT": ["Online", "Offline"],
          "TOEFL": ["Online", "Offline"]
        },
        "Visa Services": {
          "Study Abroad Visa": ["USA", "UK", "Australia", "Canada", "Europe", "Singapore"],
          "Visitor Visa": ["USA", "UK", "Australia", "Canada", "Europe", "Singapore"]
        },
        "Online Programs": {
          "Bachelor's Programs": ["BA", "BBA", "BCA", "B.Com"],
          "Master's Programs": ["MA", "MBA", "MCA", "M.Com"]
        },
        "Study MBBS Abroad": ["Russia", "Georgia"],
        "Tour Packages": {
          "Categories": ["International", "Domestic"]
        }
      };
      settings.markModified('automation.aiPrompts.programMap');
      await settings.save();
      console.log('Updated fivestep_599984 programMap from user input');
    }
  } else if (settings) {
     if (!settings.automation) settings.automation = {};
     if (!settings.automation.aiPrompts) settings.automation.aiPrompts = {};
     settings.automation.aiPrompts.programMap = {
        "Coaching": {
          "Spoken English": { "Modes": ["Online", "Offline"] },
          "Computer Courses": { "Programs": ["Short Term Courses", "Internships", "Placement Assistance"] },
          "Paramedical Courses": { "Programs": ["Patient Care Assistant", "Nursing Assistant", "General Duty Assistant", "O.T. Assistant", "Medical Laboratory Technician"] }
        },
        "International Coaching": {
          "IELTS": ["Online", "Offline"],
          "PTE": ["Online", "Offline"],
          "Duolingo": ["Online", "Offline"],
          "German Language": ["Online", "Offline"],
          "French Language": ["Online", "Offline"],
          "GRE": ["Online", "Offline"],
          "SAT": ["Online", "Offline"],
          "TOEFL": ["Online", "Offline"]
        },
        "Visa Services": {
          "Study Abroad Visa": ["USA", "UK", "Australia", "Canada", "Europe", "Singapore"],
          "Visitor Visa": ["USA", "UK", "Australia", "Canada", "Europe", "Singapore"]
        },
        "Online Programs": {
          "Bachelor's Programs": ["BA", "BBA", "BCA", "B.Com"],
          "Master's Programs": ["MA", "MBA", "MCA", "M.Com"]
        },
        "Study MBBS Abroad": ["Russia", "Georgia"],
        "Tour Packages": {
          "Categories": ["International", "Domestic"]
        }
      };
      settings.markModified('automation.aiPrompts.programMap');
      await settings.save();
      console.log('Created and Updated fivestep_599984 programMap from user input');
  } else {
    console.log('fivestep_599984 tenant not found');
  }
  process.exit(0);
}
fix().catch(console.error);
