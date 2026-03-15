const SMOKE_TLS_OPTION = "--tls-min-v1.2";

export const smokeEnvDefaults = {
  CI_SMOKE_TEST_MODE: "1",
  SMOKE_TEST_BASE_URL: "http://127.0.0.1:3101",
  NEXT_PUBLIC_FIREBASE_API_KEY: "smoke-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "smoke.local",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "smoke-project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "smoke-bucket",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "1234567890",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1234567890:web:smoke",
  FIREBASE_PROJECT_ID: "smoke-project",
  FIREBASE_CLIENT_EMAIL: "smoke@example.com",
  FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nsmoke\\n-----END PRIVATE KEY-----\\n",
  AI_GATEWAY_API_KEY: "smoke-ai-key",
  R2_REGION: "auto",
  R2_ENDPOINT: "https://smoke-r2.local",
  R2_ACCESS_KEY_ID: "smoke-access",
  R2_SECRET_ACCESS_KEY: "smoke-secret",
  R2_BUCKET_NAME: "smoke-bucket",
  R2_PUBLIC_BASE_URL: "https://cdn.smoke.local",
  POLLO_AI_API_KEY: "smoke-pollo-key",
};

function ensureNodeOption(existingValue, requiredOption) {
  if (!existingValue) {
    return requiredOption;
  }

  const options = existingValue.split(/\s+/).filter(Boolean);
  return options.includes(requiredOption) ? existingValue : `${existingValue} ${requiredOption}`;
}

export function resolveSmokeEnv(sourceEnv = process.env) {
  const env = {
    ...smokeEnvDefaults,
    ...sourceEnv,
  };

  env.NODE_OPTIONS = ensureNodeOption(env.NODE_OPTIONS, SMOKE_TLS_OPTION);

  return env;
}
