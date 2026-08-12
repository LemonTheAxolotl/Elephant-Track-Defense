# Elephant Track Defense content data

The game loads and validates every file in this folder before `game.js` starts. These files contain editable content and balance values; JavaScript continues to own behavior, animation, input, and state transitions.

- `maps.json`: world dimensions, buildable bounds, entrances, endpoints, camera bounds, and ordered track waypoints.
- `orbs.json`: normal tiers, special orbs, the fused boss, health, speed, rewards, damage, and visual colors.
- `towers.json`: shop entries, prices, placement limits, statistics, upgrades, targeting metadata, and specializations.
- `achievements.json`: profile achievement text, difficulties, rewards, and declarative unlock conditions.
- `tutorial.json`: ordered tutorial copy, highlighted UI targets, and required actions.
- `waves.json`: the 50 wave records, composition rule, special windows, warnings, and fixed finale encounter order.
- `difficulties.json`: Easy, Normal, and Hard modifiers and player-facing descriptions.

## Safely adding content

Use a permanent lowercase ID made from letters, numbers, `_`, or `-`. Never reuse or rename an ID after a save may contain it. Add a map to `maps.json` and set `defaultMapId` only when it is ready. Add an orb before referencing its ID from a wave, achievement, or finale. Add a tower record whose `runtimeType` is supported by gameplay code. Add a wave with the next sequential `wave_N` ID and a valid composition-rule ID.

Run `node content-data.test.js` after editing. A missing reference, duplicate ID, malformed record, or invalid sequence produces a named developer error. The browser displays the same error instead of starting with partially loaded data.
