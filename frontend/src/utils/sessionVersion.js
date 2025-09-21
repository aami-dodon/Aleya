const listeners = new Set();
let expectedBootId = null;

export function setExpectedBootId(bootId) {
  expectedBootId = bootId || null;
}

export function getExpectedBootId() {
  return expectedBootId;
}

export function onBootIdMismatch(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function trackBootId(bootId) {
  if (!bootId) {
    return;
  }

  if (!expectedBootId) {
    expectedBootId = bootId;
    return;
  }

  if (expectedBootId === bootId) {
    return;
  }

  const previousBootId = expectedBootId;
  expectedBootId = bootId;

  listeners.forEach((listener) => {
    try {
      listener(bootId, previousBootId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Boot ID listener error", error);
    }
  });
}
