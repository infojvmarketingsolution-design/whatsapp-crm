
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the filters state object
const oldFiltersState = `  const [filters, setFilters] = useState({
    status: 'ALL',
    heat: 'ALL',
    stage: 'ALL',
    agent: 'ALL',
    source: 'ALL',
    minScore: 0,
    maxScore: 100,
    minValue: 0,
    hasUnread: false,
    hasTasks: false,
    dateRange: 'ALL' // ALL, TODAY, WEEK, MONTH
  });`;

const newFiltersState = `  const [filters, setFilters] = useState({
    status: 'ALL',
    heat: 'ALL',
    stage: 'ALL',
    agent: 'ALL',
    source: 'ALL',
    program: 'ALL',
    qualification: 'ALL',
    minScore: 0,
    maxScore: 100,
    dateRange: 'ALL',
    startDate: '',
    endDate: '',
    startTime: '00:00',
    endTime: '23:59',
    month: 'ALL'
  });`;

// 2. Update the filteredContacts logic
const oldFilterLogic = `    const matchesSource = filters.source === 'ALL' || c.leadSource === filters.source;
    const matchesScore = c.score >= filters.minScore && c.score <= filters.maxScore;
    const matchesValue = (c.estimatedValue || 0) >= filters.minValue;
    const matchesUnread = !filters.hasUnread || c.unreadCount > 0;
    const matchesTasks = !filters.hasTasks || (c.tasks && c.tasks.length > 0);
    
    let matchesDate = true;`;

const newFilterLogic = `    const matchesSource = filters.source === 'ALL' || c.leadSource === filters.source;
    const matchesProgram = filters.program === 'ALL' || (c.selectedProgram && c.selectedProgram.toLowerCase().includes(filters.program.toLowerCase()));
    const matchesQual = filters.qualification === 'ALL' || (c.qualification && c.qualification.toLowerCase().includes(filters.qualification.toLowerCase()));
    const matchesScore = (c.score || 0) >= filters.minScore;
    
    // Date & Time Logic
    const createdAt = new Date(c.createdAt);
    let matchesDate = true;
    
    if (filters.startDate) {
       const start = new Date(filters.startDate);
       start.setHours(0,0,0,0);
       matchesDate = matchesDate && createdAt >= start;
    }
    if (filters.endDate) {
       const end = new Date(filters.endDate);
       end.setHours(23,59,59,999);
       matchesDate = matchesDate && createdAt <= end;
    }
    if (filters.month !== 'ALL') {
       matchesDate = matchesDate && createdAt.getMonth() === parseInt(filters.month);
    }
    
    // Time Logic (HH:mm)
    const leadTimeStr = createdAt.getHours().toString().padStart(2, '0') + ':' + createdAt.getMinutes().toString().padStart(2, '0');
    const matchesTime = leadTimeStr >= filters.startTime && leadTimeStr <= filters.endTime;

    const matchesUnread = !filters.hasUnread || c.unreadCount > 0;
    const matchesTasks = !filters.hasTasks || (c.tasks && c.tasks.length > 0);`;

// 3. Update the matchesDate block (clean up the old logic)
const oldMatchesDateBlock = /let matchesDate = true;[\s\S]+?return matchesSearch && matchesStatus && matchesHeat && matchesStage && matchesAgent && matchesSource && matchesScore && matchesValue && matchesUnread && matchesTasks && matchesDate;/;

const newMatchesDateBlock = `return matchesSearch && matchesStatus && matchesHeat && matchesAgent && matchesSource && matchesProgram && matchesQual && matchesDate && matchesTime;`;

if (content.includes(oldFiltersState)) {
    content = content.replace(oldFiltersState, newFiltersState);
}

if (content.includes(oldFilterLogic)) {
    content = content.replace(oldFilterLogic, newFilterLogic);
}

content = content.replace(oldMatchesDateBlock, newMatchesDateBlock);

fs.writeFileSync(filePath, content);
console.log('Filter state and logic updated.');
