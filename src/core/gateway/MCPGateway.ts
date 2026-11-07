import { ToolRegistry, ToolDefinition } from './ToolRegistry';
import { SecurityScanner } from './SecurityScanner';

/**
 * MCPGateway acts as the secure firewall between the Agent and the Tools.
 * It implements the "Zero Trust" architecture for tool interactions.
 */
export class MCPGateway {
  private registry: ToolRegistry;
  private scanner: SecurityScanner;

  constructor() {
    this.registry = new ToolRegistry();
    this.scanner = new SecurityScanner();
  }

  /**
   * Registers a tool with the gateway. This must happen before any tool is called.
   */
  registerTool(definition: ToolDefinition): void {
    this.registry.registerTool(definition);
  }

  /**
   * The core interception loop for tool calls.
   */
  async callTool(toolName: string, currentDefinition: ToolDefinition, args: any, toolExecutor: (args: any) => Promise<any>): Promise<any> {
    console.log(`[MCPGateway] Intercepting call to tool: ${toolName}`);

    // 1. Verify Tool Signature (Rug-Pull Defense)
    if (!this.registry.verifySignature(currentDefinition)) {
      throw new Error(`SECURITY_EXCEPTION: Rug-pull detected for tool '${toolName}'. Execution blocked.`);
    }

    // 2. Scan Arguments (Secret Leak Defense)
    this.scanner.scanForSecrets(args);

    // 3. Execute Tool (Through the Sandbox)
    console.log(`[MCPGateway] Signature verified and arguments scrubbed. Dispatching to sandbox...`);
    const result = await toolExecutor(args);

    // 4. Sanitize Output (Poisoning Defense)
    const sanitizedResult = this.scanner.sanitizeOutput(result);

    return sanitizedResult;
  }
}
