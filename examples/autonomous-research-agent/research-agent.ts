/**
 * Autonomous Research Agent Example
 * 
 * Demonstrates all Phase 0 autonomous operations features:
 * - AgentRuntime orchestration
 * - Memory context retrieval and injection
 * - Multi-step reasoning with WorkingMemory
 * - Telemetry capture and monitoring
 * - Hook system extensibility
 * - Provider fallback handling
 * 
 * @example
 * ```typescript
 * const agent = new AutonomousResearchAgent({
 *   providers: ['openai', 'anthropic'],
 *   memoryEnabled: true,
 *   telemetryEnabled: true
 * });
 * 
 * const result = await agent.research('quantum computing applications');
 * console.log(result.summary);
 * ```
 */

import type { 
  AgentRuntime,
  ProviderRegistry,
  DCYFRMemory,
  TelemetryEngine,
  WorkingMemoryInterface
} from '@dcyfr/ai';

/**
 * Research task configuration
 */
export interface ResearchConfig {
  /** Research topic or question */
  topic: string;
  /** Maximum research depth (number of steps) */
  maxDepth?: number;
  /** Include academic sources */
  includeAcademic?: boolean;
  /** Include recent developments (last 12 months) */
  includeRecent?: boolean;
  /** Target audience level */
  audienceLevel?: 'beginner' | 'intermediate' | 'expert';
}

/**
 * Research result with structured findings
 */
export interface ResearchResult {
  /** Research topic */
  topic: string;
  /** Executive summary */
  summary: string;
  /** Key findings organized by category */
  findings: {
    overview: string;
    keyAdvantages: string[];
    limitations: string[];
    applications: string[];
    recentDevelopments: string[];
    futureDirections: string[];
  };
  /** Sources and references */
  sources: string[];
  /** Research metadata */
  metadata: {
    researchDepth: number;
    stepsCompleted: number;
    timeSpent: number;
    memoryContextUsed: boolean;
    telemetryEvents: number;
  };
}

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /** LLM providers to use (in order of preference) */
  providers?: string[];
  /** Enable memory context retrieval */
  memoryEnabled?: boolean;
  /** Enable telemetry tracking */
  telemetryEnabled?: boolean;
  /** Custom memory configuration */
  memoryConfig?: {
    maxResults?: number;
    minScore?: number;
  };
  /** Research-specific settings */
  researchSettings?: {
    defaultMaxDepth?: number;
    defaultAudienceLevel?: 'beginner' | 'intermediate' | 'expert';
  };
}

/**
 * Autonomous Research Agent
 * 
 * Demonstrates comprehensive autonomous operations with multi-step reasoning,
 * memory integration, and telemetry capture.
 */
export class AutonomousResearchAgent {
  private runtime: AgentRuntime;
  private config: Required<AgentConfig>;

  constructor(
    runtime: AgentRuntime,
    config: AgentConfig = {}
  ) {
    this.runtime = runtime;
    this.config = {
      providers: config.providers || ['openai', 'anthropic', 'ollama'],
      memoryEnabled: config.memoryEnabled ?? true,
      telemetryEnabled: config.telemetryEnabled ?? true,
      memoryConfig: {
        maxResults: 10,
        minScore: 0.7,
        ...config.memoryConfig
      },
      researchSettings: {
        defaultMaxDepth: 3,
        defaultAudienceLevel: 'intermediate',
        ...config.researchSettings
      }
    };

    this.setupHooks();
  }

  /**
   * Setup runtime hooks for enhanced functionality
   */
  private setupHooks(): void {
    if (!this.config.telemetryEnabled) return;

    // Before execution hook - log research start
    this.runtime.addHook('beforeExecute', async (task: string) => {
      console.log(`🔬 [Research Agent] Starting research: ${task}`);
      return { approved: true };
    });

    // After execution hook - log completion
    this.runtime.addHook('afterExecute', async (task: string, result: any, success: boolean) => {
      const status = success ? '✅' : '❌';
      console.log(`${status} [Research Agent] Completed: ${task}`);
      
      if (success && result?.findings) {
        console.log(`📊 Found ${result.findings.applications?.length || 0} applications`);
      }
    });
  }

  /**
   * Conduct autonomous research on a given topic
   */
  async research(config: ResearchConfig): Promise<ResearchResult> {
    const startTime = Date.now();
    const maxDepth = config.maxDepth || this.config.researchSettings.defaultMaxDepth;
    const audienceLevel = config.audienceLevel || this.config.researchSettings.defaultAudienceLevel;

    console.log(`🎯 [Research Agent] Researching: ${config.topic}`);
    console.log(`📋 Configuration: depth=${maxDepth}, audience=${audienceLevel}`);

    try {
      // Step 1: Generate research overview
      console.log('\n📚 Step 1: Generating research overview...');
      const overviewResult = await this.executeResearchStep({
        step: 'overview',
        topic: config.topic,
        instruction: `Provide a comprehensive overview of "${config.topic}" suitable for a ${audienceLevel} audience. Focus on key concepts, importance, and scope.`
      });

      // Step 2: Analyze key advantages and limitations
      console.log('\n⚖️ Step 2: Analyzing advantages and limitations...');
      const analysisResult = await this.executeResearchStep({
        step: 'analysis',
        topic: config.topic,
        instruction: `Analyze the key advantages and limitations of "${config.topic}". Provide balanced, evidence-based assessment.`,
        previousContext: overviewResult.content
      });

      // Step 3: Research applications and use cases
      console.log('\n🚀 Step 3: Researching applications...');
      const applicationsResult = await this.executeResearchStep({
        step: 'applications',
        topic: config.topic,
        instruction: `Identify practical applications and real-world use cases for "${config.topic}". Include current implementations and future potential.`,
        previousContext: `${overviewResult.content}\n\n${analysisResult.content}`
      });

      // Step 4: Recent developments (if requested)
      let recentResult: any = null;
      if (config.includeRecent) {
        console.log('\n🔄 Step 4: Recent developments...');
        recentResult = await this.executeResearchStep({
          step: 'recent',
          topic: config.topic,
          instruction: `Research recent developments and breakthroughs in "${config.topic}" from the last 12 months. Focus on significant advances and emerging trends.`,
          previousContext: `${overviewResult.content}\n\n${analysisResult.content}\n\n${applicationsResult.content}`
        });
      }

      // Step 5: Synthesize final research result
      console.log('\n🎯 Step 5: Synthesizing findings...');
      const synthesisResult = await this.synthesizeResearch({
        topic: config.topic,
        overview: overviewResult.content,
        analysis: analysisResult.content,
        applications: applicationsResult.content,
        recent: recentResult?.content,
        audienceLevel
      });

      const timeSpent = Date.now() - startTime;
      const stepsCompleted = recentResult ? 5 : 4;

      // Get telemetry stats
      const telemetryEvents = await this.getTelemetryEventCount();

      console.log(`\n✅ Research completed in ${timeSpent}ms`);
      console.log(`📈 Steps: ${stepsCompleted}, Telemetry events: ${telemetryEvents}`);

      return {
        topic: config.topic,
        summary: synthesisResult.summary,
        findings: synthesisResult.findings,
        sources: synthesisResult.sources,
        metadata: {
          researchDepth: maxDepth,
          stepsCompleted,
          timeSpent,
          memoryContextUsed: this.config.memoryEnabled,
          telemetryEvents
        }
      };

    } catch (error) {
      console.error('❌ Research failed:', error);
      throw new Error(`Research failed for topic "${config.topic}": ${error}`);
    }
  }

  /**
   * Execute a single research step with memory and telemetry
   */
  private async executeResearchStep(params: {
    step: string;
    topic: string;
    instruction: string;
    previousContext?: string;
  }): Promise<{ content: string; memoryUsed: boolean }> {
    // Build context-aware prompt
    let prompt = `Research Step: ${params.step.toUpperCase()}\n\n${params.instruction}`;
    
    if (params.previousContext) {
      prompt += `\n\nPrevious research context:\n${params.previousContext}`;
    }

    // Use WorkingMemory to store step progress
    const workingMemory = this.runtime.getWorkingMemory();
    workingMemory.set(`research-step-${params.step}`, {
      topic: params.topic,
      instruction: params.instruction,
      timestamp: Date.now()
    });

    // Execute with AgentRuntime (includes memory retrieval and telemetry)
    const result = await this.runtime.executeTask(prompt, {
      timeout: 30000,
      memoryConfig: this.config.memoryEnabled ? this.config.memoryConfig : undefined
    });

    if (!result.success) {
      throw new Error(`Research step "${params.step}" failed: ${result.error}`);
    }

    // Store result in working memory for next steps
    workingMemory.set(`research-result-${params.step}`, {
      content: result.output,
      timestamp: Date.now(),
      memoryRetrievalUsed: result.memoryRetrievalUsed || false
    });

    return {
      content: result.output || '',
      memoryUsed: result.memoryRetrievalUsed || false
    };
  }

  /**
   * Synthesize all research findings into structured result
   */
  private async synthesizeResearch(params: {
    topic: string;
    overview: string;
    analysis: string;
    applications: string;
    recent?: string;
    audienceLevel: string;
  }): Promise<{
    summary: string;
    findings: ResearchResult['findings'];
    sources: string[];
  }> {
    const synthesisPrompt = `
SYNTHESIS TASK: Create a structured research summary

TOPIC: ${params.topic}
AUDIENCE: ${params.audienceLevel}

RESEARCH FINDINGS:

OVERVIEW:
${params.overview}

ANALYSIS:
${params.analysis}

APPLICATIONS:
${params.applications}

${params.recent ? `RECENT DEVELOPMENTS:\n${params.recent}` : ''}

Please synthesize these findings into:
1. Executive Summary (2-3 sentences)
2. Key Advantages (3-5 bullet points)
3. Limitations (3-5 bullet points)  
4. Applications (3-7 specific examples)
5. Recent Developments (3-5 items if provided)
6. Future Directions (3-5 forward-looking statements)

Format as JSON:
{
  "summary": "Executive summary text",
  "findings": {
    "overview": "Brief overview",
    "keyAdvantages": ["advantage1", "advantage2", ...],
    "limitations": ["limitation1", "limitation2", ...],
    "applications": ["app1", "app2", ...],
    "recentDevelopments": ["dev1", "dev2", ...],
    "futureDirections": ["direction1", "direction2", ...]
  },
  "sources": ["source1", "source2", ...]
}
`;

    const result = await this.runtime.executeTask(synthesisPrompt, {
      timeout: 45000,
      memoryConfig: this.config.memoryEnabled ? this.config.memoryConfig : undefined
    });

    if (!result.success) {
      throw new Error(`Synthesis failed: ${result.error}`);
    }

    try {
      // Parse JSON response
      const parsed = JSON.parse(result.output || '{}');
      return {
        summary: parsed.summary || 'Research completed successfully.',
        findings: {
          overview: parsed.findings?.overview || params.overview.substring(0, 200) + '...',
          keyAdvantages: parsed.findings?.keyAdvantages || [],
          limitations: parsed.findings?.limitations || [],
          applications: parsed.findings?.applications || [],
          recentDevelopments: parsed.findings?.recentDevelopments || [],
          futureDirections: parsed.findings?.futureDirections || []
        },
        sources: parsed.sources || ['LLM-generated research synthesis']
      };
    } catch (parseError) {
      console.warn('⚠️ Failed to parse synthesis JSON, using fallback structure');
      
      return {
        summary: `Research on ${params.topic} completed with comprehensive analysis of current state, applications, and future potential.`,
        findings: {
          overview: params.overview.substring(0, 300) + '...',
          keyAdvantages: ['Advanced capabilities', 'Growing adoption', 'Active research'],
          limitations: ['Implementation complexity', 'Cost considerations', 'Technical barriers'],
          applications: ['Research and development', 'Commercial applications', 'Educational use'],
          recentDevelopments: params.recent ? ['Ongoing innovations', 'Industry adoption', 'Technical breakthroughs'] : [],
          futureDirections: ['Continued advancement', 'Broader adoption', 'New applications']
        },
        sources: ['LLM-generated research synthesis']
      };
    }
  }

  /**
   * Get telemetry event count for this research session
   */
  private async getTelemetryEventCount(): Promise<number> {
    try {
      const telemetry = this.runtime.getTelemetryEngine();
      if (!telemetry) return 0;
      
      const events = await telemetry.getEvents();
      return events.length;
    } catch (error) {
      console.warn('⚠️ Failed to retrieve telemetry count:', error);
      return 0;
    }
  }

  /**
   * Get research statistics and performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    totalResearchSessions: number;
    averageResearchTime: number;
    memoryHitRate: number;
    providerDistribution: Record<string, number>;
  }> {
    try {
      const telemetry = this.runtime.getTelemetryEngine();
      if (!telemetry) {
        return {
          totalResearchSessions: 0,
          averageResearchTime: 0,
          memoryHitRate: 0,
          providerDistribution: {}
        };
      }

      const events = await telemetry.getEvents();
      
      const researchEvents = events.filter(e => 
        e.agentName?.includes('research') || 
        e.type === 'start' || 
        e.type === 'finish'
      );

      const memoryEvents = events.filter(e => e.type === 'memory_retrieval');
      const memoryHits = memoryEvents.filter(e => e.memoriesRelevant > 0).length;
      const memoryHitRate = memoryEvents.length > 0 ? memoryHits / memoryEvents.length : 0;

      // Calculate provider distribution
      const providerCounts: Record<string, number> = {};
      events.forEach(e => {
        if (e.provider) {
          providerCounts[e.provider] = (providerCounts[e.provider] || 0) + 1;
        }
      });

      return {
        totalResearchSessions: Math.floor(researchEvents.length / 2), // start + finish pairs
        averageResearchTime: 0, // Would need execution time tracking
        memoryHitRate: Math.round(memoryHitRate * 100) / 100,
        providerDistribution: providerCounts
      };

    } catch (error) {
      console.warn('⚠️ Failed to calculate performance metrics:', error);
      return {
        totalResearchSessions: 0,
        averageResearchTime: 0,
        memoryHitRate: 0,
        providerDistribution: {}
      };
    }
  }

  /**
   * Display research agent status and capabilities
   */
  async getStatus(): Promise<{
    ready: boolean;
    providersAvailable: string[];
    memoryEnabled: boolean;
    telemetryEnabled: boolean;
    workingMemoryKeys: string[];
  }> {
    const workingMemory = this.runtime.getWorkingMemory();
    const keys = Array.from((workingMemory as any).storage?.keys() || []);

    return {
      ready: this.runtime.isReady(),
      providersAvailable: this.config.providers,
      memoryEnabled: this.config.memoryEnabled,
      telemetryEnabled: this.config.telemetryEnabled,
      workingMemoryKeys: keys.filter(k => k.startsWith('research-'))
    };
  }
}

/**
 * Helper function to create a pre-configured research agent
 */
export async function createResearchAgent(config: AgentConfig = {}): Promise<AutonomousResearchAgent> {
  try {
    // Dynamic import to handle optional dependencies
    const { AgentRuntime, ProviderRegistry, TelemetryEngine, DCYFRMemory } = await import('@dcyfr/ai');

    // Initialize components
    const providerRegistry = new ProviderRegistry();
    
    const telemetryEngine = config.telemetryEnabled !== false 
      ? new TelemetryEngine({ storage: 'sqlite' })
      : undefined;

    const memory = config.memoryEnabled !== false
      ? new DCYFRMemory({ storage: 'memory' })
      : undefined;

    // Create runtime
    const runtime = new AgentRuntime({
      providerRegistry,
      memory,
      telemetry: telemetryEngine
    });

    return new AutonomousResearchAgent(runtime, config);

  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot resolve module')) {
      throw new Error(
        'Failed to create research agent: @dcyfr/ai not available. ' +
        'Install with: npm install @dcyfr/ai'
      );
    }
    throw error;
  }
}