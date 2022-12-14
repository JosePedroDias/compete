/**
 * Sync interface
 */
export type SyncInterface<T> = T & {
  sync: () => [string, any][];
  patch: (diffs: [string, any][]) => void;
  insertAt(index: number, value: any): void;
  removeAt(index: number): void;
};

/**
 * This function transforms a regular object or array into a similar one supporting sync/patch feature.
 * If object in not an array, sets get recorded for sync.
 * If object is an array, array methods push/pop/shift/unshift plus insertAt and removeAt are synced
 * @param o object to track
 */
export function trackObject<T>(o: T): SyncInterface<T> {
  const isArray = o instanceof Array;

  let yetToSync = isArray ? [] : new Map<string, any>();

  const SPECIALS = ['push', 'pop', 'shift', 'unshift', 'insertAt', 'removeAt'];

  function sync() {
    // @ts-ignore
    const childrenSyncs = Object.keys(o)
      // @ts-ignore
      .map((k) => o[k])
      .filter((v) => v.sync)
      .map((v) => v.sync());

    const arr = Array.from(yetToSync);

    if (isArray) {
      yetToSync = [];
    } else {
      (yetToSync as Map<string, any>).clear();
    }

    if (childrenSyncs.length > 0) return { c: childrenSyncs, m: arr };
    return arr;
  }

  function patch(diffs: [string, any][]) {
    // @ts-ignore
    if (diffs.m) {
      // @ts-ignore
      const childrenToPatch = Object.keys(o)
        // @ts-ignore
        .map((k) => o[k])
        .filter((v) => v.patch);
      // @ts-ignore
      for (const [idx, subDiff] of Object.entries(diffs.c)) {
        // @ts-ignore
        childrenToPatch[idx].patch(subDiff);
      }

      // @ts-ignore
      diffs = diffs.m;
    }

    for (const [k, v] of diffs) {
      if (isArray && SPECIALS.indexOf(k as string) !== -1) {
        if (k === 'insertAt') {
          // @ts-ignore
          o.splice(v[0], 0, v[1]);
        } else if (k === 'removeAt') {
          // @ts-ignore
          o.splice(v, 1);
        } else {
          // @ts-ignore
          o[k](v);
        }
      } else {
        // @ts-ignore
        o[k] = v;
      }
    }
  }

  // only called for arrays
  function special(methodName: string, v: any, v2: any) {
    (yetToSync as any[]).push([methodName, v2 !== undefined ? [v, v2] : v]);

    if (methodName === 'insertAt') {
      // @ts-ignore
      o.splice(v, 0, v2);
    } else if (methodName === 'removeAt') {
      // @ts-ignore
      o.splice(v, 1);
    } else {
      // @ts-ignore
      return o[methodName](v);
    }
  }

  const proxy = new Proxy(o as any, {
    get(target, k) {
      if (k === 'sync') return sync;
      if (k === 'patch') return patch;
      if (isArray && SPECIALS.indexOf(k as string) !== -1) {
        // @ts-ignore
        return (v, v2) => special(k, v, v2);
      }
      if (k in target) {
        // @ts-ignore
        return target[k];
      }
    },
    set(target: any, k, v): boolean {
      if (typeof k === 'string') {
        if (target[k] !== v) {
          if (isArray) (yetToSync as any[]).push([k, v]);
          else (yetToSync as Map<string, any>).set(k, v);
        }
        target[k] = v;
        return true;
      }
      return false;
    },
  });

  return proxy as SyncInterface<T>;
}
