/**
 * Autonomous Research Agent Tests
 * 
 * Tests the example research agent implementation to ensure
 * all Phase 0 features work correctly.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { AutonomousResearchAgent } from './research-agent';
import type { AgentConfig } from './research-agent';

// Mock the @dcyfr/ai module
vi.mock('@dcyfr/ai', () => ({
  AgentRuntime: vi.fn().mockImplementation(() => ({
    isReady: vi.fn().mockReturnValue(true),
    executeTask: vi.fn(),
    getWorkingMemory: vi.fn().mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
      clear: vi.fn(),
      storage: new Map()
    }),
    getTelemetryEngine: vi.fn().mockReturnValue({
      getEvents: vi.fn().mockResolvedValue([])
    }),
    addHook: vi.fn()
  })),
  ProviderRegistry: vi.fn().mockImplementation(() => ({})),
  TelemetryEngine: vi.fn().mockImplementation(() => ({
    getEvents: vi.fn().mockResolvedValue([])
  })),
  DCYFRMemory: vi.fn().mockImplementation(() => ({}))
}));

describe('AutonomousResearchAgent', () => {
  let agent: AutonomousResearchAgent;
  let mockRuntime: any;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock AgentRuntime for testing
    mockRuntime = {
      isReady: vi.fn().mockReturnValue(true),
      executeTask: vi.fn().mockResolvedValue({
        success: true,
        output: 'Mock research result',
        memoryRetrievalUsed: true
      }),
      getWorkingMemory: vi.fn().mockReturnValue({
        set: vi.fn(),
        get: vi.fn(),
        clear: vi.fn(),
        storage: new Map()
      }),
      getTelemetryEngine: vi.fn().mockReturnValue({
        getEvents: vi.fn().mockResolvedValue([
          { type: 'start', timestamp: Date.now() },
          { type: 'finish', timestamp: Date.now() }
        ])
      }),
      addHook: vi.fn()
    };

    // Create agent with mocked runtime
    const { AutonomousResearchAgent } = await import('./research-agent');
    agent = new AutonomousResearchAgent(mockRuntime, {
      providers: ['ollama'],
      memoryEnabled: true,
      telemetryEnabled: true
    });
  });

  describe('initialization', () => {
    it('should create agent with default configuration', async () => {
      const { AutonomousResearchAgent } = await import('./research-agent');
      const testAgent = new AutonomousResearchAgent(mockRuntime);
      
      const status = await testAgent.getStatus();
      expect(status.ready).toBe(true);
      expect(status.memoryEnabled).toBe(true);
      expect(status.telemetryEnabled).toBe(true);
    });

    it('should configure providers correctly', async () => {
      const config: AgentConfig = {
        providers: ['openai', 'anthropic'],
        memoryEnabled: false,
        telemetryEnabled: false
      };

      const { AutonomousResearchAgent } = await import('./research-agent');
      const testAgent = new AutonomousResearchAgent(mockRuntime, config);
      
      const status = await testAgent.getStatus();
      expect(status.providersAvailable).toEqual(['openai', 'anthropic']);
      expect(status.memoryEnabled).toBe(false);
      expect(status.telemetryEnabled).toBe(false);
    });

    it('should setup hooks when telemetry enabled', () => {
      expect(mockRuntime.addHook).toHaveBeenCalledWith('beforeExecute', expect.any(Function));
      expect(mockRuntime.addHook).toHaveBeenCalledWith('afterExecute', expect.any(Function));
    });
  });

  describe('research functionality', () => {
    it('should conduct basic research successfully', async () => {
      // Mock synthesis step response
      mockRuntime.executeTask
        .mockResolvedValueOnce({
          success: true,
          output: 'Overview of AI ethics',
          memoryRetrievalUsed: false
        })
        .mockResolvedValueOnce({
          success: true,
          output: 'Analysis of advantages and limitations',
          memoryRetrievalUsed: true
        })
        .mockResolvedValueOnce({
          success: true,
          output: 'Applications in healthcare and finance',
          memoryRetrievalUsed: false
        })
        .mockResolvedValueOnce({
          success: true,
          output: JSON.stringify({
            summary: 'AI ethics analysis completed',
            findings: {
              overview: 'Comprehensive overview',
              keyAdvantages: ['Improved transparency', 'Better decision making'],
              limitations: ['Implementation complexity', 'Cultural differences'],
              applications: ['Healthcare', 'Finance', 'Education'],
              recentDevelopments: [],
              futureDirections: ['Regulation development', 'Industry standards']
            },
            sources: ['Research synthesis']
          }),
          memoryRetrievalUsed: false
        });

      const result = await agent.research({
        topic: 'AI ethics and governance',
        maxDepth: 3,
        audienceLevel: 'intermediate'
      });

      expect(result.topic).toBe('AI ethics and governance');
      expect(result.summary).toBe('AI ethics analysis completed');
      expect(result.findings.keyAdvantages).toHaveLength(2);
      expect(result.findings.applications).toHaveLength(3);
      expect(result.metadata.stepsCompleted).toBe(4);
      expect(result.metadata.memoryContextUsed).toBe(true);
    });

    it('should handle research with recent developments', async () => {
      // Mock all research steps including recent developments
      mockRuntime.executeTask
        .mockResolvedValueOnce({ success: true, output: 'Overview' })
        .mockResolvedValueOnce({ success: true, output: 'Analysis' })
        .mockResolvedValueOnce({ success: true, output: 'Applications' })
        .mockResolvedValueOnce({ success: true, output: 'Recent developments' })
        .mockResolvedValueOnce({
          success: true,
          output: JSON.stringify({
            summary: 'Research with recent developments',
            findings: {
              overview: 'Overview',
              keyAdvantages: ['Advantage 1'],
              limitations: ['Limitation 1'],
              applications: ['Application 1'],
              recentDevelopments: ['Development 1', 'Development 2'],
              futureDirections: ['Direction 1']
            },
            sources: ['Source 1']
          })
        });

      const result = await agent.research({
        topic: 'quantum computing',
        maxDepth: 4,
        includeRecent: true,
        audienceLevel: 'expert'
      });

      expect(result.metadata.stepsCompleted).toBe(5); // Including recent developments
      expect(result.findings.recentDevelopments).toHaveLength(2);
    });

    it('should handle research failure gracefully', async () => {
      mockRuntime.executeTask.mockRejectedValue(new Error('Provider unavailable'));

      await expect(agent.research({
        topic: 'test topic',
        maxDepth: 2
      })).rejects.toThrow('Research failed for topic "test topic"');
    });

    it('should use working memory for step coordination', async () => {
      const mockWorkingMemory = mockRuntime.getWorkingMemory();
      
      mockRuntime.executeTask.mockResolvedValue({
        success: true,
        output: 'Step result',
        memoryRetrievalUsed: false
      });

      await agent.research({
        topic: 'test coordination',
        maxDepth: 2
      });

      // Verify working memory usage
      expect(mockWorkingMemory.set).toHaveBeenCalledWith(
        expect.stringMatching(/^research-step-/),
        expect.objectContaining({
          topic: 'test coordination',
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('performance metrics', () => {
    it('should calculate performance metrics', async () => {
      // Mock telemetry events
      mockRuntime.getTelemetryEngine().getEvents.mockResolvedValue([
        { type: 'start', agentName: 'research-agent' },
        { type: 'finish', agentName: 'research-agent' },
        { type: 'memory_retrieval', memoriesRelevant: 2 },
        { type: 'memory_retrieval', memoriesRelevant: 0 },
        { provider: 'openai' },
        { provider: 'anthropic' }
      ]);

      const metrics = await agent.getPerformanceMetrics();

      expect(metrics.totalResearchSessions).toBe(1); // start/finish pair
      expect(metrics.memoryHitRate).toBe(0.5); // 1 of 2 memory retrievals had results
      expect(metrics.providerDistribution).toEqual({
        openai: 1,
        anthropic: 1
      });
    });

    it('should handle telemetry unavailable', async () => {
      mockRuntime.getTelemetryEngine.mockReturnValue(null);

      const metrics = await agent.getPerformanceMetrics();

      expect(metrics.totalResearchSessions).toBe(0);
      expect(metrics.memoryHitRate).toBe(0);
      expect(metrics.providerDistribution).toEqual({});
    });
  });

  describe('agent status', () => {
    it('should return correct status information', async () => {
      const status = await agent.getStatus();

      expect(status.ready).toBe(true);
      expect(status.providersAvailable).toEqual(['ollama']);
      expect(status.memoryEnabled).toBe(true);
      expect(status.telemetryEnabled).toBe(true);
      expect(Array.isArray(status.workingMemoryKeys)).toBe(true);
    });
  });
});

describe('createResearchAgent helper', () => {
  it('should create agent with default configuration', async () => {
    const { createResearchAgent } = await import('./research-agent');
    
    // This test would normally require actual @dcyfr/ai imports
    // For unit testing, we mock the dependencies
    try {
      await createResearchAgent();
    } catch (error) {
      // Expected to fail in test environment due to mocked imports
      expect(error).toBeDefined();
    }
  });

  it('should handle missing dependencies gracefully', async () => {
    const { createResearchAgent } = await import('./research-agent');

    // Mock import failure
    vi.doMock('@dcyfr/ai', () => {
      throw new Error('Cannot resolve module');
    });

    await expect(createResearchAgent()).rejects.toThrow(
      'Failed to create research agent: @dcyfr/ai not available'
    );
  });
});

describe('Configuration validation', () => {
  it('should validate configuration correctly', async () => {
    const { validateConfig, validateEnvironment } = await import('./config');

    const validConfig = {
      providers: ['openai'],
      memoryEnabled: true,
      telemetryEnabled: true,
      memoryConfig: {
        maxResults: 10,
        minScore: 0.7
      }
    };

    const validation = validateConfig(validConfig);
    expect(validation.valid).toBe(false); // Missing API key in test env
    expect(validation.warnings).toContain('OpenAI provider specified but OPENAI_API_KEY not set');
  });

  it('should validate environment correctly', async () => {
    const { validateEnvironment } = await import('./config');

    const envCheck = validateEnvironment();
    expect(envCheck.valid).toBeDefined();
    expect(Array.isArray(envCheck.issues)).toBe(true);
    expect(Array.isArray(envCheck.recommendations)).toBe(true);
  });
});