import { z } from 'zod';

/**
 * TaskState represents the current lifecycle stage of a BRZ task.
 * These states drive the Durable State Machine in the Orchestrator.
 */
export const TaskStateSchema = z.enum([
  'IDLE',
  'PLANNING',
  'WAITING_APPROVAL',
  'EXECUTING',
  'VERIFYING',
  'RECOVERING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export type TaskState = z.infer<typeof TaskStateSchema>;

/**
 * TaskContext holds the stateful data associated with a task.
 * This is what gets persisted to the Store.
 */
export interface TaskContext {
  taskId: string;
  goal: string;
  currentState: TaskState;
  plan?: any[]; // Will be replaced by a detailed Plan schema later
  auditTrail: AuditEntry[];
  metadata: Record<string, any>;
  updatedAt: Date;
}

export interface AuditEntry {
  timestamp: Date;
  actor: 'PLANNER' | 'WORKER' | 'VERIFIER' | 'GATEWAY' | 'SUPERVISOR';
  action: string;
  input: any;
  output: any;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  evidenceHash?: string;
}
