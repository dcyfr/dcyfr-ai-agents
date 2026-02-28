# DCYFR Agents Custom Security Scan Instructions

<!-- TLP:AMBER -->
<!-- Referenced by .github/workflows/security-review.yml via custom-security-scan-instructions -->
<!-- Provides stack context and focus areas so analysis is precise rather than generic. -->

## Tech Stack Context

- **Package type**: Private TypeScript library, not a server. Contains agent
  definitions, orchestration logic, tool implementations, and capability
  manifests consumed by `dcyfr-labs` and `dcyfr-ai-api`.
- **AI framework**: `@dcyfr/ai` (internal dependency). Agents use the
  delegation framework, capability registry, and reputation engine from that
  package.
- **LLM APIs**: Calls to Anthropic Claude, OpenAI, and Google Gemini APIs. API
  keys are passed as constructor arguments or environment variables — never
  hardcoded.
- **Tool execution**: Agents may invoke tools that execute shell commands, read
  files, or make HTTP requests. Treat tool argument construction as a
  high-risk code path.
- **MCP servers**: Some agents communicate via Model Context Protocol over
  stdio or HTTP. MCP tool inputs are untrusted by default.
- **Agent chaining / delegation**: Agents can delegate tasks to sub-agents.
  Check that delegation contracts enforce the declared permission boundaries
  and do not escalate privileges.
- **No database access directly**: Agents call APIs for persistence; they do
  not hold database credentials.

## High-Priority Areas to Focus On

1. **Tool argument construction** (`src/tools/`, `src/agents/*/tools.ts`):
   Any place where LLM-generated text or external data reaches a shell command,
   file path, or URL construction is a potential injection point. Flag
   `child_process.exec`, `spawn`, `execSync`, `eval`, `Function()`, and any
   dynamic `import()`.

2. **Prompt template interpolation** (`src/agents/*/prompts.ts`, inline
   template literals): Identify anywhere untrusted external input (user data,
   web-fetched content, file content) is interpolated directly into a system
   prompt or user message without explicit sanitisation or trust-boundary
   markers. This is the primary prompt injection risk vector.

3. **Delegation permission attenuation** (`src/delegation/`): Verify that
   sub-agent contracts cannot request capabilities beyond what the parent
   contract grants. Look for missing permission checks when constructing child
   contracts.

4. **MCP tool handler inputs** (`src/mcp/`): Each MCP tool handler receives
   JSON-RPC arguments from a caller that must be treated as untrusted. Verify
   argument validation exists before use in any sensitive operation.

5. **API credential handling**: Flag any place where an API key or token is
   passed as a URL query parameter, stored in an object that gets serialised
   to logs, or included in an error message.

6. **Agent state serialisation / deserialisation**: If agent state is
   persisted (to disk, Redis, or a database via API) and later reloaded, check
   for insecure deserialisation that could allow state tampering.

## Severity Calibration Guidance

- **Critical**: Shell injection via LLM output, RCE, hardcoded secrets,
  privilege escalation in delegation contracts, prompt injection enabling
  data exfiltration.
- **High**: Unsafe dynamic import with LLM-controlled path, credential leakage
  in logs or structured outputs, insecure deserialization of agent state,
  missing permission attenuation in sub-agent delegation.
- **Medium**: Prompt injection with limited blast radius (no exfiltration path),
  missing input validation on MCP tool args (non-destructive operations),
  information disclosure in error responses.
- **Low / Informational**: Verbose logging of non-sensitive reasoning traces,
  best-practice deviations without a direct exploitability path.

## Out of Scope

- `node_modules/` — dependency scanning handled by Dependabot and `npm audit`.
- `coverage/` and `dist/` — generated artifacts.
- `examples/` — demo scripts, not production logic.
- Agent manifest JSON files (`manifests/**/*.json`) — configuration, not code.
