import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeGoogleAuth = registerPlugin('NativeGoogleAuth', {
  web: () => ({
    signIn: async () => {
      throw new Error('NativeGoogleAuth is only available on native platforms.');
    },
    restorePreviousSignIn: async () => ({ success: false, noSession: true }),
    signOut: async () => ({ success: true }),
  }),
});

export const isNativeIOSApp = () => {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
};

export const nativeGoogleSignIn = async () => {
  if (!isNativeIOSApp()) {
    return { success: false, error: 'Native iOS Google Sign-In is unavailable.' };
  }

  try {
    const result = await NativeGoogleAuth.signIn();
    return {
      success: true,
      idToken: result?.idToken || null,
      accessToken: result?.accessToken || null,
      profile: result?.profile || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Native Google Sign-In failed.',
      code: error?.code || null,
    };
  }
};

export const restoreNativeGoogleSession = async () => {
  if (!isNativeIOSApp()) {
    return { success: false, noSession: true };
  }

  try {
    const result = await NativeGoogleAuth.restorePreviousSignIn();
    return {
      success: Boolean(result?.success),
      noSession: Boolean(result?.noSession),
      idToken: result?.idToken || null,
      accessToken: result?.accessToken || null,
      profile: result?.profile || null,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Failed to restore native Google session.',
      code: error?.code || null,
    };
  }
};

export const nativeGoogleSignOut = async () => {
  if (!isNativeIOSApp()) {
    return { success: true };
  }

  try {
    await NativeGoogleAuth.signOut();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Native Google sign-out failed.',
      code: error?.code || null,
    };
  }
};
