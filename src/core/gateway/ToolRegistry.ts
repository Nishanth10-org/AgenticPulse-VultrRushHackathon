import crypto from 'crypto';

/**
 * ToolDefinition represents the signature of an MCP tool.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * ToolRegistry manages the trusted signatures of tools to prevent "rug-pulls"
 * and tool shadowing.
 */
export class ToolRegistry {
  private trustedTools: Map<string, string> = new Map(); // toolName -> signatureHash

  /**
   * Registers a tool and stores its signature hash.
   */
  registerTool(definition: ToolDefinition): void {
    const hash = this.calculateHash(definition);

    // Tool Shadowing Protection: Prevent overriding existing trusted tools
    if (this.trustedTools.has(definition.name)) {
      throw new Error(`SECURITY_EXCEPTION: Tool shadowing detected. Tool '${definition.name}' is already registered.`);
    }

    this.trustedTools.set(definition.name, hash);
    console.log(`[ToolRegistry] Registered tool '${definition.name}' with hash ${hash.substring(0, 8)}...`);
  }

  /**
   * Verifies that the current tool definition matches the registered signature.
   */
  verifySignature(definition: ToolDefinition): boolean {
    const currentHash = this.calculateHash(definition);
    const registeredHash = this.trustedTools.get(definition.name);

    if (!registeredHash) {
      throw new Error(`SECURITY_EXCEPTION: Tool '${definition.name}' is not registered in the trusted registry.`);
    }

    if (currentHash !== registeredHash) {
      console.error(`[ToolRegistry] RUG-PULL DETECTED: Tool '${definition.name}' signature has changed!`);
      return false;
    }

    return true;
  }

  private calculateHash(definition: ToolDefinition): string {
    const canonicalString = JSON.stringify({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters
    });
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }
}
