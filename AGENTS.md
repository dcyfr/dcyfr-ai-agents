# AGENTS.md - AI Agent Instructions for @dcyfr/ai-agents

**Project:** @dcyfr/ai-agents - Autonomous Agent Framework Template  
**Purpose:** Public template showcasing DCYFR AI agent capabilities  
**Priority:** P1.1 (AI Differentiator - Build First)

---

## 📌 Project Context

This is a **P1 priority template** that demonstrates DCYFR's core value proposition: autonomous AI agents with tool usage, memory, and observability.

**Key Differentiators:**
- ✅ Complete agent execution loop with multi-step reasoning
- ✅ Type-safe tool system with Zod validation
- ✅ Dual memory system (short-term + long-term persistence)
- ✅ Event-driven observability for monitoring
- ✅ Production-ready with 99%+ test coverage
- ✅ Three example agents (customer service, research, code gen)

---

## 🎯 Architecture Patterns

### Agent Loop Pattern

```typescript
// Agent decision-making loop
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

### Memory Abstraction

Both memory types implement `MemoryStore` interface:
- `save(key, value)` - Store
- `get(key)` - Retrieve
- `delete(key)` - Remove
- ` clear()` - Wipe
- `keys()` - List

### Event System

Observability through events:
- `start` - Agent execution begins
- `step` - Each iteration
- `tool_call` - Before tool execution
- `tool_result` - After tool execution
- `error` - On failures
- `finish` - Execution complete

---

## 🏗️ File Organization

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
  - MemoryStore

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
