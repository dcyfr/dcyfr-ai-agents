/**
 * Agent module exports
 */

export { Agent, type AgentOptions } from './core/agent.js';
export { AgentRouter, type RouterConfig, type ExecutionStats } from './core/router.js';
export {
  PolicyBindingManager,
  InMemoryPolicySnapshotResolver,
  PolicySnapshotRequiredError,
  type ImprovementPolicyBinding,
  type ResolvedPolicySnapshot,
  type PolicySnapshotResolver,
} from './core/policy-binding.js';
export * from './tools/index.js';
export * from './memory/index.js';

// Re-export core types
export type {
  AgentConfig,
  AgentResult,
  AgentState,
  AgentStep,
  AgentEvent,
  AgentEventListener,
  AgentMessage,
  Tool,
  ToolExample,
  ToolContext,
  MemoryStore,
} from '../types/index.js';
