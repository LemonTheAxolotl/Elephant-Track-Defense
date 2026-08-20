// Heater support tower: a non-attacking warmth field for Snow-Capped freezes.
(function(root){
  'use strict';
  const heaterUI={buy:document.querySelector('#buyHeater'),price:document.querySelector('#heaterPrice')};
  const HEATER_TYPE='heater';
  let backlashEffects=[];
  heaterUI.price.textContent=CONFIG.heaterCost;
  function isHeater(tower){return tower?.towerType===HEATER_TYPE}
  // Heaters share the tower collection for placement and support-radius
  // bookkeeping, but they are buildings.  Repair any legacy special-orb
  // movement state before it can displace the structure or consume an orb slot.
  function normalizeHeater(tower){
    if(!isHeater(tower))return tower;
    if(Number.isFinite(tower.homeX)&&Number.isFinite(tower.homeY)){tower.x=tower.homeX;tower.y=tower.homeY}
    else{tower.homeX=tower.x;tower.homeY=tower.y}
    for(const orb of state.balls||[])if(Array.isArray(orb.attracted))orb.attracted=orb.attracted.filter(unit=>unit!==tower);
    tower.lureOrb=null;tower.followIndex=null;tower.fleeTo=null;tower.fleeRoute=null;
    tower.fumeAffected=false;tower.fumeFearLife=0;tower.fumeRecoilFallback=false;
    tower.behavior='home';tower.walking=false;tower.visualTarget=null;tower.foodFocus=false;
    tower.attack=0;tower.recoil=0;tower.angle=0;tower.facing=1;
    return tower;
  }
  function normalizeHeaters(){for(const tower of state.towers||[])normalizeHeater(tower)}
  function heaterRadius(tower){return CONFIG.HEATER_RADII[Math.max(0,Math.min(CONFIG.HEATER_RADII.length-1,(tower?.level||1)-1))]}
  // Protection uses the same world-space center and radius as the visible
  // warmth circle.  A tower's artwork/range must not make it lose warmth.
  function strongestHeater(tower){return state.towers.filter(heater=>isHeater(heater)&&!heater.sold&&Number.isFinite(heater.x)&&Number.isFinite(heater.y)&&Math.hypot(tower.x-heater.x,tower.y-heater.y)<=heater.radius).sort((a,b)=>b.level-a.level||Math.hypot(a.x-tower.x,a.y-tower.y)-Math.hypot(b.x-tower.x,b.y-tower.y))[0]||null}
  function heaterWarmthLevel(tower){return tower?.kind==='elephant'&&!isHeater(tower)&&tower.towerType!=='flame'&&!tower.sold&&state.towers.includes(tower)?strongestHeater(tower)?.level||0:0}
  function heaterFootprintProtected(tower){return heaterWarmthLevel(tower)>0}
  root.heaterWarmthLevel=heaterWarmthLevel;
  function heaterRecoveryMultiplier(tower){return heaterWarmthLevel(tower)===1?1.25:heaterWarmthLevel(tower)===2?1.5:1}
  root.heaterFreezeRecoveryMultiplier=heaterRecoveryMultiplier;
  function createHeater(x,y){const tower={kind:'elephant',towerType:HEATER_TYPE,contentId:'heater',towerId:state.nextTowerId++,name:'HEATER',purchasePrice:CONFIG.heaterCost,sold:false,level:1,x,y,homeX:x,homeY:y,behavior:'home',cooldown:Infinity,angle:0,facing:1,attack:0,recoil:0,targetMode:'first'};applyLevelStats(tower);return tower}
  const heaterMaxLevelBase=maxLevel;maxLevel=function(tower){return isHeater(tower)?3:heaterMaxLevelBase(tower)};
  const heaterApplyStatsBase=applyLevelStats;applyLevelStats=function(tower){if(!isHeater(tower))return heaterApplyStatsBase(tower);tower.damage=0;tower.attackSpeed=Infinity;tower.radius=heaterRadius(tower);tower.cooldown=Infinity;tower.attack=0;tower.visualTarget=null};
  const heaterUpgradeCostBase=upgradeCost;upgradeCost=function(tower){return isHeater(tower)?Math.ceil(CONFIG.HEATER_BASE_UPGRADE_COST*Math.pow(CONFIG.HEATER_UPGRADE_COST_MULTIPLIER,tower.level-1)):heaterUpgradeCostBase(tower)};
  const heaterCanTargetBase=canTowerTarget;canTowerTarget=function(tower,orb){return !isHeater(tower)&&heaterCanTargetBase(tower,orb)};
  // Explicitly keep support buildings out of every Food/Fume/Engineer target
  // pass, including scans that refill a Fume Orb after a new tower is placed.
  const heaterAffectElephantsBase=affectElephants;
  affectElephants=function(orb){
    const heaters=(state.towers||[]).filter(tower=>isHeater(tower)&&!tower.sold),availability=heaters.map(tower=>[tower,tower.unavailable]);
    for(const heater of heaters){normalizeHeater(heater);heater.unavailable=true}
    try{return heaterAffectElephantsBase(orb)}finally{for(const [heater,unavailable]of availability){heater.unavailable=unavailable;normalizeHeater(heater)}}
  };
  const heaterScanFumesBase=scanActiveFumeOrbs;
  scanActiveFumeOrbs=function(immediate=false){normalizeHeaters();return heaterScanFumesBase(immediate)};
  function buyHeater(){if(state.status==='playing'&&state.currency>=CONFIG.heaterCost&&reservedTotalUnitCount()<CONFIG.TOTAL_UNIT_LIMIT){state.placement=HEATER_TYPE;updateUI()}}
  heaterUI.buy.addEventListener('click',buyHeater);
  const heaterRefreshBase=refreshUnitButtons;refreshUnitButtons=function(){heaterRefreshBase();heaterUI.buy.disabled=state.currency<CONFIG.heaterCost||state.status!=='playing'||reservedTotalUnitCount()>=CONFIG.TOTAL_UNIT_LIMIT;heaterUI.buy.classList.toggle('selected',state.placement===HEATER_TYPE);if(state.placement===HEATER_TYPE){ui.hint.querySelector('strong').textContent='PLACE HEATER';ui.hint.querySelector('p').lastChild.textContent=' Click valid ground. Its warmth field protects elephants from Snow-Capped freezes.'}};
  const heaterPlacementRangeBase=placementRange;placementRange=function(){return state.placement===HEATER_TYPE?CONFIG.HEATER_RADII[0]:heaterPlacementRangeBase()};
  canvas.addEventListener('click',event=>{if(state.placement!==HEATER_TYPE)return;event.stopImmediatePropagation();updatePlacementPointer(event);if(!placementAllowed(mouse)||state.currency<CONFIG.heaterCost||reservedTotalUnitCount()>=CONFIG.TOTAL_UNIT_LIMIT)return;state.currency-=CONFIG.heaterCost;const heater=createHeater(mouse.x,mouse.y);state.towers.push(heater);state.placement=null;selectTower(heater);burst(heater.x,heater.y,'#ff9b42',18,72);updateUI()},true);
  function drawHeater(tower,ghost=false,valid=true,selected=false){const r=tower.radius||heaterRadius(tower),showRange=selected||state.placement===HEATER_TYPE&&tower.towerId===0;ctx.save();ctx.translate(tower.x,tower.y);if(showRange){ctx.globalAlpha=.14;ctx.fillStyle='#ff7a2d';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.58;ctx.strokeStyle='#ffb15c';ctx.lineWidth=2;ctx.setLineDash([8,7]);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}ctx.globalAlpha=ghost?.45:1;ctx.shadowColor='#ff762e';ctx.shadowBlur=22;ctx.fillStyle='#5f2d1a';ctx.fillRect(-24,-24,48,52);ctx.strokeStyle='#ffd28d';ctx.lineWidth=3;ctx.strokeRect(-24,-24,48,52);ctx.fillStyle='#ffca62';ctx.beginPath();ctx.roundRect(-13,-14,26,28,4);ctx.fill();ctx.fillStyle='#e85024';ctx.beginPath();ctx.arc(0,1,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff1b5';ctx.font='900 17px Inter';ctx.textAlign='center';ctx.fillText('♨',0,7);ctx.fillStyle='#242a2e';for(const x of [-17,17])ctx.fillRect(x-3,28,6,10);ctx.restore()}
  const heaterDrawElephantBase=drawElephant;drawElephant=function(tower,...args){if(isHeater(tower))return drawHeater(tower,...args);const result=heaterDrawElephantBase(tower,...args);if(!args[0]&&heaterFootprintProtected(tower)){ctx.save();ctx.translate(tower.x,tower.y);ctx.globalAlpha=.3+.1*Math.sin(state.gameTime*5);ctx.strokeStyle='#ffb159';ctx.shadowColor='#ff6f2c';ctx.shadowBlur=12;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,2,40,0,Math.PI*2);ctx.stroke();ctx.restore()}return result};
  function orbMaximumHp(orb){return Number.isFinite(orb?.maxHp)?orb.maxHp:Number.isFinite(orb?.maxDurability)?orb.maxDurability:Math.max(0,Number(orb?.hp)||0)}
  function orbIsInvulnerable(orb){return !!(orb?.invulnerable||orb?.digInvulnerable||isBossShieldActive?.(orb))}
  function applyHeaterBacklash(orb,heater){if(!orb?.snowCovered||orbIsInvulnerable(orb))return false;const damage=orbMaximumHp(orb)*CONFIG.HEATER_BACKLASH_MAX_HP_PERCENT;if(!(damage>0))return false;if(orb.special){orb.durability=Math.max(0,(orb.durability??orb.hp)-damage);orb.hits=(orb.maxDurability??orbMaximumHp(orb))-orb.durability;orb.hp=orb.durability;if(orb.durability<=0)defeatSpecial(orb)}else{orb.hp=Math.max(0,orb.hp-damage);if(orb.hp<=0)hitOrb({towerType:'heater_backlash',damage:0,lureOrb:null},orb)}orb.heatMeltLife=.65;backlashEffects.push({heater,orb,x1:heater.x,y1:heater.y,x2:orb.x,y2:orb.y,life:.42,max:.42,damage});burst(orb.x,orb.y,'#ff8b3d',14,82);return true}
  root.beforeSnowFreezeHit=function(tower,rules,orb){const heater=strongestHeater(tower);if(!heater||heater.level<3)return false;applyHeaterBacklash(orb,heater);if(state.selectedTower===tower)updateStats();return true};
  function drawBacklashEffects(){for(const effect of backlashEffects){const p=1-effect.life/effect.max,x=effect.x1+(effect.x2-effect.x1)*p,y=effect.y1+(effect.y2-effect.y1)*p;ctx.save();ctx.globalAlpha=Math.max(0,effect.life/effect.max);ctx.strokeStyle='#ff9a48';ctx.shadowColor='#ff5c2a';ctx.shadowBlur=14;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(effect.x1,effect.y1);ctx.quadraticCurveTo((effect.x1+effect.x2)/2,(effect.y1+effect.y2)/2-20*Math.sin(p*Math.PI),x,y);ctx.stroke();ctx.fillStyle='#fff0b7';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.restore()}}
  const heaterUpdateBase=update;update=function(dt){normalizeHeaters();const result=heaterUpdateBase(dt);normalizeHeaters();if(!state.paused&&state.status==='playing'){for(const orb of state.balls)orb.heatMeltLife=Math.max(0,(orb.heatMeltLife||0)-dt);for(const effect of backlashEffects)effect.life-=dt;backlashEffects=backlashEffects.filter(effect=>effect.life>0)}root.renderFreezeResistance?.();return result};
  const heaterDrawBase=draw;draw=function(){heaterDrawBase();if(state.placement===HEATER_TYPE&&mouse.inside){const scale=state.renderScale||1;ctx.save();ctx.setTransform(scale,0,0,scale,0,0);ctx.translate(-state.cameraX,-state.cameraY);drawHeater({x:mouse.x,y:mouse.y,radius:CONFIG.HEATER_RADII[0],towerId:0},true,placementAllowed(mouse),true);ctx.restore()}drawBacklashEffects()};
  function heaterWarmthText(tower){const level=heaterWarmthLevel(tower);return level===1?'Heater Warmth: Level 1 — Freeze recovery 1.25× faster':level===2?'Heater Warmth: Level 2 — Freeze recovery 1.5× faster':level===3?'Heater Warmth: Level 3 — Immune to Snow-Capped freezes':'Heater Warmth: Inactive'}
  const heaterStatsBase=updateStats;updateStats=function(){const result=heaterStatsBase(),tower=state?.selectedTower;if(!tower)return result;if(isHeater(tower)){ui.selectedTypeLabel.textContent='SELECTED SUPPORT TOWER';ui.towerName.textContent='HEATER';ui.towerLevel.textContent=`LEVEL ${tower.level}/3`;ui.statOneLabel.textContent='WARMTH RADIUS';ui.statTwoLabel.textContent='ACTIVE EFFECT';ui.statThreeLabel.textContent='BACKLASH';ui.towerDamage.textContent=`${Math.round(tower.radius)}`;ui.towerAttackSpeed.textContent=tower.level===1?'Recovery 1.25×':tower.level===2?'Recovery 1.5×':'Freeze immune';ui.towerRange.textContent=tower.level===3?'25% max HP reflect':'Level 3 only';ui.targetingControls.classList.add('hidden');ui.upgradePreview.textContent=tower.level===1?'Level 2: Freeze recovery 1.5× faster.':tower.level===2?'Level 3: Immune to freezes; reflects 25% max HP.':'Level 3: Immune to Snow-Capped freezes; reflects 25% max HP.'}else if(tower.kind==='elephant'){ui.upgradePreview.textContent=`${ui.upgradePreview.textContent} • ${heaterWarmthText(tower)}`}return result};
  const heaterOrbDrawBase=drawBall;drawBall=function(orb){const result=heaterOrbDrawBase(orb);if((orb?.heatMeltLife||0)>0){ctx.save();ctx.translate(orb.x,orb.y);ctx.globalAlpha=Math.min(1,orb.heatMeltLife/.16);ctx.strokeStyle='#ffb36c';ctx.shadowColor='#ff7034';ctx.shadowBlur=15;ctx.lineWidth=2;for(const offset of [-8,0,8]){ctx.beginPath();ctx.moveTo(offset,12);ctx.quadraticCurveTo(offset+5,4,offset,0);ctx.stroke()}ctx.restore()}return result};
  const heaterSnapshotBase=finaleTowerSnapshot;finaleTowerSnapshot=function(tower){const copy=heaterSnapshotBase(tower);if(isHeater(tower))copy.contentId='heater';return copy};
  if(root.__ELEPHANT_TEST_MODE__)root.HeaterTestHooks={createHeater,heaterFootprintProtected,strongestHeater,heaterWarmthLevel,heaterRecoveryMultiplier,applyHeaterBacklash,isHeater,normalizeHeater};
})(globalThis);
