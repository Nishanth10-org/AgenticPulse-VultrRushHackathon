"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * StateStore provides the persistence layer for the Durable State Machine.
 * Initially implemented as a file-based store for the MVP.
 */
class StateStore {
    constructor(dir = './store') {
        this.storePath = path_1.default.resolve(dir);
        if (!fs_1.default.existsSync(this.storePath)) {
            fs_1.default.mkdirSync(this.storePath, { recursive: true });
        }
    }
    getFilePath(taskId) {
        return path_1.default.join(this.storePath, `${taskId}.json`);
    }
    async saveState(context) {
        const filePath = this.getFilePath(context.taskId);
        await fs_1.default.promises.writeFile(filePath, JSON.stringify(context, null, 2));
    }
    async getState(taskId) {
        const filePath = this.getFilePath(taskId);
        if (!fs_1.default.existsSync(filePath))
            return null;
        const data = await fs_1.default.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        // Restore Date objects from JSON strings
        return {
            ...parsed,
            updatedAt: new Date(parsed.updatedAt),
            auditTrail: parsed.auditTrail.map((entry) => ({
                ...entry,
                timestamp: new Date(entry.timestamp)
            }))
        };
    }
    async listTasks() {
        const files = await fs_1.default.promises.readdir(this.storePath);
        return files
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace('.json', ''));
    }
}
exports.StateStore = StateStore;
