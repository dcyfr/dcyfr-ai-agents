/**
 * Research agent example
 * 
 * Demonstrates:
 * - Multi-step reasoning
 * - Multiple tool usage
 * - Memory persistence
 */

import { Agent, searchTool, calculatorTool, LongTermMemory } from '../../src/index.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function main(): Promise<void> {
  console.log('🔬 Research Agent Example\n');

  // Create persistent memory
  const memory = new LongTermMemory({
    storagePath: join(tmpdir(), 'research-agent-memory.json'),
    autoSaveInterval: 5000,
  });

  await memory.load();

  // Create research agent
  const agent = new Agent({
    name: 'Research Assistant',
    description: 'Advanced research agent that can search, analyze, and synthesize information',
    maxIterations: 10,
    temperature: 0.5,
    verbose: true,
    tools: [searchTool, calculatorTool],
    memory,
    listeners: [
      (event) => {
        switch (event.type) {
          case 'start':
            console.log('🚀 Starting research...\n');
            break;
          case 'tool_call':
            console.log(`🔧 Calling tool: ${event.data.tool}`);
            break;
          case 'tool_result':
            console.log(`✅ Tool completed\n`);
            break;
          case 'finish':
            console.log('\n✨ Research complete!\n');
            break;
        }
      },
    ],
  });

  // Research query
  const query = 'Research the latest trends in autonomous AI agents and calculate the growth rate if adoption increased by 150% from 100,000 users';
  console.log(`Research Query:\n${query}\n`);
  console.log('='.repeat(60) + '\n');

  // Run research
  const result = await agent.run(query);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Research Results:');
  console.log('='.repeat(60));
  console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Iterations: ${result.iterations}/${agent.getState().iteration}`);
  console.log(`Duration: ${result.metadata.duration}ms`);
  console.log(`Steps taken: ${result.steps.length}`);
  console.log(`\nFindings:\n${result.output}`);

  // Save memory
  await memory.persist();
  console.log(`\n💾 Memory saved to: ${memory.getStats().storagePath}`);

  await memory.dispose();
}

main().catch(console.error);
