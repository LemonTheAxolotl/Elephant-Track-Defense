const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class FakeElement{
  constructor(){this.dataset={};this.disabled=false;this.listeners={};this.offsetWidth=1100;const names=new Set(['hidden']);this.classList={add:(...items)=>items.forEach(item=>names.add(item)),remove:(...items)=>items.forEach(item=>names.delete(item)),contains:item=>names.has(item)};}
  addEventListener(type,listener){this.listeners[type]=listener}
  appendChild(child){this.child=child}
  focus(){}
  removeAttribute(name){if(name==='data-replaying')delete this.dataset.replaying}
  querySelector(){return null}
}
const elements=new Map(['#iceOpeningCutscene','#iceOpeningScene','#skipIceOpeningCutscene','#mapSelectionModal','#mapSelectionGrid','#iceOpeningReplayNotice'].map(id=>[id,new FakeElement()]));
const iceCard=new FakeElement(),iceCardCopy=new FakeElement();
iceCard.querySelector=selector=>selector==='.map-card-copy'?iceCardCopy:null;
const stored=new Map();
const state={currency:135,currentHealth:100,maximumHealth:100,wave:0,difficultyLocked:false,difficulty:null,paused:false,manualPaused:false,autoCountdown:2,stats:{destroyed:0,escaped:0,orbIncome:0,waveIncome:0,healthLost:0}};
const sandbox={
  console,state,GameContent:{activeMap:{id:'frozen_expanse'}},
  localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},
  document:{querySelector:selector=>selector==='.map-card.frozen'?iceCard:elements.get(selector)||null,createElement:()=>new FakeElement()},
  window:{addEventListener(){}},MutationObserver:class{observe(){}},
  updateUI(){},update(){sandbox.gameplayUpdates++},gameplayUpdates:0,
  setRunDifficulty(key){state.difficulty=key;state.difficultyLocked=true}
};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('./ice-opening-cutscene.js','utf8'),sandbox);

const original=JSON.stringify({currency:state.currency,currentHealth:state.currentHealth,maximumHealth:state.maximumHealth,wave:state.wave,stats:state.stats});
sandbox.setRunDifficulty('normal');
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,true);
assert.equal(state.paused,true);
assert.equal(state.autoCountdown,2);
assert.equal(elements.get('#iceOpeningCutscene').classList.contains('hidden'),false);
assert.equal(sandbox.ICE_OPENING_SCENES.length,13);
for(const entry of sandbox.ICE_OPENING_SCENES)sandbox.update(entry.duration+.01);
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,false);
assert.equal(state.paused,false);
assert.equal(elements.get('#iceOpeningCutscene').classList.contains('hidden'),true);
assert.equal(stored.get('elephant-track-ice-opening-viewed-v1'),'viewed');
assert.equal(JSON.stringify({currency:state.currency,currentHealth:state.currentHealth,maximumHealth:state.maximumHealth,wave:state.wave,stats:state.stats}),original);
assert.equal(sandbox.gameplayUpdates,0);

state.difficultyLocked=false;sandbox.setRunDifficulty('easy');
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,false,'viewed opening must not replay on retry');
assert.equal(sandbox.playIceOpeningCutscene({replay:true}),true);
assert.equal(sandbox.playIceOpeningCutscene({replay:true}),false,'replay must not duplicate an active cutscene');
sandbox.finishIceOpeningCutscene();
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,false);
assert.equal(JSON.stringify({currency:state.currency,currentHealth:state.currentHealth,maximumHealth:state.maximumHealth,wave:state.wave,stats:state.stats}),original);

// Replays are callable from the Ice Map card even when Foundry is the active
// map. They hide and restore the map-selection screen without touching a run.
elements.get('#mapSelectionModal').classList.remove('hidden');
state.paused=true;state.wave=7;state.currency=482;state.autoCountdown=1.75;
const replaySnapshot=JSON.stringify({paused:state.paused,wave:state.wave,currency:state.currency,autoCountdown:state.autoCountdown,stats:state.stats});
sandbox.GameContent.activeMap.id='map_foundry_sector_07';
assert.equal(sandbox.startIceMapOpeningCutscene({replay:true}),true);
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,true);
assert.equal(elements.get('#mapSelectionModal').classList.contains('hidden'),true);
assert.equal(state.paused,true);
assert.equal(state.autoCountdown,1.75);
sandbox.update(5);
assert.equal(sandbox.gameplayUpdates,0);
sandbox.finishIceOpeningCutscene();
assert.equal(elements.get('#mapSelectionModal').classList.contains('hidden'),false);
assert.equal(JSON.stringify({paused:state.paused,wave:state.wave,currency:state.currency,autoCountdown:state.autoCountdown,stats:state.stats}),replaySnapshot);

// The actual card button must use the replay path, even when the active map
// is Foundry. This is the formerly inert click path.
assert.ok(iceCardCopy.child,'the Ice card should receive a replay button');
assert.equal(iceCardCopy.child.dataset.action,'replay-ice-opening');
assert.equal(iceCardCopy.child.disabled,false);
elements.get('#mapSelectionModal').classList.remove('hidden');
iceCardCopy.child.closest=selector=>selector==='[data-action="replay-ice-opening"]'?iceCardCopy.child:null;
elements.get('#mapSelectionGrid').listeners.click({target:iceCardCopy.child,preventDefault(){},stopPropagation(){}});
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,true);
assert.equal(elements.get('#mapSelectionModal').classList.contains('hidden'),true);
sandbox.finishIceOpeningCutscene();
assert.equal(elements.get('#mapSelectionModal').classList.contains('hidden'),false);
console.log('Ice opening cutscene lifecycle tests passed.');
