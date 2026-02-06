# Agent Architecture

This document describes the architecture and design decisions for the @dcyfr/ai-agents framework.

## Core Concepts

### 1. Agent Loop

The agent operates in a continuous decision-making loop:

```
┌─────────────────────────────────────┐
│   Initialize Agent State            │
└───────────┬─────────────────────────┘
            │
            ▼
      ┌─────────────────┐
      │ iterations < max │
      │ AND !finished    │
      └────┬───────┬─────┘
           │ No    │ Yes
           │       ▼
           │  ┌──────────────────┐
           │  │ Make Decision    │
           │  │ (thought + action)│
           │  └───────┬──────────┘
           │          │
           │          ▼
           │     ┌─────────┐
           │     │ Action? │
           │     └─┬────┬──┘
           │    No │    │ Yes
           │       │    ▼
           │       │ ┌──────────────┐
           │       │ │ Execute Tool │
           │       │ └──────┬───────┘
           │       │        │
           │       ▼        ▼
           │    ┌──────────────────┐
           │    │  Update State    │
           │    └────────┬─────────┘
           │             │
           └─────────────┘
                  │
                  ▼
           ┌──────────────┐
           │ Return Result│
           └──────────────┘
```

### 2. State Management

Agent state includes:
- **Iteration count** - Current step number
- **Messages** - Conversation history (system, user, assistant, tool)
- **Steps** - Execution trace with thoughts/actions/observations
- **Finished flag** - Completion status
- **Final output** - Result when complete

### 3. Tool System

Tools provide capabilities to the agent:

**Tool Interface:**
```typescript
{
  name: string;           // Unique identifier
  description: string;     // For LLM understanding
  inputSchema: ZodSchema;  // Input validation
  execute: Function;       // Execution logic
  examples: Example[];     // Few-shot learning (optional)
}
```

**Tool Registry:**
- Central registration
- Category organization
- Name-based lookup
- Bulk operations

**Tool Execution Flow:**
```
Input → Validation (Zod) → Execute → Output
         ↓ (fail)
      Error + Stack
```

### 4. Memory Architecture

**Dual Memory System:**

**Short-Term Memory:**
- In-memory storage (Map)
- LRU eviction policy
- Fast access (<1ms)
- Conversation context
- Recent observations

**Long-Term Memory:**
- File-based persistence (JSON)
- Auto-save capability
- Pattern search (regex)
- Import/export
- Learned knowledge

**Memory Interface:**
```typescript
interface MemoryStore {
  save(key, value): Promise<void>;
  get(key): Promise<unknown | undefined>;
  delete(key): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

### 5. Event System

**Observer Pattern for Observability:**

**Event Types:**
- `start` - Execution begins
- `step` - Each iteration
- `tool_call` - Before tool execution
- `tool_result` - After tool completes
- `error` - On failures
- `finish` - Execution complete

**Use Cases:**
- Logging
- Monitoring
- Debugging
- Metrics collection
- User feedback

### 6. Error Handling

**Multi-Level Error Recovery:**

1. **Tool Level:**
   - Input validation errors (Zod)
   - Execution errors (try-catch)
   - Return error in observation

2. **Step Level:**
   - Catch step errors
   - Store in step.error
   - Emit error event
   - Continue execution

3. **Agent Level:**
   - Catch unhandled errors
   - Return failed result
   - Include error in metadata

**Error Propagation:**
```
Tool Error → Step Error → Continue Execution
            ↓
        Error Event
            ↓
     Event Listeners
            ↓
    Logging/Monitoring
```

## Design Decisions

### Why TypeScript?

- **Type Safety** - Catch errors at compile time
- **IDE Support** - Autocomplete, refactoring
- **Documentation** - Types as documentation
- **Maintainability** - Easier to refactor

### Why Zod for Validation?

- **Runtime safety** - Validates actual data
- **Type inference** - TypeScript types from schemas
- **Composable** - Build complex validations
- **Clear errors** - Helpful error messages

### Why Dual Memory?

- **Performance** - In-memory fast for frequent access
- **Persistence** - File-based preserves across restarts
- **Flexibility** - Choose appropriate storage
- **Simplicity** - Simple interfaces, easy to extend

### Why Event System?

- **Observability** - See what agent is doing
- **Extensibility** - Add monitoring without modifying core
- **Debugging** - Trace execution flow
- **Decoupling** - Separate concerns (execution vs. logging)

### Why No LLM Integration?

This template provides the **framework** without coupling to specific LLM providers:

**Benefits:**
- ✅ Provider-agnostic (OpenAI, Anthropic, local models)
- ✅ Lighter weight (<50KB core)
- ✅ Faster to customize
- ✅ Educational (see structure clearly)

**Integration:**
Users implement `makeDecision()` method with their choice of:
- @dcyfr/ai (recommended)
- OpenAI SDK
- Anthropic SDK
- Local models (Ollama, etc.)

## Performance Considerations

### Agent Loop
- **Iteration overhead:** <10ms per step
- **Tool execution:** Depends on tool implementation
- **State updates:** O(1) operations

### Memory Operations
- **Short-term get/set:** O(1) average, O(n) worst case
- **Long-term get/set:** O(1) in-memory, O(n) persist
- **Long-term search:** O(n) keys

### Event System
- **Event emission:** O(n) listeners (typically 1-3)
- **Async listeners:** Non-blocking

## Scalability

### Horizontal Scaling
- Stateless agent instances
- Shared long-term memory (file lock or database)
- Event aggregation (message queue)

### Vertical Scaling
- Memory limits (short-term max size)
- Iteration limits (max iterations)
- Tool timeouts

## Security Considerations

### Input Validation
- **All tool inputs validated** with Zod
- **Schema enforcement** prevents injection
- **Type checking** catches malformed data

### Tool Execution
- **Sandboxed execution** (up to tool implementer)
- **Timeout support** (future enhancement)
- **Resource limits** (up to tool implementer)

### Memory Access
- **No arbitrary code execution**
- **File path validation** (in long-term memory)
- **Data serialization** (JSON only)

## Testing Strategy

### Unit Tests
- Agent class methods
- Tool registry operations
- Memory implementations
- Individual tools

### Integration Tests
- Agent + tools + memory
- Event system end-to-end
- Example agents

### Coverage Goals
- **99%+ code coverage**
- **All error paths tested**
- **Edge cases covered**

## Future Enhancements

Potential additions (not in P1.1):

1. **Streaming responses** - Real-time output
2. **Parallel tool execution** - Multiple tools simultaneously
3. **Tool composition** - Tools calling tools
4. **Conversation branching** - Explore multiple paths
5. **Vector memory** - Semantic search
6. **Distributed execution** - Multi-agent coordination
7. **Plugin system** - Dynamic tool loading
8. **Web UI** - Visual agent monitoring

---

**Document Version:** 1.0  
**Last Updated:** February 5, 2026  
**Maintained By:** DCYFR Engineering
