import { LLMAdapter } from './LLMAdapter';
import { TaskContext, AuditEntry } from '../../types';

/**
 * The Verifier Agent acts as the adversarial judge of the execution.
 */
export class VerifierAgent {
  private llm: LLMAdapter;

  constructor(llm: LLMAdapter) {
    this.llm = llm;
  }

  async verify(context: TaskContext): Promise<{ verdict: 'SUCCESS' | 'FAILURE', reasoning: string }> {
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
