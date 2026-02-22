# AGENTS.md - AI Agent Instructions for @dcyfr/ai-agents

**Project:** @dcyfr/ai-agents - Autonomous Agent Framework Template  
**Purpose:** Public template showcasing DCYFR AI agent capabilities  
**Priority:** P1.1 (AI Differentiator - Build First)

**✨ Phase 0 Autonomous Operations:** This project now includes production-ready autonomous operations with AgentRuntime, memory integration, telemetry monitoring, and extensible hook systems.

---

## 📌 Project Context

This is a **P1 priority template** that demonstrates DCYFR's core value proposition: autonomous AI agents with tool usage, memory, and observability.

**Key Differentiators:**
- ✅ **AgentRuntime Orchestration** - Phase 0 autonomous execution with provider fallback
- ✅ **Memory Context Integration** - Automatic retrieval and injection with relevance scoring
- ✅ **Multi-Step Reasoning** - WorkingMemory state management across task steps
- ✅ **Telemetry Monitoring** - SQLite event capture with cost analysis dashboard
- ✅ **Hook System Extensibility** - beforeExecute/afterExecute hooks for custom logic
- ✅ **Provider Fallback** - OpenAI → Anthropic → Ollama graceful degradation
- ✅ **Production-Ready** - 99%+ test coverage with comprehensive E2E validation
- ✅ **Real-World Examples** - Autonomous research agent demonstrating all Phase 0 features

---

## 🎯 Architecture Patterns

### AgentRuntime Pattern (Phase 0)

```typescript
// Autonomous task execution with memory and telemetry
import { AgentRuntime, ProviderRegistry, TelemetryEngine, DCYFRMemory } from '@dcyfr/ai';

const runtime = new AgentRuntime({
  providerRegistry: new ProviderRegistry(),
  memory: new DCYFRMemory({ storage: 'memory' }),
  telemetry: new TelemetryEngine({ storage: 'sqlite' })
});

// Execute task with memory context and telemetry
const result = await runtime.executeTask('Analyze market trends for Q1', {
  timeout: 30000,
  memoryConfig: {
    maxResults: 10,
    minScore: 0.7
  }
});

if (result.success) {
  console.log('Task completed:', result.output);
  console.log('Memory used:', result.memoryRetrievalUsed);
}
```

### Traditional Agent Loop Pattern

```typescript
// Agent decision-making loop (for custom implementations)
while (iteration < maxIterations && !finished) {
  // 1. Decide next action (thought + tool selection)
  const decision = await makeDecision(state);
  
  // 2. Execute tool if action specified
  if (decision.action) {
    const result = await executeTool(decision.action);
    state.observations.push(result);
  }
  
  // 3. Update state and check completion
  state = updateState(decision, result);
}
```

### Dynamic Agent Import Pattern

For optional dependency management:
```typescript
// Dynamic import for graceful degradation
export async function createAutonomousAgent(config: AgentConfig) {
  try {
    const { AgentRuntime, ProviderRegistry } = await import('@dcyfr/ai');
    return new AutonomousAgent(new AgentRuntime(config));
  } catch (error) {
    if (error.message.includes('Cannot resolve module')) {
      console.warn('AgentRuntime not available, using fallback agent');
      return new FallbackAgent(config);
    }
    throw error;
  }
}
```

### Tool Registry Pattern

All tools follow strict interface:
```typescript
interface Tool {
  name: string;                    // Unique identifier
  description: string;              // For LLM context
  inputSchema: z.ZodType;          // Validation
  execute: (input) => Promise<result>;  // Execution
  examples?: ToolExample[];        // Few-shot learning
}
```

### Memory Integration (Phase 0)

**Automatic Context Retrieval:**
```typescript
// Memory automatically retrieved and injected by AgentRuntime
const result = await runtime.executeTask('Explain quantum computing', {
  memoryConfig: {
    maxResults: 15,    // Maximum context entries
    minScore: 0.7,     // Relevance threshold (0.0-1.0)
    enabled: true      // Enable/disable memory retrieval
  }
});

// Memory persistence after successful completion
if (result.success) {
  // AgentRuntime automatically stores successful results
  console.log(`Memory retrieval used: ${result.memoryRetrievalUsed}`);
}
```

**WorkingMemory State Management:**
```typescript
// Cross-step state coordination
const workingMemory = runtime.getWorkingMemory();
workingMemory.set('research-step-1', {
  topic: 'AI ethics',
  findings: ['Transparency', 'Accountability']
});

// Access in subsequent steps
const previousStep = workingMemory.get('research-step-1');
```

### Traditional Memory Abstraction

Both memory types implement `MemoryStore` interface:
- `save(key, value)` - Store
- `get(key)` - Retrieve
- `delete(key)` - Remove
- ` clear()` - Wipe
- `keys()` - List

### Hook System (Phase 0)

**Extensible Before/After Hooks:**
```typescript
// Add custom hooks for validation, logging, monitoring
runtime.addHook('beforeExecute', async (task: string) => {
  console.log(`Starting task: ${task}`);
  
  // Validation hook
  if (task.includes('sensitive')) {
    return { approved: false, reason: 'Sensitive content detected' };
  }
  
  return { approved: true };
});

runtime.addHook('afterExecute', async (task, result, success) => {
  // Custom telemetry
  await customLogger.track({
    task,
    success,
    duration: result.duration,
    timestamp: Date.now()
  });
});
```

### Telemetry Monitoring (Phase 0)

**Event Capture & Analysis:**
```typescript
// All events automatically captured to SQLite
const telemetry = runtime.getTelemetryEngine();
const events = await telemetry.getEvents();

// Dashboard commands
const { TelemetryDashboard } = await import('@dcyfr/ai/cli/telemetry-dashboard');
const dashboard = new TelemetryDashboard();

// Show recent activity
dashboard.showRecentEvents(20);
dashboard.showCostSummary();
dashboard.showProviderSummary();
```

### Traditional Event System

Observability through events:
- `start` - Agent execution begins
- `step` - Each iteration
- `tool_call` - Before tool execution
- `tool_result` - After tool execution
- `error` - On failures
- `finish` - Execution complete

---

## 🏗️ File Organization

### Autonomous Operations Examples (`examples/`)
- **autonomous-research-agent/** - Complete Phase 0 demonstration (600+ lines)
  - Multi-step research pipeline with memory integration
  - Hook system extensions and telemetry monitoring 
  - Provider fallback and configuration management
  - Comprehensive tests and documentation

### Core Implementation (`src/agent/core/`)
- **agent.ts** - Main Agent class (200+ lines)
  - Execution loop
  - State management
  - Event emission
  - Tool coordination

### Tool System (`src/agent/tools/`)
- **registry.ts** - Central tool registry (150+ lines)
- **validators.ts** - Zod validation helpers (100+ lines)
- **examples/** - Built-in tools (calculator, search, time, string manipulation)

### Memory (`src/agent/memory/`)
- **short-term.ts** - In-memory with LRU eviction
- **long-term.ts** - File-based persistence with auto-save

### Types (`src/types/`)
- **index.ts** - All TypeScript interfaces and types
  - AgentConfig, AgentState, AgentResult
  - Tool, ToolExample, ToolContext
  - AgentEvent, AgentEventListener
  - AutonomousAgent interfaces (Phase 0)
  - ResearchConfig, ResearchResult, AgentMetrics
  - MemoryStore

---

## 🚀 Getting Started with Autonomous Operations (Phase 0)

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install @dcyfr/ai

# Optional: Configure LLM providers
export OPENAI_API_KEY=your_openai_key
export ANTHROPIC_API_KEY=your_anthropic_key
# OR install local Ollama for development
```

### Quick Start: Autonomous Research Agent

```bash
# Run the example
cd examples/autonomous-research-agent
npm run demo

# Direct research
npm run demo -- --topic "AI ethics in healthcare"

# Production configuration
npm run demo -- --config production --show-telemetry
```

### Basic Implementation

```typescript
import { createResearchAgent } from './examples/autonomous-research-agent/research-agent';

// Create agent with autonomous operations
const agent = await createResearchAgent({
  providers: ['openai', 'anthropic'],
  memoryEnabled: true,
  telemetryEnabled: true
});

// Conduct autonomous research
const result = await agent.research({
  topic: 'quantum computing applications',
  maxDepth: 3,
  includeRecent: true,
  audienceLevel: 'expert'
});

console.log(result.summary);
console.log(result.findings);
console.log(result.metadata);
```

### Environment Validation

```bash
# Check runtime configuration
npm run validate

# View telemetry dashboard
npm run telemetry

# Alternative CLI commands
npx @dcyfr/ai validate-runtime
npx @dcyfr/ai telemetry --recent 20
```

### Provider Configuration

**OpenAI Setup:**
```bash
export OPENAI_API_KEY=sk-your-key-here
# Supports: gpt-4, gpt-4o, gpt-3.5-turbo
```

**Anthropic Setup:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
# Supports: claude-3-5-sonnet, claude-3-haiku, claude-3-opus
```

**Ollama Setup (Local Development):**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install a model
ollama pull llama2
# OR: ollama pull codellama, qwen2.5, etc.

# Optional: Custom host
export OLLAMA_HOST=localhost:11434
```

### Memory Configuration

```typescript
const config: AgentConfig = {
  memoryEnabled: true,
  memoryConfig: {
    maxResults: 10,     // Maximum context entries (5-25 recommended)
    minScore: 0.7       // Relevance threshold (0.5-0.9 range)
  }
};
```

**Memory Relevance Guidelines:**
- `0.9+`: Only highly relevant context (restrictive)
- `0.7-0.8`: Balanced relevance (recommended)
- `0.5-0.6`: More permissive context (development)
- `<0.5`: Too noisy (not recommended)

### Telemetry Configuration

```typescript
const config: AgentConfig = {
  telemetryEnabled: true,
  // SQLite database automatically created at ~/.dcyfr/telemetry.db
};

// View telemetry dashboard
const { TelemetryDashboard } = await import('@dcyfr/ai/cli/telemetry-dashboard');
const dashboard = new TelemetryDashboard();

// Show metrics
dashboard.showRecentEvents(10);
dashboard.showCostSummary();
dashboard.showProviderSummary();
```

**Telemetry Data Captured:**
- Task execution events (start/finish/error)
- Memory retrieval events (context found/relevant/duration)
- Provider usage (API calls/costs/response times)
- Hook execution (before/after timing)
- Working memory state changes

### Troubleshooting Common Issues

**"Cannot resolve module @dcyfr/ai"**
```bash
# Install from workspace root
cd ../../  # Navigate to dcyfr-ai-agents root
npm install
```

**"Provider not available"**
```bash
# Check API keys
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Validate configuration
npx @dcyfr/ai validate-runtime
```

**"Research timeout"**
```bash
# Reduce complexity
npm run demo -- --max-depth 2

# Use local providers for development
npm run demo -- --config budget  # Ollama only
```

**"Memory retrieval failed"**
```bash
# Lower relevance threshold
npm run demo -- --config development  # minScore: 0.6

# Check memory configuration in config.ts
```

**High API Costs:**
```typescript
// Use budget configuration
const budgetConfig = {
  providers: ['ollama'],  // Local only
  memoryConfig: {
    maxResults: 5,        // Reduce context
    minScore: 0.8        // Higher relevance
  }
};
```

---

## 🧪 Testing Strategy

### Unit Tests (99%+ coverage target)
- **agent.test.ts** - Agent class behavior
- **tool-registry.test.ts** - Registry operations
- **tools.test.ts** - Example tool functionality
- **memory.test.ts** - Both memory implementations

### Test Patterns

**1. Tool Testing:**
```typescript
it('should validate and execute tool', async () => {
  const result = await tool.execute({ valid: 'input' });
  expect(result).toBeDefined();
});

it('should throw on invalid input', async () => {
  await expect(tool.execute({ invalid })).rejects.toThrow();
});
```

**2. Memory Testing:**
```typescript
it('should persist and reload data', async () => {
  await memory.save('key', 'value');
  await memory.persist();
  
  const newMemory = new LongTermMemory({ path });
  await newMemory.load();
  expect(await newMemory.get('key')).toBe('value');
});
```

---

## 📝 Code Quality Standards

### TypeScript Strictness
- ✅ `strict: true`
- ✅ No `any` types
- ✅ Explicit return types on all functions
- ✅ Proper interface/type usage

### Module Exports
- ✅ Barrel exports (`index.ts` per directory)
- ✅ Named exports only (no default exports)
- ✅ Re-export types from core modules

### Error Handling
- ✅ Try-catch in async functions
- ✅ Meaningful error messages
- ✅ Error events emitted
- ✅ Graceful degradation

---

## 🚀 Example Guidelines

### Example Requirements
Each example should:
1. **Be self-contained** - Runnable with `npm run example:*`
2. **Demonstrate features** - Show specific capabilities
3. **Include logging** - Use event listeners for visibility
4. **Have clear narrative** - Console output tells a story

### Example Structure
```typescript
// 1. Setup with clear purpose
console.log('🤖 [Example Type] Example\n');

// 2. Configure agent
const agent = new Agent({
  name: 'Descriptive Name',
  description: 'What it does',
  tools: [relevantTools],
  memory: appropriateMemory,
  listeners: [loggingListener],
});

// 3. Execute with context
console.log(`Query: ${query}\n`);
const result = await agent.run(query);

// 4. Display results
console.log('Results:', result);
```

---

## 🎨 Design Principles

### 1. Type Safety First
Every public API has strict TypeScript types. No runtime surprises.

### 2. Composability
- Tools are independent
- Memory is pluggable
- Events are observable
- Agent is extensible

### 3. Developer Experience
- Clear error messages
- Helpful examples
- Comprehensive docs
- Intuitive APIs

### 4. Production Ready
- Full test coverage
- Error recovery
- Performance monitoring (via events)
- Memory management

---

## 🔧 Extension Points

### Custom Tools
```typescript
// Create tool following interface
const customTool: Tool<Input, Output> = {
  name: 'unique_name',
  description: 'Clear description for agent',
  inputSchema: z.object({ /* validation */ }),
  async execute(input) {
    // Implementation
    return output;
  },
};

// Register with agent
agent.registerTool(customTool);
```

### Custom Memory
```typescript
// Implement MemoryStore interface
class CustomMemory implements MemoryStore {
  async save(key: string, value: unknown): Promise<void> { /* */ }
  async get(key: string): Promise<unknown | undefined> { /* */ }
  async delete(key: string): Promise<void> { /* */ }
  async clear(): Promise<void> { /* */ }
  async keys(): Promise<string[]> { /* */ }
}
```

### Event Listeners
```typescript
const monitoringListener: AgentEventListener = async (event) => {
  switch (event.type) {
    case 'start':
      await logToMonitoring('agent_start', event.data);
      break;
    case 'error':
      await alertOnError(event.data.error);
      break;
  }
};

agent.listeners.push(monitoringListener);
```

---

## 📊 Success Metrics

- ✅ **Test Coverage:** 99%+ (all core functionality)
- ✅ **Type Safety:** 100% (no `any`, strict mode)
- ✅ **Examples:** 3 working examples (customer service, research, code gen)
- ✅ **Documentation:** Complete README + CONTRIBUTING + API docs
- ✅ **Performance:** <100ms agent overhead per iteration
- ✅ **Bundle Size:** <50KB minified (core framework only)

---

## 🤖 AI Agent Collaboration

When working on this template:

**Primary Agent:** ai-architect  
Designs agent loop, tool patterns, memory architecture

**Supporting Agents:**
- **typescript-expert** - Strict typing, interfaces, generics
- **testing-strategist** - Test patterns, 99%+ coverage
- **documentation-writer** - README, examples, API docs
- **security-specialist** - Input validation, tool safety

**Coordination Pattern:**
1. ai-architect designs core agent loop
2. typescript-expert implements type-safe interfaces
3. testing-strategist creates comprehensive tests
4. documentation-writer documents patterns and examples
5. security-specialist validates tool input handling

---

## 🔍 Quality Checkpoints

Before considering P1.1 complete:

- [ ] Agent loop executes multi-step workflows
- [ ] Tool registry validates and executes tools
- [ ] Short-term memory works with LRU eviction
- [ ] Long-term memory persists to disk
- [ ] Event system emits all event types
- [ ] All 4 example tools function correctly
- [ ] 3 example agents run successfully
- [ ] Tests pass at 99%+ coverage
- [ ] TypeScript compiles with no errors
- [ ] README has clear quick start
- [ ] CONTRIBUTING.md has dev setup

---

**Last Updated:** February 5, 2026  
**Status:** ✅ Implemented (P1.1 Complete)  
**Next:** P1.2 dcyfr-ai-rag (RAG systems)

## Quality Gates
- TypeScript: 0 errors (`npm run typecheck`)
- Tests: ≥99% pass rate (`npm run test`)
- Lint: 0 errors (`npm run lint`)
