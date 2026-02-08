# Security Policy

**@dcyfr/ai-agents** - Autonomous Agent Framework  
**Version:** 0.3.0 (targeting v1.0.0)  
**Last Updated:** February 8, 2026

---

## 🔒 Security Overview

This document outlines the security policy for `@dcyfr/ai-agents`, including vulnerability reporting, security best practices, and agent-specific security considerations.

**Key Security Principles:**
- ✅ **Minimal Dependencies** - Only `zod` in production (regular security audits)
- ✅ **Input Validation** - All tool inputs validated with Zod schemas
- ✅ **Error Isolation** - Tool execution errors contained and logged
- ✅ **No Hardcoded Secrets** - Zero credentials in codebase
- ✅ **TypeScript Strict Mode** - Type safety prevents common vulnerabilities

---

## 📢 Reporting Security Vulnerabilities

### Responsible Disclosure

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly:

**DO NOT** create a public GitHub issue for security vulnerabilities.

### How to Report

**Email:** security@dcyfr.ai

**Include:**
1. **Description** - Detailed explanation of the vulnerability
2. **Impact** - Potential security impact (data exposure, code execution, etc.)
3. **Reproduction** - Step-by-step instructions to reproduce
4. **Proof of Concept** - Code sample demonstrating the issue (if applicable)
5. **Suggested Fix** - Proposed remediation (optional)
6. **Your Contact Info** - For follow-up questions

### Response Timeline

- **24 hours** - Initial acknowledgment of your report
- **72 hours** - Preliminary assessment and severity classification
- **7 days** - Detailed response with remediation plan
- **30 days** - Target for patch release (critical vulnerabilities)
- **90 days** - Public disclosure timeline (coordinated with reporter)

### Bug Bounty

We do not currently offer a paid bug bounty program. Security researchers will receive:
- ✅ Public acknowledgment in release notes (if desired)
- ✅ Recognition in SECURITY.md contributors section
- ✅ Our sincere gratitude for making the ecosystem safer

---

## 🛡️ Security Best Practices

### 1. Tool Input Validation

**ALWAYS** validate tool inputs with Zod schemas to prevent injection attacks:

```typescript
import { z } from 'zod';
import { validators } from '@dcyfr/ai-agents';

// ✅ GOOD: Strict validation
const safeTool: Tool = {
  name: 'database_query',
  description: 'Query database with SELECT only',
  inputSchema: z.object({
    query: z.string()
      .regex(/^SELECT/i, 'Only SELECT queries allowed')
      .max(500, 'Query too long'),
    table: validators.stringEnum(['users', 'orders', 'products']),
  }),
  async execute(input) {
    // Input is validated, but still sanitize
    return await db.query(input.query);
  },
};

// ❌ BAD: No validation
const unsafeTool: Tool = {
  name: 'unsafe_query',
  description: 'Query database',
  inputSchema: z.object({
    query: z.string(), // No constraints!
  }),
  async execute(input) {
    // Vulnerable to SQL injection!
    return await db.query(input.query);
  },
};
```

### 2. Principle of Least Privilege

Give agents only the tools they absolutely need:

```typescript
// ✅ GOOD: Minimal tools
const customerServiceAgent = new Agent({
  name: 'Support',
  description: 'Customer support agent',
  tools: [
    searchKnowledgeBaseTool, // Read-only search
    getCurrentTimeTool,       // Safe utility
  ],
});

// ❌ BAD: Excessive privileges
const dangerousAgent = new Agent({
  name: 'Support',
  description: 'Customer support agent',
  tools: [
    executeDatabaseQuery,  // Direct DB access
    runShellCommand,       // Shell execution
    deleteUserAccount,     // Destructive operation
  ],
});
```

### 3. Sanitize File Paths

Prevent path traversal attacks when working with files:

```typescript
import { validators } from '@dcyfr/ai-agents';
import path from 'node:path';

const readFileTool: Tool = {
  name: 'read_file',
  description: 'Read file contents (restricted to /data directory)',
  inputSchema: z.object({
    filename: validators.filePath,
  }),
  async execute(input) {
    // Resolve to absolute path
    const basePath = '/app/data';
    const fullPath = path.resolve(basePath, input.filename);
    
    // ✅ CRITICAL: Verify path is within allowed directory
    if (!fullPath.startsWith(basePath)) {
      throw new Error('Access denied: Path traversal detected');
    }
    
    return await fs.readFile(fullPath, 'utf-8');
  },
};
```

### 4. Rate Limiting

Prevent abuse by limiting agent execution:

```typescript
import { rateLimit } from 'some-rate-limiter';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});

async function runAgent(userId: string, input: string) {
  // Check rate limit
  if (!limiter.check(userId)) {
    throw new Error('Rate limit exceeded');
  }
  
  const agent = new Agent({
    name: 'Limited Agent',
    description: 'Rate-limited agent',
    tools: [/* tools */],
    maxIterations: 5, // Also limit computation
  });
  
  return await agent.run(input);
}
```

### 5. Secrets Management

**NEVER** hardcode secrets in code or configuration:

```typescript
// ❌ BAD: Hardcoded API key
const apiTool: Tool = {
  name: 'api_call',
  description: 'Call external API',
  inputSchema: z.object({ endpoint: z.string() }),
  async execute(input) {
    const response = await fetch(input.endpoint, {
      headers: {
        'Authorization': 'Bearer sk-1234567890', // NEVER DO THIS!
      },
    });
    return response.json();
  },
};

// ✅ GOOD: Environment variables
const safeTool: Tool = {
  name: 'api_call',
  description: 'Call external API',
  inputSchema: z.object({ endpoint: z.string() }),
  async execute(input) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set');
    }
    
    const response = await fetch(input.endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.json();
  },
};
```

### 6. Output Sanitization

Sanitize agent outputs before displaying to users:

```typescript
function sanitizeOutput(output: string): string {
  // Remove potential PII patterns
  return output
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]')  // SSN
    .replace(/\b\d{16}\b/g, '[CARD NUMBER REDACTED]')      // Credit card
    .replace(/password:\s*\S+/gi, 'password: [REDACTED]'); // Passwords
}

const result = await agent.run(userInput);
const safeOutput = sanitizeOutput(result.output);
console.log(safeOutput);
```

### 7. Monitor Agent Behavior

Log and monitor all agent actions for anomaly detection:

```typescript
const agent = new Agent({
  name: 'Monitored Agent',
  description: 'Production agent with security monitoring',
  tools: [/* tools */],
  listeners: [
    async (event) => {
      // Log all tool calls
      if (event.type === 'tool_call') {
        await securityLog.write({
          timestamp: new Date(),
          userId: currentUser.id,
          tool: event.data.tool,
          input: event.data.input,
        });
      }
      
      // Alert on suspicious patterns
      if (event.type === 'error') {
        if (event.data.error.message.includes('SQL injection')) {
          await securityAlert.send({
            severity: 'critical',
            message: 'Possible SQL injection attempt detected',
            userId: currentUser.id,
          });
        }
      }
    },
  ],
});
```

---

## ⚠️ Agent-Specific Security Considerations

### Tool Execution Risks

**Risk:** Agents can execute arbitrary tools with user-provided input.

**Mitigations:**
1. ✅ **Whitelist allowed tools** - Only register safe, audited tools
2. ✅ **Validate all inputs** - Use strict Zod schemas
3. ✅ **Sandbox tool execution** - Consider Docker containers or VMs for untrusted tools
4. ✅ **Timeout tool execution** - Prevent DoS via long-running operations
5. ✅ **Audit tool usage** - Log all tool calls with inputs

**Example: Sandboxed Tool**
```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const sandboxedTool: Tool = {
  name: 'run_code',
  description: 'Execute Python code in isolated sandbox',
  inputSchema: z.object({
    code: z.string().max(1000),
  }),
  async execute(input) {
    // Run in Docker container with resource limits
    const { stdout, stderr } = await execAsync(
      `docker run --rm --network=none --memory=100m --cpus=0.5 \\
         python:3.11-alpine python -c "${input.code.replace(/"/g, '\\"')}"`
    );
    
    if (stderr) {
      throw new Error(`Execution error: ${stderr}`);
    }
    
    return { output: stdout };
  },
};
```

### Memory Injection Attacks

**Risk:** Malicious users could pollute long-term memory with false information.

**Mitigations:**
1. ✅ **Namespace memory keys** - Use `user:${userId}:key` pattern
2. ✅ **Validate memory values** - Schema validation before saving
3. ✅ **Implement memory quotas** - Limit storage per user
4. ✅ **Audit memory changes** - Log all writes to LongTermMemory
5. ✅ **Periodic memory cleanup** - Remove stale or suspicious entries

**Example: Safe Memory Usage**
```typescript
const memory = new LongTermMemory({
  storagePath: './agent-memory.json',
});

// ✅ Namespaced keys
await memory.save(`user:${userId}:preference`, userPreference);

// ✅ Validation before saving
const preferenceSchema = z.object({
  theme: z.enum(['light', 'dark']),
  language: z.string().length(2),
});

try {
  const validated = preferenceSchema.parse(userPreference);
  await memory.save(`user:${userId}:preference`, validated);
} catch (error) {
  console.error('Invalid preference:', error);
}
```

### Prompt Injection

**Risk:** Users might craft inputs to manipulate agent behavior ("ignore previous instructions").

**Mitigations:**
1. ✅ **Input sanitization** - Remove obvious injection attempts
2. ✅ **Structured prompts** - Use clear delimiters and formatting
3. ✅ **Output validation** - Verify agent outputs match expected format
4. ✅ **Rate limiting** - Prevent brute-force injection attempts
5. ✅ **Human-in-the-loop** - Require approval for sensitive actions

**Example: Input Sanitization**
```typescript
function sanitizeInput(input: string): string {
  // Remove obvious injection patterns
  return input
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:\s*/gi, '')
    .replace(/you are now/gi, '')
    .trim()
    .slice(0, 2000); // Limit length
}

const safeInput = sanitizeInput(userInput);
const result = await agent.run(safeInput);
```

### Denial of Service

**Risk:** Users could trigger infinite loops or resource exhaustion.

**Mitigations:**
1. ✅ **Max iterations limit** - Always set `maxIterations` (default: 10)
2. ✅ **Execution timeouts** - Abort long-running agent executions
3. ✅ **Rate limiting** - Limit requests per user per time window
4. ✅ **Resource monitoring** - Track CPU/memory usage
5. ✅ **Circuit breakers** - Stop accepting requests if system overloaded

**Example: Execution Timeout**
```typescript
async function runWithTimeout(agent: Agent, input: string, timeoutMs: number) {
  return Promise.race([
    agent.run(input),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
    ),
  ]);
}

// 30 second timeout
const result = await runWithTimeout(agent, userInput, 30000);
```

---

## 🔐 Dependency Security

### Production Dependencies

Current production dependencies (audited as of v1.0.0):

| Package | Version | Vulnerabilities | Last Audit |
|---------|---------|----------------|------------|
| `zod` | ^3.22.x | **0 known** | 2026-02-08 |

**Audit Results:**
```bash
npm audit --production
found 0 vulnerabilities
```

### Security Monitoring

We monitor dependencies using:
- ✅ **GitHub Dependabot** - Automated vulnerability scanning
- ✅ **npm audit** - Pre-commit and CI/CD pipeline checks
- ✅ **Snyk** - Continuous monitoring (planned for v1.1.0)
- ✅ **Manual reviews** - Quarterly security audits

### Updating Dependencies

**Process:**
1. Monthly dependency updates (patch versions)
2. Quarterly minor version updates
3. Security patches released within 7 days of disclosure
4. All updates tested with 95%+ test coverage suite

---

## 🚨 Known Security Limitations

### 1. No Built-in LLM Security

This framework provides agent structure but does NOT include:
- ❌ Prompt injection prevention (if integrating with LLMs)
- ❌ Jailbreak detection
- ❌ Content moderation

**Recommendation:** Use external services (OpenAI Moderation API, guardrails libraries) when integrating with LLMs.

### 2. Tool Execution Trust Model

The framework **trusts all registered tools**. It's your responsibility to:
- ✅ Audit all custom tools for security vulnerabilities
- ✅ Validate tool inputs with Zod schemas
- ✅ Sanitize tool outputs before displaying
- ✅ Implement tool-level access control

### 3. File System Access

`LongTermMemory` reads/writes files without additional sandboxing:
- ✅ Use absolute paths with validation
- ✅ Restrict to specific directories
- ✅ Never use user-provided paths directly
- ✅ Implement file size limits

---

## 📜 Security Compliance

### OWASP Top 10 Alignment

| OWASP Risk | Mitigation |
|------------|------------|
| **A01: Broken Access Control** | Tools require explicit registration; implement tool-level auth |
| **A02: Cryptographic Failures** | No crypto in framework; use environment variables for secrets |
| **A03: Injection** | Zod schema validation on all inputs; sanitize outputs |
| **A04: Insecure Design** | Principle of least privilege; fail-secure defaults |
| **A05: Security Misconfiguration** | TypeScript strict mode; minimal dependencies |
| **A06: Vulnerable Components** | Automated dependency scanning; 0 vulnerabilities |
| **A07: Authentication Failures** | Auth is application-level (not framework concern) |
| **A08: Data Integrity Failures** | File-based memory with validation; checksums recommended |
| **A09: Logging Failures** | Event system for comprehensive logging |
| **A10: Server-Side Request Forgery** | URL validation in tool schemas; whitelist domains |

---

## 📞 Contact

**Security Team:** security@dcyfr.ai  
**General Support:** hello@dcyfr.ai  
**Website:** https://www.dcyfr.ai  
**GitHub:** https://github.com/dcyfr/dcyfr-ai-agents

---

## 🏆 Security Acknowledgments

We thank the following security researchers for responsible disclosure:

_No vulnerabilities reported yet (v0.3.0 → 1.0.0)_

---

**Last Updated:** February 8, 2026  
**Next Review:** May 8, 2026 (quarterly)  
**Policy Version:** 1.0
