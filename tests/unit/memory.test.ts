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

  it('should handle errors during persist', async () => {
    // Create memory with invalid path (trying to write to a directory)
    const invalidPath = '/invalid/path/that/does/not/exist/file.json';
    const mem = new LongTermMemory({ storagePath: invalidPath, autoSaveInterval: 0 });
    
    await mem.save('key1', 'value1');
    
    // Persist should throw an error
    await expect(mem.persist()).rejects.toThrow();
  });

  it('should handle auto-save functionality', async () => {
    const autoSaveFile = join(tmpdir(), `auto-save-${Date.now()}.json`);
    const autoSaveMem = new LongTermMemory({
      storagePath: autoSaveFile,
      autoSaveInterval: 100, // 100ms auto-save
    });

    try {
      await autoSaveMem.save('key1', 'value1');
      
      // Wait for auto-save to trigger (give it 200ms)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create new instance and verify data was persisted
      const verifyMem = new LongTermMemory({ storagePath: autoSaveFile });
      await verifyMem.load();
      expect(await verifyMem.get('key1')).toBe('value1');
      
      await autoSaveMem.dispose();
      await verifyMem.dispose();
      await fs.unlink(autoSaveFile);
    } catch (error) {
      await autoSaveMem.dispose().catch(() => {});
      throw error;
    }
  });

  it('should dispose and save dirty data', async () => {
    await memory.save('dispose-key', 'dispose-value');
    await memory.dispose();

    // Load in new instance to verify dispose persisted data
    const mem2 = new LongTermMemory({ storagePath: testFile });
    await mem2.load();
    expect(await mem2.get('dispose-key')).toBe('dispose-value');
    await mem2.dispose();
  });

  it('should handle load errors for corrupted files', async () => {
    // Write invalid JSON to file
    const corruptedFile = join(tmpdir(), `corrupted-${Date.now()}.json`);
    await fs.writeFile(corruptedFile, 'invalid json {[}', 'utf-8');

    const mem = new LongTermMemory({ storagePath: corruptedFile });
    
    // Should not throw, but log error and start with empty store
    await mem.load();
    expect(await mem.keys()).toHaveLength(0);
    
    await mem.dispose();
    await fs.unlink(corruptedFile).catch(() => {});
  });

  it('should delete and clear operations', async () => {
    await memory.save('delete-test', 'value');
    await memory.save('clear-test', 'value');
    
    await memory.delete('delete-test');
    expect(await memory.get('delete-test')).toBeUndefined();
    
    await memory.clear();
    expect(await memory.keys()).toHaveLength(0);
  });
});
