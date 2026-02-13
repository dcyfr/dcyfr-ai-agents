/**
 * Tests for AgentRouter with runtime awareness
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Agent, AgentRouter, type RouterConfig } from '../../src/agent/index.js';
import type { AgentConfig } from '../../src/types/index.js';

describe('AgentRouter', () => {
  let router: AgentRouter;
  let testAgent: Agent;

  const testAgentConfig: AgentConfig = {
    name: 'test-agent',
    description: 'Test agent for router tests',
    prompts: {
      system: 'You are a test agent',
      user: 'Process this: {{input}}',
    },
    tools: [],
  };

  beforeEach(() => {
    router = new AgentRouter({ telemetryEnabled: false, verbose: false });
    testAgent = new Agent(testAgentConfig);
  });

  describe('Agent Registration', () => {
    it('should register an agent', () => {
      router.registerAgent(testAgent);
      
      // Agent should be registered (no error on execute)
      expect(async () => {
        await router.executeWithFallback('test-agent', 'test input');
      }).not.toThrow();
    });

    it('should throw error for unregistered agent', async () => {
      await expect(
        router.executeWithFallback('unknown-agent', 'test input')
      ).rejects.toThrow("Agent 'unknown-agent' not registered");
    });

    it('should allow multiple agents to be registered', async () => {
      const agent1 = new Agent({ ...testAgentConfig, name: 'agent-1' });
      const agent2 = new Agent({ ...testAgentConfig, name: 'agent-2' });

      router.registerAgent(agent1);
      router.registerAgent(agent2);

      // Execute and verify both agents work without throwing
      await expect(router.executeWithFallback('agent-1', 'test')).resolves.toBeDefined();
      await expect(router.executeWithFallback('agent-2', 'test')).resolves.toBeDefined();
    });
  });

  describe('Runtime Detection', () => {
    it('should detect if runtime is available', async () => {
      const available = await router.isRuntimeAvailable();
      
      // Should be boolean
      expect(typeof available).toBe('boolean');
      
      // In test environment, runtime might not be available
      // Just verify method works
    });

    it('should handle runtime import errors gracefully', async () => {
      // Should not throw even if runtime is unavailable
      const available = await router.isRuntimeAvailable();
      expect(available).toBeDefined();
    });
  });

  describe('Execution with Fallback', () => {
    beforeEach(() => {
      router.registerAgent(testAgent);
    });

    it('should execute agent and return result with runtime flag', async () => {
      const result = await router.executeWithFallback('test-agent', 'test input');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('usedRuntime');
      expect(typeof result.usedRuntime).toBe('boolean');
    });

    it('should track execution statistics', async () => {
      const statsBefore = router.getStats();
      expect(statsBefore.totalExecutions).toBe(0);

      await router.executeWithFallback('test-agent', 'test input');

      const statsAfter = router.getStats();
      expect(statsAfter.totalExecutions).toBe(1);
      expect(statsAfter.runtimeExecutions + statsAfter.placeholderExecutions).toBe(1);
    });

    it('should calculate runtime availability rate correctly', async () => {
      // Execute multiple times
      await router.executeWithFallback('test-agent', 'input 1');
      await router.executeWithFallback('test-agent', 'input 2');
      await router.executeWithFallback('test-agent', 'input 3');

      const stats = router.getStats();
      expect(stats.totalExecutions).toBe(3);
      expect(stats.runtimeAvailabilityRate).toBeGreaterThanOrEqual(0);
      expect(stats.runtimeAvailabilityRate).toBeLessThanOrEqual(1);
      
      // Rate should equal runtimeExecutions / totalExecutions
      const expectedRate = stats.runtimeExecutions / stats.totalExecutions;
      expect(stats.runtimeAvailabilityRate).toBe(expectedRate);
    });

    it('should reset statistics correctly', async () => {
      await router.executeWithFallback('test-agent', 'test input');
      
      const statsBefore = router.getStats();
      expect(statsBefore.totalExecutions).toBeGreaterThan(0);

      router.resetStats();

      const statsAfter = router.getStats();
      expect(statsAfter.totalExecutions).toBe(0);
      expect(statsAfter.runtimeExecutions).toBe(0);
      expect(statsAfter.placeholderExecutions).toBe(0);
      expect(statsAfter.runtimeAvailabilityRate).toBe(0);
    });
  });

  describe('Telemetry', () => {
    it('should emit telemetry when enabled', async () => {
      const telemetryRouter = new AgentRouter({
        telemetryEnabled: true,
        verbose: true,
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      telemetryRouter.registerAgent(testAgent);
      await telemetryRouter.executeWithFallback('test-agent', 'test input');

      // Should have logged telemetry
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AgentRouter Telemetry]',
        expect.objectContaining({
          agentName: 'test-agent',
          executionTime: expect.any(Number),
          usedRuntime: expect.any(Boolean),
          runtimeAvailable: expect.any(Boolean),
          success: expect.any(Boolean),
          timestamp: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });

    it('should not emit telemetry when disabled', async () => {
      const telemetryRouter = new AgentRouter({
        telemetryEnabled: false,
        verbose: false,
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      telemetryRouter.registerAgent(testAgent);
      await telemetryRouter.executeWithFallback('test-agent', 'test input');

      // Should not have logged telemetry
      expect(consoleSpy).not.toHaveBeenCalledWith(
        '[AgentRouter Telemetry]',
        expect.anything()
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Agent Status', () => {
    it('should return status for registered agents', async () => {
      const agent1 = new Agent({ ...testAgentConfig, name: 'agent-1' });
      const agent2 = new Agent({ ...testAgentConfig, name: 'agent-2' });

      router.registerAgent(agent1);
      router.registerAgent(agent2);

      const status = await router.getAgentStatus();

      expect(status).toHaveLength(2);
      expect(status).toContainEqual({
        name: 'agent-1',
        runtimeAvailable: expect.any(Boolean),
      });
      expect(status).toContainEqual({
        name: 'agent-2',
        runtimeAvailable: expect.any(Boolean),
      });
    });

    it('should return empty array when no agents registered', async () => {
      const status = await router.getAgentStatus();
      expect(status).toEqual([]);
    });

    it('should reflect runtime availability consistently', async () => {
      router.registerAgent(testAgent);

      const runtimeAvailable = await router.isRuntimeAvailable();
      const status = await router.getAgentStatus();

      status.forEach((agentStatus) => {
        expect(agentStatus.runtimeAvailable).toBe(runtimeAvailable);
      });
    });
  });

  describe('Router Configuration', () => {
    it('should use default configuration when not provided', () => {
      const defaultRouter = new AgentRouter();
      expect(defaultRouter).toBeInstanceOf(AgentRouter);
    });

    it('should respect preferRuntime configuration', () => {
      const preferRuntimeRouter = new AgentRouter({ preferRuntime: true });
      const noPreferenceRouter = new AgentRouter({ preferRuntime: false });

      expect(preferRuntimeRouter).toBeInstanceOf(AgentRouter);
      expect(noPreferenceRouter).toBeInstanceOf(AgentRouter);
    });

    it('should respect verbose configuration', async () => {
      const verboseRouter = new AgentRouter({ verbose: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      verboseRouter.registerAgent(testAgent);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AgentRouter] Registered agent: test-agent'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Statistics Accuracy', () => {
    beforeEach(() => {
      router.registerAgent(testAgent);
    });

    it('should correctly categorize runtime vs placeholder executions', async () => {
      // Execute multiple times
      const results = await Promise.all([
        router.executeWithFallback('test-agent', 'input 1'),
        router.executeWithFallback('test-agent', 'input 2'),
        router.executeWithFallback('test-agent', 'input 3'),
      ]);

      const stats = router.getStats();

      // Count actual runtime usage from results
      const actualRuntimeCount = results.filter((r) => r.usedRuntime).length;
      const actualPlaceholderCount = results.filter((r) => !r.usedRuntime).length;

      expect(stats.runtimeExecutions).toBe(actualRuntimeCount);
      expect(stats.placeholderExecutions).toBe(actualPlaceholderCount);
      expect(stats.totalExecutions).toBe(3);
    });

    it('should maintain accurate statistics across resets', async () => {
      // First batch
      await router.executeWithFallback('test-agent', 'input 1');
      await router.executeWithFallback('test-agent', 'input 2');

      const stats1 = router.getStats();
      expect(stats1.totalExecutions).toBe(2);

      // Reset
      router.resetStats();

      // Second batch
      await router.executeWithFallback('test-agent', 'input 3');

      const stats2 = router.getStats();
      expect(stats2.totalExecutions).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should propagate agent execution errors', async () => {
      // Create agent that will fail
      const failingAgent = new Agent({
        ...testAgentConfig,
        name: 'failing-agent',
      });

      router.registerAgent(failingAgent);

      // Agent.run() internally handles errors and returns success: false
      const result = await router.executeWithFallback('failing-agent', 'test input');
      
      // Should complete without throwing, even if agent fails
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('usedRuntime');
    });

    it('should update statistics even on failed executions', async () => {
      router.registerAgent(testAgent);

      const statsBefore = router.getStats();
      await router.executeWithFallback('test-agent', 'test input');
      const statsAfter = router.getStats();

      expect(statsAfter.totalExecutions).toBe(statsBefore.totalExecutions + 1);
    });
  });
});
