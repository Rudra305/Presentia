/**
 * Typed access to environment variables.
 *
 * Rules:
 *  - Only variables prefixed EXPO_PUBLIC_* are exposed to the mobile bundle.
 *  - This module is the single boundary between raw process.env and app code.
 *  - Never import process.env directly outside this file.
 *  - Vars are read via STATIC keys so Metro/Babel can inline them at build time.
 */

export type AppEnv = 'development' | 'staging' | 'production';

// Static reads — required for Metro build-time inlining and for the
// `expo/no-dynamic-env-var` lint rule.
const RAW_APP_ENV = process.env.EXPO_PUBLIC_APP_ENV;
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function toAppEnv(raw: string | undefined): AppEnv {
    return raw === 'staging' || raw === 'production' ? raw : 'development';
}

export const env = Object.freeze({
    appEnv: toAppEnv(RAW_APP_ENV),
    apiBaseUrl: RAW_API_BASE_URL ?? '',
});

export const isDev = env.appEnv === 'development';
export const isProd = env.appEnv === 'production';
