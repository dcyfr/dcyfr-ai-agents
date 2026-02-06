/**
 * Code generation agent example
 * 
 * Demonstrates:
 * - Custom tool creation
 * - String manipulation
 * - Code-specific workflows
 */

import { Agent, stringManipulationTool, ShortTermMemory, type Tool } from '../../src/index.js';
import { z } from 'zod';

// Custom code validation tool
const codeValidatorTool: Tool<{ code: string; language: string }, { valid: boolean; issues: string[] }> = {
  name: 'validate_code',
  description: 'Validate code syntax and structure',
  inputSchema: z.object({
    code: z.string().min(1),
    language: z.enum(['javascript', 'typescript', 'python']),
  }),
  async execute(input) {
    const issues: string[] = [];

    // Basic validation (placeholder)
    if (!input.code.includes('function') && !input.code.includes('def')) {
      issues.push('No function definition found');
    }

    if (input.language === 'typescript' && !input.code.includes(':')) {
      issues.push('Missing type annotations');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },
  examples: [
    {
      input: {
        code: 'function add(a: number, b: number): number { return a + b; }',
        language: 'typescript',
      },
      output: { valid: true, issues: [] },
    },
  ],
};

async function main(): Promise<void> {
  console.log('💻 Code Generation Agent Example\n');

  const agent = new Agent({
    name: 'Code Generator',
    description: 'AI agent that generates, validates, and manipulates code',
    maxIterations: 8,
    temperature: 0.3,
    verbose: true,
    tools: [stringManipulationTool, codeValidatorTool],
    memory: new ShortTermMemory(100),
    listeners: [
      (event) => {
        if (event.type === 'step') {
          const step = event.data;
          console.log(`\n📝 Step ${step.iteration}:`);
          console.log(`Thought: ${step.thought}`);

          if (step.action) {
            console.log(`\nAction: ${step.action.tool}`);
            console.log('Input:', JSON.stringify(step.action.input, null, 2));
          }

          if (step.observation) {
            console.log('\nResult:', JSON.stringify(step.observation, null, 2));
          }

          if (step.error) {
            console.log(`\n❌ Error: ${step.error.message}`);
          }
        }
      },
    ],
  });

  // Code generation request
  const request = 'Generate a TypeScript function that adds two numbers and validate it';
  console.log(`Request: ${request}\n`);
  console.log('='.repeat(60));

  // Execute
  const result = await agent.run(request);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Results:');
  console.log('='.repeat(60));
  console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Duration: ${result.metadata.duration}ms`);
  console.log(`\nGenerated Output:\n${result.output}`);
}

main().catch(console.error);
