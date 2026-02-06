/**
 * Long-term memory implementation
 * Persistent storage for agent knowledge and learned patterns
 */

import type { MemoryStore } from '../../types/index.js';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';

export interface LongTermMemoryOptions {
  /** Storage file path */
  storagePath: string;
  /** Auto-save interval in milliseconds (0 to disable) */
  autoSaveInterval?: number;
}

/**
 * File-based persistent memory storage
 */
export class LongTermMemory implements MemoryStore {
  private store: Map<string, unknown> = new Map();
  private storagePath: string;
  private autoSaveTimer?: NodeJS.Timeout;
  private isDirty = false;

  constructor(options: LongTermMemoryOptions) {
    this.storagePath = options.storagePath;

    // Setup auto-save if enabled
    if (options.autoSaveInterval && options.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(() => {
        if (this.isDirty) {
          void this.persist();
        }
      }, options.autoSaveInterval);
    }
  }

  /**
   * Load memory from disk
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8');
      const parsed = JSON.parse(data) as Record<string, unknown>;
      this.store = new Map(Object.entries(parsed));
      this.isDirty = false;
    } catch (error) {
      // File doesn't exist or is invalid - start with empty store
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error loading long-term memory:', error);
      }
      this.store = new Map();
    }
  }

  /**
   * Persist memory to disk
   */
  async persist(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(dirname(this.storagePath), { recursive: true });

      // Convert Map to object for JSON serialization
      const obj = Object.fromEntries(this.store);
      await fs.writeFile(this.storagePath, JSON.stringify(obj, null, 2), 'utf-8');
      this.isDirty = false;
    } catch (error) {
      console.error('Error persisting long-term memory:', error);
      throw error;
    }
  }

  async save(key: string, value: unknown): Promise<void> {
    this.store.set(key, value);
    this.isDirty = true;
  }

  async get(key: string): Promise<unknown | undefined> {
    return this.store.get(key);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.isDirty = true;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.isDirty = true;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  /**
   * Search for keys matching a pattern
   */
  async search(pattern: RegExp): Promise<string[]> {
    return Array.from(this.store.keys()).filter((key) => pattern.test(key));
  }

  /**
   * Get all entries
   */
  async getAll(): Promise<Array<{ key: string; value: unknown }>> {
    return Array.from(this.store.entries()).map(([key, value]) => ({ key, value }));
  }

  /**
   * Import data from another memory store
   */
  async import(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      this.store.set(key, value);
    }
    this.isDirty = true;
  }

  /**
   * Export data as plain object
   */
  async export(): Promise<Record<string, unknown>> {
    return Object.fromEntries(this.store);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    if (this.isDirty) {
      await this.persist();
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalEntries: number;
    isDirty: boolean;
    storagePath: string;
  } {
    return {
      totalEntries: this.store.size,
      isDirty: this.isDirty,
      storagePath: this.storagePath,
    };
  }
}
