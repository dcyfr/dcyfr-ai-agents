/**
 * Tool registry for managing available agent tools
 */

import type { Tool } from '../../types/index.js';

/**
 * Central registry for agent tools
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private categories: Map<string, Set<string>> = new Map();

  /**
   * Register a new tool
   */
  register(tool: Tool, category?: string): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);

    if (category) {
      if (!this.categories.has(category)) {
        this.categories.set(category, new Set());
      }
      this.categories.get(category)!.add(tool.name);
    }
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    const removed = this.tools.delete(toolName);

    // Remove from categories
    for (const tools of this.categories.values()) {
      tools.delete(toolName);
    }

    return removed;
  }

  /**
   * Get a tool by name
   */
  get(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): Tool[] {
    const toolNames = this.categories.get(category);
    if (!toolNames) {
      return [];
    }

    return Array.from(toolNames)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is Tool => tool !== undefined);
  }

  /**
   * Check if tool exists
   */
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Get tool descriptions for LLM context
   */
  getDescriptions(): string {
    return this.getAll()
      .map((tool) => {
        const examples = tool.examples
          ? `\nExamples:\n${tool.examples
              .map(
                (ex) =>
                  `  Input: ${JSON.stringify(ex.input)}\n  Output: ${JSON.stringify(ex.output)}`
              )
              .join('\n')}`
          : '';

        return `${tool.name}: ${tool.description}${examples}`;
      })
      .join('\n\n');
  }

  /**
   * Execute a tool with validation
   */
  async execute<TInput = unknown, TOutput = unknown>(
    toolName: string,
    input: TInput
  ): Promise<TOutput> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Validate input
    const validatedInput = tool.inputSchema.parse(input);

    // Execute tool
    const result = await tool.execute(validatedInput);

    return result as TOutput;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.categories.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalTools: number;
    totalCategories: number;
    toolsByCategory: Record<string, number>;
  } {
    const toolsByCategory: Record<string, number> = {};
    for (const [category, tools] of this.categories.entries()) {
      toolsByCategory[category] = tools.size;
    }

    return {
      totalTools: this.tools.size,
      totalCategories: this.categories.size,
      toolsByCategory,
    };
  }
}

/**
 * Global tool registry instance
 */
export const globalRegistry = new ToolRegistry();
