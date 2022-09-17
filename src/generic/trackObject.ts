/*
tracks changes on 1st level objects (as records)
works ok for array assignments and it's methods push, pop, shift, unshift. support insertAt(n, v) and removeAt(n) for arrays

- the sort part is irrelevant on ES2015 as Object.keys order is stable
*/

export function trackObject(o: Object) {
  const yetToSync = new Map<string, any>();

  const isArray = o instanceof Array;

  const SPECIALS = ['push', 'pop', 'shift', 'unshift', 'insertAt', 'removeAt'];

  function sync() {
    // @ts-ignore
    const childrenSyncs = Object.keys(o)
      // @ts-ignore
      .map((k) => o[k])
      .filter((v) => v.sync)
      .map((v) => v.sync());

    const arr = Array.from(yetToSync);
    yetToSync.clear();

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

  function special(methodName: string, v: any, v2:any) {
    yetToSync.set(methodName, v2 !== undefined ? [v, v2] : v);

    if (methodName === 'insertAt') { // v, v2
      // @ts-ignore
      o.splice(v, 0, v2);
    } else if (methodName === 'removeAt') { // v
      // @ts-ignore
      o.splice(v, 1);
    } else {
      // @ts-ignore
      return o[methodName](v);
    }
  }

  const proxy = new Proxy(o, {
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
        if (target[k] !== v) yetToSync.set(k, v);
        target[k] = v;
        return true;
      }
      return false;
    },
  });

  return proxy;
}

export type TO<T> = T & {
  sync: () => [string, any][];
  patch: (diffs: [string, any][]) => void;
};
