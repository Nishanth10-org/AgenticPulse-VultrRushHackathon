"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Orchestrator_1 = require("./core/orchestrator/Orchestrator");
async function main() {
    console.log('--- Blast Radius Zero: Orchestrator Demo ---');
    const orchestrator = new Orchestrator_1.Orchestrator();
    // 1. Create a new task
    const task = await orchestrator.createTask('Build a secure agent platform for Vultr Rush Hackathon');
    try {
        // 2. Run the task through the state machine
        await orchestrator.run(task.taskId);
        console.log('\nDemo completed successfully!');
    }
    catch (error) {
        console.error('\nDemo failed:', error);
    }
}
main().catch(console.error);
