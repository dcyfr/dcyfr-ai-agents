# @dcyfr/ai-agents API Reference

**Version:** 0.3.0 (targeting v1.0.0)  
**Last Updated:** February 8, 2026

Comprehensive API documentation for the `@dcyfr/ai-agents` autonomous agent framework.

---

## Table of Contents

1. [Installation](#installation)
2. [Core Concepts](#core-concepts)
3. [Agent](#agent)
4. [Tools](#tools)
5. [Memory](#memory)
6. [Types](#types)
7. [Validators](#validators)
8. [Examples](#examples)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Migration Guide](#migration-guide)

---

## Installation

```bash
npm install @dcyfr/ai-agents
```

**Requirements:**
- Node.js ≥ 20.0.0
- TypeScript ≥ 5.3 (for type safety)

**Peer Dependencies:**
-  `zod` (automatically installed) - Schema validation

---

## Core Concepts

### Agent Loop

The agent operates in a thought → action → observation loop:

1. **Thought**: Agent analyzes the current state and decides next action
2. **Action**: If needed, agent selects and executes a tool
3. **Observation**: Tool result is added to agent's context
4. **Repeat** until task complete or max iterations reached

### Tools

Functions the agent can call with:
- **Type-safe inputs** validated with Zod schemas
- **Async execution** supporting any operation (API calls, file I/O, calculations)
- **Automatic error handling** with graceful degradation

### Memory

Persistent storage for agent knowledge:
- **Short-term**: In-memory, FIFO eviction, perfect for conversation history
- **Long-term**: File-based, auto-save, perfect for learned patterns and facts

### Events

Real-time notifications of agent activity:
- `start` - Agent begins execution
- `step` - Each iteration of the agent loop
- `tool_call` - Before a tool is executed
- `tool_result` - After a tool returns
- `error` - When an error occurs
- `finish` - Agent completes execution

---

## Agent

The core `Agent` class orchestrates autonomous execution with tools and memory.

### Constructor

```typescript
import { Agent } from '@dcyfr/ai-agents';

const agent = new Agent(options: AgentOptions);
```

#### AgentOptions

```typescript
interface AgentOptions {
  /** Agent name (used in system prompt) */
  name: string;
  
  /** Agent description (used in system prompt) */
  description: string;
  
  /** Maximum number of iterations before stopping (default: 10) */
  maxIterations?: number;
  
  /** Temperature for decision-making (0.0-1.0, default: 0.7) */
  temperature?: number;
  
  /** Enable verbose logging to console (default: false) */
  verbose?: boolean;
  
  /** Custom system prompt (auto-generated if not provided) */
  systemPrompt?: string;
  
  /** Tools available to the agent */
  tools?: Tool[];
  
  /** Memory store for persistence */
  memory?: MemoryStore;
  
  /** Event listeners for monitoring */
  listeners?: AgentEventListener[];
}
```

#### Example

```typescript
import { Agent, calculatorTool, ShortTermMemory } from '@dcyfr/ai-agents';

const agent = new Agent({
  name: 'MathBot',
  description: 'Helpful mathematics assistant',
  maxIterations: 5,
  temperature: 0.3, // Lower for more deterministic behavior
  verbose: true, // Log tool executions to console
  tools: [calculatorTool],
  memory: new ShortTermMemory(50),
});
```

### Methods

#### `registerTool(tool: Tool): void`

Add a tool to the agent's available tools.

```typescript
import { searchTool } from '@dcyfr/ai-agents';

agent.registerTool(searchTool);
```

**Note:** Tools can also be provided in constructor via `tools` option.

#### `run(input: string): Promise<AgentResult>`

Execute the agent with a given input string.

```typescript
const result = await agent.run('Calculate 15 * 23');

console.log(result.output); // Final answer
console.log(result.success); // true if completed without errors
console.log(result.iterations); // Number of steps taken
console.log(result.steps); // Detailed step-by-step execution
```

**Returns:** `AgentResult`

```typescript
interface AgentResult {
  /** Final output from the agent */
  output: string;
  
  /** All execution steps */
  steps: AgentStep[];
  
  /** Number of iterations completed */
  iterations: number;
  
  /** Whether execution succeeded */
  success: boolean;
  
  /** Error if execution failed */
  error?: Error;
  
  /** Execution metadata */
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number; // milliseconds
  };
}
```

#### `getState(): AgentState`

Get the current execution state.

```typescript
const state = agent.getState();

console.log(state.messages); // Conversation history
console.log(state.iteration); // Current iteration number
console.log(state.isFinished); // Whether agent has finished
```

**Returns:** `AgentState`

```typescript
interface AgentState {
  /** Current iteration number */
  iteration: number;
  
  /** Conversation message history */
  messages: AgentMessage[];
  
  /** Execution steps taken */
  steps: AgentStep[];
  
  /** Whether agent has finished */
  isFinished: boolean;
  
  /** Final output (if finished) */
  finalOutput?: string;
}
```

#### `reset(): void`

Reset agent to initial state (clears messages and steps).

```typescript
agent.reset();
const newResult = await agent.run('New task');
```

**Note:** This does NOT clear memory - use `memory.clear()` for that.

### Events

Subscribe to agent events for monitoring and debugging.

```typescript
const agent = new Agent({
  name: 'EventAgent',
  description: 'Agent with event tracking',
  listeners: [
    async (event: AgentEvent) => {
      console.log(`[${event.type}]`, event.data);
      
      switch (event.type) {
        case 'start':
          console.log('Starting:', event.data.input);
          break;
        case 'tool_call':
          console.log('Calling:', event.data.tool);
          break;
        case 'tool_result':
          console.log('Result:', event.data.output);
          break;
        case 'error':
          console.error('Error:', event.data.error);
          break;
        case 'finish':
          console.log('Done in', event.data.iterations, 'steps');
          break;
      }
    },
  ],
});
```

#### Event Types

```typescript
type AgentEventType =
  | 'start'    // Agent execution begins
  | 'step'     // Each iteration of the loop
  | 'tool_call'    // Before tool execution
  | 'tool_result'  // After tool execution
  | 'error'    // Error occurred
  | 'finish';  // Agent execution complete

interface AgentEvent {
  type: AgentEventType;
  data: unknown; // Type depends on event type
  timestamp: Date;
}
```

---

## Tools

Tools are functions the agent can call to interact with external systems.

### Tool Interface

```typescript
interface Tool<TInput = unknown, TOutput = unknown> {
  /** Unique tool name (used by agent to select tool) */
  name: string;
  
  /** Description for the agent (how and when to use this tool) */
  description: string;
  
  /** Zod schema for input validation */
  inputSchema: z.ZodType<TInput>;
  
  /** Execute the tool with validated input */
  execute: (input: TInput, context?: ToolContext) => Promise<TOutput> | TOutput;
  
  /** Optional usage examples for documentation */
  examples?: ToolExample<TInput, TOutput>[];
}
```

### Creating Custom Tools

#### Basic Tool

```typescript
import { z } from 'zod';
import type { Tool } from '@dcyfr/ai-agents';

const weatherTool: Tool<
  { location: string; units?: 'celsius' | 'fahrenheit' },
  { temperature: number; conditions: string }
> = {
  name: 'get_weather',
  description: 'Get current weather for a location. Use this when user asks about weather conditions.',
  inputSchema: z.object({
    location: z.string().min(1, 'Location is required'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  async execute(input) {
    // Call weather API (pseudo-code)
    const response = await fetch(`https://api.weather.com/${input.location}`);
    const data = await response.json();
    
    return {
      temperature: data.temp,
      conditions: data.conditions,
    };
  },
  examples: [
    {
      input: { location: 'San Francisco', units: 'fahrenheit' },
      output: { temperature: 68, conditions: 'Partly cloudy' },
      description: 'Get weather in Fahrenheit',
    },
  ],
};
```

#### Tool with Error Handling

```typescript
const safeDatabaseTool: Tool<{ query: string }, { rows: unknown[] }> = {
  name: 'query_database',
  description: 'Execute a safe SELECT query on the database',
  inputSchema: z.object({
    query: z.string().regex(/^SELECT/i, 'Only SELECT queries allowed'),
  }),
  async execute(input) {
    try {
      const rows = await database.query(input.query);
      return { rows };
    } catch (error) {
      // Errors are automatically caught by Agent and added to step.error
      // Re-throw to let agent handle it
      throw new Error(`Database error: ${error.message}`);
    }
  },
};
```

### Built-in Tools

#### calculatorTool

Perform basic arithmetic operations.

```typescript
import { calculatorTool } from '@dcyfr/ai-agents';

// Input: { operation: 'add' | 'subtract' | 'multiply' | 'divide', a: number, b: number }
// Output: number

const result = await calculatorTool.execute({
  operation: 'multiply',
  a: 15,
  b: 23,
}); // Returns: 345
```

#### searchTool

Simulate web search (placeholder implementation).

```typescript
import { searchTool } from '@dcyfr/ai-agents';

// Input: { query: string, limit?: number }
// Output: { results: Array<{ title: string, snippet: string, url: string }> }

const result = await searchTool.execute({
  query: 'AI agent frameworks',
  limit: 5,
});
```

#### getCurrentTimeTool

Get current timestamp.

```typescript
import { getCurrentTimeTool } from '@dcyfr/ai-agents';

// Input: { format?: 'iso' | 'timestamp' | 'locale' }
// Output: { time: string | number, timezone: string }

const result = await getCurrentTimeTool.execute({
  format: 'iso',
}); // Returns: { time: '2026-02-08T00:45:00.000Z', timezone: 'UTC' }
```

#### stringManipulationTool

String operations (uppercase, lowercase, reverse, trim).

```typescript
import { stringManipulationTool } from '@dcyfr/ai-agents';

// Input: { text: string, operation: 'uppercase' | 'lowercase' | 'reverse' | 'trim' }
// Output: string

const result = await stringManipulationTool.execute({
  text: '  Hello World  ',
  operation: 'trim',
}); // Returns: 'Hello World'
```

### Tool Registry

Manage collections of tools.

```typescript
import { ToolRegistry } from '@dcyfr/ai-agents';

const registry = new ToolRegistry();

// Register tools
registry.register(calculatorTool, 'math');
registry.register(searchTool, 'web');

// Get by name
const tool = registry.get('calculator');

// Execute directly
const result = await registry.execute('calculator', {
  operation: 'add',
  a: 5,
  b: 3,
});

// Get all tools
const allTools = registry.getAll();

// Get by category
const mathTools = registry.getByCategory('math');

// Unregister
registry.unregister('search');
```

#### Global Registry

A singleton registry for sharing tools across agents.

```typescript
import { globalRegistry } from '@dcyfr/ai-agents';

globalRegistry.register(myCustomTool);

const agent = new Agent({
  name: 'Agent',
  description: 'Uses global tools',
  tools: globalRegistry.getAll(),
});
```

---

## Memory

Persistent storage for agent knowledge and conversation history.

### ShortTermMemory

In-memory storage with FIFO eviction when max size reached.

#### Constructor

```typescript
import { ShortTermMemory } from '@dcyfr/ai-agents';

const memory = new ShortTermMemory(maxSize?: number);
```

**Parameters:**
- `maxSize` (optional): Maximum number of entries (default: 100)

#### Methods

```typescript
// Save a value
await memory.save('user:name', 'Alice');

// Retrieve a value
const name = await memory.get('user:name'); // 'Alice'

// Delete a value
await memory.delete('user:name');

// Clear all data
await memory.clear();

// Get all keys
const keys = await memory.keys(); // ['key1', 'key2', ...]

// Get recent entries
const recent = await memory.getRecent(5); // Last 5 entries

// Get size
const size = memory.size(); // Number of entries
```

#### Example

```typescript
const conversationMemory = new ShortTermMemory(20); // Last 20 messages

await conversationMemory.save('msg:1', { role: 'user', content: 'Hello' });
await conversationMemory.save('msg:2', { role: 'assistant', content: 'Hi!' });

const recent = await conversationMemory.getRecent(2);
console.log(recent);
// [
//   { key: 'msg:1', value: { role: 'user', content: 'Hello' } },
//   { key: 'msg:2', value: { role: 'assistant', content: 'Hi!' } }
// ]
```

### LongTermMemory

File-based persistent storage with auto-save support.

#### Constructor

```typescript
import { LongTermMemory } from '@dcyfr/ai-agents';

const memory = new LongTermMemory(options: LongTermMemoryOptions);
```

```typescript
interface LongTermMemoryOptions {
  /** Path to JSON storage file */
  storagePath: string;
  
  /** Auto-save interval in milliseconds (0 to disable, default: 0) */
  autoSaveInterval?: number;
}
```

#### Methods

```typescript
// Load from disk
await memory.load();

// Save a value (marks as dirty)
await memory.save('learned:fact', 'The sky is blue');

// Persist to disk
await memory.persist();

// Get value
const fact = await memory.get('learned:fact');

// Search by pattern
const userKeys = await memory.search(/^user:/);

// Get all entries
const all = await memory.getAll();

// Import data
await memory.import({
  'key1': 'value1',
  'key2': 'value2',
});

// Export data
const exported = await memory.export();

// Clean up (saves if dirty)
await memory.dispose();

// Get statistics
const stats = memory.getStats();
// { totalEntries: 10, isDirty: false, storagePath: './memory.json' }
```

#### Example with Auto-Save

```typescript
const knowledge = new LongTermMemory({
  storagePath: './agent-knowledge.json',
  autoSaveInterval: 5000, // Save every 5 seconds if dirty
});

// Load existing knowledge
await knowledge.load();

// Add new fact
await knowledge.save('learned:today', {
  date: new Date(),
  fact: 'User prefers dark mode',
});

// Auto-save will persist in 5 seconds
// Or manually persist immediately
await knowledge.persist();

// Clean up on shutdown
await knowledge.dispose(); // Saves if dirty before cleanup
```

### MemoryStore Interface

Both `ShortTermMemory` and `LongTermMemory` implement the `MemoryStore` interface:

```typescript
interface MemoryStore {
  save(key: string, value: unknown): Promise<void>;
  get(key: string): Promise<unknown | undefined>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

You can implement custom memory stores (Redis, database, etc.) by implementing this interface.

---

## Types

### AgentMessage

Messages in the agent's conversation history.

```typescript
interface AgentMessage {
  /** Message role */
  role: 'system' | 'user' | 'assistant' | 'tool';
  
  /** Message content */
  content: string;
  
  /** Timestamp when message was created */
  timestamp: Date;
  
  /** Tool name (only for role: 'tool') */
  name?: string;
}
```

### AgentStep

A single step in the agent's execution.

```typescript
interface AgentStep {
  /** Step number */
  iteration: number;
  
  /** Agent's thought process */
  thought: string;
  
  /** Action taken (if any) */
  action?: {
    tool: string;
    input: unknown;
  };
  
  /** Observation from tool execution */
  observation?: unknown;
  
  /** Error if step failed */
  error?: Error;
  
  /** Step timestamp */
  timestamp: Date;
}
```

### ToolExample

Example usage for documentation.

```typescript
interface ToolExample<TInput = unknown, TOutput = unknown> {
  /** Example input */
  input: TInput;
  
  /** Expected output */
  output: TOutput;
  
  /** Description of what this example demonstrates */
  description?: string;
}
```

### ToolContext

Optional context passed to tool execution.

```typescript
interface ToolContext {
  /** Agent that's executing the tool */
  agent?: Agent;
  
  /** Current agent state */
  state?: AgentState;
  
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}
```

---

## Validators

Input validation utilities using Zod.

### Validator Schemas

Pre-built Zod schemas for common types.

```typescript
import { validators } from '@dcyfr/ai-agents';

// String validators
validators.nonEmptyString      // z.string().min(1)
validators.email               // Email format
validators.url                 // URL format
validators.dateString          // ISO 8601 datetime

// Number validators
validators.positiveInt         // Positive integers only
validators.nonNegativeInt      // Zero or positive integers
validators.probability         // 0.0 to 1.0

// File validators
validators.filePath            // Valid file path characters

// JSON validator
validators.jsonString          // Valid JSON string

// Factory functions
validators.limitedString(100)        // Max length 100
validators.boundedArray(1, 10, schema) // 1-10 items
validators.stringEnum(['a', 'b'])    // Enumvalues
validators.record('string', 'number')   // Key-value type validation
```

### Common Input Schemas

Ready-to-use input schemas for typical tool patterns.

```typescript
import { commonInputSchemas } from '@dcyfr/ai-agents';

// Text input with required content
const schema1 = commonInputSchemas.textInput;
// { text: string }

// Search/query with pagination
const schema2 = commonInputSchemas.queryInput;
// { query: string, limit?: number, offset?: number }

// File operations
const schema3 = commonInputSchemas.fileInput;
// { path: string, encoding?: 'utf8' | 'ascii' | 'base64' }

// API requests
const schema4 = commonInputSchemas.apiRequestInput;
// { url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', headers?: object, body?: unknown }

// Search with filters
const schema5 = commonInputSchemas.searchInput;
// { query: string, filters?: object, limit?: number }

// ID-based lookups
const schema6 = commonInputSchemas.idInput;
// { id: string }
```

### validateToolInput Decorator

Automatically validate tool inputs.

```typescript
import { validateToolInput, validators } from '@dcyfr/ai-agents';
import { z } from 'zod';

class MyTools {
  @validateToolInput(z.object({
    query: validators.nonEmptyString,
    limit: validators.positiveInt,
  }))
  async search(input: { query: string; limit: number }) {
    // Input is guaranteed to be valid here
    return results;
  }
}
```

---

## Examples

### Complete Customer Service Agent

```typescript
import {
  Agent,
  searchTool,
  getCurrentTimeTool,
  ShortTermMemory,
  type AgentResult,
} from '@dcyfr/ai-agents';

async function runCustomerService() {
  const memory = new ShortTermMemory(50);
  
  const agent = new Agent({
    name: 'Customer Support Agent',
    description: 'Helpful customer service assistant for e-commerce',
    maxIterations: 10,
    temperature: 0.5,
    verbose: true,
    tools: [searchTool, getCurrentTimeTool],
    memory,
    listeners: [
      async (event) => {
        if (event.type === 'tool_call') {
          console.log(`🔧 Calling tool: ${event.data.tool}`);
        }
      },
    ],
  });

  const queries = [
    'What time is it?',
    'Search for information about order tracking',
    'Help me find my order #12345',
  ];

  for (const query of queries) {
    console.log(`\n👤 User: ${query}`);
    const result: AgentResult = await agent.run(query);
    console.log(`🤖 Agent: ${result.output}`);
    console.log(`📊 Steps: ${result.iterations}, Success: ${result.success}`);
  }
}

runCustomerService();
```

### Research Agent with Long-Term Memory

```typescript
import {
  Agent,
  searchTool,
  calculatorTool,
  LongTermMemory,
} from '@dcyfr/ai-agents';

async function runResearcher() {
  const knowledge = new LongTermMemory({
    storagePath: './research-knowledge.json',
    autoSaveInterval: 10000, // Save every 10 seconds
  });

  await knowledge.load();

  const agent = new Agent({
    name: 'Research Assistant',
    description: 'AI researcher that gathers and analyzes information',
    tools: [searchTool, calculatorTool],
    memory: knowledge,
    maxIterations: 15,
  });

  const result = await agent.run(
    'Research the current state of autonomous AI agents and calculate the market size'
  );

  console.log('Research findings:', result.output);
  console.log('Execution details:', result.steps);

  // Save accumulated knowledge
  await knowledge.persist();
  await knowledge.dispose();
}

runResearcher();
```

### Custom Tool Integration

```typescript
import { Agent, type Tool } from '@dcyfr/ai-agents';
import { z } from 'zod';

// Create a GitHub API tool
const githubTool: Tool<
  { owner: string; repo: string },
  { stars: number; forks: number; issues: number }
> = {
  name: 'github_stats',
  description: 'Get GitHub repository statistics (stars, forks, issues)',
  inputSchema: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
  }),
  async execute(input) {
    const response = await fetch(
      `https://api.github.com/repos/${input.owner}/${input.repo}`
    );
    const data = await response.json();
    
    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      issues: data.open_issues_count,
    };
  },
  examples: [
    {
      input: { owner: 'microsoft', repo: 'vscode' },
      output: { stars: 150000, forks: 27000, issues: 6000 },
      description: 'Get VS Code repository stats',
    },
  ],
};

// Use in agent
const agent = new Agent({
  name: 'GitHub Analyst',
  description: 'Analyzes GitHub repositories',
  tools: [githubTool],
});

const result = await agent.run(
  'Get stats for the dcyfr/dcyfr-ai-agents repository'
);
```

---

## Error Handling

### Tool Execution Errors

Errors thrown during tool execution are automatically caught and added to the step:

```typescript
const flakyTool: Tool = {
  name: 'flaky',
  description: 'Tool that might fail',
  inputSchema: z.object({}),
  async execute() {
    if (Math.random() < 0.5) {
      throw new Error('Service unavailable');
    }
    return { success: true };
  },
};

const agent = new Agent({
  name: 'Resilient Agent',
  description: 'Handles errors gracefully',
  tools: [flakyTool],
});

const result = await agent.run('Try the flaky tool');

if (!result.success) {
  console.error('Agent failed:', result.error);
  
  // Check individual steps for errors
  result.steps.forEach((step, i) => {
    if (step.error) {
      console.error(`Step ${i} failed:`, step.error.message);
    }
  });
}
```

### Global Error Handling

```typescript
const agent = new Agent({
  name: 'Monitored Agent',
  description: 'Agent with error monitoring',
  tools: [/* tools */],
  listeners: [
    async (event) => {
      if (event.type === 'error') {
        // Log to monitoring service
        await logError(event.data.error, event.data.step);
      }
    },
  ],
});

try {
  const result = await agent.run(input);
  
  if (!result.success) {
    // Handle agent-level failure
    notifyAdmin(result.error);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

---

## Best Practices

### 1. Choose Appropriate Max Iterations

```typescript
// Quick tasks: 3-5 iterations
const quickAgent = new Agent({
  name: 'Quick',
  description: 'Simple calculations',
  maxIterations: 3,
  tools: [calculatorTool],
});

// Complex tasks: 10-20 iterations
const complexAgent = new Agent({
  name: 'Complex',
  description: 'Multi-step research and analysis',
  maxIterations: 15,
  tools: [searchTool, calculatorTool, databaseTool],
});
```

### 2. Use Appropriate Memory Type

```typescript
// For conversations: ShortTermMemory
const chatAgent = new Agent({
  name: 'ChatBot',
  description: 'Conversational assistant',
  memory: new ShortTermMemory(30), // Last 30 messages
});

// For learning: LongTermMemory with auto-save
const learningAgent = new Agent({
  name: 'Learner',
  description: 'Learns user preferences',
  memory: new LongTermMemory({
    storagePath: './preferences.json',
    autoSaveInterval: 5000,
  }),
});
```

### 3. Provide Clear Tool Descriptions

```typescript
// ❌ Bad: Vague description
const badTool: Tool = {
  name: 'search',
  description: 'Searches stuff',
  // ...
};

// ✅ Good: Clear, specific description
const goodTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information about a topic. Returns top 5 results with titles, snippets, and URLs. Use this when the user asks for information you don\'t have.',
  // ...
};
```

### 4. Validate All Tool Inputs

```typescript
import { validators, commonInputSchemas } from '@dcyfr/ai-agents';

const safeTool: Tool = {
  name: 'database_query',
  description: 'Query the database',
  inputSchema: z.object({
    query: z.string()
      .regex(/^SELECT/i, 'Only SELECT queries allowed')
      .max(500, 'Query too long'),
    limit: validators.positiveInt.max(100),
  }),
  async execute(input) {
    // Input is guaranteed valid
    return await db.query(input.query, input.limit);
  },
};
```

### 5. Monitor Agent Behavior

```typescript
const agent = new Agent({
  name: 'Monitored Agent',
  description: 'Production agent',
  listeners: [
    async (event) => {
      // Log all events to monitoring service
      await monitoring.log({
        type: event.type,
        timestamp: event.timestamp,
        data: event.data,
      });
      
      // Alert on errors
      if (event.type === 'error') {
        await alerting.send({
          severity: 'error',
          message: event.data.error.message,
        });
      }
      
      // Track tool usage
      if (event.type === 'tool_call') {
        await analytics.track('tool_call', {
          tool: event.data.tool,
        });
      }
    },
  ],
});
```

### 6. Handle Async Cleanup

```typescript
async function runAgent() {
  const memory = new LongTermMemory({
    storagePath: './agent.json',
    autoSaveInterval: 5000,
  });

  try {
    await memory.load();
    
    const agent = new Agent({
      name: 'Agent',
      description: 'Does stuff',
      memory,
    });

    const result = await agent.run(input);
    return result;
  } finally {
    // Always clean up
    await memory.dispose(); // Saves dirty data before cleanup
  }
}
```

---

## Migration Guide

### From v0.2.x to v1.0.0

#### Breaking Changes

**None** - v1.0.0 is the first stable release. All APIs are considered stable.

#### New Features

- ✅ Production-ready with 95%+ test coverage
- ✅ Comprehensive API documentation
- ✅ Security audit passed (0 vulnerabilities)
- ✅ TypeScript strict mode
- ✅ Event system for monitoring
- ✅ Dual memory architecture

#### Deprecations

**None** - All current APIs are stable and supported.

### Future Compatibility

**Semantic Versioning Commitment:**

- **Patch releases (1.0.x)**: Bug fixes only, 100% backward compatible
- **Minor releases (1.x.0)**: New features, backward compatible, no breaking changes
- **Major releases (2.0.0)**: Breaking changes allowed

**Deprecation Policy:**

- Deprecated features will be marked `@deprecated` in TypeScript
- Minimum 6 months warning before removal
- Migration guides provided for all breaking changes
- Deprecated features continue to work until next major version

**Example:**

```typescript
// If we deprecate a feature in v1.5.0...
/**
 * @deprecated Use newMethod() instead. Will be removed in v2.0.0
 */
function oldMethod() {
  // Still works, but with TypeScript warning
}

// You have until v2.0.0 to migrate (minimum 6 months)
```

---

## API Stability Guarantees

As of v1.0.0, the following APIs are considered **STABLE** and will not have breaking changes in minor/patch releases:

### Core Stable APIs

- ✅ `Agent` class and constructor
- ✅ `Agent.run()`, `Agent.registerTool()`, `Agent.getState()`, `Agent.reset()`
- ✅ `Tool` interface
- ✅ `MemoryStore` interface
- ✅ `ShortTermMemory` class
- ✅ `LongTermMemory` class
- ✅ `ToolRegistry` class
- ✅ All validator schemas
- ✅ All common input schemas
- ✅ All built-in tools (calculator, search, time, string manipulation)
- ✅ All TypeScript types (AgentOptions, AgentResult, AgentState, AgentStep, etc.)
- ✅ Event system (`AgentEvent`, `AgentEventListener`)

### Experimental APIs

**None** - All current APIs are stable.

---

## Support

- 📧 **Email**: hello@dcyfr.ai
- 🌐 **Website**: https://www.dcyfr.ai
- 🐙 **GitHub**: https://github.com/dcyfr/dcyfr-ai-agents
- 💬 **Discussions**: https://github.com/dcyfr/dcyfr-ai-agents/discussions
- 🐛 **Issues**: https://github.com/dcyfr/dcyfr-ai-agents/issues

---

**Last Updated:** February 8, 2026  
**Version:** 0.3.0 → 1.0.0  
**License:** MIT
