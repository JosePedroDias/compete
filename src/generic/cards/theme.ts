import { Sprite, Texture, Container } from "pixi.js";
import { getDeck, Card, Back } from './cards';

export const cardTextures = new Map<string, Texture>();

function setup() {
  const d = getDeck(true);
  const keys = d.map(c =>c.toString());

  for (const b of Object.values(Back)) {
    keys.push(b);
  }

  keys.push('SHADOW');
  keys.push('HIGHLIGHT');

  for (const key of keys) {
    const imgUrl = new URL(`/cards/${key}.svg`, import.meta.url).href;
    const cardTexture = Texture.from(imgUrl);
    cardTextures.set(key, cardTexture);
  }
}

setup();

/* type CardVisual = Container & {
  c
} */

const FRONT_IDX = 1;
const BACK_IDX = 2;

export function getCardVisual(c: Card) {
  const key = c.toString();
  const cv = new Container();

  const shadow = new Sprite( cardTextures.get('SHADOW') );
  shadow.anchor.set(0.5);
  cv.addChild(shadow); // 0

  const front = new Sprite( cardTextures.get(key) );
  front.anchor.set(0.5);
  cv.addChild(front); // 1

  const back = new Sprite( cardTextures.get(c.back) );
  back.anchor.set(0.5);
  cv.addChild(back); // 2

  /* const highlight = new Sprite( cardTextures.get('HIGHLIGHT') );
  highlight.anchor.set(0.5);
  cv.addChild(highlight); */

  if (c.facingDown) {
    front.visible = false;
  } else {
    back.visible = false;
  }

  c.setUpdateAndDispose(
    () => updateCardVisual(c, cv),
    () => disposeCardVisual(cv)
  );
  
  return cv;
}

export function updateCardVisual(c:Card, cv:any) {
  if ((c.facingDown && cv.children[FRONT_IDX].visible) || (!c.facingDown && cv.children[BACK_IDX].visible)) {
    cv.children[FRONT_IDX].visible = !cv.children[FRONT_IDX].visible;
    cv.children[BACK_IDX].visible = !cv.children[BACK_IDX].visible;
  }

  if (c.position[0] !== cv.position.x || c.position[1] !== cv.position.y) {
    cv.position.set(c.position[0], c.position[1]);
  }

  if (c.rotation !== cv.rotation) {
    cv.rotation = c.rotation;
  }
}

export function disposeCardVisual(cv:Container) {
  cv.parent.removeChild(cv);
}
