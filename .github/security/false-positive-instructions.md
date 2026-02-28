# DCYFR Agents False-Positive Filtering Instructions

<!-- TLP:AMBER -->
<!-- Referenced by .github/workflows/security-review.yml via false-positive-filtering-instructions -->
<!-- Plain English instructions telling Claude which findings to suppress or downgrade. -->

## Suppress These Categories Entirely

- **Environment variable presence checks**: Calls to `process.env.SOME_SECRET`
  are a configuration pattern, not a hardcoded secret. Only report when an
  actual secret value is hardcoded in source.

- **LLM response trust warnings (generic)**: This codebase intentionally
  processes and acts on LLM outputs as a core function. Do not report generic
  "untrusted LLM output" warnings unless there is a specific unsafe operation
  (shell exec, eval, SQL interpolation) downstream of the LLM response.

- **Missing input validation on internal TypeScript interfaces**: Interfaces
  are compile-time constructs. Runtime validation concerns must point to a
  specific missing validation at a trust boundary, not a TypeScript type.

- **`console.log` of agent reasoning traces**: Agents intentionally log
  reasoning steps for debugging. These are internal development logs, not
  production security vulnerabilities, unless they contain actual secrets or
  PII from user data.

## Lower Severity (Report as Low / Informational Only)

- Test files (`*.test.ts`, `*.spec.ts`) — security issues in test
  infrastructure are noted but should not block PRs.
- Example scripts under `examples/` — demo code, not production.
- Agent manifests and capability declarations — configuration files, not
  code logic.

## Always Report (Do Not Suppress Even If Matching Above)

- Any hardcoded API key, token, or credential string (even in comments or test
  fixtures).
- Shell command injection where LLM output or tool arguments reach
  `child_process.exec`, `spawn`, or similar without sanitisation.
- Prompt injection where untrusted external data is interpolated directly into
  a system prompt without sanitisation or trust boundaries.
- Supply chain risk: any dynamic `require()` or `import()` where the module
  path is derived from LLM output or external data.
- RCE in any form — especially `eval()`, `Function()`, or dynamic code
  execution fed by agent outputs.
- API key or credential leakage in agent logs or structured outputs.
- Insecure deserialization of agent state or tool results from untrusted
  sources.
