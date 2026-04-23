
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/services/ai.service.js');
let content = fs.readFileSync(filePath, 'utf8');

// I will remove the extra braces at the end of the file.
// The file should end with:
/*
      return null;
    }
  }
}

module.exports = new AIService();
*/

const targetEnding = `      return null;
    }
  }
}

module.exports = new AIService();`;

const lines = content.split('\n');
// Let's rebuild the end correctly.
// Find the last function end.

const cleanedContent = content.replace(/return null;\s+\}\s+\}\s+\}\s+\}\s+\}/, 'return null;\n    }\n  }\n}\n');

fs.writeFileSync(filePath, cleanedContent.trim() + '\n\nmodule.exports = new AIService();\n');
console.log('AIService syntax fixed.');
