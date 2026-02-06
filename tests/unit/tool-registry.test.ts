/**
 * Tool registry tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../../src/agent/tools/registry.js';
import { calculatorTool, searchTool } from '../../src/agent/tools/examples/index.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register tools', () => {
    registry.register(calculatorTool);
    registry.register(searchTool);

    expect(registry.has('calculator')).toBe(true);
    expect(registry.has('search')).toBe(true);
    expect(registry.getNames()).toContain('calculator');
    expect(registry.getNames()).toContain('search');
  });

  it('should prevent duplicate registration', () => {
    registry.register(calculatorTool);

    expect(() => registry.register(calculatorTool)).toThrow('Tool already registered');
  });

  it('should unregister tools', () => {
    registry.register(calculatorTool);
    expect(registry.has('calculator')).toBe(true);

    const removed = registry.unregister('calculator');
    expect(removed).toBe(true);
    expect(registry.has('calculator')).toBe(false);
  });

  it('should get tool by name', () => {
    registry.register(calculatorTool);

    const tool = registry.get('calculator');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('calculator');
  });

  it('should get all tools', () => {
    registry.register(calculatorTool);
    registry.register(searchTool);

    const tools = registry.getAll();
    expect(tools).toHaveLength(2);
  });

  it('should organize tools by category', () => {
    registry.register(calculatorTool, 'math');
    registry.register(searchTool, 'information');

    expect(registry.getCategories()).toContain('math');
    expect(registry.getCategories()).toContain('information');

    const mathTools = registry.getByCategory('math');
    expect(mathTools).toHaveLength(1);
    expect(mathTools[0].name).toBe('calculator');
  });

  it('should execute tools with validation', async () => {
    registry.register(calculatorTool);

    const result = await registry.execute<{ operation: 'add'; a: number; b: number }, number>(
      'calculator',
      { operation: 'add', a: 5, b: 3 }
    );

    expect(result).toBe(8);
  });

  it('should throw on invalid tool execution', async () => {
    registry.register(calculatorTool);

    await expect(
      registry.execute('nonexistent', {})
    ).rejects.toThrow('Tool not found');
  });

  it('should generate tool descriptions', () => {
    registry.register(calculatorTool);
    registry.register(searchTool);

    const descriptions = registry.getDescriptions();
    expect(descriptions).toContain('calculator');
    expect(descriptions).toContain('search');
  });

  it('should provide statistics', () => {
    registry.register(calculatorTool, 'math');
    registry.register(searchTool, 'information');

    const stats = registry.getStats();
    expect(stats.totalTools).toBe(2);
    expect(stats.totalCategories).toBe(2);
    expect(stats.toolsByCategory.math).toBe(1);
    expect(stats.toolsByCategory.information).toBe(1);
  });

  it('should clear all tools', () => {
    registry.register(calculatorTool);
    registry.register(searchTool);

    expect(registry.getAll()).toHaveLength(2);

    registry.clear();

    expect(registry.getAll()).toHaveLength(0);
    expect(registry.getCategories()).toHaveLength(0);
  });
});
