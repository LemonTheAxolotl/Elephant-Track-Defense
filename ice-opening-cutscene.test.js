const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class FakeElement{
  constructor(){this.dataset={};this.disabled=false;this.listeners={};this.offsetWidth=1100;this.style={setProperty:(name,value)=>{this.style[name]=value}};const names=new Set(['hidden']);this.classList={add:(...items)=>items.forEach(item=>names.add(item)),remove:(...items)=>items.forEach(item=>names.delete(item)),contains:item=>names.has(item)};}
  addEventListener(type,listener){this.listeners[type]=listener}
  appendChild(child){this.child=child}
  focus(){}
  setAttribute(name,value){if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]=value}
  removeAttribute(name){if(name==='data-replaying')delete this.dataset.replaying}
  querySelector(){return null}
}
const elements=new Map(['#iceOpeningCutscene','#iceOpeningScene','#skipIceOpeningCutscene','#pauseIceOpeningCutscene','#mapSelectionModal','#mapSelectionGrid','#iceOpeningReplayNotice'].map(id=>[id,new FakeElement()]));
const activeCssAnimation={playbackRate:1,playState:'running',pause(){this.playState='paused'},play(){this.playState='running'}},activeTransition={playbackRate:1,playState:'running',pause(){this.playState='paused'},play(){this.playState='running'}};
elements.get('#iceOpeningScene').getAnimations=()=>[activeCssAnimation,activeTransition];
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
assert.equal(sandbox.iceOpeningCutsceneRuntime.playbackSpeed,1,'A new cutscene must always begin at normal playback speed.');
assert.equal(sandbox.setIceOpeningCutscenePlaybackSpeed(2),true);
assert.equal(sandbox.cutscenePlaybackSpeed,2,'The public cutscene clock must be the same central multiplier.');
assert.equal(activeCssAnimation.playbackRate,2,'Existing CSS keyframes must immediately use the selected cinematic rate.');
assert.equal(activeTransition.playbackRate,2,'Existing CSS transitions must immediately use the selected cinematic rate.');
sandbox.update(.25);
assert.equal(sandbox.iceOpeningCutsceneRuntime.elapsed,.5,'The cutscene-local 2× control must advance cinematic time twice as fast.');
assert.equal(sandbox.setIceOpeningCutscenePlaybackSpeed(1.5),true);
assert.equal(activeCssAnimation.playbackRate,1.5,'Changing speed must update an animation already in progress without recreating it.');
sandbox.update(.2);
assert.equal(sandbox.iceOpeningCutsceneRuntime.elapsed,.8,'Changing cutscene speed mid-phase must preserve elapsed progress without a restart.');
assert.equal(sandbox.setIceOpeningCutscenePlaybackSpeed(3),false,'Only the documented 1×, 1.5×, and 2× cinematic speeds are valid.');
assert.equal(sandbox.setIceOpeningCutscenePlaybackSpeed(1),true);
const pausedAt=sandbox.iceOpeningCutsceneRuntime.elapsed;
assert.equal(sandbox.setIceOpeningCutscenePaused(true),true,'The cutscene pause control must freeze the cinematic without changing run pause state.');
assert.equal(elements.get('#pauseIceOpeningCutscene').textContent,'RESUME');
assert.equal(activeCssAnimation.playState,'paused');
assert.equal(activeTransition.playState,'paused');
sandbox.update(2);
assert.equal(sandbox.iceOpeningCutsceneRuntime.elapsed,pausedAt,'No cutscene timer may advance while paused.');
assert.equal(state.paused,true,'Cutscene pause must not alter the existing gameplay pause state.');
assert.equal(sandbox.setIceOpeningCutscenePaused(false),false);
assert.equal(elements.get('#pauseIceOpeningCutscene').textContent,'PAUSE');
assert.equal(activeCssAnimation.playState,'running');
sandbox.update(.2);
assert.equal(sandbox.iceOpeningCutsceneRuntime.elapsed,pausedAt+.2,'Resuming continues from the exact paused frame at the selected speed.');
assert.equal(state.paused,true);
assert.equal(state.autoCountdown,2);
assert.equal(elements.get('#iceOpeningCutscene').classList.contains('hidden'),false);
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.iceOpeningCutsceneRuntime.trialSubjects)),{
  'failed-one':'untested','failed-two':'untested','failed-three':'untested',
  'tier-ten':'untested','tier-nine':'untested'
},'Every chamber subject must start visible and independently untested.');
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.iceOpeningCutsceneRuntime.refinementSubjects)),{
  'refinement-one-a':'untested','refinement-one-b':'untested','refinement-one-c':'untested',
  'refinement-two-a':'untested','refinement-two-b':'untested','refinement-two-c':'untested',
  'refinement-final-a':'untested','refinement-final-b':'untested','refinement-final-c':'untested'
},'The later formula-refinement samples begin as a separate, visible batch.');
assert.equal(sandbox.ICE_OPENING_SCENES.length,44);
assert.equal(sandbox.ICE_OPENING_SCENES[0].dialogue,undefined,'The exterior must not speak before the scientist is visible.');
assert.equal(sandbox.ICE_OPENING_SCENES[1].dialogue,'Elephants are stronger. We need a solution.','The opening line belongs to the laboratory reveal.');
assert.equal(sandbox.ICE_OPENING_SCENES[1].followupDialogue,'Begin testing the cold-serum.','The lab instruction must remain after the visible scientist introduction.');
const snowSuccessIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='snow-create'),shieldSuccessIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='shield-create'),refinementStartIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='formula-refinement'),refinementFinalIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='refinement-final-c'),snowSetupIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='freeze-intro'),snowTestIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='freeze-test'),shieldTestIndex=sandbox.ICE_OPENING_SCENES.findIndex(phase=>phase.id==='shield-hit-one');
assert.ok(snowSuccessIndex>=0&&shieldSuccessIndex>=0&&snowSetupIndex===Math.max(snowSuccessIndex,shieldSuccessIndex)+1&&snowTestIndex>snowSetupIndex&&shieldTestIndex>snowTestIndex&&refinementStartIndex>shieldTestIndex&&refinementFinalIndex>refinementStartIndex,'The initial Snowcap and Ice Shield successes must lead directly into the outdoor tests before Formula Refinement.');
assert.equal(sandbox.ICE_OPENING_SCENES[refinementFinalIndex+1]?.id,'fade-to-elephant-base','The stable samples must fade out before the Elephant Base sequence.');
assert.equal(sandbox.ICE_OPENING_SCENES.some(phase=>phase.id==='success'),false,'The legacy final laboratory tableau phase must not return.');
assert.equal(sandbox.ICE_OPENING_SCENES.at(-2)?.id,'base-heater-success','The Elephant Base must finish its working-heater result before the final fade.');
assert.equal(sandbox.ICE_OPENING_SCENES.at(-1)?.id,'fade','Only the completed Elephant Base sequence may transition into Ice Map gameplay.');
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.ICE_OPENING_SCENES.flatMap(phase=>phase.followupDialogue?[phase.dialogue,phase.followupDialogue]:phase.dialogue?[phase.dialogue]:[]))),[
  'Elephants are stronger. We need a solution.',
  'Begin testing the cold-serum.',
  'First sample was a failure. We need to try again.',
  'Another failure.',
  'The reaction is not constant, only more testing will give us a clear answer.',
  'Perfect. Shield of living ice.',
  'And this one freezes them in place.',
  "Now let's see what the elephants can do against them.",
  'Frozen. Exactly as we wanted.',
  'The shield can be broken... but it will slow them.',
  'The first results were unstable. The formula needs to be precise.',
  'A refined dose. Test the new samples.',
  'Still unstable.',
  'Some are responding. The serum is getting closer.',
  'One final refinement.',
  'Stable results. The solution works.',
  'Bring the test subject over.',
  'One dose. Watch closely.',
  'Good. The change held.',
  'Something just forced the door.',
  'Get back. That cold is spreading.',
  'Water won’t get through that shell.',
  'Fire unit. Take the shot.',
  'That did it. The shield is gone.',
  'It didn’t freeze the fire unit.',
  'I’ve got the survivors. Keep one alive.',
  'The heater failed.',
  'Reset it.',
  'Again.',
  'There. Don’t let it stop.'
],'The Ice opening dialogue script must match the requested Scientist lines exactly and in order.');
for(let frame=0;frame<1000&&sandbox.iceOpeningCutsceneRuntime.active;frame++)sandbox.update(.25);
assert.equal(sandbox.iceOpeningCutsceneRuntime.active,false);
assert.equal(state.paused,false);
assert.equal(elements.get('#iceOpeningCutscene').classList.contains('hidden'),true);
assert.equal(stored.get('elephant-track-ice-opening-viewed-v1'),'viewed');
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.iceOpeningCutsceneRuntime.trialSubjects)),{
  'failed-one':'failed','failed-two':'failed','failed-three':'failed',
  'tier-ten':'survivedIceShield','tier-nine':'survivedSnowCap'
},'Each test subject must retain an independent terminal state for the whole playthrough.');
assert.deepEqual(JSON.parse(JSON.stringify(sandbox.iceOpeningCutsceneRuntime.refinementSubjects)),{
  'refinement-one-a':'failed','refinement-one-b':'failed','refinement-one-c':'failed',
  'refinement-two-a':'failed','refinement-two-b':'survivedSnowCap','refinement-two-c':'survivedIceShield',
  'refinement-final-a':'survivedSnowCap','refinement-final-b':'survivedIceShield','refinement-final-c':'survivedSnowCap'
},'The separate refinement batch keeps independent terminal states and never revives failed samples.');
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

// The snowy establishing shot is intentionally silent.  The opening line may
// appear only after the lab-reveal transition has completed.
assert.equal(sandbox.startIceMapOpeningCutscene({replay:true}),true);
sandbox.update(4.5);
assert.equal(elements.get('#iceOpeningScene').dataset.phase,'lab-reveal');
assert.equal(elements.get('#iceOpeningScene').dataset.dialogue,'');
sandbox.update(1);
assert.equal(elements.get('#iceOpeningScene').dataset.dialogue,'');
sandbox.update(.1);
assert.equal(elements.get('#iceOpeningScene').dataset.dialogue,'Elephants are stronger. We need a solution.');
sandbox.finishIceOpeningCutscene();
console.log('Ice opening cutscene lifecycle tests passed.');
