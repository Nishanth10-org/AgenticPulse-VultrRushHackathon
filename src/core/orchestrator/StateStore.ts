import fs from 'fs';
import path from 'path';
import { TaskContext } from '../types';

/**
 * StateStore provides the persistence layer for the Durable State Machine.
 * Initially implemented as a file-based store for the MVP.
 */
export class StateStore {
  private storePath: string;

  constructor(dir: string = './store') {
    this.storePath = path.resolve(dir);
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  private getFilePath(taskId: string): string {
    return path.join(this.storePath, `${taskId}.json`);
  }

  async saveState(context: TaskContext): Promise<void> {
    const filePath = this.getFilePath(context.taskId);
    await fs.promises.writeFile(filePath, JSON.stringify(context, null, 2));
  }

  async getState(taskId: string): Promise<TaskContext | null> {
    const filePath = this.getFilePath(taskId);
    if (!fs.existsSync(filePath)) return null;

    const data = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);

    // Restore Date objects from JSON strings
    return {
      ...parsed,
      updatedAt: new Date(parsed.updatedAt),
      auditTrail: parsed.auditTrail.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }))
    };
  }

  async listTasks(): Promise<string[]> {
    const files = await fs.promises.readdir(this.storePath);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }
}
