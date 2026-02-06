/**
 * Core agent implementation
 * 
 * This implements the autonomous agent execution loop with:
 * - Tool usage
 * - Memory management
 * - Error recovery
 * - Observability
 */

import type {
  AgentConfig,
  AgentResult,
  AgentState,
  AgentStep,
  AgentEventListener,
  Tool,
  MemoryStore,
} from '../../types/index.js';

export interface AgentOptions extends AgentConfig {
  /** Available tools for the agent */
  tools?: Tool[];
  /** Memory store implementation */
  memory?: MemoryStore;
  /** Event listeners for observability */
  listeners?: AgentEventListener[];
}

/**
 * Autonomous agent with tool usage and memory
 */
export class Agent {
  private config: Required<AgentConfig>;
  private tools: Map<string, Tool> = new Map();
  private listeners: AgentEventListener[] = [];
  private state: AgentState;

  constructor(options: AgentOptions) {
    this.config = {
      name: options.name,
      description: options.description,
      maxIterations: options.maxIterations ?? 10,
      temperature: options.temperature ?? 0.7,
      verbose: options.verbose ?? false,
      systemPrompt: '', // Will be set below
    };

    // Set system prompt after config is initialized
    this.config.systemPrompt = options.systemPrompt ?? this.defaultSystemPrompt();

    // Register tools
    if (options.tools) {
      for (const tool of options.tools) {
        this.registerTool(tool);
      }
    }

    // Memory is stored in options for future use
    // (currently not used in placeholder implementation)

    // Setup event listeners
    if (options.listeners) {
      this.listeners = options.listeners;
    }

    // Initialize state
    this.state = {
      iteration: 0,
      messages: [
        {
          role: 'system',
          content: this.config.systemPrompt,
          timestamp: new Date(),
        },
      ],
      steps: [],
      isFinished: false,
    };
  }

  /**
   * Register a tool for the agent to use
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    if (this.config.verbose) {
      console.log(`[Agent] Registered tool: ${tool.name}`);
    }
  }

  /**
   * Execute the agent with a given input
   */
  async run(input: string): Promise<AgentResult> {
    const startTime = new Date();

    // Emit start event
    await this.emitEvent({
      type: 'start',
      data: { config: this.config, input },
    });

    // Add user input to messages
    this.state.messages.push({
      role: 'user',
      content: input,
      timestamp: new Date(),
    });

    try {
      // Main agent loop
      while (this.state.iteration < this.config.maxIterations && !this.state.isFinished) {
        this.state.iteration++;

        const step = await this.executeStep();
        this.state.steps.push(step);

        // Emit step event
        await this.emitEvent({ type: 'step', data: step });

        // Check if agent finished
        if (!step.action) {
          this.state.isFinished = true;
          this.state.finalOutput = step.thought;
        }
      }

      const endTime = new Date();
      const result: AgentResult = {
        output: this.state.finalOutput || 'No output generated',
        steps: this.state.steps,
        iterations: this.state.iteration,
        success: this.state.isFinished && !this.state.steps.some((s) => s.error),
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };

      // Emit finish event
      await this.emitEvent({ type: 'finish', data: result });

      return result;
    } catch (error) {
      const endTime = new Date();
      const agentError = error instanceof Error ? error : new Error(String(error));

      // Emit error event
      await this.emitEvent({
        type: 'error',
        data: { error: agentError, step: this.state.iteration },
      });

      return {
        output: '',
        steps: this.state.steps,
        iterations: this.state.iteration,
        success: false,
        error: agentError,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  /**
   * Execute a single agent step
   */
  private async executeStep(): Promise<AgentStep> {
    const step: AgentStep = {
      iteration: this.state.iteration,
      thought: '',
      timestamp: new Date(),
    };

    try {
      // In a real implementation, this would call an LLM
      // For now, we'll simulate the agent's decision-making
      const decision = await this.makeDecision();

      step.thought = decision.thought;
      step.action = decision.action;

      // Execute tool if action specified
      if (decision.action) {
        await this.emitEvent({
          type: 'tool_call',
          data: { tool: decision.action.tool, input: decision.action.input },
        });

        const tool = this.tools.get(decision.action.tool);
        if (!tool) {
          throw new Error(`Tool not found: ${decision.action.tool}`);
        }

        // Validate input
        const validatedInput = tool.inputSchema.parse(decision.action.input);

        // Execute tool
        const result = await tool.execute(validatedInput);
        step.observation = result;

        await this.emitEvent({
          type: 'tool_result',
          data: { tool: decision.action.tool, output: result },
        });

        // Add observation to messages
        this.state.messages.push({
          role: 'tool',
          name: decision.action.tool,
          content: JSON.stringify(result),
          timestamp: new Date(),
        });
      }
    } catch (error) {
      step.error = error instanceof Error ? error : new Error(String(error));
      await this.emitEvent({
        type: 'error',
        data: { error: step.error, step: this.state.iteration },
      });
    }

    return step;
  }

  /**
   * Make decision about next action
   * In a real implementation, this would use an LLM
   */
  private async makeDecision(): Promise<{
    thought: string;
    action?: { tool: string; input: unknown };
  }> {
    // Placeholder implementation
    // In real usage, this would:
    // 1. Format conversation history
    // 2. Include available tools
    // 3. Call LLM (e.g., via @dcyfr/ai)
    // 4. Parse LLM response
    // 5. Extract thought and action

    return {
      thought: 'Analyzing the request and determining next steps...',
      action: undefined, // Finish immediately in placeholder
    };
  }

  /**
   * Default system prompt for the agent
   */
  private defaultSystemPrompt(): string {
    const toolList = Array.from(this.tools.values())
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    return `You are ${this.config.name}, an autonomous AI agent.

Description: ${this.config.description}

Available Tools:
${toolList || '(No tools available)'}

Instructions:
1. Think step-by-step about the user's request
2. Use tools when needed to gather information or take actions
3. Provide clear, helpful responses
4. If you cannot complete the task, explain why

When using a tool, respond in this format:
Thought: [Your reasoning]
Action: [tool name]
Action Input: [JSON input for the tool]

When you have a final answer, respond:
Thought: [Your reasoning]
Final Answer: [Your response to the user]`;
  }

  /**
   * Emit an event to all listeners
   */
  private async emitEvent(event: Parameters<AgentEventListener>[0]): Promise<void> {
    for (const listener of this.listeners) {
      await listener(event);
    }
  }

  /**
   * Get current agent state
   */
  getState(): Readonly<AgentState> {
    return { ...this.state };
  }

  /**
   * Reset agent state
   */
  reset(): void {
    this.state = {
      iteration: 0,
      messages: [
        {
          role: 'system',
          content: this.config.systemPrompt,
          timestamp: new Date(),
        },
      ],
      steps: [],
      isFinished: false,
    };
  }
}
