// Frozen Expanse-only Snow-Covered orb mutation and elephant freeze resistance.
(function(root){
  'use strict';
  const frozenMap=root.GameContent.indexes.maps.frozen_expanse;
  const activeRules=root.GameContent.activeMap.id==='frozen_expanse'?frozenMap.snowMutation:null;
  const uiFreeze={panel:document.querySelector('#freezeResistance'),label:document.querySelector('#freezeResistanceLabel'),timer:document.querySelector('#freezeResistanceTimer'),segments:document.querySelector('#freezeResistanceSegments')};
  const tooltip='Snow-Covered Orbs remove Freeze Resistance. Missing resistance recovers by 1 point every 2 minutes. At 0 resistance, this elephant freezes for 30 seconds.';
  let freezeBolts=[];

  function randomAttackInterval(rules=activeRules){const interval=rules.attackIntervalSeconds;return interval.min+gameRandom()*(interval.max-interval.min)}
  function shouldSnowMutate(wave,roll,rules=activeRules){return !!rules&&wave>=rules.firstWave&&roll<rules.spawnChance}
  function markSnowMutation(orb,wave,rules=activeRules,roll=gameRandom()){
    if(!orb||orb.snowMutationChecked)return !!orb?.snowCovered;
    orb.snowMutationChecked=true;orb.snowCovered=shouldSnowMutate(wave,roll,rules);
    if(orb.snowCovered)orb.snowFreezeTimer=randomAttackInterval(rules);
    return orb.snowCovered;
  }
  function markActiveMapOrb(orb,wave){if(!activeRules||!orb)return false;return markSnowMutation(orb,wave,activeRules)}

  function freezeResistanceMaximum(tower){
    if(!tower||tower.kind!=='elephant'||tower.sold)return 0;
    if(tower.towerType==='frost')return 3;
    if(['gas','foodie','eyewear'].includes(tower.towerType))return 2;
    return 1;
  }
  function ensureFreezeResistance(tower){
    const maximum=freezeResistanceMaximum(tower);if(!maximum)return 0;
    if(tower.freezeResistanceMax!==maximum){tower.freezeResistanceMax=maximum;tower.freezeResistanceRemaining=Math.min(maximum,Number.isFinite(tower.freezeResistanceRemaining)?tower.freezeResistanceRemaining:maximum)}
    if(!Number.isFinite(tower.freezeResistanceRemaining))tower.freezeResistanceRemaining=maximum;
    tower.freezeResistanceRemaining=Math.max(0,Math.min(maximum,tower.freezeResistanceRemaining));
    if(tower.freezeResistanceRemaining<maximum&&!tower.freezeWarmingRemaining&&!Number.isFinite(tower.freezeResistanceRegenTimer))tower.freezeResistanceRegenTimer=activeRules?.resistanceRegenerationSeconds||120;
    return maximum;
  }
  function towerIsFrozen(tower){return (tower?.freezeWarmingRemaining||0)>0}
  // `radius` is the live, final tower range. It already includes level stats,
  // specializations and any range modifiers, so the snow mutation must not use
  // a separate/default range here.
  function freezeTargetRange(tower){const range=Number(tower?.radius);return Number.isFinite(range)&&range>0?range:0}
  function validFreezeTarget(tower,orb){
    if(freezeResistanceMaximum(tower)<=0||towerIsFrozen(tower)||tower.behavior==='falling'||!state.towers.includes(tower)||freezeTargetRange(tower)<=0)return false;
    return !orb||dist(orb,tower)<=freezeTargetRange(tower);
  }
  function closestFreezeTarget(orb){return state.towers.filter(tower=>validFreezeTarget(tower,orb)).sort((a,b)=>dist(orb,a)-dist(orb,b)||(a.towerId||0)-(b.towerId||0))[0]||null}
  function applyFreezeHit(tower,rules=activeRules||frozenMap.snowMutation){
    const maximum=ensureFreezeResistance(tower);if(!maximum||towerIsFrozen(tower)||tower.sold)return false;
    tower.freezeResistanceRemaining=Math.max(0,tower.freezeResistanceRemaining-1);tower.freezeFrostLife=.9;tower.freezeResistanceRegenTimer=rules.resistanceRegenerationSeconds;
    if(tower.freezeResistanceRemaining===0){tower.freezeWarmingRemaining=rules.frozenDurationSeconds;tower.freezeResistanceRegenTimer=null;tower.walking=false;tower.attack=0;tower.recoil=0;tower.visualTarget=null;tower.foodFocus=false}
    if(state.selectedTower===tower)updateStats();
    return true;
  }
  function updateTowerFreeze(tower,dt,rules=activeRules||frozenMap.snowMutation){
    const maximum=ensureFreezeResistance(tower);if(!maximum)return;
    tower.freezeFrostLife=Math.max(0,(tower.freezeFrostLife||0)-dt);tower.freezeThawLife=Math.max(0,(tower.freezeThawLife||0)-dt);
    if(towerIsFrozen(tower)){
      tower.freezeWarmingRemaining=Math.max(0,tower.freezeWarmingRemaining-dt);
      if(tower.freezeWarmingRemaining===0){tower.freezeResistanceRemaining=maximum;tower.freezeResistanceRegenTimer=null;tower.freezeThawLife=.85;burst(tower.x,tower.y,'#c8f8ff',18,95)}
      return;
    }
    if(tower.freezeResistanceRemaining>=maximum){tower.freezeResistanceRegenTimer=null;return}
    tower.freezeResistanceRegenTimer=Math.max(0,(tower.freezeResistanceRegenTimer??rules.resistanceRegenerationSeconds)-dt);
    if(tower.freezeResistanceRegenTimer===0){tower.freezeResistanceRemaining++;tower.freezeFrostLife=.35;tower.freezeResistanceRegenTimer=tower.freezeResistanceRemaining<maximum?rules.resistanceRegenerationSeconds:null}
  }
  function snowOrbCanAttack(orb){return !!(orb?.snowCovered&&state.balls.includes(orb)&&orb.state==='active'&&orb.targetable&&!orb.digState&&!orb.rewarded)}
  function launchFreezeAttack(orb,target,rules=activeRules){
    const distance=Math.hypot(target.x-orb.x,target.y-orb.y);freezeBolts.push({orb,target,elapsed:0,duration:Math.max(.28,Math.min(.72,distance/520))});orb.snowFreezeTimer=randomAttackInterval(rules);orb.snowAttackFlash=.45;
  }
  function updateSnowOrbs(dt){
    for(const orb of state.balls){if(!orb.snowMutationChecked)orb.snowMutationChecked=true;if(!snowOrbCanAttack(orb))continue;orb.snowAttackFlash=Math.max(0,(orb.snowAttackFlash||0)-dt);orb.snowFreezeTimer=Math.max(0,(orb.snowFreezeTimer??randomAttackInterval(activeRules))-dt);if(orb.snowFreezeTimer===0){const target=closestFreezeTarget(orb);if(!target)continue;launchFreezeAttack(orb,target,activeRules)}}
    for(const bolt of freezeBolts){if(!snowOrbCanAttack(bolt.orb)||!validFreezeTarget(bolt.target)){bolt.remove=true;continue}bolt.elapsed+=dt;if(bolt.elapsed>=bolt.duration){applyFreezeHit(bolt.target,activeRules);bolt.remove=true}}
    freezeBolts=freezeBolts.filter(bolt=>!bolt.remove);
  }
  function partitionFrozenTowers(towers){const active=[],frozen=[];for(const tower of towers)(towerIsFrozen(tower)?frozen:active).push(tower);return{active,frozen}}

  const spawnBase=spawnBall;spawnBall=function(job){const before=new Set(state.balls),result=spawnBase(job);for(const orb of state.balls)if(!before.has(orb))markActiveMapOrb(orb,job.wave);return result};
  function markDebugSpawn(orb,wave,override){
    if(override==='snowcap'){orb.snowMutationChecked=true;orb.snowCovered=true;orb.snowFreezeTimer=randomAttackInterval(frozenMap.snowMutation);return true}
    if(override==='none'){orb.snowMutationChecked=true;orb.snowCovered=false;delete orb.snowFreezeTimer;return false}
    return markActiveMapOrb(orb,wave)
  }
  const debugNormalBase=debugNormalOrb;debugNormalOrb=function(...args){const before=new Set(state.balls),result=debugNormalBase(...args),wave=Math.max(1,state.wave||Number(ui.startLevelSelect.value)||1),override=args[2];for(const orb of state.balls)if(!before.has(orb))markDebugSpawn(orb,wave,override);return result};
  const debugSpecialBase=debugSpecialOrb;debugSpecialOrb=function(...args){const before=new Set(state.balls),result=debugSpecialBase(...args),wave=Math.max(1,state.wave||Number(ui.startLevelSelect.value)||1),override=args[1];for(const orb of state.balls)if(!before.has(orb))markDebugSpawn(orb,wave,override);return result};

  const DEBUG_SPAWN_TYPES=Object.freeze(['normal','ghost','food','fume','engineer']);
  const DEBUG_MUTATIONS=Object.freeze(['snowcap']);
  const DEBUG_SPAWN_HELP='/spawn normal <tier> [count] [mutation]\n/spawn ghost <tier> [count] [mutation]\n/spawn food [count] [mutation]\n/spawn fume [count] [mutation]\n/spawn engineer [count] [mutation]\n\nMutation available: snowcap\n\nExample:\n/spawn normal 2 5 snowcap';
  function debugSpawnError(message){return{error:message}}
  function parseDebugSpawn(source){
    const parts=source.trim().split(/\s+/),type=(parts[1]||'').toLowerCase(),whole=value=>/^-?\d+$/.test(value||'')?Number(value):null;
    if(!DEBUG_SPAWN_TYPES.includes(type))return debugSpawnError('Invalid spawn type. Use normal, ghost, food, fume, or engineer.');
    const tiered=type==='normal'||type==='ghost',tier=tiered?whole(parts[2]):null,start=tiered?3:2;
    if(tiered&&(tier===null||tier<0||tier>=OrbProgression.TIERS.length))return debugSpawnError(`Invalid tier. Use a value from 0 to ${OrbProgression.TIERS.length-1}.`);
    const tail=parts.slice(start);let mutation=null;
    if(tail.length&&whole(tail[tail.length-1])===null){mutation=tail.pop().toLowerCase();if(!DEBUG_MUTATIONS.includes(mutation))return debugSpawnError(`Unknown mutation: ${mutation}. Available mutations: snowcap.`)}
    if(tail.length>1||tail.length===1&&whole(tail[0])===null)return debugSpawnError(tiered?`Usage: /spawn ${type} <tier> [count] [mutation]`:`Usage: /spawn ${type} [count] [mutation]`);
    const count=tail.length?whole(tail[0]):1;if(count<1||count>CONFIG.ownerDebugMaximumSpawnCount)return debugSpawnError(`Orb count must be between 1 and ${CONFIG.ownerDebugMaximumSpawnCount}.`);
    return{type,tier,count,mutation,override:mutation==='snowcap'?'snowcap':'none'}
  }
  function runParsedDebugSpawn(parsed){for(let index=0;index<parsed.count;index++)(['food','fume','engineer'].includes(parsed.type)?debugSpecialOrb(parsed.type,parsed.override):debugNormalOrb(parsed.tier,parsed.type==='ghost',parsed.override))}
  function spawnSuccess(parsed){return`Spawned ${parsed.count} ${parsed.mutation==='snowcap'?'snowcap ':''}${parsed.type} orb${parsed.count===1?'':'s'}.`}

  const ownerCommandBase=executeDebugCommand;executeDebugCommand=function(source){const command=source.trim(),verb=command.split(/\s+/)[0]?.toLowerCase();if(verb==='/help'){debugWrite(`/help\n${DEBUG_SPAWN_HELP}\n/money <amount>\n/set wave <1-50>\n/health <0-100>\n/clear orbs\n/pause\n/resume\n/kill <normal|ghost|food|fume|engineer|boss|all>\n/win — Opens map selection.\n/map <foundry|ice> — Opens a specific map.\n/unlock frozen — Permanently unlock Frozen Expanse.\n/close`,'success');return}if(verb!=='/spawn')return ownerCommandBase(source);const parsed=parseDebugSpawn(command);if(parsed.error){debugWrite(parsed.error,'error');return}runParsedDebugSpawn(parsed);debugWrite(spawnSuccess(parsed),'success')};
  const adminCommandBase=executeAdminDebugCommand;executeAdminDebugCommand=function(source){const command=source.trim(),verb=command.split(/\s+/)[0]?.toLowerCase();if(verb==='/help'){adminDebugWrite(`/help\n${DEBUG_SPAWN_HELP}\n/money <amount>\n/set wave <1-50>\n/close`,'success');return}if(verb!=='/spawn')return adminCommandBase(source);const parsed=parseDebugSpawn(command);if(parsed.error){adminDebugWrite(parsed.error,'error');return}runParsedDebugSpawn(parsed);adminDebugWrite(spawnSuccess(parsed),'success')};

  const updateBase=update;update=function(dt){
    if(!activeRules||state.paused||state.status!=='playing')return updateBase(dt);
    for(const tower of state.towers)ensureFreezeResistance(tower);
    const original=state.towers,groups=partitionFrozenTowers(original);state.towers=groups.active;
    try{updateBase(dt)}finally{state.towers=[...state.towers,...groups.frozen.filter(tower=>!tower.sold)]}
    for(const tower of state.towers)updateTowerFreeze(tower,dt,activeRules);
    updateSnowOrbs(dt);if(state.selectedTower?.kind==='elephant')updateStats();
  };

  function drawSnowCover(orb){
    if(!orb?.snowCovered||orb.digState==='burrow'||orb.digState==='returnBurrow')return;
    ctx.save();ctx.translate(orb.x,orb.y-13);ctx.shadowColor='#a8efff';ctx.shadowBlur=(orb.snowAttackFlash||0)>0?15:6;ctx.fillStyle='#f4fdff';for(const cap of [{x:-10,y:1,rx:8,ry:5},{x:0,y:-2,rx:10,ry:7},{x:10,y:1,rx:8,ry:5}]){ctx.beginPath();ctx.ellipse(cap.x,cap.y,cap.rx,cap.ry,0,Math.PI,Math.PI*2);ctx.fill()}ctx.strokeStyle='#bcecf5';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-17,2);ctx.quadraticCurveTo(0,8,17,2);ctx.stroke();ctx.restore();
  }
  const drawBallBase=drawBall;drawBall=function(orb){const result=drawBallBase(orb);drawSnowCover(orb);return result};

  function drawTowerFreeze(tower){
    if(!tower||tower.kind!=='elephant'||tower.sold)return;const frozen=towerIsFrozen(tower),frost=tower.freezeFrostLife||0,thaw=tower.freezeThawLife||0;if(!frozen&&!frost&&!thaw)return;
    ctx.save();ctx.translate(tower.x,tower.y);if(frozen||frost){ctx.globalAlpha=frozen?.5:.18+.25*Math.min(1,frost);ctx.fillStyle='#a9edff';ctx.strokeStyle='#e8fdff';ctx.shadowColor='#73e6ff';ctx.shadowBlur=frozen?18:9;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-37,-40,74,75,16);ctx.fill();ctx.stroke();ctx.fillStyle='#f7feff';for(const flake of [[-27,-26],[22,-32],[-31,10],[29,18],[0,-39]]){ctx.beginPath();ctx.arc(flake[0],flake[1],3.5,0,Math.PI*2);ctx.fill()}}if(frozen){ctx.globalAlpha=1;ctx.fillStyle='#eaffff';ctx.strokeStyle='#12333e';ctx.lineWidth=4;ctx.font='900 13px Inter';ctx.textAlign='center';ctx.strokeText('FROZEN',0,-49);ctx.fillText('FROZEN',0,-49)}else if(thaw){ctx.globalAlpha=Math.min(1,thaw/.35);ctx.fillStyle='#dffcff';ctx.shadowColor='#7deaff';ctx.shadowBlur=12;ctx.font='900 12px Inter';ctx.textAlign='center';ctx.fillText('THAWED!',0,-46-thaw*8)}ctx.restore();
  }
  const drawElephantBase=drawElephant;drawElephant=function(tower,...args){const result=drawElephantBase(tower,...args);if(!args[0])drawTowerFreeze(tower);return result};

  function drawFreezeBolts(){
    if(!freezeBolts.length)return;const scale=state.renderScale||1;ctx.save();ctx.setTransform(scale,0,0,scale,0,0);ctx.translate(-state.cameraX,-state.cameraY);for(const bolt of freezeBolts){const p=Math.min(1,bolt.elapsed/bolt.duration),sx=bolt.orb.x,sy=bolt.orb.y-8,tx=bolt.target.x,ty=bolt.target.y-8,x=sx+(tx-sx)*p,y=sy+(ty-sy)*p,bend=Math.sin(p*Math.PI)*18;ctx.globalAlpha=.85;ctx.strokeStyle='#baf6ff';ctx.shadowColor='#58dcff';ctx.shadowBlur=13;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+tx)/2,(sy+ty)/2-bend,x,y);ctx.stroke();ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();if(!prefersReducedMotion())for(let i=0;i<4;i++){const a=i*Math.PI/2+state.gameTime*8;ctx.beginPath();ctx.arc(x+Math.cos(a)*8,y+Math.sin(a)*8,1.8,0,Math.PI*2);ctx.fill()}}ctx.restore();
  }
  const drawBase=draw;draw=function(){drawBase();drawFreezeBolts()};

  function renderFreezeResistance(){
    const tower=state?.selectedTower,show=!!(activeRules&&tower?.kind==='elephant'&&!tower.sold);uiFreeze.panel.classList.toggle('hidden',!show);if(!show)return;
    const maximum=ensureFreezeResistance(tower),remaining=tower.freezeResistanceRemaining,frozen=towerIsFrozen(tower);uiFreeze.panel.classList.toggle('frozen',frozen);uiFreeze.panel.title=tooltip;uiFreeze.label.textContent=`Freeze Resistance: ${remaining} / ${maximum}`;uiFreeze.timer.textContent=frozen?`Warming Up: ${Math.ceil(tower.freezeWarmingRemaining)}s`:remaining<maximum?`Next point: ${Math.ceil(tower.freezeResistanceRegenTimer)}s`:'';const signature=`${remaining}/${maximum}`;if(uiFreeze.segments.dataset?.signature!==signature){uiFreeze.segments.innerHTML=Array.from({length:maximum},(_,index)=>`<i class="${index<remaining?'filled':''}"></i>`).join('');if(uiFreeze.segments.dataset)uiFreeze.segments.dataset.signature=signature}uiFreeze.segments.setAttribute?.('aria-label',`Freeze Resistance ${remaining} of ${maximum}`);
  }
  const updateStatsBase=updateStats;updateStats=function(){const result=updateStatsBase();renderFreezeResistance();return result};
  const selectTowerBase=selectTower;selectTower=function(tower){const result=selectTowerBase(tower);renderFreezeResistance();return result};

  function clearSnowMutationRuntime(){freezeBolts=[];uiFreeze.panel.classList.add('hidden')}
  const resetBase=reset;reset=function(){clearSnowMutationRuntime();return resetBase()};
  const finishBase=finish;finish=function(kind){clearSnowMutationRuntime();return finishBase(kind)};
  const clearDebugBase=clearDebugOrbs;clearDebugOrbs=function(){clearSnowMutationRuntime();return clearDebugBase()};
  ui.restart.addEventListener('click',clearSnowMutationRuntime);ui.bannerRestart.addEventListener('click',clearSnowMutationRuntime);ui.sell.addEventListener('click',()=>{freezeBolts=freezeBolts.filter(bolt=>!bolt.target.sold)});

  const towerSnapshotBase=finaleTowerSnapshot;finaleTowerSnapshot=function(tower){const copy=towerSnapshotBase(tower);for(const key of ['freezeResistanceMax','freezeResistanceRemaining','freezeResistanceRegenTimer','freezeWarmingRemaining'])if(tower?.[key]!==undefined)copy[key]=tower[key];return copy};
  const orbSnapshotBase=finaleOrbSnapshot;finaleOrbSnapshot=function(orb){const copy=orbSnapshotBase(orb);for(const key of ['snowMutationChecked','snowCovered','snowFreezeTimer'])if(orb?.[key]!==undefined)copy[key]=orb[key];return copy};

  // Existing saves predate the mutation; their already-living orbs remain unchanged.
  for(const tower of state.towers||[])if(activeRules)ensureFreezeResistance(tower);
  for(const orb of state.balls||[])if(orb.snowMutationChecked===undefined)orb.snowMutationChecked=true;
  renderFreezeResistance();

  if(root.__ELEPHANT_TEST_MODE__)root.SnowMutationTestHooks={activeRules,frozenRules:frozenMap.snowMutation,shouldSnowMutate,markSnowMutation,markDebugSpawn,parseDebugSpawn,freezeResistanceMaximum,ensureFreezeResistance,applyFreezeHit,updateTowerFreeze,towerIsFrozen,freezeTargetRange,validFreezeTarget,closestFreezeTarget,partitionFrozenTowers};
})(globalThis);
