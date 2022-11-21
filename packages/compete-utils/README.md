# compete utils

This is the home of a couple of optional features that go well with **compete**.

Be sure to visit the [docs](https://josepedrodias.github.io/compete/packages/compete-utils/docs/index.html).

## sync/patch objects and arrays between server and clients

if you wrap an array or object with trackObject, it will make sure attribute changes (either object attributes or array positions) will get tracked
and for arrays the most relevant ops are abstracted too (`push`/`pop`, `shift`/`unshift`, `insertAt`/`removeAt`)

by the time the `.sync()` function is called, all changes since the last sync are given to you to send over the wire and apply with `.patch()`

If one is careful enough to wrap children correctly, this algorithm works well recursively. Take a look at [trackObject.test.ts](src/trackObject.test.ts).

## forget/recover to enforce hidden state

TODO: eventually generalize or just keep as a recipe?

In card games it's very common for players not to be able to know their opposite player hands.
This card abstraction assumes the card is known at server-side and `.forget()` and `.recall()` is used with the optional `adaptState()` game room wrapper method
to temporarily hide the card value of cards you're not supposed to see.

Take a look at [cards.test.ts](src/cards/cards.test.ts).
