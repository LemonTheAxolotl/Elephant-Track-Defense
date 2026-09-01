// Flame Elephant: persistent tower data with runtime-only burn and heat effects.
(function(root){
  'use strict';
  const definition=root.GameContent.indexes.towers.flame_elephant;
  if(!definition)throw new Error('towers.json: missing flame_elephant definition');
  const stats=definition.baseStats,upgrades=definition.upgrades,TYPE=definition.runtimeType;
  const flameUI={buy:document.querySelector('#buyFlame'),price:document.querySelector('#flamePrice')};
  let flameStreams=[],freezeSteam=[];

  function isFlame(tower){return tower?.towerType===TYPE}
  function orbIsInvulnerable(orb){return !!(orb?.invulnerable||orb?.digInvincible||orb?.digInvulnerable||isBossShieldActive?.(orb))}
  function activeOrb(orb){return !!(orb&&state.balls.includes(orb)&&orb.targetable&&orb.state==='active'&&!orb.rewarded)}
  function burnList(orb){return Array.isArray(orb?.flameBurns)?orb.flameBurns:[]}
  function clearOrbBurns(orb){if(orb)delete orb.flameBurns}

  flameUI.price.textContent=definition.cost;
  flameUI.buy.querySelector('.tower-copy strong').textContent=definition.name;
  flameUI.buy.querySelector('.tower-copy small').textContent=definition.shopDescription;

  const flameCreateBase=createElephant;
  createElephant=function(type,x,y,options={}){
    if(type!==TYPE)return flameCreateBase(type,x,y,options);
    const tower=flameCreateBase('elephant',x,y,options);
    tower.towerType=TYPE;tower.contentId=definition.id;tower.name=definition.name;tower.purchasePrice=definition.cost;
    tower.starterGift=false;tower.nonSellable=false;applyLevelStats(tower);return tower;
  };
  function createFlameElephant(x,y){return createElephant(TYPE,x,y)}

  const flameStatsBase=applyLevelStats;
  applyLevelStats=function(tower){
    if(!isFlame(tower))return flameStatsBase(tower);
    const steps=Math.max(0,(tower.level||1)-1);
    tower.damage=stats.directImpactDamage;
    tower.attackSpeed=stats.attackCooldown/Math.pow(1+(upgrades.attackSpeedPerLevel||0),steps);
    tower.radius=stats.range*Math.pow(1+(upgrades.rangePerLevel||0),steps);
  };
  const flameMaxLevelBase=maxLevel;maxLevel=function(tower){return isFlame(tower)?upgrades.maxLevel:flameMaxLevelBase(tower)};
  const flameUpgradeCostBase=upgradeCost;upgradeCost=function(tower){return isFlame(tower)?Math.ceil(upgrades.baseCost*Math.pow(upgrades.costMultiplier,tower.level-1)):flameUpgradeCostBase(tower)};
  const flameCanTargetBase=canTowerTarget;canTowerTarget=function(tower,orb){if(isFlame(tower)&&orb?.ghost)return false;return flameCanTargetBase(tower,orb)};

  function meltIceShield(orb){
    if(!activeOrb(orb)||orbIsInvulnerable(orb)||!(Number(orb.iceShieldHits)>0))return false;
    orb.iceShieldHits=0;orb.iceShieldBroken=true;orb.iceShieldImpactLife=0;orb.iceShieldCrackLife=0;orb.iceShieldMeltLife=.9;
    burst(orb.x,orb.y,'#b7f4ff',13,62);return true;
  }
  function applyBurn(tower,orb){
    if(!isFlame(tower)||!activeOrb(orb)||orbIsInvulnerable(orb))return false;
    const effects=burnList(orb),existing=effects.find(effect=>effect.towerId===tower.towerId);
    if(existing){existing.remaining=stats.burnDuration;existing.source=tower;return true}
    effects.push({towerId:tower.towerId,source:tower,tickAccumulator:0,ticks:0,remaining:stats.burnDuration});orb.flameBurns=effects;return true;
  }
  function flameHit(tower,orb){return meltIceShield(orb)?'melt':applyBurn(tower,orb)?'burn':false}

  const flameFireBase=fire;
  fire=function(tower,target){
    if(!isFlame(tower))return flameFireBase(tower,target);
    if(!canTowerTarget(tower,target)||!activeOrb(target))return false;
    const dx=target.x-tower.x,dy=target.y-tower.y,angle=Math.atan2(dy,dx);
    tower.facing=dx>=0?1:-1;tower.angle=Math.atan2(dy,Math.abs(dx));tower.attack=.34;tower.recoil=.72;target.hit=.16;
    const nozzle=flameTrunkTip(tower);flameStreams.push({tower,target,x1:nozzle.x,y1:nozzle.y,x2:target.x,y2:target.y,life:.34,max:.34,seed:gameRandom()*10});
    const result=flameHit(tower,target);burst(target.x,target.y,result==='melt'?'#d7fbff':'#ff8a32',result==='melt'?10:8,result==='melt'?55:72);return result;
  };

  function applyBurnTick(orb,effect){
    if(!activeOrb(orb)||orbIsInvulnerable(orb))return false;
    const difficultyMultiplier=typeof difficultyRule==='function'?(Number(difficultyRule()?.damageMultiplier)||1):1,source={kind:'elephant',towerType:'flame_burn',towerId:effect.towerId,damage:stats.burnDamagePerTick/difficultyMultiplier,lureOrb:null,targetMode:'first'};
    hitOrb(source,orb);if(state.balls.includes(orb)){orb.flameTickLife=.24;burst(orb.x,orb.y,'#ff9c38',5,42)}return true;
  }
  function updateBurns(dt){
    for(const orb of [...state.balls]){
      const effects=burnList(orb);if(!effects.length){clearOrbBurns(orb);continue}
      for(const effect of effects){
        if(effect.source?.sold||!state.towers.includes(effect.source)){effect.remove=true;continue}
        const activeTime=Math.min(Math.max(0,effect.remaining),dt);effect.remaining=Math.max(0,effect.remaining-dt);effect.tickAccumulator=(effect.tickAccumulator||0)+activeTime;
        while(effect.tickAccumulator+1e-9>=stats.burnTickInterval){
          effect.tickAccumulator-=stats.burnTickInterval;effect.ticks++;applyBurnTick(orb,effect);if(!state.balls.includes(orb))break;
        }
        if(effect.remaining<=0||!state.balls.includes(orb))effect.remove=true;
      }
      if(state.balls.includes(orb)){orb.flameBurns=effects.filter(effect=>!effect.remove);if(!orb.flameBurns.length)clearOrbBurns(orb);orb.flameTickLife=Math.max(0,(orb.flameTickLife||0)-dt);orb.iceShieldMeltLife=Math.max(0,(orb.iceShieldMeltLife||0)-dt)}
    }
  }

  const flameUpdateBase=update;update=function(dt){const result=flameUpdateBase(dt);if(!state.paused&&state.status==='playing'){updateBurns(Math.max(0,dt));for(const stream of flameStreams)stream.life-=dt;flameStreams=flameStreams.filter(stream=>stream.life>0&&state.balls.includes(stream.target));for(const effect of freezeSteam)effect.life-=dt;freezeSteam=freezeSteam.filter(effect=>effect.life>0)}return result};

  function flameTrunkTip(tower){const facing=tower.facing||1,rotation=tower.angle||0,bob=Math.sin(state.gameTime*(tower.walking?8:3.6)+tower.x)*(tower.walking?4:2),recoil=(tower.recoil||0)*5,localX=43-recoil,localY=(tower.attack||tower.behavior==='eating'?1:13)+bob,c=Math.cos(rotation),s=Math.sin(rotation);return{x:tower.x+facing*(localX*c-localY*s),y:tower.y+localX*s+localY*c}}
  function drawTrunkFlame(tower,ghost,valid){const phase=prefersReducedMotion()?0:state.gameTime*9+(tower.towerId||0)*.63,flicker=prefersReducedMotion()?1:.88+Math.sin(phase)*.12,tipY=(tower.attack||tower.behavior==='eating'?1:13),bob=Math.sin(state.gameTime*(tower.walking?8:3.6)+tower.x)*(tower.walking?4:2);ctx.save();ctx.translate(tower.x,tower.y);ctx.scale(tower.facing||1,1);ctx.rotate(tower.angle||0);ctx.translate(-(tower.recoil||0)*5,bob);ctx.globalAlpha=ghost?0.64:1;ctx.fillStyle='#e64a24';ctx.beginPath();ctx.moveTo(39,tipY+4);ctx.quadraticCurveTo(48,tipY+7,51,tipY);ctx.quadraticCurveTo(48,tipY-8*flicker,43,tipY-11*flicker);ctx.quadraticCurveTo(44,tipY-3,39,tipY+4);ctx.fill();ctx.fillStyle='#ffad2d';ctx.beginPath();ctx.moveTo(42,tipY+3);ctx.quadraticCurveTo(47,tipY+3,48,tipY-1);ctx.quadraticCurveTo(46,tipY-6*flicker,44,tipY-7*flicker);ctx.quadraticCurveTo(45,tipY-1,42,tipY+3);ctx.fill();ctx.fillStyle='#fff4a5';ctx.beginPath();ctx.moveTo(44,tipY+2);ctx.quadraticCurveTo(47,tipY,46,tipY-3*flicker);ctx.quadraticCurveTo(44,tipY-1,44,tipY+2);ctx.fill();ctx.restore()}
  const flameDrawElephantBase=drawElephant;
  drawElephant=function(tower,ghost=false,valid=true,selected=false){const result=flameDrawElephantBase(tower,ghost,valid,selected);if(isFlame(tower))drawTrunkFlame(tower,ghost,valid);return result};
  function drawBurningOrb(orb){
    const effects=burnList(orb),melt=orb.iceShieldMeltLife||0;if(!effects.length&&!melt)return;ctx.save();ctx.translate(orb.x,orb.y);
    if(effects.length){const pulse=.75+.2*Math.sin(state.gameTime*12+orb.x),boost=(orb.flameTickLife||0)>0?1.35:1;ctx.globalAlpha=Math.min(1,pulse*boost);ctx.shadowColor='#ff5b22';ctx.shadowBlur=13*boost;for(let index=0;index<5;index++){const angle=index*Math.PI*2/5+state.gameTime*.7,radius=BALL_R-2+(index%2)*4,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius-5;ctx.fillStyle=index%2?'#ff6a24':'#ffc13a';ctx.beginPath();ctx.moveTo(x-3,y+7);ctx.quadraticCurveTo(x-5,y,x,y-8-(index%3)*2);ctx.quadraticCurveTo(x+5,y,x+3,y+7);ctx.fill()}ctx.globalAlpha=.2;ctx.fillStyle='#ff7b27';ctx.beginPath();ctx.arc(0,0,BALL_R+4,0,Math.PI*2);ctx.fill()}
    if(melt){const progress=1-melt/.9;ctx.globalAlpha=Math.min(1,melt/.18);ctx.fillStyle='#8eeaff';ctx.strokeStyle='#dffcff';ctx.lineWidth=2;for(let index=0;index<7;index++){const angle=index*Math.PI*2/7+.2,distance=BALL_R+progress*18,x=Math.cos(angle)*distance,y=Math.sin(angle)*distance+progress*12;ctx.beginPath();ctx.ellipse(x,y,2.2,4.2,angle,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=.7*(1-progress);for(const x of [-10,0,11]){ctx.beginPath();ctx.moveTo(x,-BALL_R);ctx.quadraticCurveTo(x+5,-BALL_R-12-progress*9,x,-BALL_R-20-progress*14);ctx.stroke()}}
    ctx.restore();
  }
  const flameDrawBallBase=drawBall;drawBall=function(orb){const result=flameDrawBallBase(orb);drawBurningOrb(orb);return result};

  function drawFlameStreams(){
    if(!flameStreams.length&&!freezeSteam.length)return;const scale=state.renderScale||1;ctx.save();ctx.setTransform(scale,0,0,scale,0,0);ctx.translate(-state.cameraX,-state.cameraY);
    for(const stream of flameStreams){const alpha=Math.max(0,stream.life/stream.max),dx=stream.x2-stream.x1,dy=stream.y2-stream.y1,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;ctx.globalAlpha=alpha;ctx.lineCap='round';const gradient=ctx.createLinearGradient(stream.x1,stream.y1,stream.x2,stream.y2);gradient.addColorStop(0,'#fff5a1');gradient.addColorStop(.3,'#ffbd32');gradient.addColorStop(.75,'#f35a23');gradient.addColorStop(1,'#d92f1622');ctx.strokeStyle=gradient;ctx.shadowColor='#ff5a20';ctx.shadowBlur=14;ctx.lineWidth=7+alpha*4;ctx.beginPath();ctx.moveTo(stream.x1,stream.y1);ctx.quadraticCurveTo((stream.x1+stream.x2)/2+nx*7,(stream.y1+stream.y2)/2+ny*7,stream.x2,stream.y2);ctx.stroke();ctx.fillStyle='#ffd65a';for(let index=1;index<8;index++){const p=index/8,w=Math.sin(index*3.7+stream.seed)*7*(1-p),x=stream.x1+dx*p+nx*w,y=stream.y1+dy*p+ny*w;ctx.beginPath();ctx.arc(x,y,1.5+2*(1-p),0,Math.PI*2);ctx.fill()}}
    for(const effect of freezeSteam){const progress=1-effect.life/effect.max;ctx.globalAlpha=Math.min(1,effect.life/.18)*(1-progress*.55);ctx.strokeStyle='#e9ffff';ctx.shadowColor='#ff9a45';ctx.shadowBlur=10;ctx.lineWidth=2;for(const offset of [-8,0,8]){ctx.beginPath();ctx.moveTo(effect.x+offset,effect.y+4);ctx.quadraticCurveTo(effect.x+offset+5,effect.y-8-progress*8,effect.x+offset-1,effect.y-18-progress*15);ctx.stroke()}}
    ctx.restore();
  }
  const flameDrawBase=draw;draw=function(){flameDrawBase();drawFlameStreams()};

  root.showFlameFreezeImmunity=function(tower){if(!isFlame(tower)||tower.sold)return false;freezeSteam.push({x:tower.x,y:tower.y-8,life:.72,max:.72});burst(tower.x,tower.y,'#ffd08a',7,44);return true};

  function buyFlame(){togglePlacementPreview(TYPE,()=>state.status==='playing'&&state.currency>=definition.cost&&standardElephantCount()<CONFIG.ELEPHANT_LIMIT&&reservedTotalUnitCount()<CONFIG.TOTAL_UNIT_LIMIT)}
  flameUI.buy.addEventListener('click',buyFlame);
  const flameRefreshBase=refreshUnitButtons;refreshUnitButtons=function(){flameRefreshBase();const canPlace=standardElephantCount()<CONFIG.ELEPHANT_LIMIT&&reservedTotalUnitCount()<CONFIG.TOTAL_UNIT_LIMIT;flameUI.buy.disabled=state.currency<definition.cost||state.status!=='playing'||!canPlace;flameUI.buy.classList.toggle('selected',state.placement===TYPE);if(state.placement===TYPE){ui.hint.querySelector('strong').textContent='PLACE FLAME ELEPHANT';ui.hint.querySelector('p').lastChild.textContent=' Click valid ground. Burns orbs, melts Ice Shields, and cannot be frozen.'}extendedUI.standardElephantCount.textContent=`Standard Elephants: ${reservedElephantCount()+(state.placement===TYPE?1:0)}/${CONFIG.ELEPHANT_LIMIT}`};
  canvas.addEventListener('click',event=>{if(state.placement!==TYPE)return;event.stopImmediatePropagation();updatePlacementPointer(event);if(!placementAllowed(mouse)||state.currency<definition.cost||standardElephantCount()>=CONFIG.ELEPHANT_LIMIT||state.towers.filter(towerUsesElephantPlacementSlot).length>=CONFIG.TOTAL_UNIT_LIMIT)return;state.currency-=definition.cost;const tower=applyPlacementFacing(createFlameElephant(mouse.x,mouse.y));state.towers.push(tower);scanActiveFumeOrbs(true);state.placement=null;selectTower(tower);tutorialAction('placed');burst(tower.x,tower.y,'#ff762e',20,82);updateUI()},true);

  const flameUpdateStatsBase=updateStats;updateStats=function(){const result=flameUpdateStatsBase(),tower=state?.selectedTower;if(!isFlame(tower))return result;ui.selectedTypeLabel.textContent='SELECTED FLAME ELEPHANT';ui.towerName.textContent=definition.name;ui.towerLevel.textContent=`LEVEL ${tower.level}/${upgrades.maxLevel}`;ui.statOneLabel.textContent='BURN DAMAGE';ui.statTwoLabel.textContent='ATTACK SPEED';ui.statThreeLabel.textContent='RANGE';ui.towerDamage.textContent=`${stats.burnDamagePerTick.toFixed(2)} × 5`;ui.towerAttackSpeed.textContent=`${(1/tower.attackSpeed).toFixed(2)}/s`;ui.towerRange.textContent=Math.round(tower.radius);ui.targetingControls.classList.remove('hidden');ui.targetMode.value=tower.targetMode;ui.targetHelp.textContent=targetDescriptions[tower.targetMode];ui.upgradePreview.textContent=tower.level>=upgrades.maxLevel?'Fully upgraded':'+2% attack speed • +1.5% range • refreshes 5s burn';return result};

  function removeTowerBurns(tower){for(const orb of state.balls){if(!Array.isArray(orb.flameBurns))continue;orb.flameBurns=orb.flameBurns.filter(effect=>effect.towerId!==tower.towerId);if(!orb.flameBurns.length)clearOrbBurns(orb)}flameStreams=flameStreams.filter(stream=>stream.tower!==tower)}
  root.clearFlameTowerEffects=removeTowerBurns;
  const flameSellBase=sellSelected;sellSelected=function(){const tower=state?.selectedTower;if(isFlame(tower))removeTowerBurns(tower);return flameSellBase()};
  function clearFlameRuntime(){flameStreams=[];freezeSteam=[];for(const orb of state.balls||[]){clearOrbBurns(orb);delete orb.flameTickLife;delete orb.iceShieldMeltLife}}
  const flameResetBase=reset;reset=function(){clearFlameRuntime();return flameResetBase()};
  const flameFinishBase=finish;finish=function(kind){clearFlameRuntime();return flameFinishBase(kind)};
  const flameClearDebugBase=clearDebugOrbs;clearDebugOrbs=function(){clearFlameRuntime();return flameClearDebugBase()};

  const flameSnapshotBase=finaleTowerSnapshot;finaleTowerSnapshot=function(tower){const copy=flameSnapshotBase(tower);if(isFlame(tower))copy.contentId=definition.id;return copy};
  for(const tower of state.towers||[])if(isFlame(tower)){tower.contentId=definition.id;tower.name=definition.name;tower.purchasePrice=definition.cost;applyLevelStats(tower)}
  for(const orb of state.balls||[])clearOrbBurns(orb);
  updateUI();
  if(root.__ELEPHANT_TEST_MODE__)root.FlameElephantTestHooks={definition,isFlame,createFlameElephant,meltIceShield,applyBurn,flameHit,applyBurnTick,updateBurns,orbIsInvulnerable,burnList,clearFlameRuntime,freezeSteamCount:()=>freezeSteam.length,flameStreamCount:()=>flameStreams.length};
})(globalThis);
