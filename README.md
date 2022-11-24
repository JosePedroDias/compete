# compete

You're reached the **compete** ⚔️ monorepo featuring its
[server](packages/compete-server/),
[client](packages/compete-client/),
[optional tools](packages/compete-utils/)
and [example games](apps/).

_The github language stats show lots of HTML because I'm pushing generated HTML docs in for convenience. Fear not: this is a TypeScript project._ 😅

Compete is in alpha stage. It's API is currently very volatile and for this reason I haven't yet pushed any of its packages to NPM, which I intend to to soon ™️.

## I want to see it in action

First let's prepare the packages:

`npm run install-all`

or

`npm install && (cd compete-server && npm install && npm run build) && (cd compete-client && npm install && npm run build) && (cd compete-utils && npm install && npm run build)`

----

To prepare a game do (using air-hockey as example):

```
cd apps/air-hockey
npm install
npm run build
npm run build-server
```

and then let's fire both server and client

```
npm run run-server &
npm run run-serve-client
```

You should now visit http://localhost:4173 which is serving the client code.  
The multiplayer game server is running in [ws://localhost:9001](ws://localhost:9001).

ℹ️ For most games there is a bot you can start one or multiple times by doing `npm run run-bot`. They tend to do dumb things but are useful nonetheless.


## So what is it?

**Compete** is a multiplayer game server in nodejs. 
It's composed of an opinionated websocket server with the purpose of hosting authoritative multiplayer games. If you want to find out more about the ideas that drove the design of it, take a look at the [what is MP](https://josepedrodias.com/presentations/what-is-mp) presentation I presented to FRVR last September.


## documentation

Be sure to visit [server](packages/compete-server/),
[client](packages/compete-client/),
[optional tools](packages/compete-utils/).

These packages expose `d.ts` files. You surely can use TypeScript for game development but you can do JavaScript instead too
and editors such as Visual Studio Code do a fine job helping you out.
I tried by best to document things and the purpose of these games is to exercise the project and serve as a showcase / go to reference of how to do things.
If you create games with compete I would love to know. Add the tag `compete-mp` to your repo if your game is OSS. Maybe we'll even feature some of those as links here. 

## dependency references

- [uws]()
- [msgpack]()
- [howler](https://github.com/goldfire/howler.js#documentation)
- [matter](https://brm.io/matter-js/docs/)
- pixi [1](https://pixijs.download/release/docs/index.html) [2](https://pixijs.io/guides/)
- trig-fills https://github.com/strainer/trigfills
- [simplex-noise](https://github.com/jwagner/simplex-noise.js)
- [alea (rng)](https://github.com/coverslide/node-alea)


## credits
### sprites

- https://www.kenney.nl/assets/topdown-tanks-redux
- https://www.pngitem.com/middle/hJTxhmo_air-hockey-sprites-hd-png-download/

### sfx

- https://www.soundsnap.com/tags/air_hockey


## known bugs / limitations

- bootstrap scripts assume POSIX machine
- I have setup nodemon on game `package.json` with the purpose of refreshing both client and server code but it's not working.
I tend to do `npm run dev` in a terminal and `npm run build-server && npm run run-server` in another one instead.

## TODO (subject to change)

- for the packages/repo:
  - review all games (since I changed several things)
  - should make it easier to bootstrap for windows machines
  - my usage of turbo is suboptimal. errors aren't stopping pipelines so I rarely see them unless I call scripts manually
  - add example nginx setup for https
  - add example docker image
  - document a little better compete-client and compete-utils
  - would be great to have a basic sanity for example games
  - publish packages once we leave alpha
- regarding example games:
  - finish up go fish game logic (low priority)
  - would love to be able to import matter-js for typescript and let nodejs work well. had to hack it in js.
- topics for investigation:
  - apply rollback net code to air-hockey or other fast-paced game
  - would like to try our serving webrtc with unordered unreliable messages to see if that performs better thank regular websockets for fast paced games
