#!/usr/bin/env tsx
/**
 * Phase 0 Validation Script
 * Tests autonomous operations with live LLM provider and memory storage
 */

import { 
  AgentRuntime,
  ProviderRegistry,
  DCYFRMemoryImpl,
  TelemetryEngine
} from '@dcyfr/ai';

interface ValidationResult {
  test: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

const results: ValidationResult[] = [];

async function addResult(
  test: string,
  fn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    results.push({
      test,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`✅ ${test}`);
  } catch (error) {
    results.push({
      test,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`❌ ${test}`);
    console.error(`   Error: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  console.log('🔍 Phase 0 Autonomous Operations Validation\n');
  console.log('Configuration:');
  console.log(`  LLM Provider: ${process.env.OPENAI_API_BASE || 'Not configured'}`);
  console.log(`  Vector DB: ${process.env.VECTOR_DB_URL || 'Not configured'}`);
  console.log(`  Memory Provider: ${process.env.VECTOR_DB_PROVIDER || 'Not configured'}\n`);

  // Test 1: Provider Registry Initialization
  await addResult('Provider Registry Initialization', async () => {
    const registry = ProviderRegistry.getInstance();
    const providers = registry.listProviders();
    if (providers.length === 0) {
      throw new Error('No providers registered');
    }
    console.log(`   Found ${providers.length} providers`);
  });

  // Test 2: Memory Configuration
  await addResult('Memory Configuration', async () => {
    const config = {
      vectorDb: {
        provider: (process.env.VECTOR_DB_PROVIDER || 'qdrant') as 'qdrant',
        url: process.env.VECTOR_DB_URL || 'http://localhost:6333',
        index: process.env.VECTOR_DB_INDEX || 'dcyfr_memories',
      },
      llm: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || 'msty-vibe-proxy',
        model: process.env.LLM_MODEL || 'gpt-4',
        embeddingModel: process.env.LLM_EMBEDDING_MODEL || 'text-embedding-3-small',
      },
    };
    
    const memory = new DCYFRMemoryImpl(config);
    if (!memory) {
      throw new Error('Failed to initialize memory');
    }
    console.log(`   Memory initialized with ${config.vectorDb.provider}`);
  });

  // Test 3: Telemetry Engine
  await addResult('Telemetry Engine Initialization', async () => {
    const telemetry = TelemetryEngine.getInstance();
    telemetry.recordEvent({
      type: 'validation',
      timestamp: Date.now(),
      data: { phase: 0, test: 'initialization' },
    });
    console.log('   Telemetry event recorded');
  });

  // Test 4: AgentRuntime Initialization
  await addResult('AgentRuntime Initialization', async () => {
    const memoryConfig = {
      vectorDb: {
        provider: 'qdrant' as const,
        url: process.env.VECTOR_DB_URL || 'http://localhost:6333',
        index: 'dcyfr_memories',
      },
      llm: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || 'msty-vibe-proxy',
        model: process.env.LLM_MODEL || 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
      },
    };

    const runtime = new AgentRuntime({
      agentName: 'validation-agent',
      memory: new DCYFRMemoryImpl(memoryConfig),
      telemetry: TelemetryEngine.getInstance(),
      enableTelemetry: true,
    });

    if (!runtime) {
      throw new Error('Failed to initialize AgentRuntime');
    }
    console.log('   AgentRuntime created successfully');
  });

  // Test 5: LLM Provider Connectivity (via runtime execution)
  await addResult('LLM Provider Execution', async () => {
    const memoryConfig = {
      vectorDb: {
        provider: 'qdrant' as const,
        url: process.env.VECTOR_DB_URL || 'http://localhost:6333',
        index: 'phase0_validation',
      },
      llm: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || 'msty-vibe-proxy',
        model: process.env.LLM_MODEL || 'claude-sonnet-4',
        embeddingModel: 'text-embedding-3-small',
      },
    };

    const runtime = new AgentRuntime({
      agentName: 'llm-test-agent',
      memory: new DCYFRMemoryImpl(memoryConfig),
      telemetry: TelemetryEngine.getInstance(),
      enableTelemetry: true,
      providerFallbackEnabled: true,
    });

    const result = await runtime.execute('What is 2+2? Answer with just the number.');
    
    if (!result.output || result.output.length === 0) {
      throw new Error('No output from LLM provider');
    }
    
    console.log(`   LLM Response: ${result.output.substring(0, 100)}...`);
    console.log(`   Iterations: ${result.iterations}, Duration: ${result.duration}ms`);
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}`);
      console.log(`    Error: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
