// Frozen Expanse-only Snow-Covered orb mutation and elephant freeze resistance.
(function(root){
  'use strict';
  const frozenMap=root.GameContent.indexes.maps.frozen_expanse;
  const activeRules=root.GameContent.activeMap.id==='frozen_expanse'?frozenMap.snowMutation:null;
  const activeIceShieldRules=root.GameContent.activeMap.id==='frozen_expanse'?frozenMap.iceShield:null;
  // Debug mutations deliberately work on every map and in older standalone
  // bundles.  Do not make a Foundry debug spawn depend on Ice Map data being
  // present in the currently loaded content bundle.
  const DEBUG_ICE_SHIELD_RANGE=frozenMap?.iceShield?.shieldHitRange||{min:1,max:5};
  const uiFreeze={panel:document.querySelector('#freezeResistance'),label:document.querySelector('#freezeResistanceLabel'),timer:document.querySelector('#freezeResistanceTimer'),bar:document.querySelector('#freezeResistanceBar'),fill:document.querySelector('#freezeResistanceFill'),status:document.querySelector('#freezeResistanceStatus')};
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
  // Encounter bookkeeping is non-critical. It previously ran after the orb
  // was already inserted into state.balls, allowing a stale encyclopedia
  // record to turn a successful debug spawn into a false console failure.
  function recordIceShieldEncounter(orb){if(!activeIceShieldRules||!orb?.iceShieldMaxHits)return false;try{const record=encyclopediaRecord?.('mutation-ice-shield');if(!record)throw new Error('Ice Shield encyclopedia record is unavailable.');record.encounteredCount=(Number(record.encounteredCount)||0)+1;if(record.firstEncounterWave===null)record.firstEncounterWave=orb.wave||state.wave||1;record.discoveryState='discovered';record.unlockPending=false;saveEncyclopediaData();return true}catch(error){console.error('[Ice Shield encounter record failed]',error);return false}}
  function iceShieldRange(rules=activeIceShieldRules||frozenMap.iceShield){const range=rules?.shieldHitRange||DEBUG_ICE_SHIELD_RANGE;return{min:Math.max(1,Math.floor(Number(range?.min)||1)),max:Math.max(1,Math.floor(Number(range?.max)||5))}}
  function rollIceShieldDurability(rules=activeIceShieldRules||frozenMap.iceShield,roll=gameRandom()){const range=iceShieldRange(rules),min=Math.min(range.min,range.max),max=Math.max(range.min,range.max);return min+Math.min(max-min,Math.floor(Math.max(0,Math.min(.999999999,Number(roll)||0))*(max-min+1)))}
  function applyIceShieldDurability(orb,rules,durabilityRoll){const hits=rollIceShieldDurability(rules,durabilityRoll);orb.iceShieldHits=hits;orb.iceShieldMaxHits=hits;orb.iceShieldImpactLife=0;orb.iceShieldCrackLife=0;orb.iceShieldBroken=false;return hits}
  function markIceShieldMutation(orb,wave,rules=activeIceShieldRules,roll=gameRandom(),durabilityRoll){if(!orb||orb.iceShieldChecked)return !!orb?.iceShieldHits;orb.iceShieldChecked=true;if(rules&&wave>=rules.firstWave&&roll<rules.spawnChance){applyIceShieldDurability(orb,rules,durabilityRoll);recordIceShieldEncounter(orb)}return !!orb.iceShieldHits}
  const markActiveMapOrbSnow=markActiveMapOrb;markActiveMapOrb=function(orb,wave){const snow=markActiveMapOrbSnow(orb,wave);markIceShieldMutation(orb,wave);return snow||!!orb.iceShieldHits}

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
  // A Snow-Capped Food Orb cannot freeze a tower it has lured. Compare the
  // concrete orb object, not a broad "following food" state, so another Food
  // Orb can still freeze that tower normally.
  function chasingThisFoodOrb(tower,orb){return !!(orb?.special&&orb.specialType==='food'&&tower?.lureOrb===orb)}
  function validFreezeTarget(tower,orb){
    if(chasingThisFoodOrb(tower,orb)||freezeResistanceMaximum(tower)<=0||towerIsFrozen(tower)||tower.behavior==='falling'||!state.towers.includes(tower)||freezeTargetRange(tower)<=0)return false;
    return !orb||dist(orb,tower)<=freezeTargetRange(tower);
  }
  function closestFreezeTarget(orb){return state.towers.filter(tower=>validFreezeTarget(tower,orb)).sort((a,b)=>dist(orb,a)-dist(orb,b)||(a.towerId||0)-(b.towerId||0))[0]||null}
  function applyFreezeHit(tower,rules=activeRules||frozenMap.snowMutation,orb){
    if(chasingThisFoodOrb(tower,orb))return false;
    if(root.beforeSnowFreezeHit?.(tower,rules,orb))return false;
    if(tower?.towerType==='flame'){root.showFlameFreezeImmunity?.(tower,orb);return false}
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
      tower.freezeWarmingRemaining=Math.max(0,tower.freezeWarmingRemaining-dt*(root.heaterFreezeRecoveryMultiplier?.(tower)||1));
      if(tower.freezeWarmingRemaining===0){tower.freezeResistanceRemaining=maximum;tower.freezeResistanceRegenTimer=null;tower.freezeThawLife=.85;burst(tower.x,tower.y,'#c8f8ff',18,95)}
      return;
    }
    if(tower.freezeResistanceRemaining>=maximum){tower.freezeResistanceRegenTimer=null;return}
    tower.freezeResistanceRegenTimer=Math.max(0,(tower.freezeResistanceRegenTimer??rules.resistanceRegenerationSeconds)-dt*(root.heaterFreezeRecoveryMultiplier?.(tower)||1));
    if(tower.freezeResistanceRegenTimer===0){tower.freezeResistanceRemaining++;tower.freezeFrostLife=.35;tower.freezeResistanceRegenTimer=tower.freezeResistanceRemaining<maximum?rules.resistanceRegenerationSeconds:null}
  }
  function snowOrbCanAttack(orb){return !!(orb?.snowCovered&&state.balls.includes(orb)&&orb.state==='active'&&orb.targetable&&!orb.digState&&!orb.rewarded)}
  function launchFreezeAttack(orb,target,rules=activeRules){
    const distance=Math.hypot(target.x-orb.x,target.y-orb.y);freezeBolts.push({orb,target,elapsed:0,duration:Math.max(.28,Math.min(.72,distance/520))});orb.snowFreezeTimer=randomAttackInterval(rules);orb.snowAttackFlash=.45;
  }
  function updateSnowOrbs(dt){
    for(const orb of state.balls){if(!orb.snowMutationChecked)orb.snowMutationChecked=true;if(!snowOrbCanAttack(orb))continue;orb.snowAttackFlash=Math.max(0,(orb.snowAttackFlash||0)-dt);orb.snowFreezeTimer=Math.max(0,(orb.snowFreezeTimer??randomAttackInterval(activeRules))-dt);if(orb.snowFreezeTimer===0){const target=closestFreezeTarget(orb);if(!target)continue;launchFreezeAttack(orb,target,activeRules)}}
    for(const bolt of freezeBolts){if(!snowOrbCanAttack(bolt.orb)||!validFreezeTarget(bolt.target)){bolt.remove=true;continue}bolt.elapsed+=dt;if(bolt.elapsed>=bolt.duration){applyFreezeHit(bolt.target,activeRules,bolt.orb);bolt.remove=true}}
    freezeBolts=freezeBolts.filter(bolt=>!bolt.remove);
  }
  function partitionFrozenTowers(towers){const active=[],frozen=[];for(const tower of towers)(towerIsFrozen(tower)?frozen:active).push(tower);return{active,frozen}}

  function snowCapMaximumHp(orb){return Number.isFinite(orb?.maxHp)?orb.maxHp:Number.isFinite(orb?.maxDurability)?orb.maxDurability:Math.max(0,Number(orb?.hp)||0)}
  function snowWeightHeals(orb){return Math.max(0,Math.floor(orb?.snowWeightHeals||0))}
  function snowWeightMultiplier(orb){return !orb?.snowCovered?1:Math.max(CONFIG.FROST_SNOW_WEIGHT_SPEED_FLOOR,1-snowWeightHeals(orb)*CONFIG.FROST_SNOW_WEIGHT_SLOW_PER_HEAL)}
  function applySnowCapFrostHeal(orb){
    const maximum=snowCapMaximumHp(orb),current=Math.max(0,Number(orb.hp)||0),heal=Math.min(maximum-current,maximum*CONFIG.FROST_SNOW_CAP_HEAL_PERCENT);
    orb.frostSlowStacks=0;orb.frostSlowLife=0;
    if(heal<=0)return 0;
    orb.hp=current+heal;if(orb.special&&Number.isFinite(orb.maxDurability)){orb.durability=Math.min(orb.maxDurability,orb.hp);orb.hits=orb.maxDurability-orb.durability}
    orb.snowWeightHeals=snowWeightHeals(orb)+1;orb.snowHealFlash=.56;burst(orb.x,orb.y,'#c8f8ff',14,78);
    return heal;
  }
  function iceShieldHits(orb){return Math.max(0,Math.floor(Number(orb?.iceShieldHits)||0))}
  // This is the single event gate for Ice Shield.  It deliberately runs before
  // damage, durability, Frost slow/heal, and Mini Robot collision resolution.
  function consumeIceShieldHit(orb){
    const hits=iceShieldHits(orb);if(!hits||!state.balls.includes(orb))return false;
    if(orb.digInvincible||orb.invulnerable||(orb.isBoss&&isBossShieldActive?.(orb)))return false;
    orb.iceShieldHits=hits-1;orb.iceShieldImpactLife=.38;orb.iceShieldCrackLife=hits===1?.62:.42;
    if(hits===1){orb.iceShieldBroken=true;burst(orb.x,orb.y,'#d9fbff',20,105)}else burst(orb.x,orb.y,'#9beeff',9,58);
    return true;
  }
  root.consumeMiniRobotIceShield=consumeIceShieldHit;
  const iceShieldHitOrbBase=hitOrb;hitOrb=function(tower,target){if(consumeIceShieldHit(target))return false;return iceShieldHitOrbBase(tower,target)};
  // Frost never chips an Ice Shield. A shielded Frost hit applies neither slow
  // nor Snow-Capped healing, even on the Ice Map where Frost can damage an
  // unshielded normal orb.
  const frostHitEffectBase=frostHitEffect;frostHitEffect=function(tower,target){if(iceShieldHits(target)>0)return false;if(!target?.snowCovered)return frostHitEffectBase(tower,target);return applySnowCapFrostHeal(target)};
  const iceShieldMiniAttackBase=miniRobotAttack;miniRobotAttack=function(mini,orb){if(consumeIceShieldHit(orb)){mini.cooldown=mini.attackSpeed;mini.attackTarget=null;mini.weaponLife=0;return false}return iceShieldMiniAttackBase(mini,orb)};
  const iceShieldDestroyMiniBase=destroyOrbByMini;destroyOrbByMini=function(orb){if(consumeIceShieldHit(orb))return false;return iceShieldDestroyMiniBase(orb)};

  const spawnBase=spawnBall;spawnBall=function(job){const before=new Set(state.balls),result=spawnBase(job);for(const orb of state.balls)if(!before.has(orb))markActiveMapOrb(orb,job.wave);return result};
  function markDebugSpawn(orb,wave,override){
    if(override==='snowcap'){orb.snowMutationChecked=true;orb.snowCovered=true;orb.snowFreezeTimer=randomAttackInterval(frozenMap.snowMutation);return true}
    if(override==='iceshield'){orb.snowMutationChecked=true;orb.snowCovered=false;delete orb.snowFreezeTimer;orb.iceShieldChecked=true;applyIceShieldDurability(orb,frozenMap.iceShield);recordIceShieldEncounter(orb);return true}
    if(override==='none'){orb.snowMutationChecked=true;orb.snowCovered=false;delete orb.snowFreezeTimer;orb.iceShieldChecked=true;delete orb.iceShieldHits;delete orb.iceShieldMaxHits;return false}
    return markActiveMapOrb(orb,wave)
  }
  const debugNormalBase=debugNormalOrb;debugNormalOrb=function(...args){const before=new Set(state.balls),result=debugNormalBase(...args),wave=Math.max(1,state.wave||Number(ui.startLevelSelect.value)||1),override=args[2];for(const orb of state.balls)if(!before.has(orb))markDebugSpawn(orb,wave,override);return result};
  const debugSpecialBase=debugSpecialOrb;debugSpecialOrb=function(...args){const before=new Set(state.balls),result=debugSpecialBase(...args),wave=Math.max(1,state.wave||Number(ui.startLevelSelect.value)||1),override=args[1];for(const orb of state.balls)if(!before.has(orb))markDebugSpawn(orb,wave,override);return result};

  const DEBUG_SPAWN_TYPES=Object.freeze(['normal','ghost','food','fume','engineer']);
  const DEBUG_MUTATIONS=Object.freeze(['snowcap','iceshield']);
  const DEBUG_SPAWN_HELP='/spawn normal <tier> [count] [mutation]\n/spawn ghost <tier> [count] [mutation]\n/spawn food [count] [mutation]\n/spawn fume [count] [mutation]\n/spawn engineer [count] [mutation]\n\nMutations available: snowcap, iceshield\n\nExamples:\n/spawn normal 5 iceshield\n/spawn normal 5 3 iceshield';
  function debugSpawnError(message){return{error:message}}
  function parseDebugSpawn(source){
    const parts=source.trim().split(/\s+/),type=(parts[1]||'').toLowerCase(),whole=value=>/^-?\d+$/.test(value||'')?Number(value):null;
    if(!DEBUG_SPAWN_TYPES.includes(type))return debugSpawnError('Invalid spawn type. Use normal, ghost, food, fume, or engineer.');
    const tiered=type==='normal'||type==='ghost',tier=tiered?whole(parts[2]):null,start=tiered?3:2;
    if(tiered&&(tier===null||tier<0||tier>=OrbProgression.TIERS.length))return debugSpawnError(`Invalid tier. Use a value from 0 to ${OrbProgression.TIERS.length-1}.`);
    const tail=parts.slice(start),usage=tiered?`Usage: /spawn ${type} <tier> [count] [mutation]`:`Usage: /spawn ${type} [count] [mutation]`;
    if(tail.length>2)return debugSpawnError(usage);
    let count=1,mutation=null;
    if(tail.length){
      const first=tail[0].toLowerCase(),numericCount=whole(first);
      if(numericCount===null){
        if(tail.length!==1)return debugSpawnError(usage);
        if(!DEBUG_MUTATIONS.includes(first))return debugSpawnError(`Unknown mutation: ${first}. Available mutations: snowcap, iceshield.`);
        mutation=first;
      }else{
        count=numericCount;
        if(tail.length===2){mutation=tail[1].toLowerCase();if(whole(mutation)!==null)return debugSpawnError(usage);if(!DEBUG_MUTATIONS.includes(mutation))return debugSpawnError(`Unknown mutation: ${mutation}. Available mutations: snowcap, iceshield.`)}
      }
    }
    if(count<1||count>CONFIG.ownerDebugMaximumSpawnCount)return debugSpawnError(`Orb count must be between 1 and ${CONFIG.ownerDebugMaximumSpawnCount}.`);
    return{type,tier,count,mutation,override:mutation||'none'}
  }
  function runParsedDebugSpawn(parsed){const before=state.balls.length;for(let index=0;index<parsed.count;index++)(['food','fume','engineer'].includes(parsed.type)?debugSpecialOrb(parsed.type,parsed.override):debugNormalOrb(parsed.tier,parsed.type==='ghost',parsed.override));const spawned=state.balls.slice(before);if(spawned.length!==parsed.count)throw new Error(`Debug spawn completed ${spawned.length} of ${parsed.count} requested orbs.`);return{ok:true,parsed,spawned}}
  function spawnSuccess(result){const parsed=result.parsed||result,type=parsed.type==='normal'?'Normal':parsed.type==='ghost'?'Ghost':parsed.type==='food'?'Food':parsed.type==='fume'?'Fume':'Engineer',orbLabel=(parsed.type==='normal'||parsed.type==='ghost')?`Tier ${parsed.tier} ${type} Orb(s)`:`${type} Orb(s)`,mutation=parsed.mutation==='iceshield'?' with Ice Shield':parsed.mutation==='snowcap'?' with Snow-Capped mutation':'';return`Spawned ${parsed.count} ${orbLabel}${mutation}.`}

  const ownerCommandBase=executeDebugCommand;executeDebugCommand=function(source){const command=source.trim(),verb=command.split(/\s+/)[0]?.toLowerCase(),iceMap=root.GameContent.activeMap.id==='frozen_expanse',totalWaves=root.GameContent.activeMap.totalWaves;if(verb==='/help'){debugWrite(`/help\n${DEBUG_SPAWN_HELP}\n/money <amount>\n/set wave <1-${totalWaves}>\n/health <0-100>\n/clear orbs\n/pause\n/resume\n/kill <normal|ghost|food|fume|engineer|boss|all>\n/win — ${iceMap?`Complete Frozen Expanse through Wave ${totalWaves}.`:'Opens map selection.'}\n/map <foundry|ice> — Opens a specific map.\n/unlock frozen — Permanently unlock Frozen Expanse.\n/close`,'success');return{ok:true}}if(verb!=='/spawn')return ownerCommandBase(source);const parsed=parseDebugSpawn(command);if(parsed.error){debugWrite(parsed.error,'error');return{ok:false,error:parsed.error}}const result=runParsedDebugSpawn(parsed);debugWrite(spawnSuccess(result),'success');return result};
  const adminCommandBase=executeAdminDebugCommand;executeAdminDebugCommand=function(source){const command=source.trim(),verb=command.split(/\s+/)[0]?.toLowerCase();if(verb==='/help'){adminDebugWrite(`/help\nADMIN COMMANDS\n${DEBUG_SPAWN_HELP}\n/money <amount>\n/set wave <1-${root.GameContent.activeMap.totalWaves}>\n/close`,'success');return{ok:true}}if(verb!=='/spawn')return adminCommandBase(source);const parsed=parseDebugSpawn(command);if(parsed.error){adminDebugWrite(parsed.error,'error');return{ok:false,error:parsed.error}}const result=runParsedDebugSpawn(parsed);adminDebugWrite(spawnSuccess(result),'success');return result};

  const iceShieldDictionaryBase=encyclopediaEntries;encyclopediaEntries=function(){const entries=iceShieldDictionaryBase();if(!activeIceShieldRules||entries.some(entry=>entry.id==='mutation-ice-shield'))return entries;return entries.concat({id:'mutation-ice-shield',category:'special',tier:null,name:'Ice Shield Orb',description:'A randomly durable ice shell blocks damaging attacks before the orb can take damage.',introductionWave:`Ice Map Wave ${activeIceShieldRules.firstWave}`,baseHP:'Random Shield Durability',scaling:'Each valid damaging attack removes exactly 1 shield hit',reward:'Base orb reward unchanged',endpointDamage:'Base orb type',baseSpeed:'Base orb type',speedScaling:'Base orb type',visual:{highlight:'#effcff',mid:'#9beeff',low:'#4c93b2',shadow:'#113447',rim:'#d9fbff',glow:'#64dfff'},specialDetails:['Blocks direct attacks, Splash pulses, and Mini Robot attacks','Frost does not affect a shielded orb','The final blocked hit shatters the shell permanently']})};

  function updateSnowCapFrostVisuals(dt){for(const orb of state.balls){orb.snowHealFlash=Math.max(0,(orb.snowHealFlash||0)-dt);orb.frostHitFlash=Math.max(0,(orb.frostHitFlash||0)-dt);orb.iceShieldImpactLife=Math.max(0,(orb.iceShieldImpactLife||0)-dt);orb.iceShieldCrackLife=Math.max(0,(orb.iceShieldCrackLife||0)-dt)}}
  const updateBase=update;update=function(dt){
    if(!state.paused&&state.status==='playing')updateSnowCapFrostVisuals(dt);
    if(!activeRules||state.paused||state.status!=='playing')return updateBase(dt);
    for(const tower of state.towers)ensureFreezeResistance(tower);
    const original=state.towers,groups=partitionFrozenTowers(original);state.towers=groups.active;
    try{updateBase(dt)}finally{state.towers=[...state.towers,...groups.frozen.filter(tower=>!tower.sold)]}
    for(const tower of state.towers)updateTowerFreeze(tower,dt,activeRules);
    updateSnowOrbs(dt);if(state.selectedTower?.kind==='elephant')updateStats();
  };

  function drawSnowCover(orb){
    if(!orb?.snowCovered||orb.digState==='burrow'||orb.digState==='returnBurrow')return;
    const weight=snowWeightHeals(orb),thickness=Math.min(10,weight*.8),healing=(orb.snowHealFlash||0)>0;
    ctx.save();ctx.translate(orb.x,orb.y-13);ctx.shadowColor='#a8efff';ctx.shadowBlur=healing?22:(orb.snowAttackFlash||0)>0?15:6;ctx.fillStyle='#f4fdff';for(const cap of [{x:-10,y:1,rx:8+thickness*.35,ry:5+thickness*.22},{x:0,y:-2,rx:10+thickness*.45,ry:7+thickness*.3},{x:10,y:1,rx:8+thickness*.35,ry:5+thickness*.22}]){ctx.beginPath();ctx.ellipse(cap.x,cap.y,cap.rx,cap.ry,0,Math.PI,Math.PI*2);ctx.fill()}ctx.strokeStyle='#bcecf5';ctx.lineWidth=1.2+thickness*.08;ctx.beginPath();ctx.moveTo(-17-thickness*.35,2);ctx.quadraticCurveTo(0,8+thickness*.25,17+thickness*.35,2);ctx.stroke();ctx.restore();
    if(healing){ctx.save();ctx.translate(orb.x,orb.y);ctx.globalAlpha=Math.min(1,orb.snowHealFlash/.18);ctx.fillStyle='#bff7ff';ctx.shadowColor='#83ecff';ctx.shadowBlur=24;ctx.beginPath();ctx.arc(0,0,BALL_R+8,0,Math.PI*2);ctx.fill();ctx.restore()}
    if(weight){ctx.save();ctx.fillStyle='#e8feff';ctx.shadowColor='#174354';ctx.shadowBlur=3;ctx.font='700 8px Inter';ctx.textAlign='center';ctx.fillText(`Snow Weight: ${weight} heals`,orb.x,orb.y+39);ctx.textAlign='left';ctx.restore()}
  }
  function activeFrostSlowStacks(orb){return orb?.frostSlowLife>0?frostSlowStacks(orb):0}
  function drawFrostSlowStatus(orb){const life=Math.max(0,orb?.frostHitFlash||0);if(!life)return;const p=1-life/.24;ctx.save();ctx.translate(orb.x,orb.y);ctx.globalAlpha=Math.min(1,life/.08);ctx.fillStyle='#c9f7ff';ctx.shadowColor='#83e9ff';ctx.shadowBlur=9;for(const flake of [{x:-11,y:-5,s:2},{x:7,y:-10,s:1.7},{x:13,y:5,s:2.1},{x:-4,y:12,s:1.5}]){const drift=p*7;ctx.beginPath();ctx.arc(flake.x+Math.sign(flake.x||1)*drift,flake.y+Math.sign(flake.y||1)*drift,flake.s*(1-p*.45),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=Math.min(.7,life/.12);ctx.strokeStyle='#e9feff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,-3);ctx.lineTo(-2,-7);ctx.lineTo(4,-4);ctx.stroke();ctx.restore()}
  function drawIceShield(orb){
    const hits=iceShieldHits(orb),maximum=Math.max(hits,Math.floor(Number(orb?.iceShieldMaxHits)||0)),lost=Math.max(0,maximum-hits),shatterLife=orb.iceShieldCrackLife||0,shattering=!hits&&shatterLife>0;if(!hits&&!shattering)return;
    if(hits){const strength=maximum<=1?0:maximum<=3?.5:1,remaining=maximum?hits/maximum:1,radius=BALL_R-1+strength*2.4*remaining,edgeWidth=1.25+strength*1.9*remaining;ctx.save();ctx.translate(orb.x,orb.y);ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.clip();const shell=ctx.createRadialGradient(-7,-9,2,0,0,BALL_R+strength*4);shell.addColorStop(0,`#f3ffff${strength>.5?'c7':'99'}`);shell.addColorStop(.36,`#b8efff${strength>.5?'78':'48'}`);shell.addColorStop(.76,'#73cfe133');shell.addColorStop(1,'#d9fbff70');ctx.fillStyle=shell;ctx.fillRect(-BALL_R-5,-BALL_R-5,(BALL_R+5)*2,(BALL_R+5)*2);ctx.globalAlpha=.72+.18*strength;ctx.strokeStyle='#dffcff';ctx.lineWidth=edgeWidth;ctx.beginPath();ctx.arc(0,0,radius-1,.48,2.48);ctx.stroke();ctx.globalAlpha=.52+.24*strength;ctx.strokeStyle='#f8ffff';ctx.lineWidth=1.5+strength*1.6;ctx.beginPath();ctx.arc(-4,-4,Math.max(3,radius-6),3.7,5.1);ctx.stroke();ctx.lineWidth=1.1+strength*.45;ctx.strokeStyle='#9adff0';for(const angle of [-2.55,.28,2.18]){ctx.beginPath();ctx.arc(0,0,radius-2,angle,angle+.38);ctx.stroke()}if(lost){ctx.globalAlpha=.55+.1*Math.min(3,lost);ctx.strokeStyle='#dffcff';ctx.lineWidth=1.1;for(let index=0;index<lost;index++){const angle=-1.25+index*2.1,x=Math.cos(angle)*(radius*.38),y=Math.sin(angle)*(radius*.38);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle+.55)*8,y+Math.sin(angle+.55)*8);ctx.lineTo(x+Math.cos(angle-.15)*12,y+Math.sin(angle-.15)*12);ctx.stroke()}}ctx.restore();ctx.save();ctx.translate(orb.x,orb.y);ctx.strokeStyle='#a9eefa';ctx.globalAlpha=.55+.17*strength;ctx.lineWidth=edgeWidth*.72;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();ctx.restore()}else{const progress=1-shatterLife/.62;ctx.save();ctx.translate(orb.x,orb.y);ctx.globalAlpha=Math.min(1,shatterLife/.16);ctx.fillStyle='#c6f7ff';for(let index=0;index<10;index++){const angle=index*Math.PI*2/10+.19,distance=BALL_R*(.35+progress*1.45),size=2.5+(index%3);ctx.save();ctx.translate(Math.cos(angle)*distance,Math.sin(angle)*distance);ctx.rotate(angle+progress*2);ctx.beginPath();ctx.moveTo(-size,-size*.45);ctx.lineTo(size,-size*.7);ctx.lineTo(size*.45,size);ctx.lineTo(-size*.7,size*.5);ctx.closePath();ctx.fill();ctx.restore()}ctx.restore()}
  }
  const drawBallBase=drawBall;drawBall=function(orb){const result=drawBallBase(orb);drawFrostSlowStatus(orb);drawSnowCover(orb);drawIceShield(orb);return result};
  // Final movement wrapper: Frost applies after special-orb, difficulty, and puddle modifiers.
  const frostStackSpeedBase=orbMovementSpeed;orbMovementSpeed=function(orb){const speed=frostStackSpeedBase(orb),stacks=activeFrostSlowStacks(orb);return speed*(1-stacks*CONFIG.FROST_SLOW_PER_STACK)*snowWeightMultiplier(orb)};

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
    const tower=state?.selectedTower,show=!!(activeRules&&(tower?.kind==='elephant'||tower?.towerType==='heater')&&!tower.sold);uiFreeze.panel.classList.toggle('hidden',!show);if(!show)return;
    const heater=tower.towerType==='heater',flame=tower.towerType==='flame';
    if(heater||flame){uiFreeze.panel.classList.remove('frozen');uiFreeze.panel.classList.add('heated');uiFreeze.panel.title=flame?'Flame Elephants are permanently immune to Snow-Capped freezes.':'Heaters are permanent support structures and cannot freeze.';uiFreeze.label.textContent='Freeze Resistance: ∞ / ∞';uiFreeze.timer.textContent='';if(uiFreeze.status){uiFreeze.status.textContent=flame?'Permanent Flame Immunity':'Permanent Heat Source';uiFreeze.status.classList.remove('hidden')}if(uiFreeze.fill)uiFreeze.fill.style.width='100%';if(uiFreeze.bar){uiFreeze.bar.setAttribute('aria-valuemax','1');uiFreeze.bar.setAttribute('aria-valuenow','1');uiFreeze.bar.setAttribute('aria-valuetext',flame?'Permanent flame immunity':'Permanent heat source')}return}
    const maximum=ensureFreezeResistance(tower),remaining=tower.freezeResistanceRemaining,frozen=towerIsFrozen(tower),percent=maximum?remaining/maximum:0,warmthLevel=root.heaterWarmthLevel?.(tower)||0,heated=!frozen&&warmthLevel>0,warmthText=warmthLevel===1?'Heater Warmth: Level 1 — Freeze recovery 1.25× faster':warmthLevel===2?'Heater Warmth: Level 2 — Freeze recovery 1.5× faster':warmthLevel===3?'Heater Warmth: Level 3 — Immune to Snow-Capped freezes':'';uiFreeze.panel.classList.toggle('frozen',frozen);uiFreeze.panel.classList.toggle('heated',heated);uiFreeze.panel.title=tooltip;uiFreeze.label.textContent=`Freeze Resistance: ${remaining} / ${maximum}`;uiFreeze.timer.textContent=frozen?`FROZEN — Warming Up: ${Math.ceil(tower.freezeWarmingRemaining)}s`:remaining<maximum?`Next point: ${Math.ceil(tower.freezeResistanceRegenTimer)}s`:'';if(uiFreeze.status){uiFreeze.status.textContent=warmthText;uiFreeze.status.classList.toggle('hidden',!warmthText)}if(uiFreeze.fill)uiFreeze.fill.style.width=`${percent*100}%`;if(uiFreeze.bar){uiFreeze.bar.setAttribute('aria-valuemax',String(maximum));uiFreeze.bar.setAttribute('aria-valuenow',String(remaining));uiFreeze.bar.setAttribute('aria-valuetext',`Freeze Resistance ${remaining} of ${maximum}`)}
  }
  root.renderFreezeResistance=renderFreezeResistance;
  const updateStatsBase=updateStats;updateStats=function(){const result=updateStatsBase();renderFreezeResistance();return result};
  const selectTowerBase=selectTower;selectTower=function(tower){const result=selectTowerBase(tower);renderFreezeResistance();return result};

  function clearSnowMutationRuntime(){freezeBolts=[];uiFreeze.panel.classList.add('hidden')}
  const resetBase=reset;reset=function(){clearSnowMutationRuntime();return resetBase()};
  const finishBase=finish;finish=function(kind){clearSnowMutationRuntime();return finishBase(kind)};
  const clearDebugBase=clearDebugOrbs;clearDebugOrbs=function(){clearSnowMutationRuntime();return clearDebugBase()};
  ui.restart.addEventListener('click',clearSnowMutationRuntime);ui.bannerRestart.addEventListener('click',clearSnowMutationRuntime);ui.sell.addEventListener('click',()=>{freezeBolts=freezeBolts.filter(bolt=>!bolt.target.sold)});

  const towerSnapshotBase=finaleTowerSnapshot;finaleTowerSnapshot=function(tower){const copy=towerSnapshotBase(tower);for(const key of ['freezeResistanceMax','freezeResistanceRemaining','freezeResistanceRegenTimer','freezeWarmingRemaining'])if(tower?.[key]!==undefined)copy[key]=tower[key];return copy};
  const orbSnapshotBase=finaleOrbSnapshot;finaleOrbSnapshot=function(orb){const copy=orbSnapshotBase(orb);for(const key of ['snowMutationChecked','snowCovered','snowFreezeTimer','snowWeightHeals','iceShieldChecked','iceShieldHits','iceShieldMaxHits'])if(orb?.[key]!==undefined)copy[key]=orb[key];return copy};

  // Existing saves predate the mutation; their already-living orbs remain unchanged.
  for(const tower of state.towers||[])if(activeRules)ensureFreezeResistance(tower);
  for(const orb of state.balls||[]){if(orb.snowMutationChecked===undefined)orb.snowMutationChecked=true;if(orb.iceShieldChecked===undefined)orb.iceShieldChecked=true}
  renderFreezeResistance();

  if(root.__ELEPHANT_TEST_MODE__)root.SnowMutationTestHooks={activeRules,frozenRules:frozenMap.snowMutation,iceShieldRules:frozenMap.iceShield,shouldSnowMutate,markSnowMutation,markIceShieldMutation,markDebugSpawn,parseDebugSpawn,consumeIceShieldHit,iceShieldHits,iceShieldRange,rollIceShieldDurability,freezeResistanceMaximum,ensureFreezeResistance,applyFreezeHit,updateTowerFreeze,towerIsFrozen,freezeTargetRange,chasingThisFoodOrb,validFreezeTarget,closestFreezeTarget,partitionFrozenTowers,activeFrostSlowStacks};
})(globalThis);
