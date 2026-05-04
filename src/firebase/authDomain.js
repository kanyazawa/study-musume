const LOCALHOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3})$/i;

export const resolveFirebaseAuthDomain = ({
  configuredAuthDomain,
  runtimeHostname,
  useRuntimeHostForAuth = false,
}) => {
  if (!configuredAuthDomain) {
    return '';
  }

  if (!useRuntimeHostForAuth) {
    return configuredAuthDomain;
  }

  if (!runtimeHostname || LOCALHOST_PATTERN.test(runtimeHostname)) {
    return configuredAuthDomain;
  }

  return runtimeHostname;
};

