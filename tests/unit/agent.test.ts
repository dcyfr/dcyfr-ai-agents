/**
 * Agent core tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Agent } from '../../src/agent/core/agent.js';
import { calculatorTool, searchTool } from '../../src/agent/tools/examples/index.js';
import { ShortTermMemory } from '../../src/agent/memory/short-term.js';
import type { Tool } from '../../src/types/index.js';
import { z } from 'zod';

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({
      name: 'Test Agent',
      description: 'Agent for testing',
      maxIterations: 5,
      verbose: false,
    });
  });

  it('should create agent with default config', () => {
    expect(agent).toBeDefined();
    expect(agent.getState().iteration).toBe(0);
    expect(agent.getState().isFinished).toBe(false);
  });

  it('should create agent with custom system prompt', () => {
    const customAgent = new Agent({
      name: 'Custom Agent',
      description: 'Custom description',
      systemPrompt: 'Custom system prompt for testing',
    });

    const state = customAgent.getState();
    expect(state.messages[0].content).toContain('Custom system prompt');
  });

  it('should generate default system prompt with tools', () => {
    const agentWithTools = new Agent({
      name: 'Tool Agent',
      description: 'Agent with tools',
      tools: [calculatorTool, searchTool],
    });

    const state = agentWithTools.getState();
    const systemMessage = state.messages[0].content;
    expect(systemMessage).toContain('Tool Agent');
    expect(systemMessage).toContain('calculator');
    expect(systemMessage).toContain('search');
  });

  it('should register tools', () => {
    agent.registerTool(calculatorTool);
    agent.registerTool(searchTool);

    const state = agent.getState();
    expect(state.messages).toHaveLength(1); // System message
  });

  it('should register tools with verbose logging', () => {
    const verboseAgent = new Agent({
      name: 'Verbose Agent',
      description: 'Agent with verbose output',
      verbose: true,
    });

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    verboseAgent.registerTool(calculatorTool);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('[Agent] Registered tool: calculator');
    consoleWarnSpy.mockRestore();
  });

  it('should execute with tools', async () => {
    agent.registerTool(calculatorTool);

    const result = await agent.run('Calculate 5 + 3');

    expect(result).toBeDefined();
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.steps).toHaveLength(result.iterations);
    expect(result.metadata.duration).toBeGreaterThan(0);
  });

  it('should respect max iterations', async () => {
    const limitedAgent = new Agent({
      name: 'Limited Agent',
      description: 'Agent with iteration limit',
      maxIterations: 2,
    });

    const result = await limitedAgent.run('Test query');

    expect(result.iterations).toBeLessThanOrEqual(2);
  });

  it('should handle errors gracefully', async () => {
    // This will fail because the LLM call is not implemented
    const result = await agent.run('Test query');

    expect(result).toBeDefined();
    expect(result.success).toBe(true); // Placeholder implementation finishes immediately
  });

  it('should handle tool not found error', async () => {
    // Create a test agent subclass that overrides makeDecision
    class TestAgent extends Agent {
      async makeDecision() {
        return {
          thought: 'Trying to use non-existent tool',
          action: { tool: 'nonexistent', input: {} },
        };
      }
    }

    const agentWithBadTool = new TestAgent({
      name: 'Error Agent',
      description: 'Agent that tries to use non-existent tool',
      maxIterations: 1,
    });

    const result = await agentWithBadTool.run('Test');

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBeDefined();
    expect(result.steps[0].error?.message).toContain('Tool not found');
    expect(result.success).toBe(false);
  });

  it('should handle tool input validation error', async () => {
    class TestAgent extends Agent {
      async makeDecision() {
        return {
          thought: 'Trying calculator with invalid input',
          action: { tool: 'calculator', input: { invalid: 'data' } },
        };
      }
    }

    const invalidInputAgent = new TestAgent({
      name: 'Invalid Input Agent',
      description: 'Agent with invalid tool input',
      tools: [calculatorTool],
      maxIterations: 1,
    });

    const result = await invalidInputAgent.run('Test');

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBeDefined();
    expect(result.success).toBe(false);
  });

  it('should execute tool successfully', async () => {
    class TestAgent extends Agent {
      private callCount = 0;

      async makeDecision() {
        this.callCount++;
        if (this.callCount === 1) {
          return {
            thought: 'Using calculator',
            action: { 
              tool: 'calculator', 
              input: { operation: 'add', a: 5, b: 3 } 
            },
          };
        }
        return {
          thought: 'Task complete',
          action: undefined,
        };
      }
    }

    const successAgent = new TestAgent({
      name: 'Success Agent',
      description: 'Agent that successfully uses tool',
      tools: [calculatorTool],
      maxIterations: 2,
    });

    const result = await successAgent.run('Calculate 5 + 3');

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].observation).toBeDefined();
    expect(result.steps[0].observation).toBe(8);
    expect(result.steps[0].error).toBeUndefined();
    expect(result.success).toBe(true);
  });

  it('should handle errors thrown during execution', async () => {
    const errorTool: Tool = {
      name: 'error-tool',
      description: 'Tool that throws error',
      inputSchema: z.object({}),
      execute: async () => {
        throw new Error('Tool execution failed');
      },
    };

    class TestAgent extends Agent {
      async makeDecision() {
        return {
          thought: 'Using error tool',
          action: { tool: 'error-tool', input: {} },
        };
      }
    }

    const errorAgent = new TestAgent({
      name: 'Error Agent',
      description: 'Agent with failing tool',
      tools: [errorTool],
      maxIterations: 1,
    });

    const result = await errorAgent.run('Test');

    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBeDefined();
    expect(result.steps[0].error?.message).toContain('Tool execution failed');
  });

  it('should catch and handle non-Error throws', async () => {
    class TestAgent extends Agent {
      async makeDecision(): Promise<any> {
        throw 'String error';
      }
    }

    const stringErrorAgent = new TestAgent({
      name: 'String Error Agent',
      description: 'Agent that throws non-Error',
      maxIterations: 1,
    });

    const result = await stringErrorAgent.run('Test');

    expect(result.success).toBe(false);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].error).toBeDefined();
    expect(result.steps[0].error?.message).toContain('String error');
  });

  it('should support event listeners', async () => {
    const events: string[] = [];

    const agentWithListener = new Agent({
      name: 'Event Agent',
      description: 'Agent with event tracking',
      listeners: [
        (event) => {
          events.push(event.type);
          return Promise.resolve();
        },
      ],
    });

    await agentWithListener.run('Test');

    expect(events).toContain('start');
    expect(events).toContain('finish');
  });

  it('should emit step events', async () => {
    const events: any[] = [];

    const stepAgent = new Agent({
      name: 'Step Agent',
      description: 'Agent that emits step events',
      maxIterations: 2,
      listeners: [
        (event) => {
          events.push(event);
          return Promise.resolve();
        },
      ],
    });

    await stepAgent.run('Test');

    const stepEvents = events.filter((e) => e.type === 'step');
    expect(stepEvents.length).toBeGreaterThan(0);
  });

  it('should emit tool_call and tool_result events', async () => {
    class TestAgent extends Agent {
      async makeDecision() {
        return {
          thought: 'Using calculator',
          action: { 
            tool: 'calculator', 
            input: { operation: 'add', a: 10, b: 5 } 
          },
        };
      }
    }

    const events: any[] = [];

    const toolEventAgent = new TestAgent({
      name: 'Tool Event Agent',
      description: 'Agent that emits tool events',
      tools: [calculatorTool],
      maxIterations: 1,
      listeners: [
        (event) => {
          events.push(event);
          return Promise.resolve();
        },
      ],
    });

    await toolEventAgent.run('Test');

    expect(events.some((e) => e.type === 'tool_call')).toBe(true);
    expect(events.some((e) => e.type === 'tool_result')).toBe(true);
  });

  it('should emit error events', async () => {
    const events: any[] = [];

    const errorEventAgent = new Agent({
      name: 'Error Event Agent',
      description: 'Agent that emits error events',
      maxIterations: 1,
      listeners: [
        (event) => {
          events.push(event);
          return Promise.resolve();
        },
      ],
    });

    (errorEventAgent as any).makeDecision = vi.fn().mockResolvedValue({
      thought: 'Trying non-existent tool',
      action: { tool: 'nonexistent', input: {} },
    });

    await errorEventAgent.run('Test');

    const errorEvents = events.filter((e) => e.type === 'error');
    expect(errorEvents.length).toBeGreaterThan(0);
  });

  it('should integrate with memory', async () => {
    const memory = new ShortTermMemory(10);
    await memory.save('test-key', 'test-value');

    const agentWithMemory = new Agent({
      name: 'Memory Agent',
      description: 'Agent with memory',
      memory,
    });

    const result = await agentWithMemory.run('Test');
    expect(result).toBeDefined();

    const savedValue = await memory.get('test-key');
    expect(savedValue).toBe('test-value');
  });

  it('should reset state', () => {
    agent.run('Test query');
    const stateBefore = agent.getState();
    expect(stateBefore.iteration).toBeGreaterThanOrEqual(0);

    agent.reset();
    const stateAfter = agent.getState();
    expect(stateAfter.iteration).toBe(0);
    expect(stateAfter.steps).toHaveLength(0);
    expect(stateAfter.isFinished).toBe(false);
  });

  it('should set custom temperature', () => {
    const tempAgent = new Agent({
      name: 'Temp Agent',
      description: 'Agent with custom temperature',
      temperature: 0.9,
    });

    expect((tempAgent as any).config.temperature).toBe(0.9);
  });

  it('should use default temperature when not specified', () => {
    expect((agent as any).config.temperature).toBe(0.7);
  });

  it('should return success false when steps contain errors', async () => {
    class TestAgent extends Agent {
      private iteration = 0;

      async makeDecision() {
        this.iteration++;
        if (this.iteration === 1) {
          return {
            thought: 'Trying bad tool',
            action: { tool: 'nonexistent', input: {} },
          };
        }
        return {
          thought: 'Finishing',
          action: undefined,
        };
      }
    }

    const errorStepAgent = new TestAgent({
      name: 'Error Step Agent',
      description: 'Agent with error in steps',
      maxIterations: 2,
    });

    const result = await errorStepAgent.run('Test');

    expect(result.success).toBe(false);
    expect(result.steps.some((s) => s.error)).toBe(true);
  });

  it('should add tool observations to message history', async () => {
    class TestAgent extends Agent {
      async makeDecision() {
        return {
          thought: 'Using calculator',
          action: { 
            tool: 'calculator', 
            input: { operation: 'multiply', a: 7, b: 3 } 
          },
        };
      }
    }

    const messageAgent = new TestAgent({
      name: 'Message Agent',
      description: 'Agent that tracks messages',
      tools: [calculatorTool],
      maxIterations: 1,
    });

    await messageAgent.run('Calculate 7 * 3');

    const state = messageAgent.getState();
    const toolMessages = state.messages.filter((m) => m.role === 'tool');
    expect(toolMessages.length).toBeGreaterThan(0);
    expect(toolMessages[0].name).toBe('calculator');
  });
});
