"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannerAgent = void 0;
/**
 * The Planner Agent decomposes a high-level goal into a DAG of atomic steps.
 */
class PlannerAgent {
    constructor(llm) {
        this.llm = llm;
    }
    async plan(context) {
        console.log(`[Planner] Decomposing goal: ${context.goal}`);
        const systemPrompt = `
      You are the BRZ Planner. Your goal is to decompose a user request into a strict sequence of atomic steps.
      Each step must be a tool call. Output ONLY a JSON array of steps.
      Format: [{ "step": number, "action": string, "params": object, "description": string }]
    `;
        const userPrompt = `Goal: ${context.goal}`;
        const response = await this.llm.generate(systemPrompt, userPrompt, true);
        return JSON.parse(response);
    }
}
exports.PlannerAgent = PlannerAgent;
