let token: object | null = null

/**
 * A token for the task that's running: the same object until the task's
 * microtasks run, then a new one. It tells a repeat of a request made in
 * the same task (a handler that asks again) from a new one; the listeners
 * of one user event can each run in a task of their own, so a request's
 * event tells those apart (see `isNoopRequest`). Nothing that has to see a
 * value React commits later reads it.
 */
export function currentTask(): object {
  if (token === null) {
    const current = {}
    token = current
    queueMicrotask(() => {
      if (token === current) token = null
    })
  }
  return token
}
