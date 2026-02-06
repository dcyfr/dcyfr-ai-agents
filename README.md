# @dcyfr/ai-agents

> Autonomous agent framework template - Build AI agents with tool usage, memory, and observability

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Overview

**@dcyfr/ai-agents** is a production-ready starter template for building autonomous AI agents with:

- ✅ **Agent Loop** - Multi-step reasoning and decision-making
- ✅ **Tool Registry** - Type-safe tool system with validation
- ✅ **Memory Management** - Short-term and long-term persistence
- ✅ **Observability** - Event system for monitoring and debugging
- ✅ **Error Recovery** - Graceful handling of failures
- ✅ **Strict TypeScript** - Full type safety and IDE support
- ✅ **Comprehensive Tests** - 99%+ test coverage with Vitest
- ✅ **Example Agents** - Customer service, research, code generation

## 🚀 Quick Start

```bash
# Clone or use as template
git clone https://github.com/dcyfr/dcyfr-ai-agents.git
cd dcyfr-ai-agents

# Install dependencies
npm install

# Run example agent
npm run example:customer-service

# Run tests
npm test

# Build for production
npm run build
```

## 📦 Installation

```bash
npm install @dcyfr/ai-agents
```

## 💡 Basic Usage

```typescript
import { Agent, calculatorTool, searchTool, ShortTermMemory } from '@dcyfr/ai-agents';

// Create an agent
const agent = new Agent({
  name: 'Assistant',
  description: 'Helpful AI assistant',
  tools: [calculatorTool, searchTool],
  memory: new ShortTermMemory(),
  maxIterations: 10,
});

// Run the agent
const result = await agent.run('Calculate 15 * 23 and search for information about AI');

console.log(result.output);
console.log(`Completed in ${result.iterations} steps`);
```

## 🏗️ Architecture

### Core Components

#### Agent

The main agent class that orchestrates:
- Decision-making loop
- Tool execution
- Memory management
- Event emission

```typescript
const agent = new Agent({
  name: 'My Agent',
  description: 'What this agent does',
  maxIterations: 10,
  temperature: 0.7,
  verbose: true,
  tools: [/* tools */],
  memory: new ShortTermMemory(),
  listeners: [(event) => console.log(event)],
});
```

#### Tools

Type-safe tools with Zod validation:

```typescript
import { z } from 'zod';
import type { Tool } from '@dcyfr/ai-agents';

const myTool: Tool<{ query: string }, { result: string }> = {
  name: 'my_tool',
  description: 'Description for the agent',
  inputSchema: z.object({
    query: z.string().min(1),
  }),
  async execute(input) {
    // Tool logic here
    return { result: `Processed: ${input.query}` };
  },
};
```

#### Memory

Two memory implementations:

**Short-term (in-memory):**
```typescript
const memory = new ShortTermMemory(100); // Max 100 entries
await memory.save('key', 'value');
const value = await memory.get('key');
```

**Long-term (file-based):**
```typescript
const memory = new LongTermMemory({
  storagePath: './agent-memory.json',
  autoSaveInterval: 5000, // Auto-save every 5s
});

await memory.load();
await memory.save('knowledge', { learned: 'data' });
await memory.persist();
```

#### Events

Monitor agent execution:

```typescript
const agent = new Agent({
  // ... config
  listeners: [
    (event) => {
      switch (event.type) {
        case 'start':
          console.log('Agent started:', event.data.input);
          break;
        case 'tool_call':
          console.log('Calling tool:', event.data.tool);
          break;
        case 'finish':
          console.log('Agent finished:', event.data.output);
          break;
      }
    },
  ],
});
```

## 📚 Examples

### Customer Service Agent

```typescript
import { Agent, searchTool, getCurrentTimeTool } from '@dcyfr/ai-agents';

const agent = new Agent({
  name: 'Customer Support',
  description: 'Helpful customer service agent',
  tools: [searchTool, getCurrentTimeTool],
});

const result = await agent.run('Help me track my order #12345');
```

### Research Agent

```typescript
import { Agent, searchTool, calculatorTool, LongTermMemory } from '@dcyfr/ai-agents';

const memory = new LongTermMemory({ storagePath: './research.json' });
await memory.load();

const agent = new Agent({
  name: 'Researcher',
  description: 'Research assistant',
  tools: [searchTool, calculatorTool],
  memory,
});

const result = await agent.run('Research AI agent frameworks and compare adoption rates');
```

### Custom Tool

```typescript
import { z } from 'zod';

const weatherTool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string(),
    units: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  async execute(input) {
    // Fetch weather from API
    return {
      location: input.location,
      temperature: 72,
      conditions: 'sunny',
    };
  },
};

agent.registerTool(weatherTool);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test

# Coverage report
npm run test:coverage
```

### Test Structure

- **Unit tests** - `tests/unit/*.test.ts`
- **Integration tests** - `tests/integration/*.test.ts`
- **Fixtures** - `tests/fixtures/`

## 📖 API Reference

### Agent

- `new Agent(options)` - Create agent instance
- `agent.registerTool(tool)` - Add tool to agent
- `agent.run(input)` - Execute agent with input
- `agent.getState()` - Get current execution state
- `agent.reset()` - Reset agent to initial state

### ToolRegistry

- `registry.register(tool, category?)` - Register tool
- `registry.unregister(toolName)` - Remove tool
- `registry.get(toolName)` - Get tool by name
- `registry.getAll()` - Get all tools
- `registry.execute(toolName, input)` - Execute tool

### Memory

Both `ShortTermMemory` and `LongTermMemory` implement:

- `save(key, value)` - Store value
- `get(key)` - Retrieve value
- `delete(key)` - Remove value
- `clear()` - Clear all data
- `keys()` - List all keys

## 🔧 Configuration

### Environment Variables

```bash
# None required - fully self-contained template
# Add your own as needed (e.g., API keys)
OPENAI_API_KEY=your-key-here  # If integrating with LLM providers
```

### TypeScript

Strict mode enabled by default in `tsconfig.json`. Customize as needed.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © DCYFR

## 🔗 Related Templates

- [@dcyfr/ai](https://github.com/dcyfr/dcyfr-ai) - Core AI framework
- [@dcyfr/ai-rag](https://github.com/dcyfr/dcyfr-ai-rag) - RAG systems
- [@dcyfr/ai-graphql](https://github.com/dcyfr/dcyfr-ai-graphql) - GraphQL API
- [@dcyfr/ai-code-gen](https://github.com/dcyfr/dcyfr-ai-code-gen) - Code generation

## 📞 Support

- 📧 Email: hello@dcyfr.ai
- 🌐 Website: https://www.dcyfr.ai
- 📚 Docs: https://docs.dcyfr.ai

---

**Built with ❤️ by DCYFR - Making AI development accessible**
