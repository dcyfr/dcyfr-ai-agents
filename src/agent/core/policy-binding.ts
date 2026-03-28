/**
 * Improvement Policy Binding — Agent Manifest Extension
 * TLP:AMBER - Internal Use Only
 *
 * Allows agents to declare which improvement-policy domains they consume.
 * When the metacognitive runtime approves and applies a policy snapshot,
 * bound agents receive the updated parameters on their next execution.
 *
 * This is an opt-in extension — agents that do not declare a binding are
 * entirely unaffected by the metacognitive runtime.
 *
 * @module agent/core/policy-binding
 */

// ---------------------------------------------------------------------------
// Policy binding types
// ---------------------------------------------------------------------------

/**
 * Declares that an agent consumes policies from one or more improvement domains.
 * Attached to an agent's options to opt into metacognitive policy updates.
 */
export interface ImprovementPolicyBinding {
  /**
   * Domain IDs this agent subscribes to.
   * Must match domain_id values registered in the transfer evaluation pipeline.
   * Examples: `['scoring_strategy', 'delegation_thresholds']`
   */
  domain_ids: string[];

  /**
   * Callback invoked when an approved policy snapshot is resolved for this agent.
   * The agent may use the snapshot's parameters to adjust its behavior.
   *
   * Called once per domain per resolution. Must not throw — errors are caught
   * and logged, leaving the agent in its current state.
   */
  onPolicySnapshot: (snapshot: ResolvedPolicySnapshot) => void | Promise<void>;

  /**
   * Whether to fail the agent if no approved snapshot is available for a
   * bound domain. Defaults to false (agent proceeds with current parameters).
   */
  requireSnapshot?: boolean;
}

/**
 * A resolved, approved policy snapshot delivered to a bound agent.
 * Contains the parameters the agent should adopt.
 */
export interface ResolvedPolicySnapshot {
  /** The domain this snapshot governs. */
  domain_id: string;

  /** Unique snapshot identifier for traceability. */
  snapshot_id: string;

  /** The approved policy parameters. */
  parameters: Record<string, unknown>;

  /** ISO timestamp when this snapshot was approved and applied. */
  applied_at: string;

  /** The proposal ID that produced this snapshot (for audit trail). */
  proposal_id: string;
}

// ---------------------------------------------------------------------------
// Policy resolver interface
// ---------------------------------------------------------------------------

/**
 * Interface for resolving approved policy snapshots from a ledger or registry.
 * Implementations may query the file-backed ledger, an in-memory registry,
 * or a remote policy service.
 */
export interface PolicySnapshotResolver {
  /**
   * Resolve the latest approved-and-applied snapshot for a domain.
   * Returns null if no approved snapshot exists for this domain.
   */
  resolveLatest(domainId: string): Promise<ResolvedPolicySnapshot | null>;
}

// ---------------------------------------------------------------------------
// Policy-binding manager
// ---------------------------------------------------------------------------

/**
 * Resolves and delivers approved policy snapshots to bound agents.
 *
 * Usage:
 * ```typescript
 * const manager = new PolicyBindingManager(resolver);
 * await manager.applyBindings(agentName, binding);
 * ```
 */
export class PolicyBindingManager {
  private readonly resolver: PolicySnapshotResolver;

  constructor(resolver: PolicySnapshotResolver) {
    this.resolver = resolver;
  }

  /**
   * Resolve approved snapshots for each of the agent's bound domains and
   * invoke `onPolicySnapshot` for each resolved snapshot.
   *
   * If `requireSnapshot` is true and a domain has no approved snapshot,
   * throws `PolicySnapshotRequiredError`.
   */
  async applyBindings(agentName: string, binding: ImprovementPolicyBinding): Promise<void> {
    for (const domainId of binding.domain_ids) {
      const snapshot = await this.resolver.resolveLatest(domainId);

      if (!snapshot) {
        if (binding.requireSnapshot) {
          throw new PolicySnapshotRequiredError(agentName, domainId);
        }
        // No snapshot available — agent continues with its current parameters
        continue;
      }

      try {
        await binding.onPolicySnapshot(snapshot);
      } catch (err) {
        // Non-fatal: log and continue; agent stays in current state
        console.warn(
          `[PolicyBindingManager] Agent "${agentName}" snapshot callback failed for domain "${domainId}":`,
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }
}

/** Thrown when `requireSnapshot=true` but no approved snapshot exists. */
export class PolicySnapshotRequiredError extends Error {
  constructor(
    public readonly agentName: string,
    public readonly domainId: string,
  ) {
    super(
      `Agent "${agentName}" requires an approved policy snapshot for domain "${domainId}" but none was found.`,
    );
    this.name = 'PolicySnapshotRequiredError';
  }
}

// ---------------------------------------------------------------------------
// In-memory resolver (for testing and shadow mode)
// ---------------------------------------------------------------------------

/**
 * In-memory PolicySnapshotResolver backed by a simple Map.
 * Used in tests and non-production environments.
 */
export class InMemoryPolicySnapshotResolver implements PolicySnapshotResolver {
  private snapshots: Map<string, ResolvedPolicySnapshot> = new Map();

  /** Register an approved snapshot for a domain. */
  register(snapshot: ResolvedPolicySnapshot): void {
    this.snapshots.set(snapshot.domain_id, snapshot);
  }

  async resolveLatest(domainId: string): Promise<ResolvedPolicySnapshot | null> {
    return this.snapshots.get(domainId) ?? null;
  }

  /** Clear all registered snapshots. */
  clear(): void {
    this.snapshots.clear();
  }
}
