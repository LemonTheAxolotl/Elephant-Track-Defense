# Elephant Track Defense

A browser-based tower-defense game where elephants defend a winding track from increasingly powerful metallic orbs.

## Play

[Play Elephant Track Defense](https://lemontheaxolotl.github.io/Elephant-Track-Defense/)

The game runs entirely in the browser with no backend or installation required.

Game maps, waves, towers, orbs, achievements, tutorials, and difficulties are editable in [`data/`](data/README.md). They are loaded through relative URLs, so the same build works on GitHub Pages without a database.

## Local development

Serve this directory with any static file server, then open its local URL. JSON loading uses browser `fetch`, matching GitHub Pages deployment behavior.

For example, from the project root:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`. The static server must serve `index.html`, `data-loader.js`, and the complete `data/` folder from this same root.

The project also includes `content-local.js`, a generated fallback that lets a downloaded build open directly from `file://`. Whenever the editable files in `data/` change, refresh that fallback before sharing the standalone build:

```sh
node build-local-content.js
```

Run the automated checks with Node.js:

```sh
node --check game.js
node --check orb-progression.js
node content-data.test.js
node game-integration.test.js
node orb-progression.test.js
node balance-simulation.test.js
```
