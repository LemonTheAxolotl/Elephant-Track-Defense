const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('ice-base-action.js','utf8'),sandbox);
const action=sandbox.IceBaseAction,actors=action.createActors(),original=[...actors];
const snow=()=>actors.filter(actor=>actor.type==='snowcap'&&actor.state!=='defeated');
const shield=actors.find(actor=>actor.type==='iceshield');
assert.equal(new Set(actors.map(actor=>actor.id)).size,4);
action.advance(actors,'base-orb-breach',3.4);
const staged=actors.map(actor=>({x:actor.x,y:actor.y}));
assert.equal(snow().length,3);
for(const phase of ['base-snowcap-freeze','base-shield-defense']){
  action.advance(actors,phase,5);
  assert.deepEqual(actors.map(actor=>({x:actor.x,y:actor.y})),staged,'Changing dialogue/shot must not move or respawn an orb.');
}
const states=[];
for(let frame=0;frame<=360;frame++){
  const t=frame/100;action.advance(actors,'base-fire-break',t);
  const state=action.shieldState(t);if(states.at(-1)!==state)states.push(state);
  assert.equal(snow().length,3,'Shield destruction must never clean up a Snowcap.');
  assert.equal(action.complete(actors,'base-fire-break',t),t>=action.SHIELD.defeatEnd);
  if(t<action.SHIELD.defeatEnd)assert.notEqual(shield.state,'defeated');
}
assert.deepEqual(states,['iceshieldIdle','fireIncoming','fireImpact','shieldCracking','shieldBreaking','defeating','removed']);
action.advance(actors,'base-fire-immunity',4);
assert.equal(snow().length,3,'The failed freeze attempt must leave all three attackers visible.');
const counts=[3];
for(const [phase,target,count] of [['base-snowcap-defeat-one',actors[0],2],['base-snowcap-defeat-two',actors[1],1]]){
  for(let frame=0;frame<=250;frame++){
    const t=frame/100;action.advance(actors,phase,t);
    assert.equal(action.complete(actors,phase,t),t>=action.SNOW.defeatEnd);
    if(t<action.SNOW.impactAt)assert.equal(target.state,'active');
    else if(t<action.SNOW.defeatEnd)assert.equal(target.state,'dying','An impacted orb must finish its visible destruction before removal.');
    else assert.equal(target.state,'defeated');
  }
  counts.push(snow().length);assert.equal(snow().length,count);
}
assert.deepEqual(counts,[3,2,1]);
assert.equal(action.complete(actors,'base-ghost-rescue',0),false);
action.advance(actors,'base-ghost-rescue',1.4);assert.equal(actors[2].state,'capturing');
action.advance(actors,'base-ghost-rescue',3);assert.equal(actors[2].state,'captured');
assert.equal(action.complete(actors,'base-ghost-rescue',3),true);
action.advance(actors,'base-heater-success',4);
assert.equal(actors[2].state,'captured');assert.equal(snow().length,1);
actors.forEach((actor,i)=>assert.equal(actor,original[i],'Every actor retains its object identity through all shots.'));
const replay=action.createActors();assert(replay.every(actor=>actor.state==='waiting'));assert.equal(replay.length,4);
assert.equal(action.fireCue('base-shield-defense',8),null);
assert.equal(action.fireCue('base-fire-break',.1).attack,0);
assert(action.fireCue('base-fire-break',.5).recoil>0,'The trunk must visibly ready before firing.');
console.log('Elephant Base action tests passed: autonomous attack, complete shield defeat, Snowcap counts 3 → 2 → 1 captured, stable IDs, replay.');
