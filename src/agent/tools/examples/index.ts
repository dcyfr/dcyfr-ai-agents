/**
 * Example tools for demonstration
 */

import { z } from 'zod';
import type { Tool } from '../../../types/index.js';
import { validators } from '../validators.js';

/**
 * Calculator tool - performs basic arithmetic
 */
export const calculatorTool: Tool<
  { operation: 'add' | 'subtract' | 'multiply' | 'divide'; a: number; b: number },
  number
> = {
  name: 'calculator',
  description: 'Performs basic arithmetic operations (add, subtract, multiply, divide)',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  async execute(input: { operation: 'add' | 'subtract' | 'multiply' | 'divide'; a: number; b: number }): Promise<number> {
    switch (input.operation) {
      case 'add':
        return input.a + input.b;
      case 'subtract':
        return input.a - input.b;
      case 'multiply':
        return input.a * input.b;
      case 'divide':
        if (input.b === 0) {
          throw new Error('Division by zero');
        }
        return input.a / input.b;
    }
  },
  examples: [
    {
      input: { operation: 'add', a: 5, b: 3 },
      output: 8,
      description: 'Adding two numbers',
    },
    {
      input: { operation: 'multiply', a: 4, b: 7 },
      output: 28,
      description: 'Multiplying two numbers',
    },
  ],
};

/**
 * Search tool - simulates a search operation
 */
export const searchTool: Tool<{ query: string; limit?: number }, Array<{ title: string; snippet: string }>> = {
  name: 'search',
  description: 'Search for information using a query string',
  inputSchema: z.object({
    query: validators.nonEmptyString,
    limit: validators.positiveInt.optional().default(5),
  }),
  async execute(input: { query: string; limit?: number }): Promise<Array<{ title: string; snippet: string }>> {
    // Simulated search results
    return Array.from({ length: Math.min(input.limit ?? 5, 10) }, (_, i) => ({
      title: `Result ${i + 1} for "${input.query}"`,
      snippet: `This is a snippet of information related to ${input.query}...`,
    }));
  },
  examples: [
    {
      input: { query: 'autonomous agents', limit: 3 },
      output: [
        { title: 'Result 1', snippet: 'Information about autonomous agents...' },
        { title: 'Result 2', snippet: 'More details on AI agents...' },
        { title: 'Result 3', snippet: 'Agent frameworks and tools...' },
      ],
    },
  ],
};

/**
 * Get current time tool
 */
export const getCurrentTimeTool: Tool<Record<string, never>, string> = {
  name: 'get_current_time',
  description: 'Get the current date and time in ISO 8601 format',
  inputSchema: z.object({}),
  async execute() {
    return new Date().toISOString();
  },
  examples: [
    {
      input: {},
      output: '2026-02-05T10:30:00.000Z',
      description: 'Getting current timestamp',
    },
  ],
};

/**
 * String manipulation tool
 */
export const stringManipulationTool: Tool<
  { text: string; operation: 'uppercase' | 'lowercase' | 'reverse' | 'length' },
  string | number
> = {
  name: 'string_manipulation',
  description: 'Perform various string operations',
  inputSchema: z.object({
    text: validators.nonEmptyString,
    operation: z.enum(['uppercase', 'lowercase', 'reverse', 'length']),
  }),
  async execute(input: { text: string; operation: 'uppercase' | 'lowercase' | 'reverse' | 'length' }): Promise<string | number> {
    switch (input.operation) {
      case 'uppercase':
        return input.text.toUpperCase();
      case 'lowercase':
        return input.text.toLowerCase();
      case 'reverse':
        return input.text.split('').reverse().join('');
      case 'length':
        return input.text.length;
    }
  },
  examples: [
    {
      input: { text: 'Hello World', operation: 'uppercase' },
      output: 'HELLO WORLD',
    },
    {
      input: { text: 'Hello World', operation: 'length' },
      output: 11,
    },
  ],
};

/**
 * All example tools
 */
export const exampleTools = [
  calculatorTool,
  searchTool,
  getCurrentTimeTool,
  stringManipulationTool,
];
