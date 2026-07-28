const assert = require('node:assert/strict');
const progression = require('./orb-progression.js');

const BASE_HP = 50;
const waveSize = level => 10 + level - 1;
const counts = tiers => tiers.reduce((result, tier) => {
  result[tier] = (result[tier] || 0) + 1;
  return result;
}, {});

// Tier configuration: cumulative 25% bases and tier + 1 rewards.
assert.deepEqual(progression.TIERS.map(t => t.introductionLevel), [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
assert.deepEqual(progression.TIERS.map(t => t.baseHPMultiplier), Array.from({length:11},(_,tier)=>1.25 ** tier));
assert.deepEqual(progression.TIERS.map(t => t.currencyReward), Array.from({length:11},(_,tier)=>tier+1));

// Requested level coverage and independent HP clocks.
assert.equal(progression.hpFor(1, 0, BASE_HP), 50);
assert.equal(progression.hpFor(5, 0, BASE_HP), Math.round(50 * 1.05 ** 4));
assert.equal(progression.hpFor(5, 1, BASE_HP), Math.round(50 * 1.25));
assert.equal(progression.hpFor(6, 1, BASE_HP), Math.round(50 * 1.25 * 1.05));
assert.equal(progression.hpFor(10, 1, BASE_HP), Math.round(50 * 1.25 * 1.05 ** 5));
assert.equal(progression.hpFor(10, 2, BASE_HP), Math.round(50 * 1.25 ** 2));
assert.equal(progression.hpFor(11, 2, BASE_HP), Math.round(50 * 1.25 ** 2 * 1.05));
assert.equal(progression.hpFor(15, 3, BASE_HP), Math.round(50 * 1.25 ** 3));
assert.equal(progression.hpFor(20, 4, BASE_HP), Math.round(50 * 1.25 ** 4));
assert.equal(progression.hpFor(25, 5, BASE_HP), Math.round(50 * 1.25 ** 5));
assert.equal(progression.hpFor(30, 6, BASE_HP), Math.round(50 * 1.25 ** 6));
assert.equal(progression.hpFor(35, 7, BASE_HP), Math.round(50 * 1.25 ** 7));
assert.equal(progression.hpFor(40, 8, BASE_HP), Math.round(50 * 1.25 ** 8));
assert.equal(progression.hpFor(45, 9, BASE_HP), Math.round(50 * 1.25 ** 9));
assert.equal(progression.hpFor(50, 10, BASE_HP), Math.round(50 * 1.25 ** 10));
assert.deepEqual(progression.TIERS.slice(7).map(tier=>tier.name),['Emerald Alloy Orb','Platinum Ring Orb','Crimson Celestial Orb','Prismatic Abyss Orb']);

// Normal and mixed waves at Levels 1, 5, 6, 10, 11, and 15.
assert.deepEqual(counts(progression.tiersForWave(1, waveSize(1))), {0: 10});
assert.deepEqual(counts(progression.tiersForWave(5, waveSize(5))), {0: 7, 1: 7});
assert.deepEqual(counts(progression.tiersForWave(6, waveSize(6))), {0: 7, 1: 8});
assert.deepEqual(counts(progression.tiersForWave(10, waveSize(10))), {0: 6, 1: 6, 2: 7});
assert.deepEqual(counts(progression.tiersForWave(11, waveSize(11))), {0: 6, 1: 7, 2: 7});
assert.deepEqual(counts(progression.tiersForWave(15, waveSize(15))), {0: 6, 1: 6, 2: 6, 3: 6});
assert.deepEqual(counts(progression.tiersForWave(20, waveSize(20))), {0: 5, 1: 6, 2: 6, 3: 6, 4: 6});
assert.deepEqual(counts(progression.tiersForWave(25, waveSize(25))), {0: 5, 1: 5, 2: 6, 3: 6, 4: 6, 5: 6});
assert.deepEqual(counts(progression.tiersForWave(30, waveSize(30))), {0: 5, 1: 5, 2: 5, 3: 6, 4: 6, 5: 6, 6: 6});
assert.deepEqual(counts(progression.tiersForWave(35,45)), {0:5,1:5,2:5,3:6,4:6,5:6,6:6,7:6});
assert.deepEqual(counts(progression.tiersForWave(40,45)), {0:5,1:5,2:5,3:5,4:5,5:5,6:5,7:5,8:5});
assert.deepEqual(counts(progression.tiersForWave(45,45)), {0:4,1:4,2:4,3:4,4:4,5:5,6:5,7:5,8:5,9:5});
assert.deepEqual(counts(progression.tiersForWave(50,45)), {0:4,1:4,2:4,3:4,4:4,5:4,6:4,7:4,8:4,9:4,10:5});

// Mixed waves spawn the older tier first and give an odd extra orb to the new tier.
assert.deepEqual(progression.tiersForWave(10, 11), [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2]);
assert.deepEqual(progression.tiersForWave(15, 17), Array(4).fill(0).concat(Array(4).fill(1),Array(4).fill(2),Array(5).fill(3)));

// Full-precision rewards accept the additive total plant multiplier.
for(const multiplier of [1,1.2,1.4,1.7,2,5]){
  assert.equal(progression.rewardWithIncomeMultiplier(4,multiplier),4*multiplier);
}

console.log('Orb and papaya progression tests passed through Wave 50.');
