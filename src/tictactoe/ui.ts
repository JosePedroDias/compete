export type GridOpts = {
  onClick: (pos:[number, number])=>void;
}

export function grid(w:number, h:number, opts: GridOpts): [HTMLElement, (pos:[number, number], opts:{value:any})=>void] {
  const gridEl = document.createElement('div');
  gridEl.className = 'grid';
  
  const cellEls:HTMLElement[] = [];

  let i = 0;
  for (let y = 0; y < h; ++y) {
      let rowEl = document.createElement('div');
      rowEl.className = 'row';
      gridEl.appendChild(rowEl);

      for (let x = 0; x < w; ++x) {
          const cellEl = document.createElement('div');
          cellEl.className = 'cell';
          cellEl.dataset.pos = `${x},${y}`;
          cellEl.appendChild(document.createTextNode(' '));
          rowEl.appendChild(cellEl);
          cellEls.push(cellEl);
          ++i;
      }
  }

  gridEl.addEventListener('click', (ev) => {
      const cellEl = ev.target as HTMLElement;
      // @ts-ignore
      const pos:[number, number] = cellEl.dataset.pos.split(',').map((c) => parseInt(c, 10));
      opts.onClick(pos);
  });

  function update(pos:[number, number], uOpts:{value:any}) {
    const data = `${pos[0]},${pos[1]}`;
      const cellEl = cellEls.find((el) => el.dataset.pos === data);
      // @ts-ignore
      if (value) cellEl.firstChild.nodeValue = uOpts.value;
  }

  return [ gridEl, update ];
}

export function label(initialValue = ' '): [HTMLElement, Function] {
  const el = document.createElement('div');

  el.innerHTML = initialValue;

  function update(value:any) {
      el.innerHTML = value;
  }

  return [ el, update ];
}

// type HashOfstring = {[key: string]: string};

/* export function handleKeys(opts:Object) {
  //const { relevantKeys:HashOfstring , onChange:Function } = opts;
  // @ts-ignore
  const relevantKeys = opts.relevantKeys;
  // @ts-ignore
  const onChange = opts.onChange;

  function onKeyEv(ev: KeyboardEvent) {
      const keyV = relevantKeys[ev.key];
      if (!keyV) return;
      
      ev.preventDefault();
      ev.stopPropagation();
      onChange(keyV, ev);
  }
  document.body.addEventListener('keydown', onKeyEv);
  document.body.addEventListener('keyup',   onKeyEv);
} */
