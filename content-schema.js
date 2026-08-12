(function(root){
  'use strict';
  const ID=/^[a-z][a-z0-9_-]*$/;
  function fail(file,message){throw new Error(`${file}: ${message}`)}
  function object(value,file,label){if(!value||typeof value!=='object'||Array.isArray(value))fail(file,`${label} must be an object`)}
  function array(value,file,label){if(!Array.isArray(value))fail(file,`${label} must be an array`)}
  function ids(items,file,label){array(items,file,label);const seen=new Set();for(const item of items){object(item,file,`${label} item`);if(!ID.test(item.id||''))fail(file,`${label} has invalid id "${item.id}"`);if(seen.has(item.id))fail(file,`${label} has duplicate id "${item.id}"`);seen.add(item.id)}return seen}
  function index(items){return Object.fromEntries(items.map(item=>[item.id,item]))}
  function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze)}return value}
  function build(raw){
    const required=['maps','orbs','towers','achievements','tutorial','waves','difficulties'];
    for(const name of required){object(raw[name],`${name}.json`,'root');if(raw[name].version!==1)fail(`${name}.json`,'unsupported or missing version')}
    const mapIds=ids(raw.maps.maps,'maps.json','maps');
    if(!mapIds.has(raw.maps.defaultMapId))fail('maps.json',`defaultMapId references missing map "${raw.maps.defaultMapId}"`);
    for(const map of raw.maps.maps){const points=ids(map.trackWaypoints,'maps.json',`${map.id}.trackWaypoints`);if(points.size<2)fail('maps.json',`${map.id} needs at least two waypoints`);ids(map.entrances,'maps.json',`${map.id}.entrances`);ids(map.endpoints,'maps.json',`${map.id}.endpoints`);if(map.entrances.some(e=>!points.has(e.waypointId))||map.endpoints.some(e=>!points.has(e.waypointId)))fail('maps.json',`${map.id} entrance/endpoint references a missing waypoint`)}
    const tierIds=ids(raw.orbs.normalTiers,'orbs.json','normalTiers'),specialIds=ids(raw.orbs.specialOrbs,'orbs.json','specialOrbs'),bossIds=ids(raw.orbs.bosses,'orbs.json','bosses');
    const orbIds=new Set([...tierIds,...specialIds,...bossIds]);if(orbIds.size!==tierIds.size+specialIds.size+bossIds.size)fail('orbs.json','orb IDs must be globally unique');
    raw.orbs.normalTiers.forEach((tier,i)=>{if(tier.tier!==i)fail('orbs.json',`${tier.id} must have tier ${i}`)});
    const towerIds=ids(raw.towers.towers,'towers.json','towers');raw.towers.towers.forEach(t=>{if(t.specializations)ids(t.specializations,'towers.json',`${t.id}.specializations`)});
    const difficultyIds=ids(raw.difficulties.difficulties,'difficulties.json','difficulties');for(const id of ['easy','normal','hard'])if(!difficultyIds.has(id))fail('difficulties.json',`missing difficulty "${id}"`);
    const achievementIds=ids(raw.achievements.achievements,'achievements.json','achievements');object(raw.achievements.difficultyRewards,'achievements.json','difficultyRewards');raw.achievements.achievements.forEach(a=>{if(!raw.achievements.difficultyRewards[a.difficulty])fail('achievements.json',`${a.id} has unknown difficulty`);const ref=a.unlockCondition?.towerId||a.unlockCondition?.orbId||a.unlockCondition?.waveId;if(ref&&!towerIds.has(ref)&&!orbIds.has(ref)&&!/^wave_\d+$/.test(ref))fail('achievements.json',`${a.id} references missing ID "${ref}"`)});
    const tutorialIds=ids(raw.tutorial.steps,'tutorial.json','steps'),waveIds=ids(raw.waves.waves,'waves.json','waves');if(raw.waves.waves.length!==50)fail('waves.json','exactly 50 waves are required');raw.waves.waves.forEach((w,i)=>{if(w.number!==i+1)fail('waves.json',`${w.id} has invalid number`);if(w.compositionRuleId!==raw.waves.compositionRule.id)fail('waves.json',`${w.id} has unknown composition rule`)});
    ids(raw.waves.specialWindows,'waves.json','specialWindows');ids(raw.waves.warnings,'waves.json','warnings');const finaleIds=ids(raw.waves.finales,'waves.json','finales');raw.waves.specialWindows.forEach(w=>{if(!orbIds.has(w.orbId))fail('waves.json',`${w.id} references missing orb "${w.orbId}"`)});raw.waves.finales.forEach(f=>{if(!bossIds.has(f.bossId))fail('waves.json',`${f.id} references missing boss`);f.encounterOrder.forEach(id=>{if(!orbIds.has(id))fail('waves.json',`${f.id} references missing orb "${id}"`)})});raw.waves.waves.forEach(w=>{if(w.finaleId&&!finaleIds.has(w.finaleId))fail('waves.json',`${w.id} references missing finale`)});
    const activeMap=raw.maps.maps.find(m=>m.id===raw.maps.defaultMapId);const config=Object.assign({},raw.maps.config,raw.orbs.config,raw.towers.config,raw.tutorial.config,raw.waves.config,raw.waves.runtimeConfig,{TRACK_WAYPOINTS:activeMap.trackWaypoints.map(({x,y})=>({x,y})),BOSS_ORB_TYPES:[],ADDITIONAL_ORB_TYPES:[]});
    ['startingCurrency','maximumHealth','startingHealth','waterElephantCost','TOTAL_WAVES','BALL_HEALTH','TIER0_ORB_HEALTH','BALL_SPEED','GAME_SPEEDS'].forEach(key=>{if(config[key]===undefined)fail('content configuration',`missing "${key}"`)});
    return deepFreeze(Object.assign({},raw,{config,activeMap,indexes:{maps:index(raw.maps.maps),orbs:index([...raw.orbs.normalTiers,...raw.orbs.specialOrbs,...raw.orbs.bosses]),towers:index(raw.towers.towers),achievements:index(raw.achievements.achievements),tutorial:index(raw.tutorial.steps),waves:index(raw.waves.waves),difficulties:index(raw.difficulties.difficulties)},stableIds:{maps:[...mapIds],orbs:[...orbIds],towers:[...towerIds],achievements:[...achievementIds],tutorial:[...tutorialIds],waves:[...waveIds]}}));
  }
  const api={build};root.GameContentSchema=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
