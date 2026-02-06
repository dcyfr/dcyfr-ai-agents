/**
 * Example tools tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculatorTool,
  searchTool,
  getCurrentTimeTool,
  stringManipulationTool,
} from '../../src/agent/tools/examples/index.js';

describe('Example Tools', () => {
  describe('calculatorTool', () => {
    it('should add numbers', async () => {
      const result = await calculatorTool.execute({ operation: 'add', a: 5, b: 3 });
      expect(result).toBe(8);
    });

    it('should subtract numbers', async () => {
      const result = await calculatorTool.execute({ operation: 'subtract', a: 10, b: 4 });
      expect(result).toBe(6);
    });

    it('should multiply numbers', async () => {
      const result = await calculatorTool.execute({ operation: 'multiply', a: 6, b: 7 });
      expect(result).toBe(42);
    });

    it('should divide numbers', async () => {
      const result = await calculatorTool.execute({ operation: 'divide', a: 20, b: 4 });
      expect(result).toBe(5);
    });

    it('should throw on division by zero', async () => {
      await expect(
        calculatorTool.execute({ operation: 'divide', a: 10, b: 0 })
      ).rejects.toThrow('Division by zero');
    });
  });

  describe('searchTool', () => {
    it('should return search results', async () => {
      const results = await searchTool.execute({ query: 'test query', limit: 3 });

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('snippet');
    });

    it('should respect limit parameter', async () => {
      const results = await searchTool.execute({ query: 'test', limit: 5 });
      expect(results).toHaveLength(5);
    });

    it('should use default limit', async () => {
      const results = await searchTool.execute({ query: 'test' });
      expect(results).toHaveLength(5); // Default limit
    });
  });

  describe('getCurrentTimeTool', () => {
    it('should return ISO 8601 timestamp', async () => {
      const result = await getCurrentTimeTool.execute({});

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return current time', async () => {
      const result = await getCurrentTimeTool.execute({});
      const timestamp = new Date(result);
      const now = new Date();

      // Should be within 1 second
      expect(Math.abs(timestamp.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('stringManipulationTool', () => {
    it('should convert to uppercase', async () => {
      const result = await stringManipulationTool.execute({
        text: 'hello world',
        operation: 'uppercase',
      });
      expect(result).toBe('HELLO WORLD');
    });

    it('should convert to lowercase', async () => {
      const result = await stringManipulationTool.execute({
        text: 'HELLO WORLD',
        operation: 'lowercase',
      });
      expect(result).toBe('hello world');
    });

    it('should reverse string', async () => {
      const result = await stringManipulationTool.execute({
        text: 'hello',
        operation: 'reverse',
      });
      expect(result).toBe('olleh');
    });

    it('should return string length', async () => {
      const result = await stringManipulationTool.execute({
        text: 'hello world',
        operation: 'length',
      });
      expect(result).toBe(11);
    });
  });
});
