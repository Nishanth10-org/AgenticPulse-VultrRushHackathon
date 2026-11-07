"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierAgent = void 0;
/**
 * The Verifier Agent acts as the adversarial judge of the execution.
 */
class VerifierAgent {
    constructor(llm) {
        this.llm = llm;
    }
    async verify(context) {
        console.log(`[Verifier] Reviewing audit trail for task ${context.taskId}...`);
        const systemPrompt = `
      You are the BRZ Verifier. Your job is to find reasons why a task FAILED.
      You must be adversarial. Do not trust the Worker's claims; only trust the Audit Trail evidence.
      Output ONLY JSON: { "verdict": "SUCCESS" | "FAILURE", "reasoning": string }
    `;
        const userPrompt = `Goal: ${context.goal}\nAudit Trail: ${JSON.stringify(context.auditTrail)}`;
        const response = await this.llm.generate(systemPrompt, userPrompt, true);
        return JSON.parse(response);
    }
}
exports.VerifierAgent = VerifierAgent;
