#!/usr/bin/env node
/**
 * Autonomous Research Agent Demo
 * 
 * Demonstrates all Phase 0 autonomous operations features:
 * - AgentRuntime orchestration
 * - Memory context retrieval and injection  
 * - Multi-step reasoning with WorkingMemory
 * - Telemetry capture and monitoring
 * - Hook system extensibility
 * - Provider fallback handling
 * 
 * Usage:
 *   npm run demo                           # Interactive demo
 *   npm run demo -- --topic "AI ethics"   # Direct research
 *   npm run demo -- --config production   # Use production config
 *   npm run demo -- --show-telemetry      # Display telemetry dashboard
 */

import { createResearchAgent, type AutonomousResearchAgent } from './research-agent';
import { 
  getConfigForEnvironment, 
  validateEnvironment, 
  validateConfig,
  exampleResearchTasks,
  developmentConfig,
  productionConfig,
  researchConfig,
  budgetConfig 
} from './config';

/**
 * Command line interface for the demo
 */
interface DemoOptions {
  topic?: string;
  config?: string;
  showTelemetry?: boolean;
  interactive?: boolean;
  maxDepth?: number;
  audienceLevel?: 'beginner' | 'intermediate' | 'expert';
}

/**
 * Parse command line arguments
 */
function parseArgs(): DemoOptions {
  const args = process.argv.slice(2);
  const options: DemoOptions = {
    interactive: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--topic':
        options.topic = nextArg;
        options.interactive = false;
        i++;
        break;
      case '--config':
        options.config = nextArg;
        i++;
        break;
      case '--show-telemetry':
        options.showTelemetry = true;
        break;
      case '--max-depth':
        options.maxDepth = parseInt(nextArg) || 3;
        i++;
        break;
      case '--audience':
        if (['beginner', 'intermediate', 'expert'].includes(nextArg)) {
          options.audienceLevel = nextArg as any;
          i++;
        }
        break;
      case '--help':
        displayHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(`
🔬 Autonomous Research Agent Demo

Usage: npm run demo [options]

Options:
  --topic "text"           Research topic (skips interactive mode)
  --config <name>          Configuration preset:
                           • development (default)
                           • production  
                           • research
                           • budget
  --max-depth <number>     Research depth (1-5, default: 3)
  --audience <level>       Target audience:
                           • beginner
                           • intermediate (default)
                           • expert
  --show-telemetry         Display telemetry dashboard after research
  --help                   Show this help

Examples:
  npm run demo
  npm run demo -- --topic "quantum computing"
  npm run demo -- --config production --max-depth 4
  npm run demo -- --topic "AI ethics" --audience expert --show-telemetry

Environment Variables:
  OPENAI_API_KEY          OpenAI API key (optional)
  ANTHROPIC_API_KEY       Anthropic API key (optional)
  OLLAMA_HOST             Ollama server (optional, default: localhost:11434)
`);
}

/**
 * Validate the environment and display setup information
 */
function displayEnvironmentInfo(): boolean {
  console.log('🔍 Environment Validation\n');
  
  const envCheck = validateEnvironment();
  
  // Display Node.js and environment info
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Check API key availability
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const ollamaHost = process.env.OLLAMA_HOST || 'localhost:11434';

  console.log('🔑 Provider Configuration:');
  console.log(`  OpenAI:    ${hasOpenAI ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Anthropic: ${hasAnthropic ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Ollama:    🔄 ${ollamaHost}`);
  console.log();

  // Display issues and recommendations
  if (envCheck.issues.length > 0) {
    console.log('⚠️  Issues:');
    envCheck.issues.forEach(issue => console.log(`   ${issue}`));
    console.log();
  }

  if (envCheck.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    envCheck.recommendations.forEach(rec => console.log(`   ${rec}`));
    console.log();
  }

  if (!hasOpenAI && !hasAnthropic) {
    console.log('⚠️  No cloud LLM providers configured. Using fallback mode.');
    console.log('   Research quality may be limited without cloud providers.\n');
  }

  return envCheck.valid || hasOpenAI || hasAnthropic;
}

/**
 * Get configuration based on user input
 */
function getConfiguration(configName?: string) {
  const configs = {
    development: developmentConfig,
    production: productionConfig,
    research: researchConfig,
    budget: budgetConfig
  };

  const config = configName 
    ? configs[configName as keyof typeof configs] || developmentConfig
    : getConfigForEnvironment();

  console.log(`📋 Using ${configName || 'auto-detected'} configuration:`);
  console.log(`   Providers: ${config.providers?.join(', ')}`);
  console.log(`   Memory: ${config.memoryEnabled ? 'enabled' : 'disabled'}`);
  console.log(`   Telemetry: ${config.telemetryEnabled ? 'enabled' : 'disabled'}`);
  console.log(`   Max Depth: ${config.researchSettings?.defaultMaxDepth}`);
  console.log(`   Audience: ${config.researchSettings?.defaultAudienceLevel}\n`);

  const validation = validateConfig(config);
  if (validation.warnings.length > 0) {
    console.log('⚠️  Configuration Warnings:');
    validation.warnings.forEach(warning => console.log(`   ${warning}`));
    console.log();
  }

  return config;
}

/**
 * Interactive topic selection
 */
async function selectResearchTopic(): Promise<{ topic: string; config: any }> {
  console.log('🎯 Select a research topic:\n');
  
  const topics = Object.entries(exampleResearchTasks);
  topics.forEach(([key, config], index) => {
    console.log(`${index + 1}. ${config.topic} (${config.audienceLevel})`);
  });
  console.log(`${topics.length + 1}. Custom topic\n`);

  // For demo purposes, auto-select the first topic
  // In a real CLI, you'd use readline for user input
  console.log('🔄 Auto-selecting topic 1 for demo...');
  const selected = topics[0];
  
  console.log(`Selected: ${selected[1].topic}\n`);
  return { topic: selected[1].topic, config: selected[1] };
}

/**
 * Custom topic input (simplified for demo)
 */
function getCustomTopic(): { topic: string; config: any } {
  // For demo, use a default topic
  const topic = 'artificial intelligence in education';
  console.log(`Custom topic: ${topic}\n`);
  
  return {
    topic,
    config: {
      topic,
      maxDepth: 3,
      includeRecent: true,
      audienceLevel: 'intermediate'
    }
  };
}

/**
 * Display telemetry dashboard
 */
async function showTelemetryDashboard(): Promise<void> {
  console.log('\n📊 Telemetry Dashboard\n');
  
  try {
    // Import telemetry dashboard
    const { TelemetryDashboard } = await import('@dcyfr/ai/cli/telemetry-dashboard');
    
    const dashboard = new TelemetryDashboard();
    
    console.log('Recent Events:');
    await dashboard.showRecentEvents(10);
    
    console.log('\nProvider Summary:');
    await dashboard.showProviderSummary();
    
    console.log('\nCost Analysis:');
    await dashboard.showCostSummary();
    
  } catch (error) {
    console.log('⚠️  Telemetry dashboard not available');
    console.log(`   Error: ${error}`);
    console.log('   Try: npx dcyfr telemetry\n');
  }
}

/**
 * Format and display research results
 */
function displayResults(result: any): void {
  console.log('\n📄 Research Results\n');
  console.log('='.repeat(60));
  console.log(`TOPIC: ${result.topic}`);
  console.log('='.repeat(60));
  
  console.log('\n📋 EXECUTIVE SUMMARY');
  console.log(result.summary);
  
  console.log('\n📊 OVERVIEW');
  console.log(result.findings.overview);
  
  if (result.findings.keyAdvantages.length > 0) {
    console.log('\n✅ KEY ADVANTAGES');
    result.findings.keyAdvantages.forEach((advantage: string, i: number) => {
      console.log(`${i + 1}. ${advantage}`);
    });
  }
  
  if (result.findings.limitations.length > 0) {
    console.log('\n⚠️  LIMITATIONS');
    result.findings.limitations.forEach((limitation: string, i: number) => {
      console.log(`${i + 1}. ${limitation}`);
    });
  }
  
  if (result.findings.applications.length > 0) {
    console.log('\n🚀 APPLICATIONS');
    result.findings.applications.forEach((app: string, i: number) => {
      console.log(`${i + 1}. ${app}`);
    });
  }
  
  if (result.findings.recentDevelopments.length > 0) {
    console.log('\n🔄 RECENT DEVELOPMENTS');
    result.findings.recentDevelopments.forEach((dev: string, i: number) => {
      console.log(`${i + 1}. ${dev}`);
    });
  }
  
  if (result.findings.futureDirections.length > 0) {
    console.log('\n🔮 FUTURE DIRECTIONS');
    result.findings.futureDirections.forEach((dir: string, i: number) => {
      console.log(`${i + 1}. ${dir}`);
    });
  }
  
  console.log('\n📈 RESEARCH METADATA');
  console.log(`   Steps Completed: ${result.metadata.stepsCompleted}`);
  console.log(`   Time Spent: ${result.metadata.timeSpent}ms`);
  console.log(`   Memory Used: ${result.metadata.memoryContextUsed ? 'Yes' : 'No'}`);
  console.log(`   Telemetry Events: ${result.metadata.telemetryEvents}`);
  console.log(`   Research Depth: ${result.metadata.researchDepth}`);
  
  if (result.sources.length > 0) {
    console.log('\n📚 SOURCES');
    result.sources.forEach((source: string, i: number) => {
      console.log(`${i + 1}. ${source}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main demo function
 */
async function runDemo(): Promise<void> {
  console.log('🔬 Autonomous Research Agent - Phase 0 Demo');
  console.log('Demonstrating autonomous operations with memory, telemetry & hooks\n');

  try {
    const options = parseArgs();
    
    // Step 1: Validate environment
    const envValid = displayEnvironmentInfo();
    if (!envValid) {
      console.log('❌ Environment validation failed. Demo may not work properly.\n');
    }

    // Step 2: Get configuration
    const config = getConfiguration(options.config);

    // Step 3: Create research agent
    console.log('🤖 Creating research agent...');
    const agent = await createResearchAgent(config);
    
    // Display agent status
    const status = await agent.getStatus();
    console.log('✅ Agent created successfully');
    console.log(`   Ready: ${status.ready ? 'Yes' : 'No'}`);
    console.log(`   Providers: ${status.providersAvailable.join(', ')}`);
    console.log(`   Memory: ${status.memoryEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Telemetry: ${status.telemetryEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Working Memory: ${status.workingMemoryKeys.length} keys\n`);

    // Step 4: Select research topic
    let researchTopic: string;
    let researchConfig: any;

    if (options.topic) {
      researchTopic = options.topic;
      researchConfig = {
        topic: options.topic,
        maxDepth: options.maxDepth || 3,
        includeRecent: true,
        audienceLevel: options.audienceLevel || 'intermediate'
      };
    } else if (options.interactive) {
      const selection = await selectResearchTopic();
      researchTopic = selection.topic;
      researchConfig = selection.config;
    } else {
      const custom = getCustomTopic();
      researchTopic = custom.topic;
      researchConfig = custom.config;
    }

    // Step 5: Conduct research
    console.log('🔍 Starting autonomous research...\n');
    const startTime = Date.now();
    
    const result = await agent.research(researchConfig);
    
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Research completed in ${totalTime}ms\n`);

    // Step 6: Display results
    displayResults(result);

    // Step 7: Show performance metrics
    console.log('\n📈 Agent Performance Metrics');
    const metrics = await agent.getPerformanceMetrics();
    console.log(`   Total Sessions: ${metrics.totalResearchSessions}`);
    console.log(`   Memory Hit Rate: ${metrics.memoryHitRate * 100}%`);
    console.log(`   Provider Distribution:`);
    Object.entries(metrics.providerDistribution).forEach(([provider, count]) => {
      console.log(`     ${provider}: ${count} calls`);
    });

    // Step 8: Show telemetry dashboard (if requested)
    if (options.showTelemetry) {
      await showTelemetryDashboard();
    }

    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   • Try: npm run demo -- --show-telemetry');
    console.log('   • Try: npm run demo -- --config research --max-depth 5');
    console.log('   • Try: npx dcyfr telemetry (view full dashboard)');
    console.log('   • Try: npx dcyfr validate-runtime (check setup)');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot resolve module')) {
        console.error('\n💡 Setup Required:');
        console.error('   1. Install dependencies: npm install @dcyfr/ai');
        console.error('   2. Configure providers: export OPENAI_API_KEY=your_key');
        console.error('   3. Or install Ollama for local models');
      } else if (error.message.includes('Provider')) {
        console.error('\n💡 Provider Issue:');
        console.error('   • Check API keys are set correctly');
        console.error('   • Ensure providers are accessible');
        console.error('   • Try: npx dcyfr validate-runtime');
      } else if (error.message.includes('timeout')) {
        console.error('\n💡 Timeout Issue:');
        console.error('   • Research may be too deep/complex');
        console.error('   • Try lower --max-depth');
        console.error('   • Check provider responsiveness');
      }
    }
    
    process.exit(1);
  }
}

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };