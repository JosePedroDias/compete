import { uwsClient } from "../generic/uwsClient";

import { grid, label } from "./ui";

const CLEAN_LABEL_MS = 2500;
let cleanTimer:any;

const boardEl = document.getElementById('board') as HTMLElement;

function onClick(position:[number, number]) {
  ws.send({op: 'play', position });
  updateGrid(position, {value:'X'});
}

const [labelEl, updateLabel_] = label();
document.body.appendChild(labelEl);

function updateLabel(txt:string) {
    if (cleanTimer) {
      clearTimeout(cleanTimer);
      cleanTimer = 0;
    }

    updateLabel_(txt);

    cleanTimer = setTimeout(() => updateLabel_(' '), CLEAN_LABEL_MS);
}

const [gridEl, updateGrid] = grid(3, 3, { onClick });
document.body.appendChild(gridEl);

const ws = uwsClient((msg) => {
  console.log(msg);
});
