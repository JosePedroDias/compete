/*
tracks changes on 1st level objects (as records)
works ok for array assignments and it's methods push, pop, shift, unshift

EVENTUAL TODO
- wrap tracking object values in object or array?
- support slice, splice?
*/


export function trackObject(o: Object) {
  const yetToSync = new Map<string, any>();

  const isArray = o instanceof Array;

  const SPECIALS = ['push', 'pop', 'shift', 'unshift'];

  function sync() {
    const arr = Array.from(yetToSync);
    yetToSync.clear();
    return arr;
  }

  function patch(diffs:[string,any][]) {
    for (const [k, v] of diffs) {
      if (isArray && SPECIALS.indexOf(k as string) !== -1) {
        // @ts-ignore
        o[k](v);
      } else {
        // @ts-ignore
        o[k] = v;
      }
    }
  }

  function special(methodName:string, v:any) {
    yetToSync.set(methodName, v);
    // @ts-ignore
    return o[methodName](v);
  }

  const proxy = new Proxy(o, {
    get(target, k) {
      if (k === 'sync') return sync;
      if (k === 'patch') return patch;
      if (isArray && SPECIALS.indexOf(k as string) !== -1) {
        // @ts-ignore
        return (v) => special(k, v);
      }
      if (k in target) {
        // @ts-ignore
        return target[k];
      }
    },
    set(target:any, k, v): boolean {
      if (typeof k === 'string') {
        if (target[k] !== v) yetToSync.set(k, v);
        target[k] = v;
        return true;
      }
      return false;
    }
  });

  return proxy;
}
