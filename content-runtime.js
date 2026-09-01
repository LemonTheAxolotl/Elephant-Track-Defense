// Stable-ID bindings and presentation text shared by all gameplay modules.
(function(root){
  'use strict';
  const content=root.GameContent;
  if(!content)throw new Error('Validated game content is unavailable');
  const runtimeTowerIds=Object.fromEntries(content.towers.towers.map(t=>[t.runtimeType,t.id]));
  function towerId(tower){return tower?.contentId||runtimeTowerIds[tower?.towerType]||runtimeTowerIds[tower?.kind]||null}
  function orbId(orb){if(orb?.contentId)return orb.contentId;if(orb?.isFusedBoss)return content.waves.finales[0].bossId;if(orb?.specialType)return`${orb.specialType}_orb`;return Number.isInteger(orb?.tier)?`tier_${orb.tier}`:null}
  const createElephantBase=createElephant;createElephant=function(...args){const tower=createElephantBase(...args);tower.contentId=towerId(tower);const definition=content.indexes.towers[tower.contentId];if(definition){tower.name=definition.name;tower.purchasePrice=tower.starterGift?0:definition.cost}return tower};
  const createRobotElephantBase=createRobotElephant;createRobotElephant=function(...args){const tower=createRobotElephantBase(...args);tower.contentId='robot_elephant';tower.name=content.indexes.towers.robot_elephant.name;tower.purchasePrice=content.indexes.towers.robot_elephant.cost;return tower};
  const spawnBallBase=spawnBall;spawnBall=function(...args){const before=state.balls.length,result=spawnBallBase(...args);state.balls.slice(before).forEach(orb=>orb.contentId=orbId(orb));return result};
  const debugSpecialOrbBaseContent=debugSpecialOrb;debugSpecialOrb=function(...args){const orb=debugSpecialOrbBaseContent(...args);if(orb)orb.contentId=orbId(orb);return orb};
  const debugNormalOrbBaseContent=debugNormalOrb;debugNormalOrb=function(...args){const orb=debugNormalOrbBaseContent(...args);if(orb)orb.contentId=orbId(orb);return orb};
  const createBossBase=createFusedPrismaticBoss;createFusedPrismaticBoss=function(...args){const orb=createBossBase(...args);orb.contentId=content.waves.finales[0].bossId;return orb};
  const towerSnapshotBaseContent=finaleTowerSnapshot;finaleTowerSnapshot=function(tower){tower.contentId=towerId(tower);return towerSnapshotBaseContent(tower)};
  const orbSnapshotBaseContent=finaleOrbSnapshot;finaleOrbSnapshot=function(orb){if(orb)orb.contentId=orbId(orb);const copy=orbSnapshotBaseContent(orb);if(copy)copy.contentId=orb?.contentId;return copy};
  const finalePayloadBaseContent=finaleSavePayload;finaleSavePayload=function(){const payload=finalePayloadBaseContent();if(payload){payload.version=2;payload.mapId=content.activeMap.id;payload.run.papayas?.forEach(plant=>plant.contentId='papaya_plant');payload.run.goldenPapayas?.forEach(plant=>plant.contentId='watermelon_farm')}return payload};
  const loadFinaleBaseContent=loadFinaleState;loadFinaleState=function(){const saved=loadFinaleBaseContent();if(saved&&!saved.mapId)saved.mapId=content.activeMap.id;if(saved?.mapId!==content.activeMap.id)throw new Error(`Save references unavailable map "${saved.mapId}"`);return saved};
  const shopButtons={base:'#buyElephant',eyewear:'#buyEyewear',foodie:'#buyFoodie',gas:'#buyGasMask',frost:'#buyFrost',heater:'#buyHeater',splash:'#buySplash',robot:'#buyRobot',papaya:'#buyPapaya',goldenPapaya:'#buyGoldenPapaya'};
  for(const tower of content.towers.towers){const card=document.querySelector(shopButtons[tower.runtimeType]);const copy=card?.querySelector('.tower-copy');if(copy){const title=copy.querySelector('strong');const description=copy.querySelector('small');if(title)title.textContent=tower.name;if(description)description.textContent=tower.shopDescription}}
  if(typeof CustomEvent!=='undefined')root.dispatchEvent?.(new CustomEvent('elephant-content-ready',{detail:{mapId:content.activeMap.id,version:1}}));
})(globalThis);
