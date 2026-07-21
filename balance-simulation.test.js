const assert = require('node:assert/strict');
const orbs = require('./orb-progression.js');

// Mirrors the centralized early-game balance values in game.js. This is a
// deterministic strong-placement scenario, not a replacement for game logic.
const BALANCE = Object.freeze({
  tier0HP: 44,
  laterTierBaseHP: 50,
  tier0Speed: 62,
  laterTierSpeed: 70,
  earlyCounts: [9, 11, 12, 13],
  earlySpawnInterval: 1.45,
  normalSpawnInterval: 1.3,
  baseDamage: 27,
  baseCooldown: 0.75,
  upgradeDamageMultiplier: 1.05,
  upgradeSpeedMultiplier: 1.02,
  tier0DamageMultiplier: 1.10,
  twoWaterElephantGroupDamageMultiplier: 0.98,
  radius: 155,
  waveReward: 10,
  waterElephantCost: 100,
  firstUpgradeCost: 50
});

const path = [
  {x:-35,y:115},{x:205,y:115},{x:205,y:270},{x:435,y:270},{x:435,y:500},
  {x:700,y:500},{x:700,y:190},{x:925,y:190},{x:925,y:555},{x:1030,y:555},
  {x:1030,y:760},{x:780,y:760},{x:780,y:970},{x:500,y:970},{x:500,y:760},
  {x:245,y:760},{x:245,y:1100},{x:555,y:1100},{x:555,y:1280},{x:900,y:1280},
  {x:900,y:1120},{x:1160,y:1120}
];
const strongTowerPositions = [{x:350,y:370},{x:570,y:620}];
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

function waveCount(wave) { return wave <= 4 ? BALANCE.earlyCounts[wave - 1] : Math.min(45, 10 + wave - 1); }
function spawnInterval(wave) { return wave <= 4 ? BALANCE.earlySpawnInterval : BALANCE.normalSpawnInterval; }
function hpFor(wave, tier) { return orbs.hpFor(wave, tier, tier === 0 ? BALANCE.tier0HP : BALANCE.laterTierBaseHP); }
function baseSpeedFor(tier) { return tier === 0 ? BALANCE.tier0Speed : BALANCE.laterTierSpeed; }
function progress(ball) { let value = 0; for (let i = 0; i < ball.segment; i++) value += distance(path[i], path[i + 1]); return value + distance(path[ball.segment], ball); }

function simulateWave(wave, towerLevels = [1]) {
  const sequence = orbs.tiersForWave(wave, waveCount(wave));
  const towers = towerLevels.map((level, index) => ({
    ...strongTowerPositions[index],
    cooldown: 0,
    damage: BALANCE.baseDamage * BALANCE.upgradeDamageMultiplier ** (level - 1),
    attackCooldown: BALANCE.baseCooldown / BALANCE.upgradeSpeedMultiplier ** (level - 1)
  }));
  const balls = [];
  let spawned = 0, spawnTimer = 0, kills = 0, escaped = 0, time = 0;
  while ((spawned < sequence.length || balls.length) && time < 240) {
    const dt = 0.02;
    time += dt;
    spawnTimer -= dt;
    if (spawned < sequence.length && spawnTimer <= 0) {
      const tier = sequence[spawned++];
      balls.push({x:path[0].x, y:path[0].y, segment:0, tier, hp:hpFor(wave, tier), maxHp:hpFor(wave, tier)});
      spawnTimer = spawnInterval(wave);
    }
    for (const ball of [...balls]) {
      const hpLossSpeed = 1 + (1 - ball.hp / ball.maxHp) * 0.20;
      let movement = baseSpeedFor(ball.tier) * hpLossSpeed * dt;
      while (movement > 0 && ball.segment < path.length - 1) {
        const destination = path[ball.segment + 1], remaining = distance(ball, destination);
        if (movement >= remaining) { ball.x = destination.x; ball.y = destination.y; ball.segment++; movement -= remaining; }
        else { ball.x += (destination.x - ball.x) / remaining * movement; ball.y += (destination.y - ball.y) / remaining * movement; movement = 0; }
      }
      if (ball.segment >= path.length - 1) { balls.splice(balls.indexOf(ball), 1); escaped++; }
    }
    for (const tower of towers) {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;
      const target = balls.filter(ball => distance(tower, ball) <= BALANCE.radius).sort((a,b) => progress(b) - progress(a))[0];
      if (!target) continue;
      const groupPenalty = towers.length >= 2 ? BALANCE.twoWaterElephantGroupDamageMultiplier : 1;
      target.hp -= tower.damage * groupPenalty * (target.tier === 0 ? BALANCE.tier0DamageMultiplier : 1);
      tower.cooldown = tower.attackCooldown;
      if (target.hp <= 0) { kills++; balls.splice(balls.indexOf(target), 1); }
    }
  }
  return {kills, escaped, total:sequence.length, currency:kills ? sequence.filter((_, index) => index < kills).reduce((sum, tier) => sum + tier + 1, 0) : 0};
}

function campaignThroughWave4() {
  let healthLost = 0, currency = 0;
  const currencyAfterWave = {};
  for (let wave = 1; wave <= 4; wave++) {
    const result = simulateWave(wave);
    healthLost += result.escaped;
    currency += result.currency + (result.escaped === 0 ? BALANCE.waveReward : 0);
    currencyAfterWave[wave] = currency;
  }
  return {healthLost, currencyAfterWave};
}

const one = [1];
const two = [1, 1];
const wave1 = simulateWave(1, one), wave2 = simulateWave(2, one), wave5Base = simulateWave(5, one);
const wave5Upgrade = simulateWave(5, [2]), wave5TwoBase = simulateWave(5, two), wave10Base = simulateWave(10, one);
const campaign = campaignThroughWave4();
const starterPairEarly = [1,2,3,4].map(wave => simulateWave(wave, two));

assert.equal(wave1.kills, wave1.total, 'One well-placed Water Elephant must clear Wave 1.');
assert.equal(wave2.kills, wave2.total, 'One well-placed Water Elephant must clear Wave 2.');
assert.ok(starterPairEarly.every(result => result.kills === result.total), 'Two starter Water Elephants should clear Waves 1–4 with the normal group penalty.');
assert.ok(campaign.healthLost <= 15, `Expected no more than 15 Health lost by Wave 4, got ${campaign.healthLost}.`);
assert.ok(campaign.currencyAfterWave[3] >= BALANCE.firstUpgradeCost, `First upgrade should be affordable around Wave 3, got ${campaign.currencyAfterWave[3]}.`);
assert.ok(wave5Base.kills < wave5Base.total, 'One unupgraded Water Elephant must not clear the bronze-containing Wave 5 alone.');
assert.ok(wave10Base.kills < wave10Base.total * 0.5, 'One unupgraded Water Elephant must be clearly insufficient against Wave 10 steel.');
assert.ok(wave5Upgrade.kills >= wave5Base.kills && wave5Upgrade.escaped <= wave5Base.escaped, 'The first upgrade should not weaken the Wave 5 response.');
assert.ok(wave5TwoBase.kills >= wave5Upgrade.kills, 'A second Water Elephant should be a meaningful Wave 5–6 response.');

let currency = 0;
const savingCurrencyAfterWave = {};
for (let wave = 1; wave <= 6; wave++) {
  const result = simulateWave(wave, one);
  currency += result.currency + (result.escaped === 0 ? BALANCE.waveReward : 0);
  savingCurrencyAfterWave[wave] = currency;
  if (wave === 6) assert.ok(currency >= BALANCE.waterElephantCost, `Second Water Elephant should be affordable by Wave 6 when saving, got ${currency}.`);
}

assert.ok(campaign.currencyAfterWave[3] >= 50, `Expected at least 50 currency after Wave 3, got ${campaign.currencyAfterWave[3]}.`);
assert.ok(campaign.currencyAfterWave[4] >= campaign.currencyAfterWave[3], 'Wave 4 currency should continue to grow.');
assert.ok(savingCurrencyAfterWave[5] < BALANCE.waterElephantCost && savingCurrencyAfterWave[6] >= BALANCE.waterElephantCost, `Expected the second Water Elephant at Wave 6, got Wave 5/6 currency ${savingCurrencyAfterWave[5]}/${savingCurrencyAfterWave[6]}.`);

console.log(`Balance simulation passed: W1 ${wave1.kills}/${wave1.total}; W2 ${wave2.kills}/${wave2.total}; starter pair W1–4 ${starterPairEarly.map(result=>`${result.kills}/${result.total}`).join(', ')}; W4 health loss ${campaign.healthLost}; currency W3/W4/W5/W6 ${campaign.currencyAfterWave[3]}/${campaign.currencyAfterWave[4]}/${savingCurrencyAfterWave[5]}/${savingCurrencyAfterWave[6]}; Wave 5 base/upgrade/two ${wave5Base.kills}/${wave5Upgrade.kills}/${wave5TwoBase.kills}; Wave 10 ${wave10Base.kills}/${wave10Base.total}.`);
