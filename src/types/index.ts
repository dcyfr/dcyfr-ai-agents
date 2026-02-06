/**
 * Core types for the DCYFR agent framework
 */

import type { z } from 'zod';

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /** Agent name for identification */
  name: string;
  /** Agent description/purpose */
  description: string;
  /** Maximum iterations before stopping */
  maxIterations?: number;
  /** Temperature for LLM calls (0-1) */
  temperature?: number;
  /** Whether to enable verbose logging */
  verbose?: boolean;
  /** Custom system prompt */
  systemPrompt?: string;
}

/**
 * Tool definition for agent use
 */
export interface Tool<TInput = unknown, TOutput = unknown> {
  /** Unique tool identifier */
  name: string;
  /** Description for the agent */
  description: string;
  /** Zod schema for input validation */
  inputSchema: z.ZodType<TInput>;
  /** Tool execution function */
  execute: (input: TInput) => Promise<TOutput>;
  /** Optional examples for few-shot learning */
  examples?: ToolExample[];
}

/**
 * Tool execution example
 */
export interface ToolExample {
  input: Record<string, unknown>;
  output: unknown;
  description?: string;
}

/**
 * Agent execution step
 */
export interface AgentStep {
  /** Step number (1-indexed) */
  iteration: number;
  /** Agent's thought process */
  thought: string;
  /** Action to take */
  action?: {
    tool: string;
    input: unknown;
  };
  /** Tool execution result */
  observation?: unknown;
  /** Error if occurred */
  error?: Error;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  /** Final answer/output */
  output: string;
  /** All execution steps */
  steps: AgentStep[];
  /** Total iterations */
  iterations: number;
  /** Success status */
  success: boolean;
  /** Error if failed */
  error?: Error;
  /** Execution metadata */
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
}

/**
 * Agent state during execution
 */
export interface AgentState {
  /** Current iteration */
  iteration: number;
  /** Conversation messages */
  messages: AgentMessage[];
  /** Execution steps */
  steps: AgentStep[];
  /** Whether agent is finished */
  isFinished: boolean;
  /** Final output if finished */
  finalOutput?: string;
}

/**
 * Agent message format
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  timestamp: Date;
}

/**
 * Agent event types for observability
 */
export type AgentEvent =
  | { type: 'start'; data: { config: AgentConfig; input: string } }
  | { type: 'step'; data: AgentStep }
  | { type: 'tool_call'; data: { tool: string; input: unknown } }
  | { type: 'tool_result'; data: { tool: string; output: unknown } }
  | { type: 'error'; data: { error: Error; step?: number } }
  | { type: 'finish'; data: AgentResult };

/**
 * Agent event listener
 */
export type AgentEventListener = (event: AgentEvent) => void | Promise<void>;

/**
 * Memory store interface
 */
export interface MemoryStore {
  /** Save memory entry */
  save(key: string, value: unknown): Promise<void>;
  /** Retrieve memory entry */
  get(key: string): Promise<unknown | undefined>;
  /** Delete memory entry */
  delete(key: string): Promise<void>;
  /** Clear all memory */
  clear(): Promise<void>;
  /** List all keys */
  keys(): Promise<string[]>;
}

/**
 * Tool execution context
 */
export interface ToolContext {
  /** Agent configuration */
  agentConfig: AgentConfig;
  /** Current iteration */
  iteration: number;
  /** Memory store access */
  memory?: MemoryStore;
}
