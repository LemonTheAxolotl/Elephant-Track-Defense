# Elephant Track Defense

A browser-based tower-defense game where elephants defend a winding track from increasingly powerful metallic orbs.

## Play

[Play Elephant Track Defense](https://lemontheaxolotl.github.io/Elephant-Track-Defense/)

The game runs entirely in the browser with no backend or installation required.

Game maps, waves, towers, orbs, achievements, tutorials, and difficulties are editable in [`data/`](data/README.md). They are loaded through relative URLs, so the same build works on GitHub Pages without a database.

## Maps

- **Foundry Sector 07** is the original 50-wave map and includes the final boss encounter.
- **Frozen Expanse** is a separate, snowy 50-wave map. It unlocks permanently after defeating the Foundry finale (or with the owner debug command `/unlock frozen`) and has its own run progress and difficulty-scoped save state.

Map definitions and their track waypoints live in [`data/maps.json`](data/maps.json); wave sets live in [`data/waves.json`](data/waves.json).

## Placing towers

1. Select an elephant, factory, plant, heater, or other item from the Shop.
2. Move the preview onto valid ground.
3. Click or tap to deploy it.
4. Changed your mind? Click or tap the same selected Shop item again to cancel placement.
5. To choose a different item instead, click or tap a different Shop item.

`R — Rotate` is a separate desktop placement-preview control.


```
