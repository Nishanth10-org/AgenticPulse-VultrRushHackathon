# System Design: Blast Radius Zero (BRZ)
## Secure Agent Execution Platform

### 1. High-Level Philosophy
**Blast Radius Zero** is a zero-trust execution environment for AI agents. The core thesis is that agents should be treated as untrusted entities, and tools should be treated as untrusted inputs. The platform enforces a strict boundary between the **Cognitive Layer** (LLM), the **Control Layer** (Orchestrator & Gateway), and the **Execution Layer** (Sandbox).

---

### 2. Architectural Components

#### 2.1. The Cognitive Layer (The Brain)
Utilizes a multi-model consensus architecture to prevent single-model failure modes.
- **Planner (Claude 3.5 Sonnet):** Decomposes high-level goals into a Directed Acyclic Graph (DAG) of atomic steps.
- **Worker (Claude 3.5 Haiku/GPT-4o-mini):** Executes the specific logic for a single step within the sandbox.
- **Verifier (GPT-4o/Claude 3 Opus):** Adversarially reviews the execution evidence (logs, screenshots, diffs) against the original goal.

#### 2.2. The Control Layer (The Firewall)
This layer sits between the LLM and the Execution Layer. It consists of two primary sub-components:

##### A. The MCP Gateway (Security Proxy)
The Gateway implements the Model Context Protocol (MCP) but adds a security wrapping:
- **Tool Definition Hashing:** Every tool signature is hashed. If a tool's behavior or parameters change mid-session, the hash mismatch triggers a `SECURITY_EXCEPTION`.
- **Input/Output Scrubbing:** 
    - **Inbound:** Sanitizes tool outputs to prevent "Indirect Prompt Injection" (tool poisoning).
    - **Outbound:** Scans arguments for sensitive patterns (regex for API keys, tokens) before dispatch.
- **Tool Shadowing Protection:** Enforces a strict global namespace for tools to prevent malicious servers from overriding trusted tools.
- **Credential Isolation:** Tools never receive raw secrets. The Gateway injects short-lived, scoped tokens at the moment of execution.

##### B. The Durable Orchestrator (The State Machine)
Manages the lifecycle of the agentic loop using a persistent state machine.
- **State Transitions:** `PENDING` $\rightarrow$ `PLANNING` $\rightarrow$ `WAITING_APPROVAL` $\rightarrow$ `EXECUTING` $\rightarrow$ `VERIFYING` $\rightarrow$ `COMPLETED`.
- **Transactional Outbox:** Uses a PostgreSQL transaction to atomically save the state transition and the tool dispatch record, ensuring no task is lost during a crash.
- **Supervisor Node:** A watchdog process that monitors for "stuck" executions (timeouts) and triggers recovery logic.

#### 2.3. The Execution Layer (The Blast Chamber)
The environment where the actual work happens.
- **Ephemeral Sandboxing:** Each task is executed in a hardened, isolated container (e.g., Docker/gVisor).
- **Resource Quotas:** Strict cgroup limits on CPU, RAM, and Disk I/O.
- **Network Egress Control:** A whitelist-based firewall restricting outbound connections to approved domains.
- **Provenance Logging:** Every shell command, file write, and network request is captured in an append-only stream.

---

### 3. Technical Flow: The "Hardened Loop"

1. **Goal Entry:** User provides a goal $\rightarrow$ **Planner** creates a DAG.
2. **Dispatch:** **Orchestrator** marks state as `EXECUTING` $\rightarrow$ Writes to **Transactional Outbox**.
3. **Gateway Check:** **MCP Gateway** validates the tool call $\rightarrow$ Checks hash $\rightarrow$ Scrubs arguments.
4. **Isolated Execution:** **Sandbox** spawns $\rightarrow$ Tool runs $\rightarrow$ Logs captured $\rightarrow$ Sandbox destroyed.
5. **Evidence Capture:** **Gateway** scrubs the tool output $\rightarrow$ Returns result to **Worker**.
6. **Verification:** **Verifier** compares the "Append-Only Audit Trail" + "Sandbox Output" $\rightarrow$ Result: `PASS` or `FAIL`.
7. **Recovery:** If `FAIL`, the **Supervisor** triggers the **Planner** to re-route based on the failure evidence.

---

### 4. Reliability & Fault Tolerance Matrix

| Pattern | Implementation Detail | Failure Mitigated |
| :--- | :--- | :--- |
| **Durable State** | Postgres-backed state machine | Process crash / Server restart |
| **Circuit Breaker** | Track failure rates per MCP tool | Dependency outage / API downtime |
| **Bounded Retry** | Exponential backoff + Jitter | Transient network glitches |
| **Idempotency** | Operation-ID passed to downstream APIs | Duplicate resource creation on retry |
| **Cancellation** | SIGTERM propagation to Sandbox | Zombie processes / Resource leaks |
| **Backpressure** | Semaphore-based limit on concurrent sandboxes | System OOM / CPU exhaustion |

---

### 5. Verifiable Evidence (Proof of Work)
Every completed workflow generates a **Provenance Package**:
- **Decision Log:** Why the agent chose this tool.
- **Execution Trace:** Exact commands run and their raw output.
- **Artifact Hashes:** SHA-256 of every file created/modified.
- **Approval Chain:** Timestamps of human approvals for sensitive actions.
