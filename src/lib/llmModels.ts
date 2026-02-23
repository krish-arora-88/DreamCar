type DeploymentSlot = 'default' | 'compromises' | 'prefExtract';

const AZURE_ENV: Record<DeploymentSlot, string> = {
  default: 'AZURE_OPENAI_DEPLOYMENT_DEFAULT',
  compromises: 'AZURE_OPENAI_DEPLOYMENT_COMPROMISES',
  prefExtract: 'AZURE_OPENAI_DEPLOYMENT_PREF_EXTRACT',
};

const OPENAI_ENV: Record<DeploymentSlot, string> = {
  default: 'OPENAI_MODEL_DEFAULT',
  compromises: 'OPENAI_MODEL_COMPROMISES',
  prefExtract: 'OPENAI_MODEL_PREF_EXTRACT',
};

const HARDCODED_DEFAULTS: Record<DeploymentSlot, string> = {
  default: 'gpt-4o-mini',
  compromises: 'gpt-4o',
  prefExtract: 'gpt-4o-mini',
};

/**
 * Resolve the model / deployment name for a given slot.
 *
 * Resolution order:
 *   1. Slot-specific Azure env (AZURE_OPENAI_DEPLOYMENT_<SLOT>)
 *   2. Slot-specific OpenAI env (OPENAI_MODEL_<SLOT>) — backward compat
 *   3. AZURE_OPENAI_DEPLOYMENT_DEFAULT — Azure catch-all
 *   4. Hard-coded default
 */
export function getDeployment(slot: DeploymentSlot): string {
  return (
    process.env[AZURE_ENV[slot]] ||
    process.env[OPENAI_ENV[slot]] ||
    process.env.AZURE_OPENAI_DEPLOYMENT_DEFAULT ||
    HARDCODED_DEFAULTS[slot]
  );
}
