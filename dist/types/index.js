"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStateSchema = void 0;
const zod_1 = require("zod");
/**
 * TaskState represents the current lifecycle stage of a BRZ task.
 * These states drive the Durable State Machine in the Orchestrator.
 */
exports.TaskStateSchema = zod_1.z.enum([
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
