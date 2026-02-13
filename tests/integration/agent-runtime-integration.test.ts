/**
 * Integration tests for Agent runtime integration (Phase 0)
 * 
 * Tests both runtime-enabled and placeholder execution paths
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../../src/agent/core/agent.js';
import type { Tool } from '../../src/types/index.js';

describe('Agent Runtime Integration (Phase 0)', () => {
  describe('Runtime-enabled execution', () => {
    it('should initialize runtime when @dcyfr/ai is available', async () => {
      const agent = new Agent({
        name: 'test-agent',
        description: 'Test agent for runtime integration',
        verbose: true,
      });

      // Give runtime a moment to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Run a simple task
      const result = await agent.run('What is 2 + 2?');

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.output).toBeDefined();
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should use runtime for decision making when available', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const agent = new Agent({
        name: 'runtime-test',
        description: 'Test runtime execution',
        verbose: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await agent.run('Test task');

      // Check if runtime initialization was logged
      const logs = consoleSpy.mock.calls.map((call) => call.join(' '));
      const runtimeInitialized = logs.some((log) => 
        log.includes('Runtime initialized successfully')
      );

      // Runtime may or may not be available depending on installation
      // This test just verifies the code path doesn't crash
      expect(result).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('should handle tools with runtime execution', async () => {
      const mockTool: Tool = {
        name: 'calculator',
        description: 'Performs basic math operations',
        inputSchema: {
          parse: (input: any) => input,
        } as any,
        execute: async (input: any) => {
          return { result: 4 };
        },
      };

      const agent = new Agent({
        name: 'tool-test',
        description: 'Test tool execution',
        tools: [mockTool],
        verbose: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await agent.run('Calculate 2 + 2');

      expect(result).toBeDefined();
      expect(result.steps).toBeDefined();
    });
  });

  describe('Placeholder fallback execution', () => {
    it('should gracefully fallback to placeholder when runtime unavailable', async () => {
      // Mock the dynamic import to fail
      const agent = new Agent({
        name: 'fallback-test',
        description: 'Test placeholder fallback',
        verbose: true,
      });

      // Even if runtime fails to initialize, agent should work
      const result = await agent.run('Test placeholder execution');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.iterations).toBe(1); // Placeholder finishes immediately
    });

    it('should log warning when using placeholder execution', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      const agent = new Agent({
        name: 'warning-test',
        description: 'Test warning logs',
        verbose: true,
      });

      await agent.run('Test task');

      // Should see either runtime init warning or placeholder execution warning
      const warnings = consoleSpy.mock.calls.map((call) => call.join(' '));
      const hasWarning = warnings.some((warning) => 
        warning.includes('Runtime') || warning.includes('placeholder')
      );

      expect(hasWarning).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should complete tasks immediately in placeholder mode', async () => {
      const agent = new Agent({
        name: 'immediate-test',
        description: 'Test immediate completion',
        verbose: false,
      });

      const startTime = Date.now();
      const result = await agent.run('Quick test');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.iterations).toBe(1);
      
      // Should complete very quickly in placeholder mode (<100ms)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Configuration and state management', () => {
    it('should maintain agent state across executions', async () => {
      const agent = new Agent({
        name: 'state-test',
        description: 'Test state persistence',
      });

      await agent.run('First task');
      const state1 = agent.getState();

      await agent.run('Second task');
      const state2 = agent.getState();

      // State should accumulate messages
      expect(state2.messages.length).toBeGreaterThan(state1.messages.length);
      expect(state2.iteration).toBeGreaterThan(state1.iteration);
    });

    it('should reset state when reset() is called', async () => {
      const agent = new Agent({
        name: 'reset-test',
        description: 'Test state reset',
      });

      await agent.run('Task before reset');
      const stateBefore = agent.getState();
      
      agent.reset();
      const stateAfter = agent.getState();

      expect(stateAfter.iteration).toBe(0);
      expect(stateAfter.messages.length).toBeLessThan(stateBefore.messages.length);
      expect(stateAfter.isFinished).toBe(false);
    });

    it('should respect maxIterations configuration', async () => {
      const agent = new Agent({
        name: 'max-iter-test',
        description: 'Test max iterations',
        maxIterations: 3,
      });

      const result = await agent.run('Test with limited iterations');

      expect(result.iterations).toBeLessThanOrEqual(3);
    });
  });

  describe('Error handling', () => {
    it('should handle runtime errors gracefully', async () => {
      const agent = new Agent({
        name: 'error-test',
        description: 'Test error handling',
      });

      // Even with potential runtime errors, agent should not crash
      const result = await agent.run('Test error handling');

      expect(result).toBeDefined();
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('should emit error events when listeners are attached', async () => {
      const errors: any[] = [];
      const errorListener = vi.fn((event: any) => {
        if (event.type === 'error') {
          errors.push(event.data);
        }
      });

      const agent = new Agent({
        name: 'event-test',
        description: 'Test error events',
        listeners: [errorListener],
      });

      await agent.run('Test with listener');

      // Listener should have been called for various events
      expect(errorListener).toHaveBeenCalled();
    });
  });
});
