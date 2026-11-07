import { LLMAdapter } from './LLMAdapter';
import { TaskContext } from '../../types';

/**
 * The Worker Agent executes a single step of the plan using available tools.
 */
export class WorkerAgent {
  private llm: LLMAdapter;

  constructor(llm: LLMAdapter) {
    this.llm = llm;
  }

  async executeStep(context: TaskContext, step: any): Promise<any> {
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
