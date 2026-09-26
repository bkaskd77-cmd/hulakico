const pending = new Map<string, Promise<unknown>>();

export function runOnce<T>(key: string, task: () => Promise<T>): Promise<T> {
  const existing = pending.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const started = task().catch((error) => {
    pending.delete(key);
    throw error;
  });
  pending.set(key, started);
  return started;
}

export function runAtMostEvery<T>(key: string, intervalMs: number, task: () => Promise<T>): Promise<T> | null {
  const slot = `${key}:${Math.floor(Date.now() / intervalMs)}`;
  if (pending.has(slot)) return null;
  return runOnce(slot, task);
}
