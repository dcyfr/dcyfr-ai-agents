/**
 * Customer service agent example
 * 
 * Demonstrates:
 * - Basic agent setup
 * - Tool usage (search, time)
 * - Simple conversation flow
 */

import { Agent, searchTool, getCurrentTimeTool, ShortTermMemory } from '../../src/index.js';

async function main(): Promise<void> {
  console.log('🤖 Customer Service Agent Example\n');

  // Create agent with customer service configuration
  const agent = new Agent({
    name: 'Customer Support Assistant',
    description: 'Helpful customer service agent that can search for information and check order status',
    maxIterations: 5,
    verbose: true,
    tools: [searchTool, getCurrentTimeTool],
    memory: new ShortTermMemory(50),
    listeners: [
      (event) => {
        if (event.type === 'step') {
          console.log(`\n[Step ${event.data.iteration}]`);
          console.log(`Thought: ${event.data.thought}`);
          if (event.data.action) {
            console.log(`Action: ${event.data.action.tool}`);
            console.log(`Input:`, event.data.action.input);
          }
          if (event.data.observation) {
            console.log(`Observation:`, event.data.observation);
          }
        }
      },
    ],
  });

  // Example customer query
  const query = 'Can you help me find information about autonomous agents?';
  console.log(`Customer: ${query}\n`);

  // Run agent
  const result = await agent.run(query);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Results:');
  console.log('='.repeat(60));
  console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Duration: ${result.metadata.duration}ms`);
  console.log(`\nFinal Answer:\n${result.output}`);
}

main().catch(console.error);
