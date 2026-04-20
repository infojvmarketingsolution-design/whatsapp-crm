const flowSteps = [
  { id: 'qualification', data: { msgType: 'LIST_MESSAGE', variableName: 'qualification' } },
  { id: 'program', data: { msgType: 'LIST_MESSAGE', variableName: 'program', isProgramSelection: true } },
  { id: 'success', data: { msgType: 'IMAGE', text: 'Success Stories' } },
  { id: 'careerGoal', data: { msgType: 'QUESTION', variableName: 'careerGoal' } }
];

async function simulate() {
  let stepToProcess = flowSteps[0];
  let iterations = 0;
  let consumeInput = true;
  let messageText = '10th Pass';
  let forceStay = false;
  let flowVariables = {};

  console.log("--- Starting Simulation ---");

  while (stepToProcess && iterations < 10) {
    iterations++;
    const nodeData = stepToProcess.data || {};
    const msgType = nodeData.msgType || 'TEXT';
    forceStay = false;

    console.log(`\nIteration ${iterations} | Node: ${stepToProcess.id} | MsgType: ${msgType} | consumeInput: ${consumeInput}`);

    if (consumeInput) {
       const varName = nodeData.variableName;
       if (varName === 'qualification') {
          console.log(`[SAVE] Setting qualification to ${messageText}`);
          flowVariables.qualification = messageText;
       } else if (varName === 'program') {
          // Simulate category match
          if (messageText === 'Diploma Programs') {
             console.log("[SAVE] Category Match: Diploma Programs");
             flowVariables.selectedStream = 'Diploma Programs';
             forceStay = true;
          }
       }
    }

    if (consumeInput && !forceStay) {
       console.log("[MOVE] Moving to next node...");
       const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
       if (flowSteps[idx + 1]) {
          stepToProcess = flowSteps[idx + 1];
          consumeInput = false;
          console.log(`[CONTINUE] New Node: ${stepToProcess.id}`);
          continue;
       }
    }

    console.log(`[EXECUTE] Sending ${msgType} for node ${stepToProcess.id}`);
    
    // Check wait
    if (['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE'].includes(msgType)) {
       console.log(`[STOP] Returning turn at ${stepToProcess.id}`);
       return;
    }

    // Move to next
    const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
    if (flowSteps[idx + 1]) {
       stepToProcess = flowSteps[idx + 1];
       consumeInput = false;
    } else {
       break;
    }
  }
}

simulate();
