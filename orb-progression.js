// Metallic orb progression values are authored in data/orbs.json.
(function(root){
  'use strict';
  if(!root.GameContent?.orbs)throw new Error('Validated orbs.json must load before orb-progression.js');
  const HP_GROWTH_PER_LEVEL=root.GameContent.orbs.hpGrowthPerWave;
  const TIERS=Object.freeze(root.GameContent.orbs.normalTiers.map(item=>Object.freeze({
    id:item.id,tier:item.tier,name:item.name,description:item.description,
    introductionLevel:item.introductionWave,baseHPMultiplier:item.baseHpMultiplier,
    currencyReward:item.reward,endpointDamage:item.endpointDamage,speed:item.speed,
    visual:Object.freeze(item.colors)
  })));
  function tierForLevel(level){for(let i=TIERS.length-1;i>=0;i--)if(level>=TIERS[i].introductionLevel)return TIERS[i].tier;return 0}
  function hpFor(level,tier,tier0BaseHP){const config=TIERS[tier];if(!config)throw new Error(`orbs.json: unknown tier index ${tier}`);return Math.round(tier0BaseHP*config.baseHPMultiplier*Math.pow(1+HP_GROWTH_PER_LEVEL,level-config.introductionLevel))}
  function tiersForWave(level,totalOrbs){const strongest=tierForLevel(level),count=strongest+1,base=Math.floor(totalOrbs/count),remainder=totalOrbs%count,result=[];for(let tier=0;tier<count;tier++)result.push(...Array(base+(tier>=count-remainder?1:0)).fill(tier));return result}
  function rewardWithIncomeMultiplier(baseReward,totalIncomeMultiplier){return baseReward*totalIncomeMultiplier}
  const api=Object.freeze({HP_GROWTH_PER_LEVEL,TIERS,tierForLevel,hpFor,tiersForWave,rewardWithIncomeMultiplier});root.OrbProgression=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
