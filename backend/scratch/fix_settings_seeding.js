const fs = require('fs');
const path = './src/controllers/settings.controller.js';
let content = fs.readFileSync(path, 'utf8');

const oldQualOptions = `settings.automation.aiPrompts.qualificationOptions = ['10th Pass', '12th Pass', 'Graduate', 'Working Professional'];`;
const newQualOptions = `settings.automation.aiPrompts.qualificationOptions = ['12th Pass', 'Graduation', 'Other'];`;

const oldMapPart = `          settings.automation.aiPrompts.programMap = {
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
          };`;

const newMapPart = `          settings.automation.aiPrompts.programMap = {
            '12th Pass': {
              'Trending Programs': ['B.Voc Cyber Security', 'B.Voc Fintech', 'B.Sc IT Ai & ML', 'B.Sc IT Data Analytics'],
              'Traditional Programs': ['B.Com', 'B.Tech', 'BBA']
            },
            'Graduation': {
              'Master Traditional Program': ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'],
              'Master Trending Program': [
                'M.Sc IT in Cyber Security & Digital Forensics',
                'M.Sc IT in Cloud Automation',
                'M.Sc IT in Data Analytics',
                'M.Sc IT in Animation, VFX & Game Design',
                'M.Sc IT in Blockchain Technology',
                'M.Sc IT in Software & Mobile App Development'
              ]
            }
          };`;

// Clean line endings first
const cleanContent = content.replace(/\r\n/g, '\n');
const cleanOldQual = oldQualOptions.replace(/\r\n/g, '\n');
const cleanNewQual = newQualOptions.replace(/\r\n/g, '\n');

let updated = cleanContent;
if (updated.includes(cleanOldQual)) {
  updated = updated.replace(cleanOldQual, cleanNewQual);
  console.log('Replaced Qual Options');
} else {
  // Let's do a substring match
  const partialOld = `qualificationOptions = ['10th Pass', '12th Pass'`;
  const idx = updated.indexOf(partialOld);
  if (idx !== -1) {
    const endLineIdx = updated.indexOf('\n', idx);
    updated = updated.substring(0, idx) + `qualificationOptions = ['12th Pass', 'Graduation', 'Other'];` + updated.substring(endLineIdx);
    console.log('Replaced Qual Options (Partial match)');
  }
}

// Replaced Map
const partialMap = `settings.automation.aiPrompts.programMap = {`;
const mapIdx = updated.indexOf(partialMap);
if (mapIdx !== -1) {
  const endMapIdx = updated.indexOf('};', mapIdx);
  if (endMapIdx !== -1) {
    updated = updated.substring(0, mapIdx) + `settings.automation.aiPrompts.programMap = {
            '12th Pass': {
              'Trending Programs': ['B.Voc Cyber Security', 'B.Voc Fintech', 'B.Sc IT Ai & ML', 'B.Sc IT Data Analytics'],
              'Traditional Programs': ['B.Com', 'B.Tech', 'BBA']
            },
            'Graduation': {
              'Master Traditional Program': ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'],
              'Master Trending Program': [
                'M.Sc IT in Cyber Security & Digital Forensics',
                'M.Sc IT in Cloud Automation',
                'M.Sc IT in Data Analytics',
                'M.Sc IT in Animation, VFX & Game Design',
                'M.Sc IT in Blockchain Technology',
                'M.Sc IT in Software & Mobile App Development'
              ]
            }
          }` + updated.substring(endMapIdx + 2);
    console.log('Replaced Program Map');
  }
}

fs.writeFileSync(path, updated, 'utf8');
console.log('Successfully completed adjustments in settings.controller.js!');
