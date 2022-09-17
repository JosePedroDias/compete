# multiplayer server

has some design ideas from nakama (trying to keep an aseptic API) and some from coliseus (efficient state management)

- trackObject - allows diffing change between sync() calls. if objects or arrays (children) as wrapped too, the diff recurses properly.

- card features a forget/recover logic to differentiate between the perspective of an owner vs opponent.

