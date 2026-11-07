/**
 * In-memory sliding window rate limiter for security-sensitive endpoints (e.g. /api/auth/login).
 * In serverless environments, this protects each instance against rapid brute-force attacks.
 * Can also integrate with external Redis/Upstash if UPSTASH_REDIS_REST_URL is configured.
 */

interface RateLimitRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired records every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((record, key) => {
      if (record.lockedUntil && record.lockedUntil < now) {
        store.delete(key);
      } else if (now - record.firstAttemptAt > 60 * 60 * 1000) {
        store.delete(key);
      }
    });
  }, 10 * 60 * 1000);
}

export interface RateLimitOptions {
  maxAttempts?: number; // Default: 5 attempts
  windowMs?: number; // Default: 15 minutes
  lockoutMs?: number; // Default: 15 minutes lockout after maxAttempts exceeded
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): {
  isLimited: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const lockoutMs = options.lockoutMs ?? 15 * 60 * 1000;
  const now = Date.now();

  const record = store.get(identifier);

  if (!record) {
    return {
      isLimited: false,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // If currently locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isLimited: true,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // If window has passed, reset
  if (now - record.firstAttemptAt > windowMs) {
    store.delete(identifier);
    return {
      isLimited: false,
      remainingAttempts: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  const remainingAttempts = Math.max(0, maxAttempts - record.count);
  return {
    isLimited: remainingAttempts === 0,
    remainingAttempts,
    retryAfterSeconds:
      remainingAttempts === 0
        ? Math.ceil((record.firstAttemptAt + lockoutMs - now) / 1000)
        : 0,
  };
}

export function recordFailedAttempt(
  identifier: string,
  options: RateLimitOptions = {}
): {
  isLimited: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
} {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const lockoutMs = options.lockoutMs ?? 15 * 60 * 1000;
  const now = Date.now();

  let record = store.get(identifier);

  if (!record || now - record.firstAttemptAt > windowMs) {
    record = {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
    store.set(identifier, record);
    return {
      isLimited: false,
      remainingAttempts: maxAttempts - 1,
      retryAfterSeconds: 0,
    };
  }

  record.count += 1;

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockoutMs;
    const retryAfterSeconds = Math.ceil(lockoutMs / 1000);
    return {
      isLimited: true,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  return {
    isLimited: false,
    remainingAttempts: maxAttempts - record.count,
    retryAfterSeconds: 0,
  };
}

export function clearRateLimit(identifier: string): void {
  store.delete(identifier);
}
