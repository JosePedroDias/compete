# air hockey game

This is a 2 player fast paced game.

It runs at 30 fps and uses matter-js to replicate air hockey physics.

Players send their pusher desired positions (where their mouse/touch is) and receive updated positions for both pushers and the puck.

To check the metrics do

    watch -n 5 "curl -sS 'http://localhost:9001/metrics' -H 'x-secret: 42'|jq"
