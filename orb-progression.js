// ============================================================================
// METALLIC ORB TIER CONFIGURATION
// Tier HP multipliers are cumulative and remain separate from per-level growth.
// ============================================================================
(function (root) {
  const HP_GROWTH_PER_LEVEL = 0.05;

  const TIERS = Object.freeze([
    Object.freeze({
      tier: 0,
      name: 'Iron Orb',
      description: 'The standard foundry orb: simple, steady, and lightly armored.',
      introductionLevel: 1,
      baseHPMultiplier: 1,
      currencyReward: 1,
      visual: Object.freeze({highlight:'#f6fbfc',mid:'#9eadb2',low:'#47555b',shadow:'#111a1e',rim:'#b8c4c7',accent:'#8b9ba0',glow:null})
    }),
    Object.freeze({
      tier: 1,
      name: 'Bronze Orb',
      description: 'A darker bronze shell gives this orb improved durability.',
      introductionLevel: 5,
      baseHPMultiplier: 1.25,
      currencyReward: 2,
      visual: Object.freeze({highlight:'#f1c58d',mid:'#a86f3f',low:'#5d3826',shadow:'#1d1210',rim:'#d29a62',accent:'#7c4b2d',glow:null})
    }),
    Object.freeze({
      tier: 2,
      name: 'Steel Orb',
      description: 'Polished blue steel resists weaker tower formations.',
      introductionLevel: 10,
      baseHPMultiplier: 1.25 ** 2,
      currencyReward: 3,
      visual: Object.freeze({highlight:'#eafaff',mid:'#9bbdcc',low:'#456879',shadow:'#101b25',rim:'#bde9f7',accent:'#6f9eb1',glow:'#65d9ff'})
    }),
    Object.freeze({
      tier: 3,
      name: 'Heavy Alloy Orb',
      description: 'Dense dark metal carries a faint internal energy signature.',
      introductionLevel: 15,
      baseHPMultiplier: 1.25 ** 3,
      currencyReward: 4,
      visual: Object.freeze({highlight:'#b8a9e9',mid:'#4d4965',low:'#252438',shadow:'#080711',rim:'#796f9d',accent:'#9b82ef',glow:'#8f65ff'})
    }),
    Object.freeze({
      tier: 4,
      name: 'Golden Orb',
      description: 'A brilliant polished shell hides considerable structural strength.',
      introductionLevel: 20,
      baseHPMultiplier: 1.25 ** 4,
      currencyReward: 5,
      visual: Object.freeze({highlight:'#fffbd0',mid:'#e7b83f',low:'#8d5b13',shadow:'#261707',rim:'#ffe984',accent:'#ffca38',glow:'#ffd84d'})
    }),
    Object.freeze({
      tier: 5,
      name: 'Arcane Alloy Orb',
      description: 'Purple energy lines pulse through an unstable metal body.',
      introductionLevel: 25,
      baseHPMultiplier: 1.25 ** 5,
      currencyReward: 6,
      visual: Object.freeze({highlight:'#f5d8ff',mid:'#a755ce',low:'#512066',shadow:'#16081d',rim:'#dc8cff',accent:'#e252ff',glow:'#d93cff'})
    }),
    Object.freeze({
      tier: 6,
      name: 'Legendary Orb',
      description: 'Black and crimson metal surrounds a fiercely glowing center.',
      introductionLevel: 30,
      baseHPMultiplier: 1.25 ** 6,
      currencyReward: 7,
      visual: Object.freeze({highlight:'#ffb3a8',mid:'#5d1518',low:'#25090b',shadow:'#030102',rim:'#a82d32',accent:'#ff3838',glow:'#ff2020'})
    }),
    Object.freeze({
      tier: 7,name:'Emerald Alloy Orb',description:'Emerald alloy surrounds a vivid internal green light.',introductionLevel:35,baseHPMultiplier:1.25**7,currencyReward:8,
      visual:Object.freeze({highlight:'#eaffdc',mid:'#39ad68',low:'#12553a',shadow:'#061a10',rim:'#8affae',accent:'#46f58a',glow:'#32e879'})
    }),
    Object.freeze({
      tier: 8,name:'Platinum Ring Orb',description:'White platinum is stabilized by orbiting cyan energy rings.',introductionLevel:40,baseHPMultiplier:1.25**8,currencyReward:9,
      visual:Object.freeze({highlight:'#ffffff',mid:'#dbe4eb',low:'#7d8c98',shadow:'#182027',rim:'#f5fdff',accent:'#65ecff',glow:'#55e8ff'})
    }),
    Object.freeze({
      tier: 9,name:'Crimson Celestial Orb',description:'Celestial crimson metal leaks light through animated cracks.',introductionLevel:45,baseHPMultiplier:1.25**9,currencyReward:10,
      visual:Object.freeze({highlight:'#ffd0c5',mid:'#b52f3d',low:'#5b101c',shadow:'#210309',rim:'#ff7a76',accent:'#ff4f47',glow:'#ff3a45'})
    }),
    Object.freeze({
      tier: 10,name:'Prismatic Abyss Orb',description:'Dark prismatic armor bends light around a powerful glowing center.',introductionLevel:50,baseHPMultiplier:1.25**10,currencyReward:11,
      visual:Object.freeze({highlight:'#e9d9ff',mid:'#41355f',low:'#130d29',shadow:'#010105',rim:'#9c7de0',accent:'#63f2ff',glow:'#9b63ff'})
    })
  ]);

  function tierForLevel(level) {
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (level >= TIERS[i].introductionLevel) return TIERS[i].tier;
    }
    return 0;
  }

  function hpFor(level, tier, tier0BaseHP) {
    const config = TIERS[tier];
    const levelsSinceIntroduction = level - config.introductionLevel;
    return Math.round(tier0BaseHP * config.baseHPMultiplier * Math.pow(1 + HP_GROWTH_PER_LEVEL, levelsSinceIntroduction));
  }

  function tiersForWave(level, totalOrbs) {
    const strongestTier = tierForLevel(level);
    const unlockedCount = strongestTier + 1;
    const baseCount = Math.floor(totalOrbs / unlockedCount);
    let remainder = totalOrbs % unlockedCount;
    const result = [];
    for (let tier = 0; tier < unlockedCount; tier++) {
      const strongerRemainderTier = tier >= unlockedCount - remainder;
      const count = baseCount + (strongerRemainderTier ? 1 : 0);
      result.push(...Array(count).fill(tier));
    }
    return result;
  }

  function rewardWithIncomeMultiplier(baseReward, totalIncomeMultiplier) {
    return baseReward * totalIncomeMultiplier;
  }

  const api = Object.freeze({HP_GROWTH_PER_LEVEL, TIERS, tierForLevel, hpFor, tiersForWave, rewardWithIncomeMultiplier});
  root.OrbProgression = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
