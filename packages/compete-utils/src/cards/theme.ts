import { Sprite, Texture, Container } from 'pixi.js';

import { getDeck, Card, Back } from './cards';

/**
 * This module deals with visual representation of cards and syncing those with their abstract counterparts
 */

export const cardTextures = new Map<string, Texture>();

const KEY_SHADOW = 'SHADOW';
const KEY_BLANK = 'BLANK';

/**
 * This function is meant to be automatically run by the client to fetch and load card assets as textures
 */
function prepareTextures() {
  const d = getDeck(true);
  const keys = d.map((c) => c.toString());

  for (const b of Object.values(Back)) {
    keys.push(b);
  }

  keys.push(KEY_SHADOW);
  keys.push(KEY_BLANK);

  for (const key of keys) {
    const imgUrl = `/cards/${key}.svg`;
    const cardTexture = Texture.from(imgUrl);
    cardTextures.set(key, cardTexture);
  }
}

if (typeof window === 'object') {
  prepareTextures();
}

const FRONT_IDX = 1;
const BACK_IDX = 2;

/**
 * Generates a visual representation of an abstract card and keep a loose connection between both
 *
 * @param c the abstract card
 * @param onClick makes the click handler receive the original abstract representation
 * @returns the visual representation of the card
 */
export function getCardVisual(
  c: Card,
  onClick?: (c: Card, cv: Container) => void,
): Container {
  const cv = new Container();

  cv.name = c.id;

  const shadow = new Sprite(cardTextures.get(KEY_SHADOW));
  shadow.anchor.set(0.5);
  cv.addChild(shadow); // 0

  const front = new Sprite(cardTextures.get(c.toString()));
  front.anchor.set(0.5);
  cv.addChild(front); // 1

  const back = new Sprite(cardTextures.get(c.back));
  back.anchor.set(0.5);
  cv.addChild(back); // 2

  if (c.facingDown) {
    front.visible = false;
  } else {
    back.visible = false;
  }

  c.setUpdateAndDispose(
    () => updateCardVisual(c, cv),
    () => disposeCardVisual(cv),
  );

  if (onClick) {
    cv.interactive = true;
    //cv.buttonMode = true;
    cv.on('pointerdown', () => onClick(c, cv));
  }

  return cv;
}

/**
 * Updates the visual representation with the abstract version
 * This is meant to be run when syncing remote data in
 *
 * @param c the abstract card
 * @param cv the visual card
 */
export function updateCardVisual(c: Card, cv: any): void {
  const wasBlank =
    cv.children[FRONT_IDX].texture.baseTexture.cacheId.includes('BLANK'); // TODO something simpler and/or more performant?
  const isBlank = !c.rank;

  if (
    (c.facingDown && cv.children[FRONT_IDX].visible) ||
    (!c.facingDown && cv.children[BACK_IDX].visible)
  ) {
    cv.children[FRONT_IDX].visible = !cv.children[FRONT_IDX].visible;
    cv.children[BACK_IDX].visible = !cv.children[BACK_IDX].visible;
  }

  if (wasBlank && !isBlank) {
    const front = new Sprite(cardTextures.get(c.toString()));
    front.visible = !c.facingDown;
    front.anchor.set(0.5);
    cv.removeChildAt(1);
    cv.addChildAt(front, 1);
  } else if (!wasBlank && isBlank) {
    const front = new Sprite(cardTextures.get(KEY_BLANK));
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

/**
 * This function exists to allow remote collections to update the local visual representation
 *
 * @param cards a set of abstract cards
 * @param parent the container of the visual representation of those cards
 */
export function reorderVisuals(cards: Card[], parent: Container): void {
  cards = Array.from(cards);
  cards.reverse();
  for (const c of cards) {
    const cv = parent.getChildByName(c.id);
    parent.setChildIndex(cv, 0);
  }
}

/**
 * Disposes the visual card
 *
 * @param cv visual representation of a card
 */
export function disposeCardVisual(cv: Container): void {
  cv.parent.removeChild(cv);
}
