/**
 * Tests for tool input validators
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validators,
  validateToolInput,
  commonInputSchemas,
} from '../../src/agent/tools/validators';

describe('validators', () => {
  describe('nonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(validators.nonEmptyString.parse('hello')).toBe('hello');
      expect(validators.nonEmptyString.parse('a')).toBe('a');
    });

    it('should reject empty strings', () => {
      expect(() => validators.nonEmptyString.parse('')).toThrow('String cannot be empty');
    });

    it('should reject non-string values', () => {
      expect(() => validators.nonEmptyString.parse(123)).toThrow();
      expect(() => validators.nonEmptyString.parse(null)).toThrow();
    });
  });

  describe('positiveInt', () => {
    it('should accept positive integers', () => {
      expect(validators.positiveInt.parse(1)).toBe(1);
      expect(validators.positiveInt.parse(100)).toBe(100);
    });

    it('should reject zero and negative integers', () => {
      expect(() => validators.positiveInt.parse(0)).toThrow();
      expect(() => validators.positiveInt.parse(-1)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => validators.positiveInt.parse(1.5)).toThrow();
      expect(() => validators.positiveInt.parse('5')).toThrow();
    });
  });

  describe('nonNegativeInt', () => {
    it('should accept zero and positive integers', () => {
      expect(validators.nonNegativeInt.parse(0)).toBe(0);
      expect(validators.nonNegativeInt.parse(1)).toBe(1);
      expect(validators.nonNegativeInt.parse(100)).toBe(100);
    });

    it('should reject negative integers', () => {
      expect(() => validators.nonNegativeInt.parse(-1)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => validators.nonNegativeInt.parse(1.5)).toThrow();
    });
  });

  describe('probability', () => {
    it('should accept numbers between 0 and 1', () => {
      expect(validators.probability.parse(0)).toBe(0);
      expect(validators.probability.parse(0.5)).toBe(0.5);
      expect(validators.probability.parse(1)).toBe(1);
    });

    it('should reject numbers outside 0-1 range', () => {
      expect(() => validators.probability.parse(-0.1)).toThrow();
      expect(() => validators.probability.parse(1.1)).toThrow();
    });
  });

  describe('url', () => {
    it('should accept valid URLs', () => {
      expect(validators.url.parse('https://example.com')).toBe('https://example.com');
      expect(validators.url.parse('http://localhost:3000')).toBe('http://localhost:3000');
      expect(validators.url.parse('ftp://files.example.com/file.pdf')).toBe('ftp://files.example.com/file.pdf');
    });

    it('should reject invalid URLs', () => {
      expect(() => validators.url.parse('not a url')).toThrow();
      expect(() => validators.url.parse('example.com')).toThrow();
    });
  });

  describe('email', () => {
    it('should accept valid email addresses', () => {
      expect(validators.email.parse('user@example.com')).toBe('user@example.com');
      expect(validators.email.parse('test+tag@domain.co.uk')).toBe('test+tag@domain.co.uk');
    });

    it('should reject invalid email addresses', () => {
      expect(() => validators.email.parse('notanemail')).toThrow();
      expect(() => validators.email.parse('user@')).toThrow();
      expect(() => validators.email.parse('@example.com')).toThrow();
    });
  });

  describe('dateString', () => {
    it('should accept valid ISO 8601 datetime strings', () => {
      const validDate = '2024-01-01T12:00:00Z';
      expect(validators.dateString.parse(validDate)).toBe(validDate);
    });

    it('should reject invalid datetime strings', () => {
      expect(() => validators.dateString.parse('2024-01-01')).toThrow();
      expect(() => validators.dateString.parse('not a date')).toThrow();
    });
  });

  describe('jsonString', () => {
    it('should accept valid JSON strings', () => {
      expect(validators.jsonString.parse('{"key":"value"}')).toBe('{"key":"value"}');
      expect(validators.jsonString.parse('[]')).toBe('[]');
      expect(validators.jsonString.parse('123')).toBe('123');
      expect(validators.jsonString.parse('null')).toBe('null');
    });

    it('should reject invalid JSON strings', () => {
      expect(() => validators.jsonString.parse('{invalid}')).toThrow('Invalid JSON string');
      expect(() => validators.jsonString.parse('not json')).toThrow('Invalid JSON string');
    });
  });

  describe('filePath', () => {
    it('should accept valid file paths', () => {
      expect(validators.filePath.parse('/path/to/file.txt')).toBe('/path/to/file.txt');
      expect(validators.filePath.parse('relative/path.js')).toBe('relative/path.js');
      expect(validators.filePath.parse('file_name-123.txt')).toBe('file_name-123.txt');
      expect(validators.filePath.parse('./local/file.md')).toBe('./local/file.md');
    });

    it('should reject invalid file paths', () => {
      expect(() => validators.filePath.parse('path with spaces')).toThrow('Invalid file path');
      expect(() => validators.filePath.parse('path/with/special!chars')).toThrow('Invalid file path');
      expect(() => validators.filePath.parse('path<with>brackets')).toThrow('Invalid file path');
    });
  });

  describe('limitedString', () => {
    it('should accept strings within length limit', () => {
      const validator = validators.limitedString(10);
      expect(validator.parse('short')).toBe('short');
      expect(validator.parse('exactly10x')).toBe('exactly10x');
    });

    it('should reject strings exceeding length limit', () => {
      const validator = validators.limitedString(5);
      expect(() => validator.parse('toolong')).toThrow('String must be at most 5 characters');
    });

    it('should customize max length', () => {
      const validator100 = validators.limitedString(100);
      const validator10 = validators.limitedString(10);
      
      const longString = 'x'.repeat(50);
      expect(validator100.parse(longString)).toBe(longString);
      expect(() => validator10.parse(longString)).toThrow();
    });
  });

  describe('boundedArray', () => {
    it('should accept arrays within size constraints', () => {
      const validator = validators.boundedArray(z.number(), 1, 5);
      expect(validator.parse([1])).toEqual([1]);
      expect(validator.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(validator.parse([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should reject arrays below min length', () => {
      const validator = validators.boundedArray(z.string(), 2, 5);
      expect(() => validator.parse([])).toThrow();
      expect(() => validator.parse(['one'])).toThrow();
    });

    it('should reject arrays above max length', () => {
      const validator = validators.boundedArray(z.number(), 1, 3);
      expect(() => validator.parse([1, 2, 3, 4])).toThrow();
    });

    it('should validate item types', () => {
      const validator = validators.boundedArray(z.number(), 1, 3);
      expect(() => validator.parse(['not', 'numbers'])).toThrow();
    });
  });

  describe('stringEnum', () => {
    it('should accept values from the enum', () => {
      const validator = validators.stringEnum(['red', 'green', 'blue'] as const);
      expect(validator.parse('red')).toBe('red');
      expect(validator.parse('green')).toBe('green');
      expect(validator.parse('blue')).toBe('blue');
    });

    it('should reject values not in the enum', () => {
      const validator = validators.stringEnum(['a', 'b', 'c'] as const);
      expect(() => validator.parse('d')).toThrow();
      expect(() => validator.parse('')).toThrow();
    });
  });

  describe('record', () => {
    it('should accept valid records with correct value types', () => {
      const validator = validators.record(z.number());
      expect(validator.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('should reject records with incorrect value types', () => {
      const validator = validators.record(z.number());
      expect(() => validator.parse({ a: 'not a number' })).toThrow();
    });

    it('should accept empty records', () => {
      const validator = validators.record(z.string());
      expect(validator.parse({})).toEqual({});
    });
  });
});

describe('validateToolInput', () => {
  it('should return validated input when valid', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const validator = validateToolInput(schema);
    
    const input = { name: 'Alice', age: 30 };
    expect(validator(input)).toEqual(input);
  });

  it('should throw error when input is invalid', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const validator = validateToolInput(schema);
    
    expect(() => validator({ name: 'Bob' })).toThrow(); // missing age
    expect(() => validator({ name: 123, age: 30 })).toThrow(); // wrong type
  });

  it('should transform/coerce values according to schema', () => {
    const schema = z.object({ 
      value: z.string().transform(s => s.toUpperCase()) 
    });
    const validator = validateToolInput(schema);
    
    expect(validator({ value: 'hello' })).toEqual({ value: 'HELLO' });
  });
});

describe('commonInputSchemas', () => {
  describe('textInput', () => {
    it('should accept valid text input', () => {
      const result = commonInputSchemas.textInput.parse({ text: 'hello world' });
      expect(result).toEqual({ text: 'hello world' });
    });

    it('should reject empty text', () => {
      expect(() => commonInputSchemas.textInput.parse({ text: '' })).toThrow();
    });

    it('should reject missing text field', () => {
      expect(() => commonInputSchemas.textInput.parse({})).toThrow();
    });
  });

  describe('queryInput', () => {
    it('should accept query with all fields', () => {
      const result = commonInputSchemas.queryInput.parse({ 
        query: 'search term', 
        limit: 10, 
        offset: 0 
      });
      expect(result).toEqual({ query: 'search term', limit: 10, offset: 0 });
    });

    it('should accept query with only required field', () => {
      const result = commonInputSchemas.queryInput.parse({ query: 'search' });
      expect(result).toEqual({ query: 'search' });
    });

    it('should reject invalid limit', () => {
      expect(() => commonInputSchemas.queryInput.parse({ 
        query: 'search', 
        limit: -1 
      })).toThrow();
    });

    it('should reject invalid offset', () => {
      expect(() => commonInputSchemas.queryInput.parse({ 
        query: 'search', 
        offset: -5 
      })).toThrow();
    });
  });

  describe('fileInput', () => {
    it('should accept valid file path with encoding', () => {
      const result = commonInputSchemas.fileInput.parse({ 
        path: '/path/to/file.txt', 
        encoding: 'utf-8' 
      });
      expect(result).toEqual({ path: '/path/to/file.txt', encoding: 'utf-8' });
    });

    it('should accept file path without encoding', () => {
      const result = commonInputSchemas.fileInput.parse({ path: 'file.txt' });
      expect(result).toEqual({ path: 'file.txt' });
    });

    it('should reject invalid encoding', () => {
      expect(() => commonInputSchemas.fileInput.parse({ 
        path: 'file.txt', 
        encoding: 'invalid' 
      })).toThrow();
    });
  });

  describe('apiRequestInput', () => {
    it('should accept valid API request with all fields', () => {
      const result = commonInputSchemas.apiRequestInput.parse({
        url: 'https://api.example.com',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { data: 'test' },
      });
      expect(result.url).toBe('https://api.example.com');
      expect(result.method).toBe('POST');
    });

    it('should accept minimal API request', () => {
      const result = commonInputSchemas.apiRequestInput.parse({
        url: 'https://api.example.com',
        method: 'GET',
      });
      expect(result.method).toBe('GET');
    });

    it('should reject invalid URL', () => {
      expect(() => commonInputSchemas.apiRequestInput.parse({
        url: 'not a url',
        method: 'GET',
      })).toThrow();
    });

    it('should reject invalid HTTP method', () => {
      expect(() => commonInputSchemas.apiRequestInput.parse({
        url: 'https://api.example.com',
        method: 'INVALID',
      })).toThrow();
    });
  });

  describe('searchInput', () => {
    it('should accept search with all fields', () => {
      const result = commonInputSchemas.searchInput.parse({
        query: 'search term',
        filters: { category: 'tech' },
        limit: 20,
      });
      expect(result.query).toBe('search term');
      expect(result.limit).toBe(20);
    });

    it('should use default limit when not provided', () => {
      const result = commonInputSchemas.searchInput.parse({ query: 'search' });
      expect(result.limit).toBe(10);
    });

    it('should accept custom filters', () => {
      const result = commonInputSchemas.searchInput.parse({
        query: 'search',
        filters: { date: '2024-01-01', tag: 'important' },
      });
      expect(result.filters).toEqual({ date: '2024-01-01', tag: 'important' });
    });
  });

  describe('idInput', () => {
    it('should accept valid ID', () => {
      const result = commonInputSchemas.idInput.parse({ id: 'abc123' });
      expect(result).toEqual({ id: 'abc123' });
    });

    it('should reject empty ID', () => {
      expect(() => commonInputSchemas.idInput.parse({ id: '' })).toThrow();
    });

    it('should reject missing ID', () => {
      expect(() => commonInputSchemas.idInput.parse({})).toThrow();
    });
  });
});
