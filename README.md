# Elephant Track Defense

A browser-based tower-defense game where elephants defend a winding track from increasingly powerful metallic orbs.

## Play

[Play Elephant Track Defense](https://yunzhongwu729.github.io/elephant-track-defense/)

The game runs entirely in the browser with no backend or installation required.

## Local development

Open `index.html` in a browser, or serve this directory with any static file server.

Run the automated checks with Node.js:

```sh
node --check game.js
node --check orb-progression.js
node game-integration.test.js
node orb-progression.test.js
node balance-simulation.test.js
```

