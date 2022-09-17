import { Sprite, Texture, Container } from "pixi.js";
import { getDeck, Card, Back } from './cards';

export const cardTextures = new Map<string, Texture>();

const KEY_SHADOW = 'SHADOW';
const KEY_BLANK = 'BLANK';

function setup() {
  const d = getDeck(true);
  const keys = d.map(c =>c.toString());

  for (const b of Object.values(Back)) {
    keys.push(b);
  }

  keys.push(KEY_SHADOW);
  keys.push(KEY_BLANK);

  for (const key of keys) {
    const imgUrl = new URL(`/cards/${key}.svg`, import.meta.url).href;
    const cardTexture = Texture.from(imgUrl);
    cardTextures.set(key, cardTexture);
  }
}

setup();

const FRONT_IDX = 1;
const BACK_IDX = 2;

export function getCardVisual(c: Card) {
  const cv = new Container();

  const shadow = new Sprite( cardTextures.get(KEY_SHADOW) );
  shadow.anchor.set(0.5);
  cv.addChild(shadow); // 0

  const front = new Sprite( cardTextures.get( c.toString() ) );
  front.anchor.set(0.5);
  cv.addChild(front); // 1

  const back = new Sprite( cardTextures.get(c.back) );
  back.anchor.set(0.5);
  cv.addChild(back); // 2

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
  const wasBlank = cv.children[FRONT_IDX].texture.baseTexture.cacheId.includes('BLANK'); // TODO something simpler and/or more performant?
  const isBlank = !c.rank;

  if ((c.facingDown && cv.children[FRONT_IDX].visible) || (!c.facingDown && cv.children[BACK_IDX].visible)) {
    cv.children[FRONT_IDX].visible = !cv.children[FRONT_IDX].visible;
    cv.children[BACK_IDX].visible = !cv.children[BACK_IDX].visible;
  }

  if (wasBlank && !isBlank) {
    const front = new Sprite( cardTextures.get( c.toString() ) );
    front.visible = !c.facingDown;
    front.anchor.set(0.5);
    cv.removeChildAt(1);
    cv.addChildAt(front, 1);
  } else if (!wasBlank && isBlank) {
    const front = new Sprite( cardTextures.get(KEY_BLANK) );
    front.visible = !c.facingDown;
    front.anchor.set(0.5);
    cv.removeChildAt(1);
    cv.addChildAt(front, 1);
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
