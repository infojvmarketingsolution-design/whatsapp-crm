
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will rewrite the Filter Engine to match the new Intelligence filters perfectly.

const oldFilterEngine = `  // Filter Engine
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = !searchTerm || (
      (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone || '').includes(searchTerm)
    );
    
    const matchesStatus = filters.status === 'ALL' || c.status === filters.status;
    const matchesHeat = filters.heat === 'ALL' || c.heatLevel === filters.heat;
    const matchesStage = filters.stage === 'ALL' || c.pipelineStage === filters.stage;
    const matchesAgent = filters.agent === 'ALL' || c.assignedAgent === filters.agent || c.assignedCounsellor === filters.agent;
    const matchesSource = filters.source === 'ALL' || c.leadSource === filters.source;
    const matchesScore = (c.score || 0) >= filters.minScore && (c.score || 0) <= filters.maxScore;
    const matchesValue = (c.estimatedValue || 0) >= filters.minValue;
    const matchesUnread = !filters.hasUnread || (c.lastMessageAt && new Date(c.lastMessageAt) > new Date(c.lastReadAt || 0));
    const matchesTasks = !filters.hasTasks || (c.tasks && c.tasks.some(t => t.status === 'PENDING'));
    
    // Date Range logic
    let matchesDate = true;
    if (filters.dateRange !== 'ALL') {
       const now = new Date();
       const createdAt = new Date(c.createdAt);
       if (filters.dateRange === 'TODAY') {
          matchesDate = createdAt.toDateString() === now.toDateString();
       } else if (filters.dateRange === 'WEEK') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = createdAt >= weekAgo;
       } else if (filters.dateRange === 'MONTH') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          matchesDate = createdAt >= monthAgo;
       }
    }

    return !c.isArchived && matchesSearch && matchesStatus && matchesHeat && matchesStage && matchesAgent && matchesSource && matchesScore && matchesValue && matchesUnread && matchesTasks && matchesDate;
  });`;

const newFilterEngine = `  // Intelligence Filter Engine (V2)
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = !searchTerm || (
      (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone || '').includes(searchTerm)
    );
    
    const matchesStatus = filters.status === 'ALL' || c.status === filters.status;
    const matchesStage = filters.stage === 'ALL' || c.pipelineStage === filters.stage;
    const matchesAgent = filters.agent === 'ALL' || c.assignedAgent === filters.agent || c.assignedCounsellor === filters.agent;
    const matchesSource = filters.source === 'ALL' || c.leadSource === filters.source;
    const matchesProgram = filters.program === 'ALL' || (c.selectedProgram && c.selectedProgram.toLowerCase().includes(filters.program.toLowerCase()));
    const matchesQual = filters.qualification === 'ALL' || (c.qualification && c.qualification.toLowerCase().includes(filters.qualification.toLowerCase()));
    const matchesScore = (c.score || 0) >= filters.minScore;
    
    // Advanced Timeline Logic
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

    return !c.isArchived && matchesSearch && matchesStatus && matchesStage && matchesAgent && matchesSource && matchesProgram && matchesQual && matchesScore && matchesDate && matchesTime;
  });`;

if (content.includes(oldFilterEngine)) {
    content = content.replace(oldFilterEngine, newFilterEngine);
    fs.writeFileSync(filePath, content);
    console.log('Filter Engine fixed and leads restored.');
} else {
    // Regex fallback
    const regex = /\/\/ Filter Engine[\s\S]+?return !c\.isArchived[\s\S]+?\}\);/;
    if (regex.test(content)) {
        content = content.replace(regex, newFilterEngine);
        fs.writeFileSync(filePath, content);
        console.log('Filter Engine fixed via regex.');
    }
}
