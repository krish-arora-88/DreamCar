import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDeployment } from '@/lib/llmModels';

function clearEnv() {
  delete process.env.AZURE_OPENAI_DEPLOYMENT_DEFAULT;
  delete process.env.AZURE_OPENAI_DEPLOYMENT_COMPROMISES;
  delete process.env.AZURE_OPENAI_DEPLOYMENT_PREF_EXTRACT;
  delete process.env.OPENAI_MODEL_DEFAULT;
  delete process.env.OPENAI_MODEL_COMPROMISES;
  delete process.env.OPENAI_MODEL_PREF_EXTRACT;
}

describe('getDeployment', () => {
  beforeEach(clearEnv);
  afterEach(clearEnv);

  it('returns Azure deployment env when set', () => {
    process.env.AZURE_OPENAI_DEPLOYMENT_COMPROMISES = 'my-gpt4o-azure';
    expect(getDeployment('compromises')).toBe('my-gpt4o-azure');
  });

  it('falls back to OPENAI_MODEL_* when Azure env is absent', () => {
    process.env.OPENAI_MODEL_PREF_EXTRACT = 'gpt-4o-mini-openai';
    expect(getDeployment('prefExtract')).toBe('gpt-4o-mini-openai');
  });

  it('falls back to AZURE_OPENAI_DEPLOYMENT_DEFAULT as catch-all', () => {
    process.env.AZURE_OPENAI_DEPLOYMENT_DEFAULT = 'catch-all-deploy';
    expect(getDeployment('compromises')).toBe('catch-all-deploy');
  });

  it('Azure slot-specific takes precedence over OPENAI_MODEL_*', () => {
    process.env.AZURE_OPENAI_DEPLOYMENT_COMPROMISES = 'azure-deploy';
    process.env.OPENAI_MODEL_COMPROMISES = 'openai-model';
    expect(getDeployment('compromises')).toBe('azure-deploy');
  });

  it('returns hardcoded default when no env is set', () => {
    expect(getDeployment('default')).toBe('gpt-4o-mini');
    expect(getDeployment('compromises')).toBe('gpt-4o');
    expect(getDeployment('prefExtract')).toBe('gpt-4o-mini');
  });
});
