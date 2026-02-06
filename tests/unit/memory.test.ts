/**
 * Memory systems tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShortTermMemory } from '../../src/agent/memory/short-term.js';
import { LongTermMemory } from '../../src/agent/memory/long-term.js';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('ShortTermMemory', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory(5);
  });

  it('should save and retrieve values', async () => {
    await memory.save('key1', 'value1');
    const value = await memory.get('key1');
    expect(value).toBe('value1');
  });

  it('should return undefined for missing keys', async () => {
    const value = await memory.get('nonexistent');
    expect(value).toBeUndefined();
  });

  it('should delete values', async () => {
    await memory.save('key1', 'value1');
    await memory.delete('key1');
    const value = await memory.get('key1');
    expect(value).toBeUndefined();
  });

  it('should list all keys', async () => {
    await memory.save('key1', 'value1');
    await memory.save('key2', 'value2');
    const keys = await memory.keys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should clear all data', async () => {
    await memory.save('key1', 'value1');
    await memory.save('key2', 'value2');
    await memory.clear();
    const keys = await memory.keys();
    expect(keys).toHaveLength(0);
  });

  it('should evict oldest entries when max size exceeded', async () => {
    const mem = new ShortTermMemory(3);
    await mem.save('key1', 'value1');
    await mem.save('key2', 'value2');
    await mem.save('key3', 'value3');
    await mem.save('key4', 'value4'); // Should evict key1

    expect(await mem.get('key1')).toBeUndefined();
    expect(await mem.get('key2')).toBe('value2');
    expect(await mem.get('key4')).toBe('value4');
  });

  it('should get recent entries', async () => {
    await memory.save('key1', 'value1');
    await memory.save('key2', 'value2');
    await memory.save('key3', 'value3');

    const recent = await memory.getRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].key).toBe('key2');
    expect(recent[1].key).toBe('key3');
  });

  it('should report size', () => {
    expect(memory.size()).toBe(0);
  });
});

describe('LongTermMemory', () => {
  let memory: LongTermMemory;
  let testFile: string;

  beforeEach(async () => {
    testFile = join(tmpdir(), `test-memory-${Date.now()}.json`);
    memory = new LongTermMemory({
      storagePath: testFile,
      autoSaveInterval: 0, // Disable auto-save for tests
    });
  });

  afterEach(async () => {
    await memory.dispose();
    try {
      await fs.unlink(testFile);
    } catch {
      // Ignore errors
    }
  });

  it('should save and load from disk', async () => {
    await memory.save('key1', 'value1');
    await memory.save('key2', { nested: 'value' });
    await memory.persist();

    // Create new instance and load
    const memory2 = new LongTermMemory({ storagePath: testFile });
    await memory2.load();

    expect(await memory2.get('key1')).toBe('value1');
    expect(await memory2.get('key2')).toEqual({ nested: 'value' });
  });

  it('should handle missing file on load', async () => {
    const nonExistentFile = join(tmpdir(), 'nonexistent.json');
    const mem = new LongTermMemory({ storagePath: nonExistentFile });

    await expect(mem.load()).resolves.not.toThrow();
    expect(await mem.keys()).toHaveLength(0);
  });

  it('should search keys by pattern', async () => {
    await memory.save('user:1', 'Alice');
    await memory.save('user:2', 'Bob');
    await memory.save('post:1', 'Hello');

    const userKeys = await memory.search(/^user:/);
    expect(userKeys).toHaveLength(2);
    expect(userKeys).toContain('user:1');
    expect(userKeys).toContain('user:2');
  });

  it('should get all entries', async () => {
    await memory.save('key1', 'value1');
    await memory.save('key2', 'value2');

    const all = await memory.getAll();
    expect(all).toHaveLength(2);
    expect(all.some((e) => e.key === 'key1')).toBe(true);
    expect(all.some((e) => e.key === 'key2')).toBe(true);
  });

  it('should import and export data', async () => {
    const data = {
      key1: 'value1',
      key2: 'value2',
      key3: { nested: true },
    };

    await memory.import(data);
    const exported = await memory.export();

    expect(exported).toEqual(data);
  });

  it('should track dirty state', async () => {
    let stats = memory.getStats();
    expect(stats.isDirty).toBe(false);

    await memory.save('key1', 'value1');
    stats = memory.getStats();
    expect(stats.isDirty).toBe(true);

    await memory.persist();
    stats = memory.getStats();
    expect(stats.isDirty).toBe(false);
  });

  it('should provide statistics', async () => {
    await memory.save('key1', 'value1');
    await memory.save('key2', 'value2');

    const stats = memory.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.storagePath).toBe(testFile);
  });
});
