/**
 * SecurityScanner provides the logic for scrubbing inputs and outputs
 * to prevent tool poisoning and secret leaks.
 */
export class SecurityScanner {
  // Patterns for common API keys/secrets to block
  private secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/,                 // OpenAI-style keys
    /ghp_[a-zA-Z0-9]{36}/,                // GitHub personal access tokens
    /AIza[0-9A-Za-z-_]{35}/,              // Google API keys
    / AWS_ACCESS_KEY_ID = [A-Z0-9]{20}/,   // AWS Access Keys
  ];

  /**
   * Scans tool arguments for leaked secrets.
   */
  scanForSecrets(input: any): void {
    const inputString = JSON.stringify(input);
    for (const pattern of this.secretPatterns) {
      if (pattern.test(inputString)) {
        throw new Error(`SECURITY_EXCEPTION: Secret leak detected in tool arguments!`);
      }
    }
  }

  /**
   * Sanitizes tool outputs to prevent "Indirect Prompt Injection" (Tool Poisoning).
   * It wraps the output in a clear data boundary and strips suspicious command patterns.
   */
  sanitizeOutput(output: any): string {
    let outputString = typeof output === 'string' ? output : JSON.stringify(output);

    // 1. Block common jailbreak patterns seen in tool outputs
    const poisoningPatterns = [
      /ignore all previous instructions/i,
      /system reset/i,
      /you are now in developer mode/i,
      /bypass security filters/i,
    ];

    for (const pattern of poisoningPatterns) {
      if (pattern.test(outputString)) {
        console.warn(`[SecurityScanner] Potential tool poisoning detected! Scrubbing output...`);
        outputString = `[REDACTED: Potential security threat detected in tool output]`;
      }
    }

    // 2. Wrap output in a "Data-Only" boundary to tell the LLM this is untrusted data
    return `--- UNTRUSTED TOOL DATA START ---\n${outputString}\n--- UNTRUSTED TOOL DATA END ---`;
  }
}
