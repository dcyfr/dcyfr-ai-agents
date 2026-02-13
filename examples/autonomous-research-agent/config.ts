/**
 * Research Agent Configuration Examples
 * 
 * This file shows different ways to configure the Autonomous Research Agent
 * for various use cases and environments.
 */

import type { AgentConfig, ResearchConfig } from './research-agent';

/**
 * Basic configuration for development/testing
 */
export const developmentConfig: AgentConfig = {
  providers: ['ollama'], // Local Ollama for development
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 5,
    minScore: 0.6 // Lower threshold for development
  },
  researchSettings: {
    defaultMaxDepth: 2, // Shorter research for faster iteration
    defaultAudienceLevel: 'intermediate'
  }
};

/**
 * Production configuration with OpenAI primary, Anthropic fallback
 */
export const productionConfig: AgentConfig = {
  providers: ['openai', 'anthropic', 'ollama'],
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 10,
    minScore: 0.7
  },
  researchSettings: {
    defaultMaxDepth: 3,
    defaultAudienceLevel: 'expert'
  }
};

/**
 * High-performance configuration for research-intensive workloads
 */
export const researchConfig: AgentConfig = {
  providers: ['anthropic', 'openai'], // Anthropic first for longer context
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 20,
    minScore: 0.8 // Higher relevance threshold
  },
  researchSettings: {
    defaultMaxDepth: 5, // Deep research
    defaultAudienceLevel: 'expert'
  }
};

/**
 * Minimal configuration for cost-conscious usage
 */
export const budgetConfig: AgentConfig = {
  providers: ['ollama'], // Only free local models
  memoryEnabled: false, // Reduce API calls
  telemetryEnabled: false,
  researchSettings: {
    defaultMaxDepth: 2,
    defaultAudienceLevel: 'beginner'
  }
};

/**
 * Enterprise configuration with full monitoring
 */
export const enterpriseConfig: AgentConfig = {
  providers: ['openai', 'anthropic', 'ollama'],
  memoryEnabled: true,
  telemetryEnabled: true,
  memoryConfig: {
    maxResults: 15,
    minScore: 0.75
  },
  researchSettings: {
    defaultMaxDepth: 4,
    defaultAudienceLevel: 'expert'
  }
};

/**
 * Example research configurations for different use cases
 */
export const exampleResearchTasks: Record<string, ResearchConfig> = {
  // Technology research
  quantumComputing: {
    topic: 'quantum computing applications in cryptography',
    maxDepth: 4,
    includeAcademic: true,
    includeRecent: true,
    audienceLevel: 'expert'
  },

  // Business analysis
  marketTrends: {
    topic: 'artificial intelligence adoption in healthcare',
    maxDepth: 3,
    includeRecent: true,
    audienceLevel: 'intermediate'
  },

  // Quick overview
  conceptOverview: {
    topic: 'machine learning for beginners',
    maxDepth: 2,
    includeAcademic: false,
    includeRecent: false,
    audienceLevel: 'beginner'
  },

  // Comprehensive analysis
  deepDive: {
    topic: 'blockchain scalability solutions',
    maxDepth: 5,
    includeAcademic: true,
    includeRecent: true,
    audienceLevel: 'expert'
  },

  // Educational content
  learning: {
    topic: 'neural networks explained',
    maxDepth: 3,
    includeAcademic: false,
    includeRecent: false,
    audienceLevel: 'intermediate'
  }
};

/**
 * Environment-specific configuration selection
 */
export function getConfigForEnvironment(): AgentConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return budgetConfig;
    case 'research':
      return researchConfig;
    case 'enterprise':
      return enterpriseConfig;
    default:
      return developmentConfig;
  }
}

/**
 * Provider environment validation
 */
export function validateEnvironment(): {
  valid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for API keys
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOllama = process.env.OLLAMA_HOST || 'localhost:11434';

  if (!hasOpenAI && !hasAnthropic) {
    issues.push('No cloud LLM providers configured');
    recommendations.push('Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables');
  }

  if (!hasOllama) {
    recommendations.push('Consider installing Ollama for local development');
  }

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  
  if (majorVersion < 18) {
    issues.push(`Node.js ${nodeVersion} is too old`);
    recommendations.push('Upgrade to Node.js 18+ for optimal performance');
  }

  // Check for telemetry database directory
  const homedir = process.env.HOME || process.env.USERPROFILE;
  if (homedir) {
    recommendations.push(`Telemetry will be stored in: ${homedir}/.dcyfr/`);
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Configuration validation helper
 */
export function validateConfig(config: AgentConfig): {
  valid: boolean;
  warnings: string[];
  optimizations: string[];
} {
  const warnings: string[] = [];
  const optimizations: string[] = [];

  // Check provider configuration
  if (!config.providers || config.providers.length === 0) {
    warnings.push('No providers specified - agent may fail');
  }

  if (config.providers?.includes('openai') && !process.env.OPENAI_API_KEY) {
    warnings.push('OpenAI provider specified but OPENAI_API_KEY not set');
  }

  if (config.providers?.includes('anthropic') && !process.env.ANTHROPIC_API_KEY) {
    warnings.push('Anthropic provider specified but ANTHROPIC_API_KEY not set');
  }

  // Check memory configuration
  if (config.memoryEnabled && config.memoryConfig?.minScore && config.memoryConfig.minScore < 0.5) {
    optimizations.push('Consider increasing memory minScore to 0.6+ for better relevance');
  }

  if (config.memoryConfig?.maxResults && config.memoryConfig.maxResults > 20) {
    optimizations.push('High maxResults may slow down execution - consider 10-15');
  }

  // Check research settings
  const maxDepth = config.researchSettings?.defaultMaxDepth;
  if (maxDepth && maxDepth > 4) {
    optimizations.push('Deep research (depth > 4) will increase execution time significantly');
  }

  return {
    valid: warnings.length === 0,
    warnings,
    optimizations
  };
}