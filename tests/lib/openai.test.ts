import { describe, it, expect } from 'vitest';
import { normalizeAzureBaseURL } from '@/lib/openai';

describe('normalizeAzureBaseURL', () => {
  it('appends /openai/v1/ to a bare Azure host', () => {
    expect(normalizeAzureBaseURL('https://x.openai.azure.com')).toBe(
      'https://x.openai.azure.com/openai/v1/',
    );
  });

  it('appends /openai/v1/ when host has trailing slash', () => {
    expect(normalizeAzureBaseURL('https://x.openai.azure.com/')).toBe(
      'https://x.openai.azure.com/openai/v1/',
    );
  });

  it('appends /v1/ when URL already ends with /openai', () => {
    expect(normalizeAzureBaseURL('https://x.openai.azure.com/openai')).toBe(
      'https://x.openai.azure.com/openai/v1/',
    );
  });

  it('appends trailing slash when URL ends with /openai/v1', () => {
    expect(normalizeAzureBaseURL('https://x.openai.azure.com/openai/v1')).toBe(
      'https://x.openai.azure.com/openai/v1/',
    );
  });

  it('leaves a correct URL unchanged', () => {
    expect(
      normalizeAzureBaseURL('https://x.openai.azure.com/openai/v1/'),
    ).toBe('https://x.openai.azure.com/openai/v1/');
  });

  it('strips multiple trailing slashes before normalising', () => {
    expect(normalizeAzureBaseURL('https://x.openai.azure.com///')).toBe(
      'https://x.openai.azure.com/openai/v1/',
    );
  });
});
