import { TaskContext, TaskState } from '../../types';
import { StateStore } from './StateStore';
import { v4 as uuidv4 } from 'uuid';
import { LLMAdapter } from '../agents/LLMAdapter';
import { PlannerAgent } from '../agents/Planner';
import { WorkerAgent } from '../agents/Worker';
import { VerifierAgent } from '../agents/Verifier';
import { MCPGateway } from '../gateway/MCPGateway';

/**
 * Orchestrator is the "Manager" of the Blast Radius Zero platform.
 * It implements the Durable State Machine and coordinates between the
 * Cognitive Layer (Agents), Control Layer (Gateway), and Execution Layer (Sandbox).
 */
export class Orchestrator {
  private store: StateStore;
  private planner: PlannerAgent;
  private worker: WorkerAgent;
  private verifier: VerifierAgent;
  private gateway: MCPGateway;

  constructor() {
    this.store = new StateStore();
    this.gateway = new MCPGateway();

    // Initialize LLM Adapter (Using a simulated provider for now)
    const llm = new LLMAdapter('anthropic', 'sk-simulated-key');
    this.planner = new PlannerAgent(llm);
    this.worker = new WorkerAgent(llm);
    this.verifier = new VerifierAgent(llm);
  }

  getGateway() {
    return this.gateway;
  }

  /**
   * Initializes a new task in the system.
   */
  async createTask(goal: string): Promise<TaskContext> {
    const context: TaskContext = {
      taskId: uuidv4(),
      goal,
      currentState: 'IDLE',
      auditTrail: [],
      metadata: {},
      updatedAt: new Date(),
    };

    await this.store.saveState(context);
    console.log(`[Orchestrator] Task created: ${context.taskId}`);
    return context;
  }

  /**
   * The core transition engine of the Durable State Machine.
   */
  async transition(taskId: string, newState: TaskState, auditEntry?: any): Promise<TaskContext> {
    const context = await this.store.getState(taskId);
    if (!context) throw new Error(`Task ${taskId} not found`);

    console.log(`[Orchestrator] Transitioning ${taskId}: ${context.currentState} -> ${newState}`);

    // Apply transition
    context.currentState = newState;
    context.updatedAt = new Date();

    if (auditEntry) {
      context.auditTrail.push({
        timestamp: new Date(),
        ...auditEntry
      });
    }

    await this.store.saveState(context);
    return context;
  }

  /**
   * Main execution loop for a task.
   * This is a simplified version that will eventually integrate with the
   * Planner, Worker, and Verifier agents.
   */
  async run(taskId: string): Promise<void> {
    let context = await this.store.getState(taskId);
    if (!context) throw new Error(`Task ${taskId} not found`);

    while (context.currentState !== 'COMPLETED' && context.currentState !== 'FAILED') {
      switch (context.currentState) {
        case 'IDLE':
          await this.transition(taskId, 'PLANNING');
          break;

        case 'PLANNING':
          console.log(`[Orchestrator] Planning for goal: ${context.goal}...`);
          const plan = await this.planner.plan(context);
          await this.transition(taskId, 'WAITING_APPROVAL', {
            actor: 'PLANNER',
            action: 'CREATE_PLAN',
            input: context.goal,
            output: plan,
            status: 'SUCCESS'
          });
          const updatedContext = await this.store.getState(taskId);
          if (updatedContext) updatedContext.plan = plan;
          await this.store.saveState(updatedContext!);
          break;

        case 'WAITING_APPROVAL':
          console.log(`[Orchestrator] Waiting for human approval...`);
          // MOCK: Automatically approving for the demo
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.transition(taskId, 'EXECUTING');
          break;

        case 'EXECUTING':
          console.log(`[Orchestrator] Executing task in sandbox...`);

          // Get the first step from the plan
          const currentStep = context.plan && context.plan.length > 0 ? context.plan[0] : { step: 1, description: 'Default Step', action: 'read_docs' };

          try {
            // INTEGRATION: Route tool call through the MCP Gateway
            const result = await this.gateway.callTool(
              currentStep.action || 'read_docs',
              {
                name: currentStep.action || 'read_docs',
                description: currentStep.description || 'Default tool',
                parameters: {}
              },
              currentStep.params || {},
              async (args) => {
                // This is where the Vultr Sandbox will eventually be called
                return `Simulated execution of ${currentStep.action} with args ${JSON.stringify(args)}`;
              }
            );

            await this.transition(taskId, 'VERIFYING', {
              actor: 'WORKER',
              action: 'EXECUTE_STEP',
              input: currentStep,
              output: result,
              status: 'SUCCESS'
            });
          } catch (e: any) {
            console.error(`[Orchestrator] Execution failed: ${e.message}`);
            await this.transition(taskId, 'RECOVERING', {
              actor: 'SUPERVISOR',
              action: 'HANDLE_ERROR',
              input: e.message,
              output: 'Triggering recovery',
              status: 'FAILURE'
            });
          }
          break;

        case 'VERIFYING':
          console.log(`[Orchestrator] Verifying execution evidence...`);
          const verification = await this.verifier.verify(context);

          const finalState = verification.verdict === 'SUCCESS' ? 'COMPLETED' : 'RECOVERING';
          await this.transition(taskId, finalState, {
            actor: 'VERIFIER',
            action: 'VERIFY_STEP',
            input: 'Audit Trail',
            output: verification,
            status: verification.verdict === 'SUCCESS' ? 'SUCCESS' : 'FAILURE'
          });
          break;

        case 'RECOVERING':
          console.log(`[Orchestrator] Recovering from failure...`);
          await this.transition(taskId, 'PLANNING');
          break;

        default:
          throw new Error(`Unhandled state: ${context.currentState}`);
      }

      // Refresh context for next iteration
      context = await this.store.getState(taskId)!;
    }

    console.log(`[Orchestrator] Task ${taskId} reached final state: ${context.currentState}`);
  }
}
