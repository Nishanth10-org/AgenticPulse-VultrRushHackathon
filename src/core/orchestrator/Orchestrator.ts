import { TaskContext, TaskState } from '../../types';
import { StateStore } from './StateStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Orchestrator is the "Manager" of the Blast Radius Zero platform.
 * It implements the Durable State Machine and coordinates between the
 * Cognitive Layer (Agents), Control Layer (Gateway), and Execution Layer (Sandbox).
 */
export class Orchestrator {
  private store: StateStore;

  constructor() {
    this.store = new StateStore();
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
          // MOCK: Simulating a Planner Agent
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.transition(taskId, 'WAITING_APPROVAL', {
            actor: 'PLANNER',
            action: 'CREATE_PLAN',
            input: context.goal,
            output: { steps: ['Step 1: Hello World'] },
            status: 'SUCCESS'
          });
          break;

        case 'WAITING_APPROVAL':
          console.log(`[Orchestrator] Waiting for human approval...`);
          // MOCK: Automatically approving for the demo
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.transition(taskId, 'EXECUTING');
          break;

        case 'EXECUTING':
          console.log(`[Orchestrator] Executing task in sandbox...`);
          // MOCK: Simulating a Worker Agent + Gateway + Sandbox
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.transition(taskId, 'VERIFYING', {
            actor: 'WORKER',
            action: 'EXECUTE_STEP',
            input: 'Step 1',
            output: 'Successfully printed Hello World',
            status: 'SUCCESS'
          });
          break;

        case 'VERIFYING':
          console.log(`[Orchestrator] Verifying execution evidence...`);
          // MOCK: Simulating a Verifier Agent
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.transition(taskId, 'COMPLETED', {
            actor: 'VERIFIER',
            action: 'VERIFY_STEP',
            input: 'Execution Logs',
            output: 'Verified: Goal achieved',
            status: 'SUCCESS'
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
