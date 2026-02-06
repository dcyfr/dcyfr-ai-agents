/**
 * Short-term memory implementation
 * Stores conversation context and recent interactions
 */

import type { MemoryStore } from '../../types/index.js';

/**
 * In-memory storage for short-term context
 */
export class ShortTermMemory implements MemoryStore {
  private store: Map<string, unknown> = new Map();
  private maxSize: number;
  private insertionOrder: string[] = [];

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  async save(key: string, value: unknown): Promise<void> {
    // If key exists, remove from insertion order
    if (this.store.has(key)) {
      this.insertionOrder = this.insertionOrder.filter((k) => k !== key);
    }

    // Add to store
    this.store.set(key, value);
    this.insertionOrder.push(key);

    // Evict oldest if over limit
    while (this.insertionOrder.length > this.maxSize) {
      const oldestKey = this.insertionOrder.shift();
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }
  }

  async get(key: string): Promise<unknown | undefined> {
    return this.store.get(key);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.insertionOrder = this.insertionOrder.filter((k) => k !== key);
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.insertionOrder = [];
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  /**
   * Get the most recent N entries
   */
  async getRecent(count: number): Promise<Array<{ key: string; value: unknown }>> {
    const recentKeys = this.insertionOrder.slice(-count);
    return recentKeys
      .map((key) => ({
        key,
        value: this.store.get(key)!,
      }))
      .filter((entry) => entry.value !== undefined);
  }

  /**
   * Get memory size
   */
  size(): number {
    return this.store.size;
  }
}
