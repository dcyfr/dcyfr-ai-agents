/**
 * Policy binding tests — task 4.1
 * TLP:AMBER - Internal Use Only
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PolicyBindingManager,
  InMemoryPolicySnapshotResolver,
  PolicySnapshotRequiredError,
} from '../src/agent/core/policy-binding.js';
import type { ImprovementPolicyBinding, ResolvedPolicySnapshot } from '../src/agent/core/policy-binding.js';

function makeSnapshot(domainId: string, params: Record<string, unknown> = {}): ResolvedPolicySnapshot {
  return {
    domain_id: domainId,
    snapshot_id: `snap-${domainId}`,
    parameters: { threshold: 0.8, ...params },
    applied_at: '2026-01-01T00:00:00.000Z',
    proposal_id: `proposal-${domainId}`,
  };
}

describe('InMemoryPolicySnapshotResolver', () => {
  let resolver: InMemoryPolicySnapshotResolver;

  beforeEach(() => {
    resolver = new InMemoryPolicySnapshotResolver();
  });

  it('returns null for unregistered domain', async () => {
    expect(await resolver.resolveLatest('unknown')).toBeNull();
  });

  it('returns registered snapshot', async () => {
    const snap = makeSnapshot('scoring_strategy');
    resolver.register(snap);
    expect(await resolver.resolveLatest('scoring_strategy')).toEqual(snap);
  });

  it('clear removes all snapshots', async () => {
    resolver.register(makeSnapshot('scoring_strategy'));
    resolver.clear();
    expect(await resolver.resolveLatest('scoring_strategy')).toBeNull();
  });
});

describe('PolicyBindingManager', () => {
  let resolver: InMemoryPolicySnapshotResolver;
  let manager: PolicyBindingManager;

  beforeEach(() => {
    resolver = new InMemoryPolicySnapshotResolver();
    manager = new PolicyBindingManager(resolver);
  });

  it('calls onPolicySnapshot for each resolved domain', async () => {
    resolver.register(makeSnapshot('scoring_strategy'));
    resolver.register(makeSnapshot('delegation_thresholds'));

    const received: ResolvedPolicySnapshot[] = [];
    const binding: ImprovementPolicyBinding = {
      domain_ids: ['scoring_strategy', 'delegation_thresholds'],
      onPolicySnapshot: (snap) => { received.push(snap); },
    };

    await manager.applyBindings('test-agent', binding);
    expect(received).toHaveLength(2);
    expect(received.map((s) => s.domain_id)).toEqual(['scoring_strategy', 'delegation_thresholds']);
  });

  it('skips domain with no snapshot when requireSnapshot=false', async () => {
    const onSnapshot = vi.fn();
    const binding: ImprovementPolicyBinding = {
      domain_ids: ['scoring_strategy'],
      onPolicySnapshot: onSnapshot,
      requireSnapshot: false,
    };

    await manager.applyBindings('test-agent', binding);
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it('throws PolicySnapshotRequiredError when requireSnapshot=true and no snapshot', async () => {
    const binding: ImprovementPolicyBinding = {
      domain_ids: ['scoring_strategy'],
      onPolicySnapshot: vi.fn(),
      requireSnapshot: true,
    };

    await expect(manager.applyBindings('strict-agent', binding)).rejects.toThrow(
      PolicySnapshotRequiredError,
    );
  });

  it('does not throw if requireSnapshot=true and snapshot is available', async () => {
    resolver.register(makeSnapshot('scoring_strategy'));
    const onSnapshot = vi.fn();
    const binding: ImprovementPolicyBinding = {
      domain_ids: ['scoring_strategy'],
      onPolicySnapshot: onSnapshot,
      requireSnapshot: true,
    };

    await expect(manager.applyBindings('strict-agent', binding)).resolves.toBeUndefined();
    expect(onSnapshot).toHaveBeenCalledOnce();
  });

  it('continues with remaining domains if one callback throws', async () => {
    resolver.register(makeSnapshot('scoring_strategy'));
    resolver.register(makeSnapshot('delegation_thresholds'));

    const received: string[] = [];
    const binding: ImprovementPolicyBinding = {
      domain_ids: ['scoring_strategy', 'delegation_thresholds'],
      onPolicySnapshot: (snap) => {
        if (snap.domain_id === 'scoring_strategy') throw new Error('callback error');
        received.push(snap.domain_id);
      },
    };

    await manager.applyBindings('test-agent', binding);
    // scoring_strategy error was swallowed; delegation_thresholds was processed
    expect(received).toEqual(['delegation_thresholds']);
  });

  it('delivers correct parameters from snapshot', async () => {
    resolver.register(makeSnapshot('scoring_strategy', { threshold: 0.92, weight: 1.5 }));

    let received: ResolvedPolicySnapshot | null = null;
    const binding: ImprovementPolicyBinding = {
      domain_ids: ['scoring_strategy'],
      onPolicySnapshot: (snap) => { received = snap; },
    };

    await manager.applyBindings('test-agent', binding);
    expect(received).not.toBeNull();
    expect((received as unknown as ResolvedPolicySnapshot).parameters['threshold']).toBe(0.92);
    expect((received as unknown as ResolvedPolicySnapshot).parameters['weight']).toBe(1.5);
  });
});
