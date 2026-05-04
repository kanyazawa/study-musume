import { describe, expect, it } from 'vitest';
import { resolveFirebaseAuthDomain } from './authDomain';

describe('resolveFirebaseAuthDomain', () => {
  it('uses the configured Firebase auth domain by default', () => {
    expect(resolveFirebaseAuthDomain({
      configuredAuthDomain: 'study-musume.firebaseapp.com',
      runtimeHostname: 'study-musume.pages.dev',
    })).toBe('study-musume.firebaseapp.com');
  });

  it('keeps localhost on the configured Firebase auth domain even when runtime-host auth is enabled', () => {
    expect(resolveFirebaseAuthDomain({
      configuredAuthDomain: 'study-musume.firebaseapp.com',
      runtimeHostname: '127.0.0.1',
      useRuntimeHostForAuth: true,
    })).toBe('study-musume.firebaseapp.com');
  });

  it('uses the runtime host only when explicitly enabled', () => {
    expect(resolveFirebaseAuthDomain({
      configuredAuthDomain: 'study-musume.firebaseapp.com',
      runtimeHostname: 'study-musume.netlify.app',
      useRuntimeHostForAuth: true,
    })).toBe('study-musume.netlify.app');
  });
});

