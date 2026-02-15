/**
 * Agent Router with Runtime Awareness
 * 
 * Coordinates agent execution and detects whether agents are using
 * runtime-powered execution or placeholder fallback.
 * 
 * This is a lightweight router focused on runtime detection, unlike
 * the full AgentRouter in @dcyfr/ai which handles complex routing rules.
 */

import { Agent } from './agent.js';
import type {
  AgentResult,
} from '../../types/index.js';

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Prefer agents with runtime available */
  preferRuntime?: boolean;
  /** Enable telemetry tracking */
  telemetryEnabled?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Execution statistics
 */
export interface ExecutionStats {
  /** Total executions */
  totalExecutions: number;
  /** Executions using runtime */
  runtimeExecutions: number;
  /** Executions using placeholder */
  placeholderExecutions: number;
  /** Runtime availability rate (0-1) */
  runtimeAvailabilityRate: number;
}

/**
 * AgentRouter - Routes tasks to agents with runtime awareness
 */
export class AgentRouter {
  private agents: Map<string, Agent> = new Map();
  private config: Required<RouterConfig>;
  private stats: ExecutionStats = {
    totalExecutions: 0,
    runtimeExecutions: 0,
    placeholderExecutions: 0,
    runtimeAvailabilityRate: 0,
  };

  constructor(config: RouterConfig = {}) {
    this.config = {
      preferRuntime: config.preferRuntime ?? true,
      telemetryEnabled: config.telemetryEnabled ?? true,
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Register an agent with the router
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.getName(), agent);
    
    if (this.config.verbose) {
      console.log(`[AgentRouter] Registered agent: ${agent.getName()}`);
    }
  }

  /**
   * Check if runtime is available for agents
   * 
   * Attempts to dynamically import @dcyfr/ai to detect availability
   */
  async isRuntimeAvailable(): Promise<boolean> {
    try {
      await import('@dcyfr/ai');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute task with automatic fallback and runtime detection
   * 
   * @param agentName - Name of agent to execute
   * @param input - Task input
   */
  async executeWithFallback(
    agentName: string,
    input: string
  ): Promise<AgentResult & { usedRuntime: boolean }> {
    const agent = this.agents.get(agentName);
    
    if (!agent) {
      throw new Error(`Agent '${agentName}' not registered`);
    }

    const startTime = Date.now();
    const runtimeAvailable = await this.isRuntimeAvailable();

    // Execute agent (internally handles runtime vs placeholder)
    const result = await agent.run(input);

    // Detect which execution path was used
    // Check if result contains runtime-specific data
    const usedRuntime = runtimeAvailable && this.detectRuntimeUsage(result);

    // Update statistics
    this.updateStats(usedRuntime);

    // Emit telemetry if enabled
    if (this.config.telemetryEnabled) {
      this.emitTelemetry({
        agentName,
        executionTime: Date.now() - startTime,
        usedRuntime,
        runtimeAvailable,
        success: result.success,
      });
    }

    return {
      ...result,
      usedRuntime,
    };
  }

  /**
   * Get execution statistics
   */
  getStats(): ExecutionStats {
    return { ...this.stats };
  }

  /**
   * Reset execution statistics
   */
  resetStats(): void {
    this.stats = {
      totalExecutions: 0,
      runtimeExecutions: 0,
      placeholderExecutions: 0,
      runtimeAvailabilityRate: 0,
    };
  }

  /**
   * Get list of registered agents with runtime status
   */
  async getAgentStatus(): Promise<Array<{
    name: string;
    runtimeAvailable: boolean;
  }>> {
    const runtimeAvailable = await this.isRuntimeAvailable();
    
    return Array.from(this.agents.keys()).map((name) => ({
      name,
      runtimeAvailable,
    }));
  }

  /**
   * Detect if runtime was actually used by examining result
   * @private
   */
  private detectRuntimeUsage(result: AgentResult): boolean {
    // Runtime execution typically has more detailed steps
    // Placeholder immediately finishes with minimal steps
    if (result.steps.length > 1) {
      return true;
    }

    // Check if result has runtime-specific metadata
    if (result.metadata && 'sessionId' in result.metadata) {
      return true;
    }

    // Default to false (placeholder execution)
    return false;
  }

  /**
   * Update execution statistics
   * @private
   */
  private updateStats(usedRuntime: boolean): void {
    this.stats.totalExecutions++;
    
    if (usedRuntime) {
      this.stats.runtimeExecutions++;
    } else {
      this.stats.placeholderExecutions++;
    }

    this.stats.runtimeAvailabilityRate =
      this.stats.runtimeExecutions / this.stats.totalExecutions;
  }

  /**
   * Emit telemetry event
   * @private
   */
  private emitTelemetry(event: {
    agentName: string;
    executionTime: number;
    usedRuntime: boolean;
    runtimeAvailable: boolean;
    success: boolean;
  }): void {
    if (this.config.verbose) {
      console.log('[AgentRouter Telemetry]', {
        ...event,
        timestamp: Date.now(),
      });
    }

    // In production, this would send to a telemetry backend
    // For now, just log
  }
}
