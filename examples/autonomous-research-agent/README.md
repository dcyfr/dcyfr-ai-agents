# Autonomous Research Agent Example

**Demonstrates Phase 0 Autonomous Operations with Real-World Research Tasks**

This example showcases the complete DCYFR autonomous operations stack through a practical research agent that can conduct in-depth analysis on any topic using AI capabilities enhanced with memory, telemetry, and extensible hooks.

## 🎯 What This Demonstrates

### ✅ Phase 0 Autonomous Operations Features

| Feature | Implementation | Demo |
|---------|----------------|------|
| **AgentRuntime Orchestration** | Multi-step research coordination | 5-step research pipeline with context passing |
| **Memory Context Retrieval** | Automatic relevant context injection | Previous research enhances new queries |
| **WorkingMemory State** | Ephemeral state across research steps | Step results inform subsequent analysis |
| **Telemetry Capture** | SQLite event tracking with cost analysis | Dashboard shows provider usage & costs |
| **Hook System** | Extensible before/after execution hooks | Custom logging and validation hooks |
| **Provider Fallback** | Graceful degradation across LLM providers | OpenAI → Anthropic → Ollama fallback |
| **Configuration Management** | Environment-specific configurations | Development, production, research presets |
| **Error Resilience** | Robust error handling and recovery | Timeout handling, provider failures |

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies (from dcyfr-ai-agents root)
npm install

# Configure LLM providers (choose one or more):

# Option 1: Msty Vibe CLI Proxy (Recommended for Development)
# Multi-model routing: Claude, GPT-4, Copilot, Gemini, etc.
export OPENAI_API_BASE=http://localhost:8317/v1
export OPENAI_API_KEY=msty-vibe-proxy  # Any non-empty value

# Option 2: OpenAI Direct
export OPENAI_API_KEY=your_openai_key

# Option 3: Anthropic Direct
export ANTHROPIC_API_KEY=your_anthropic_key

# Option 4: Ollama (Local)
export OLLAMA_URL=http://localhost:11434
```

### 2. Run Interactive Demo

```bash
cd examples/autonomous-research-agent
npm run demo
```

This launches an interactive research session demonstrating all Phase 0 features:

```
🔬 Autonomous Research Agent - Phase 0 Demo
Demonstrating autonomous operations with memory, telemetry & hooks

🔍 Environment Validation
Node.js: v24.13.0
Platform: darwin
Environment: development

🔑 Provider Configuration:
  OpenAI:    ✅ Configured
  Anthropic: ✅ Configured  
  Ollama:    🔄 localhost:11434

📋 Using development configuration:
   Providers: openai, anthropic, ollama
   Memory: enabled
   Telemetry: enabled
   Max Depth: 3
   Audience: intermediate

🤖 Creating research agent...
✅ Agent created successfully
   Ready: Yes
   Providers: openai, anthropic, ollama
   Memory: Enabled
   Telemetry: Enabled
   Working Memory: 0 keys

🎯 Select a research topic:
1. quantum computing applications in cryptography (expert)
2. artificial intelligence adoption in healthcare (intermediate)  
3. machine learning for beginners (beginner)
4. blockchain scalability solutions (expert)
5. neural networks explained (intermediate)
6. Custom topic

🔍 Starting autonomous research...

🔬 [Research Agent] Starting research: quantum computing applications in cryptography
📚 Step 1: Generating research overview...
[AgentRuntime Event] {
  type: 'start',
  agentName: 'research-agent',
  task: 'Research Step: OVERVIEW...',
  timestamp: 1770944987234
}
[AgentRuntime Event] {
  type: 'memory_retrieval',
  agentName: 'research-agent',
  query: 'Research Step: OVERVIEW...',
  memoriesFound: 3,
  memoriesRelevant: 1,
  threshold: 0.7,
  duration: 45,
  timestamp: 1770944987235
}
✅ [Research Agent] Completed: Research Step: OVERVIEW...
📊 Found 4 applications

⚖️ Step 2: Analyzing advantages and limitations...
🚀 Step 3: Researching applications...
🔄 Step 4: Recent developments...  
🎯 Step 5: Synthesizing findings...

✅ Research completed in 12847ms

📄 Research Results
============================================================
TOPIC: quantum computing applications in cryptography
============================================================
...
```

### 3. Direct Research Commands

```bash
# Quick research on AI ethics
npm run demo:ai-ethics

# Quantum computing research  
npm run demo:quantum

# Production configuration with telemetry dashboard
npm run demo:production

# Deep research mode (5 steps)
npm run demo:research
```

## 🏗️ Architecture Overview

### Multi-Step Research Pipeline

```typescript
// 1. Overview Generation
const overviewResult = await this.executeResearchStep({
  step: 'overview',
  topic: config.topic,
  instruction: `Provide comprehensive overview of "${config.topic}"...`
});

// 2. Advantage/Limitation Analysis (with context from step 1)
const analysisResult = await this.executeResearchStep({
  step: 'analysis', 
  topic: config.topic,
  instruction: `Analyze advantages and limitations...`,
  previousContext: overviewResult.content
});

// 3. Applications Research (with context from steps 1-2)
const applicationsResult = await this.executeResearchStep({
  step: 'applications',
  previousContext: `${overviewResult.content}\n\n${analysisResult.content}`
});

// 4. Synthesis (combines all findings)
const synthesisResult = await this.synthesizeResearch({...});
```

### Memory Integration

```typescript
// Automatic memory context retrieval
const result = await this.runtime.executeTask(prompt, {
  timeout: 30000,
  memoryConfig: {
    maxResults: 10,
    minScore: 0.7  // Relevance threshold
  }
});

// Memory persistence after successful completion
if (result.success) {
  // AgentRuntime automatically stores successful results
  console.log(`Memory retrieval used: ${result.memoryRetrievalUsed}`);
}
```

### WorkingMemory State Management

```typescript
// Store step progress for next steps
const workingMemory = this.runtime.getWorkingMemory();
workingMemory.set(`research-step-${params.step}`, {
  topic: params.topic,
  instruction: params.instruction,
  timestamp: Date.now()
});

// Access state in subsequent steps
const previousStep = workingMemory.get('research-result-overview');
if (previousStep) {
  prompt += `\n\nPrevious findings:\n${previousStep.content}`;
}
```

### Hook System Extensions

```typescript
// Before execution hook
this.runtime.addHook('beforeExecute', async (task: string) => {
  console.log(`🔬 [Research Agent] Starting research: ${task}`);
  return { approved: true };
});

// After execution hook with telemetry
this.runtime.addHook('afterExecute', async (task: string, result: any, success: boolean) => {
  const status = success ? '✅' : '❌';
  console.log(`${status} [Research Agent] Completed: ${task}`);
  
  if (success && result?.findings) {
    console.log(`📊 Found ${result.findings.applications?.length || 0} applications`);
  }
});
```

### Telemetry Monitoring

```typescript
// Get performance metrics
const metrics = await agent.getPerformanceMetrics();
/*
{
  totalResearchSessions: 5,
  averageResearchTime: 8500,
  memoryHitRate: 0.73,
  providerDistribution: {
    "openai": 12,
    "anthropic": 3,
    "ollama": 0
  }
}
*/

// View telemetry dashboard
await showTelemetryDashboard();
```

## 📋 Configuration Examples

### Development Configuration

```typescript
export const developmentConfig: AgentConfig = {
  providers: ['ollama'], // Local development
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 5,
    minScore: 0.6 // Lower threshold for development
  },
  researchSettings: {
    defaultMaxDepth: 2, // Faster iteration
    defaultAudienceLevel: 'intermediate'
  }
};
```

### Production Configuration

```typescript
export const productionConfig: AgentConfig = {
  providers: ['openai', 'anthropic', 'ollama'], // Multi-provider fallback
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 10,
    minScore: 0.7
  },
  researchSettings: {
    defaultMaxDepth: 3,
    defaultAudienceLevel: 'expert'
  }
};
```

### Research-Intensive Configuration

```typescript
export const researchConfig: AgentConfig = {
  providers: ['anthropic', 'openai'], // Anthropic first for longer context
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 20,
    minScore: 0.8 // Higher relevance threshold
  },
  researchSettings: {
    defaultMaxDepth: 5, // Deep research
    defaultAudienceLevel: 'expert'
  }
};
```

## 🔧 Usage Examples

### Basic Research

```typescript
import { createResearchAgent } from './research-agent';
import { developmentConfig } from './config';

const agent = await createResearchAgent(developmentConfig);

const result = await agent.research({
  topic: 'machine learning in healthcare',
  maxDepth: 3,
  includeRecent: true,
  audienceLevel: 'intermediate'
});

console.log(result.summary);
console.log(result.findings.applications);
```

### Advanced Research with Custom Configuration

```typescript
const agent = await createResearchAgent({
  providers: ['anthropic', 'openai'],
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 15,
    minScore: 0.75
  },
  researchSettings: {
    defaultMaxDepth: 4
  }
});

const result = await agent.research({
  topic: 'quantum computing applications in financial modeling',
  maxDepth: 5,
  includeAcademic: true,
  includeRecent: true,
  audienceLevel: 'expert'
});
```

### Performance Monitoring

```typescript
// Get agent status
const status = await agent.getStatus();
console.log(`Agent ready: ${status.ready}`);
console.log(`Providers: ${status.providersAvailable.join(', ')}`);
console.log(`Working memory keys: ${status.workingMemoryKeys.length}`);

// Get performance metrics
const metrics = await agent.getPerformanceMetrics();
console.log(`Memory hit rate: ${metrics.memoryHitRate * 100}%`);
console.log('Provider distribution:', metrics.providerDistribution);
```

### Research Result Structure

```typescript
interface ResearchResult {
  topic: string;
  summary: string; // Executive summary
  findings: {
    overview: string;
    keyAdvantages: string[];
    limitations: string[];
    applications: string[];
    recentDevelopments: string[];
    futureDirections: string[];
  };
  sources: string[];
  metadata: {
    researchDepth: number;
    stepsCompleted: number;
    timeSpent: number;
    memoryContextUsed: boolean;
    telemetryEvents: number;
  };
}
```

## 🔍 Telemetry & Monitoring

### View Research Dashboard

```bash
# Show recent research activity
npm run telemetry

# Validate runtime configuration
npm run validate

# Alternative: Direct CLI access
npx @dcyfr/ai telemetry --recent 20
npx @dcyfr/ai validate-runtime
```

### Telemetry Events Captured

- **Research Sessions**: Start/finish times, success rates
- **Memory Retrievals**: Context found, relevance scores
- **Provider Usage**: API calls, costs, response times  
- **Working Memory**: State persistence across steps
- **Hook Executions**: Before/after hook timing
- **Error Events**: Failures, timeouts, recovery

### Cost Analysis

```bash
# Show cost breakdown by provider
npx @dcyfr/ai telemetry --costs

# Export research data
npx @dcyfr/ai telemetry --export research_data.csv
```

## 🛠️ Customization & Extension

### Custom Research Agent

```typescript
class CustomResearchAgent extends AutonomousResearchAgent {
  constructor(runtime: AgentRuntime, config: AgentConfig) {
    super(runtime, config);
    
    // Add custom hooks
    this.setupCustomHooks();
  }
  
  private setupCustomHooks() {
    // Custom validation hook
    this.runtime.addHook('beforeExecute', async (task: string) => {
      if (task.includes('sensitive')) {
        return { approved: false, reason: 'Sensitive topic detected' };
      }
      return { approved: true };
    });
    
    // Custom telemetry hook  
    this.runtime.addHook('afterExecute', async (task, result, success) => {
      if (success) {
        await this.customTelemetryTracker.track({
          task,
          result,
          timestamp: Date.now()
        });
      }
    });
  }
}
```

### Research Step Extensions

```typescript
// Add custom research step
private async executeExpertAnalysis(topic: string): Promise<string> {
  return await this.executeResearchStep({
    step: 'expert-analysis',
    topic,
    instruction: `Conduct expert-level technical analysis of ${topic} including mathematical foundations, algorithmic approaches, and implementation challenges.`
  });
}

// Use in research pipeline
const expertResult = await this.executeExpertAnalysis(config.topic);
```

### Memory Configuration

```typescript
// Custom memory configuration for specific research types
const customConfig: AgentConfig = {
  memoryConfig: {
    maxResults: 25,     // More context for complex topics
    minScore: 0.85      // Higher relevance for expert research
  }
};
```

## 🔒 Security & Privacy

### API Key Management

```bash
# Use environment variables (recommended)
export OPENAI_API_KEY=your_key
export ANTHROPIC_API_KEY=your_key

# OR: Use .env file (development only)
echo "OPENAI_API_KEY=your_key" >> .env
echo "ANTHROPIC_API_KEY=your_key" >> .env
```

### Data Storage

- **Telemetry**: Stored in `~/.dcyfr/telemetry.db` (SQLite)
- **Memory**: In-memory by default (configure for persistence)
- **Working Memory**: Ephemeral (cleared after research session)
- **API Keys**: Environment variables only (never stored)

### Privacy Controls

```typescript
// Disable telemetry for sensitive research
const agent = await createResearchAgent({
  telemetryEnabled: false,
  memoryEnabled: false  // No context persistence
});
```

## 🧪 Testing & Validation

### Run Tests

```bash
# Unit tests
npm test

# Integration tests (requires API keys)
npm run test:integration

# Lint code
npm run lint
```

### Validate Environment

```bash
npm run validate
```

Expected output:
```
🔍 Runtime Validation

✅ Core Dependencies:
   @dcyfr/ai: v1.0.0
   AgentRuntime: available
   ProviderRegistry: available
   TelemetryEngine: available
   DCYFRMemory: available

✅ Provider Configuration:
   OpenAI: configured (api_key: sk-...abc)
   Anthropic: configured (api_key: sk-ant-...xyz)  
   Ollama: available (localhost:11434)

✅ Memory System:
   DCYFRMemory: initialized
   WorkingMemory: available
   Storage backend: memory

✅ Telemetry System:
   TelemetryEngine: initialized
   Database: /Users/user/.dcyfr/telemetry.db
   Recent events: 42

All systems operational! 🚀
```

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot resolve module @dcyfr/ai"**
```bash
# Install dependencies from workspace root
cd ../../  # Navigate to dcyfr-ai-agents root
npm install
```

**2. "Provider not available"**
```bash
# Check API key configuration
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Validate runtime
npm run validate
```

**3. "Research timeout"**
```bash
# Reduce research depth
npm run demo -- --max-depth 2

# Use local providers for development
npm run demo -- --config budget
```

**4. "Memory retrieval failed"**
```bash
# Check memory configuration
npm run demo -- --config development  # Lower thresholds
```

### Performance Optimization

**Slow Research:**
- Reduce `maxDepth` (2-3 for faster results)
- Use `audienceLevel: 'beginner'` for simpler analysis
- Enable only essential providers

**High API Costs:**
- Use `budget` configuration (Ollama only)
- Lower `memoryConfig.maxResults` to reduce context
- Set higher `memoryConfig.minScore` for relevance

**Memory Issues:**
- Increase `memoryConfig.minScore` (0.8+) for relevance
- Reduce `memoryConfig.maxResults` (5-10) for performance
- Clear working memory between sessions

## 📚 Related Documentation

- **[AgentRuntime Guide](../../dcyfr-ai/README.md#agent-runtime)** - Core runtime documentation
- **[Provider Configuration](../../dcyfr-ai/README.md#providers)** - LLM provider setup
- **[Memory System](../../dcyfr-ai/README.md#memory)** - Memory configuration & usage
- **[Telemetry Dashboard](../../dcyfr-ai/README.md#telemetry)** - Monitoring & analytics
- **[Hook System](../../dcyfr-ai/README.md#hooks)** - Extensibility guide

## 🤝 Contributing

Found a bug or want to add features?

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Built with ❤️ by [DCYFR Labs](https://dcyfr.ai)**

*Demonstrating the future of autonomous AI operations*