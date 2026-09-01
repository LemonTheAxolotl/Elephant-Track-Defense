/* Beta difficulty rules.  Loaded after game.js so this wraps the final active gameplay functions. */
const DIFFICULTY_RULES=Object.fromEntries(globalThis.GameContent.difficulties.difficulties.map(item=>[item.id,{name:item.name,hpMultiplier:item.nonBossHpMultiplier,speedMultiplier:item.nonBossSpeedMultiplier??1,damageMultiplier:item.elephantFinalDamageMultiplier,description:item.displayText}]));
const DIFFICULTY_RUN_STORAGE_KEY=`elephant-track-defense-difficulty-run:${globalThis.GameContent.activeMap.id}`,DIFFICULTY_RUN_VERSION=2;
const difficultyModal=document.querySelector('#difficultyModal');
const difficultyHud=document.querySelector('#difficultyHud'),difficultyHudValue=document.querySelector('#difficultyHudValue');
const difficultyButtons=[...document.querySelectorAll?.('#difficultyModal [data-difficulty]')||[]];
function difficultyKey(){return DIFFICULTY_RULES[state?.difficulty]?state.difficulty:'normal'}
function difficultyRule(){return DIFFICULTY_RULES[difficultyKey()]}
function difficultyLabel(){return difficultyRule().description}
function renderDifficultyHud(){if(!difficultyHud)return;const visible=!!state?.difficultyLocked&&!!state?.difficulty;difficultyHud.classList.toggle('hidden',!visible);if(difficultyHud.dataset)difficultyHud.dataset.difficulty=visible?difficultyKey():'';if(visible&&difficultyHudValue)difficultyHudValue.textContent=difficultyRule().name.toUpperCase()}
function readDifficultyRun(){try{const saved=JSON.parse(localStorage.getItem(DIFFICULTY_RUN_STORAGE_KEY)||'null');return saved&&typeof saved==='object'?saved:null}catch{return null}}
function writeDifficultyRun(value){try{localStorage.setItem(DIFFICULTY_RUN_STORAGE_KEY,JSON.stringify({version:DIFFICULTY_RUN_VERSION,...value}))}catch{}}
function clearDifficultyRun(){try{localStorage.setItem(DIFFICULTY_RUN_STORAGE_KEY,'')}catch{}}
function hideDifficultyChoice(){difficultyModal?.classList.add('hidden');difficultyModal?.setAttribute?.('aria-hidden','true')}
function currentDifficultyRun(saved=readDifficultyRun()){return saved?.version===DIFFICULTY_RUN_VERSION?saved:null}
function tutorialSetupReadyForDifficulty(){return !!(tutorialData?.completed||tutorialData?.skipped||tutorialData?.doNotShow||(state?.tutorialActive&&tutorialData?.step>=10))}
function difficultyChoiceRequired(){return !!(state&&state.status==='playing'&&state.wave===0&&!state.difficultyLocked&&!state.pendingWaveStart&&tutorialSetupReadyForDifficulty()&&canStartWave())}
function applyDifficultyToOrb(orb){
  if(!orb)return orb;
  globalThis.applyIceMapOrbRebalance?.(orb);
  if(orb.difficultyApplied)return orb;
  if(orb.isBoss){orb.difficultyApplied=true;return orb}
  const multiplier=difficultyRule().hpMultiplier;
  orb.maxHp=Math.max(1,Math.round(orb.maxHp*multiplier));
  orb.hp=Math.min(orb.maxHp,Math.max(0,Math.round(orb.hp*multiplier)));
  if(Number.isFinite(orb.maxDurability))orb.maxDurability=Math.max(1,Math.round(orb.maxDurability*multiplier));
  if(Number.isFinite(orb.durability))orb.durability=Math.min(orb.maxDurability,Math.max(0,Math.round(orb.durability*multiplier)));
  orb.difficultyApplied=true;
  return orb;
}
function applyDifficultyToNewOrbs(before){state.balls.slice(before).forEach(applyDifficultyToOrb)}
function setRunDifficulty(key){
  if(!DIFFICULTY_RULES[key]||state.difficultyLocked)return;
  state.difficulty=key;state.difficultyLocked=true;
  writeDifficultyRun({pending:false,difficulty:key,difficultyLocked:true});
  hideDifficultyChoice();
  renderDifficultyHud();
  updateUI();
}
function openDifficultyChoice(){
  if(globalThis.__ELEPHANT_TEST_MODE__){state.difficulty='normal';state.difficultyLocked=true;return}
  if(!difficultyChoiceRequired()){hideDifficultyChoice();return false}
  difficultyModal?.classList.remove('hidden');
  difficultyModal?.removeAttribute?.('aria-hidden');
  writeDifficultyRun({pending:true,difficulty:null,difficultyLocked:false});
  return true;
}
difficultyButtons.forEach(button=>button.addEventListener('click',()=>setRunDifficulty(button.dataset.difficulty)));

const difficultySpawnBallBase=spawnBall;
spawnBall=function(job){const before=state.balls.length,result=difficultySpawnBallBase(job);applyDifficultyToNewOrbs(before);return result};
const difficultyDebugNormalBase=debugNormalOrb;
debugNormalOrb=function(tier){const before=state.balls.length,result=difficultyDebugNormalBase(tier);applyDifficultyToNewOrbs(before);return result};
const difficultyDebugSpecialBase=debugSpecialOrb;
debugSpecialOrb=function(type){const before=state.balls.length,result=difficultyDebugSpecialBase(type);applyDifficultyToNewOrbs(before);return result};
const difficultyBossBase=createFusedPrismaticBoss;
createFusedPrismaticBoss=function(index){const boss=applyDifficultyToOrb(difficultyBossBase(index));updateBossHealthHud();return boss};
const difficultyReinforcementBase=spawnBossReinforcement;
spawnBossReinforcement=function(...args){return applyDifficultyToOrb(difficultyReinforcementBase(...args))};
const difficultyOrbMovementSpeedBase=orbMovementSpeed;
orbMovementSpeed=function(orb){const iceMapMultiplier=orb?.isBoss?1:(globalThis.iceMapOrbSpeedMultiplier?.(orb)??1);return difficultyOrbMovementSpeedBase(orb)*iceMapMultiplier*(orb?.isBoss?1:(difficultyRule().speedMultiplier??1))};
const difficultyDamageBase=damageAgainst;
damageAgainst=function(tower,target){return difficultyDamageBase(tower,target)*difficultyRule().damageMultiplier};
const difficultyMiniDamageBase=miniRobotDamageAgainst;
miniRobotDamageAgainst=function(mini,orb){return difficultyMiniDamageBase(mini,orb)*difficultyRule().damageMultiplier};

const difficultySnapshotBase=finaleRunSnapshot;
finaleRunSnapshot=function(){return {...difficultySnapshotBase(),difficulty:difficultyKey(),difficultyLocked:!!state.difficultyLocked}};
const difficultyOrbSnapshotBase=finaleOrbSnapshot;
finaleOrbSnapshot=function(orb){return {...difficultyOrbSnapshotBase(orb),difficultyApplied:!!orb.difficultyApplied}};
const difficultyRestoreBase=restoreFinaleSave;
restoreFinaleSave=function(saved){
  const restored=difficultyRestoreBase(saved);
  if(!restored)return restored;
  const run=saved?.run||{};state.difficulty=DIFFICULTY_RULES[run.difficulty]?run.difficulty:'normal';state.difficultyLocked=run.difficultyLocked!==false;
  state.balls.forEach(applyDifficultyToOrb);updateBossHealthHud();updateUI();return restored;
};
const difficultyResetBase=reset;
reset=function(){
  clearDifficultyRun();
  const result=difficultyResetBase();
  if(state.finale?.phase&&state.finale.phase!=='idle'){state.difficulty=DIFFICULTY_RULES[state.difficulty]?state.difficulty:'normal';state.difficultyLocked=true}
  else {state.difficulty=null;state.difficultyLocked=false;hideDifficultyChoice();renderDifficultyHud();setTimeout(()=>updateUI(),0)}
  return result;
};
const difficultyFinishBase=finish;
finish=function(kind){const result=difficultyFinishBase(kind);if((kind==='won'||kind==='lost')&&state.status===kind){const p=ui.banner.querySelector('p');p.textContent=`${p.textContent} • Difficulty: ${difficultyRule().name}`;}return result};
const difficultyPauseBase=togglePause;
togglePause=function(){const result=difficultyPauseBase();if(state?.status==='playing'&&state.manualPaused)ui.pausedLabel.textContent=`GAME PAUSED • ${difficultyRule().name.toUpperCase()}`;return result};
const difficultyFinishWithRunCleanup=finish;
finish=function(kind){const result=difficultyFinishWithRunCleanup(kind);if((kind==='won'||kind==='lost')&&state.status===kind){clearDifficultyRun();hideDifficultyChoice()}return result};
function resetDifficultyForExplicitNewRun(){setTimeout(()=>{if(!state||state.status!=='playing'||state.wave!==0||state.finale?.phase&&state.finale.phase!=='idle')return;clearDifficultyRun();state.difficulty=null;state.difficultyLocked=false;hideDifficultyChoice();updateUI()},0)}
ui.restart?.addEventListener('click',resetDifficultyForExplicitNewRun);
ui.bannerRestart?.addEventListener('click',resetDifficultyForExplicitNewRun);
const difficultyUpdateBase=updateUI;
updateUI=function(){const result=difficultyUpdateBase();renderDifficultyHud();if(state?.wave===0&&!state.difficultyLocked){ui.startWave.disabled=true;if(difficultyChoiceRequired()){ui.waveStatus.textContent='Choose a difficulty to begin Wave 1.';openDifficultyChoice()}else if(canStartWave())ui.waveStatus.textContent='Complete the first-run setup to choose a difficulty.'}return result};

function initializeDifficultyForCurrentRun(){if(state.finale?.phase&&state.finale.phase!=='idle'){state.difficulty='normal';state.difficultyLocked=true;hideDifficultyChoice();state.balls.forEach(applyDifficultyToOrb);updateBossHealthHud()}else if(globalThis.__ELEPHANT_TEST_MODE__){state.difficulty='normal';state.difficultyLocked=true;hideDifficultyChoice()}else{const saved=currentDifficultyRun();if(saved?.difficultyLocked&&DIFFICULTY_RULES[saved.difficulty]){state.difficulty=saved.difficulty;state.difficultyLocked=true;hideDifficultyChoice()}else{state.difficulty=null;state.difficultyLocked=false;hideDifficultyChoice();writeDifficultyRun({pending:true,difficulty:null,difficultyLocked:false})}updateUI()}}
initializeDifficultyForCurrentRun();
