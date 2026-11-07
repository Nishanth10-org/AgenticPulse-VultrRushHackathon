"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAgent = void 0;
/**
 * The Worker Agent executes a single step of the plan using available tools.
 */
class WorkerAgent {
    constructor(llm) {
        this.llm = llm;
    }
    async executeStep(context, step) {
        console.log(`[Worker] Executing step ${step.step}: ${step.description}`);
        const systemPrompt = `
      You are the BRZ Worker. You execute a single atomic step.
      You must format your output as a tool call for the MCP Gateway.
      Context Goal: ${context.goal}
    `;
        const userPrompt = `Execute this step: ${JSON.stringify(step)}`;
        const response = await this.llm.generate(systemPrompt, userPrompt, true);
        return JSON.parse(response);
    }
}
exports.WorkerAgent = WorkerAgent;
