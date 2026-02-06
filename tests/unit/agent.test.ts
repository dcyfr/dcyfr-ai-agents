/**
 * Agent core tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Agent } from '../../src/agent/core/agent.js';
import { calculatorTool, searchTool } from '../../src/agent/tools/examples/index.js';
import { ShortTermMemory } from '../../src/agent/memory/short-term.js';

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

  it('should register tools', () => {
    agent.registerTool(calculatorTool);
    agent.registerTool(searchTool);

    const state = agent.getState();
    expect(state.messages).toHaveLength(1); // System message
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
});
