const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class FakeElement {
  constructor(){const classes=new Set();this.value='1';this.textContent='';this.disabled=false;this.checked=false;this.width=1120;this.height=680;this.style={};this.lastChild={textContent:''};this.classList={add(...names){names.forEach(name=>classes.add(name))},remove(...names){names.forEach(name=>classes.delete(name))},toggle(name,force){if(force===true){classes.add(name);return true}if(force===false){classes.delete(name);return false}if(classes.has(name)){classes.delete(name);return false}classes.add(name);return true},contains(name){return classes.has(name)}}}
  addEventListener(){}
  appendChild(){}
  focus(){}
  select(){}
  replaceChildren(){}
  querySelector(){return new FakeElement()}
  getContext(){const gradient={addColorStop(){}};return new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='createRadialGradient'||key==='createLinearGradient')return ()=>gradient;return ()=>{}},set(target,key,value){target[key]=value;return true}})}
  getBoundingClientRect(){return {left:0,top:0,width:1120,height:680}}
}

const elements = new Map();
const storedValues = new Map();
const context = vm.createContext({
  console,
  Math,
  Object,
  Number,
  Array,
  performance:{now:()=>0},
  requestAnimationFrame(){},
  setTimeout(callback){callback();return 1},
  OrbProgression:require('./orb-progression.js'),
  localStorage:{getItem(key){return storedValues.has(key)?storedValues.get(key):null},setItem(key,value){storedValues.set(key,value)}},
  document:{
    querySelector(selector){if(!elements.has(selector))elements.set(selector,new FakeElement());return elements.get(selector)},
    createElement(){return new FakeElement()}
  },
  window:{addEventListener(){}}
});
vm.runInContext(fs.readFileSync('./game.js','utf8'),context);

const html = fs.readFileSync('./index.html','utf8');
const css = fs.readFileSync('./styles.css','utf8');
assert.match(html,/id="openEncyclopedia"/);
assert.match(html,/id="encyclopediaModal"/);
assert.match(html,/id="buyFoodie"/);
assert.match(html,/id="buyFrost" class="tower-card frost-card"/);
assert.match(html,/id="buyRobot" class="tower-card robot-card"/);
assert.match(html,/Robot Elephants: 0\/3/);
assert.match(html,/id="robotPrice">150/);
assert.match(html,/class="mini-elephant robot-shop-elephant">🐘/);
assert.doesNotMatch(html,/class="robot-shop-model"/);
assert.match(html,/class="robot-shop-seam seam-one"/);
assert.match(html,/class="tower-preview frost-preview"/);
assert.match(html,/class="mini-elephant frost-elephant">🐘/);
assert.match(html,/Icy spray • Slows orbs • No damage/);
assert.match(html,/id="frostPrice">175/);
assert.doesNotMatch(html,/id="buyFrost"[^>]*hidden/);
assert.match(html,/id="tutorialOverlay"/);
assert.match(html,/id="tutorialPlacementMarker"/);
assert.match(html,/id="scrollDiscoveryHint"[^>]*>\s*<span>More track below<\/span>/);
assert.match(html,/id="waveCenter"/);
assert.match(html,/id="currency">100</);
assert.match(html,/id="price">100</);
assert.match(html,/id="sellRefund">50</);
assert.match(html,/id="buyGoldenPapaya"/);
assert.match(html,/Wave income • Increases wave bonuses/);
assert.match(html,/id="waveRewardNotice"/);
assert.match(html,/id="openAchievements"/);
assert.match(html,/id="achievementsModal"/);
assert.match(html,/id="splashSpecializationModal"/);
assert.match(html,/data-splash-specialization="standard"/);
assert.match(html,/data-splash-specialization="gas"/);
assert.match(html,/data-splash-specialization="foodie"/);
assert.match(html,/data-splash-specialization="ghost"/);
assert.match(css,/\.achievements-modal\{position:fixed/);
assert.match(css,/\.splash-specialization-modal\{position:fixed/);
assert.match(css,/\.splash-specialization-grid\{display:grid;grid-template-columns:1fr 1fr/);
assert.match(css,/@keyframes achievementArrival/);
assert.match(fs.readFileSync('./game.js','utf8'),/Buy a Water Elephant for 100 currency\./);
assert.match(fs.readFileSync('./game.js','utf8'),/risky economy strategy because it cannot attack/);
assert.match(css,/\.encyclopedia-modal\{position:fixed/);
assert.match(css,/\.encyclopedia-grid\{overflow:auto/);
assert.match(css,/@media\(max-width:760px\).*\.encyclopedia-detail\{display:block!important/s);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/canvas\{[^}]*touch-action:none/);
assert.match(css,/\.game-shell\{[^}]*height:100%[^}]*display:flex[^}]*overflow:hidden/);
assert.match(css,/\.play-area\{[^}]*flex:1 1 auto[^}]*min-height:0[^}]*overflow:hidden/);
assert.match(css,/aside\{[^}]*height:100%[^}]*overflow-y:auto/);
assert.match(css,/canvas\{[^}]*position:absolute[^}]*width:100%[^}]*height:100%/);
assert.match(css,/\.tutorial-spotlight\.placement-range\{[^}]*border-radius:50%/);
assert.match(css,/\.scroll-discovery-hint\{position:absolute/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.scroll-discovery-hint i\{animation:none!important/);
assert.doesNotMatch(fs.readFileSync('./game.js','utf8'),/fillRect\(0,(?:675|680|1015|1020),CONFIG\.WORLD_WIDTH/);
assert.match(fs.readFileSync('./game.js','utf8'),/\['elephant','eyewear','foodie','gas','splash','frost','robot'\]\.includes\(state\.placement\)/);
assert.match(fs.readFileSync('./game.js','utf8'),/state\.placement==='robot'\?'robot'/);
assert.match(fs.readFileSync('./game.js','utf8'),/if\(t\?\.towerType==='robot'\)return drawRobotElephant\(t,g,v,s\)/);
assert.doesNotMatch(html,/\u221e/);
assert.match(html,/class="mini-glasses"><b><\/b><b><\/b><\/span>/);
assert.match(html,/class="mini-food"><b><\/b><\/span>/);
assert.match(css,/\.mini-glasses b\{[^}]*border:3px solid #71efff/);
assert.match(css,/\.mini-glasses\{[^}]*left:48px;top:51px/);
assert.match(css,/\.mini-food\{[^}]*border-radius:52% 48% 55% 45%/);
assert.match(css,/\.mini-food\{[^}]*right:7px;top:64px/);
assert.match(css,/\.frost-card\{height:105px;overflow:hidden/);
assert.match(css,/\.frost-preview\{background:radial-gradient/);
assert.match(css,/\.tower-preview\{background:radial-gradient\(circle,#34505a,#142329\)/);
assert.match(css,/\.robot-shop-elephant/);
assert.match(css,/\.robot-shop-seam/);
assert.match(css,/\.mini-snow\{position:absolute/);
assert.match(css,/\.mini-frost-spray\{position:absolute/);
assert.match(css,/@media\(max-width:900px\)\{\.frost-card\{height:105px;grid-template-columns:92px minmax\(0,1fr\)/);
assert.match(css,/@media\(max-width:420px\)\{\.frost-card \.tower-copy/);
assert.match(html,/WATERMELON FARM/);
assert.match(css,/\.watermelon-farm-preview\{/);
assert.match(css,/\.wave-reward-notice\{position:fixed/);

const run = expression => vm.runInContext(expression,context);
const approximately = (actual,expected) => assert.ok(Math.abs(actual-expected)<1e-9,`Expected ${expected}, got ${actual}`);
run('tutorialData.completed=true;state.tutorialActive=false');

// Achievement rewards heal below maximum health, pay currency at full health,
// cap healing at 100, persist, and cannot be claimed twice.
run('achievementData={unlocked:{}};state.currentHealth=98;state.maximumHealth=100;state.currency=0');
assert.equal(run('unlockAchievement("first-water")'),'+1 Health Point');
assert.equal(run('state.currentHealth'),99);
assert.equal(run('state.currency'),0);
assert.equal(run('unlockAchievement("first-water")'),null);
run('state.currentHealth=100;state.currency=0');
assert.equal(run('unlockAchievement("perfect-wave")'),'+20 currency');
assert.equal(run('state.currentHealth'),100);
assert.equal(run('state.currency'),20);
assert.equal(run('JSON.parse(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)).unlocked["perfect-wave"].reward'),'+20 currency');
run('achievementData={unlocked:Object.fromEntries(ACHIEVEMENTS.map(item=>[item.id,{unlockedAt:1,reward:"test"}]))};saveAchievementData();reset()');

// Final economy configuration and starting affordability.
assert.equal(run('CONFIG.startingCurrency'),100);
assert.equal(run('CONFIG.waterElephantCost'),100);
assert.equal(run('CONFIG.papayaPlantCost'),100);
assert.equal(run('CONFIG.eyewearElephantCost'),125);
assert.equal(run('CONFIG.foodieElephantCost'),150);
assert.equal(run('CONFIG.frostElephantCost'),175);
assert.equal(run('CONFIG.towerSellRate'),.5);
run('reset();updateUI()');
assert.equal(run('state.currency'),100);
assert.equal(run('ui.buy.disabled'),false);
run('state.currency=CONFIG.frostElephantCost;state.pendingFrostPlacement=true;state.placement="frost";updateUI()');
assert.equal(run('frostButton.classList.contains("selected")'),true);
assert.equal(run('extendedUI.buyGasMask.classList.contains("selected")'),false);
assert.equal(run('placementRange()'),run('CONFIG.FROST_ELEPHANT_RADIUS'));
run('const frostTower=createElephant("frost",420,360)');
assert.equal(run('frostTower.towerType'),'frost');
assert.equal(run('frostTower.name'),'FROST ELEPHANT');
assert.equal(run('frostTower.purchasePrice'),run('CONFIG.frostElephantCost'));
run('cancelPlacement()');
assert.equal(run('state.pendingFrostPlacement'),false);
run('reset()');

// Engineer debug spawns bypass wave mutation, use the complete Engineer setup,
// and validate their shared debug spawn-limit count argument.
run('reset();tutorialData.completed=true;state.tutorialActive=false;debugWrite=(message,kind)=>{state.debugMessage=message;state.debugKind=kind};executeDebugCommand("/spawn engineer")');
assert.equal(run('state.balls.length'),1);
assert.equal(run('state.balls[0].specialType'),'engineer');
assert.equal(run('state.balls[0].lureDuration'),60);
assert.equal(run('(state.engineerHoles||[]).length'),1);
assert.equal(run('state.debugMessage'),'Spawned 1 Engineer Orb(s).');
run('reset();tutorialData.completed=true;state.tutorialActive=false;const engineerDebugWater=createElephant("elephant",160,160);state.towers.push(engineerDebugWater);executeDebugCommand("/spawn engineer 20")');
assert.equal(run('state.balls.filter(orb=>orb.specialType==="engineer").length'),20);
assert.equal(run('(state.engineerHoles||[]).length'),20);
assert.equal(run('engineerDebugWater.behavior'),'fleeingFumeOrb');
assert.equal(run('state.debugMessage'),'Spawned 20 Engineer Orb(s).');
run('executeDebugCommand("/spawn engineer 0")');
assert.equal(run('state.debugMessage'),'Orb count must be between 1 and 20.');
run('executeDebugCommand("/spawn engineer 21")');
assert.equal(run('state.debugMessage'),'Orb count must be between 1 and 20.');
run('executeDebugCommand("/spawn engineer nope")');
assert.equal(run('state.debugMessage'),'Usage: /spawn engineer [count]');
run('reset();tutorialData.completed=true;state.tutorialActive=false;executeDebugCommand("/spawn engineer");const lateEngineerTower=createElephant("elephant",150,180);state.towers.push(lateEngineerTower);scanActiveFumeOrbs(true)');
assert.equal(run('lateEngineerTower.behavior'),'fleeingFumeOrb');
run('reset()');

// Owner wave-setting is a non-starting operation with strict, useful feedback.
run('reset();debugWrite=(message,kind)=>{state.debugMessage=message;state.debugKind=kind};executeDebugCommand("/set wave 1")');
assert.equal(run('state.wave'),0);
assert.equal(run('ui.startLevelSelect.value'),'1');
assert.equal(run('state.debugMessage'),'Wave set to 1.');
run('executeDebugCommand("/set wave 25")');
assert.equal(run('state.wave'),24);
assert.equal(run('ui.startLevelSelect.value'),'25');
run('executeDebugCommand("/set wave 50")');
assert.equal(run('state.wave'),49);
assert.equal(run('ui.startLevelSelect.value'),'50');
assert.equal(run('state.waveJobs.length'),0);
assert.equal(run('state.balls.length'),0);
run('executeDebugCommand("/set wave 0")');
assert.equal(run('state.debugMessage'),'Wave must be between 1 and 50.');
run('executeDebugCommand("/set wave 51")');
assert.equal(run('state.debugMessage'),'Wave must be between 1 and 50.');
run('executeDebugCommand("/set wave 1.5")');
assert.equal(run('state.debugMessage'),'Usage: /set wave <number>');
run('executeDebugCommand("/set wave")');
assert.equal(run('state.debugMessage'),'Usage: /set wave <number>');
assert.equal(run('canStartWave()'),true);
run('launchWave()');
assert.equal(run('state.waveJobs.length+Number(!!state.pendingWaveStart)'),1);
run('reset()');

// The Wave 1 Water Elephant purchase reserves one paid tower, then grants one
// normal-but-non-sellable starter elephant after the first placement.
run('tutorialData.completed=true;state.tutorialActive=false;reset();buy()');
assert.equal(run('state.currency'),0);
assert.equal(run('state.placement'),'elephant');
assert.equal(run('state.starterGift.firstPaidPurchased'),true);
assert.equal(run('state.starterGift.paidPlacementPending'),true);
assert.equal(run('canStartWave()'),false);
run('cancelPlacement();buy()');
assert.equal(run('state.placement'),'elephant');
run('state.towers.push(createElephant("elephant",350,370));grantStarterGiftAfterPaidPlacement()');
assert.equal(run('state.starterGift.granted'),true);
assert.equal(run('state.starterGift.giftPlacementPending'),true);
assert.equal(run('state.placement'),'starterGiftElephant');
assert.equal(run('grantStarterGiftAfterPaidPlacement()'),false);
assert.equal(run('canStartWave()'),false);
run('const starterGiftTower=placeStarterGiftElephant({x:570,y:620})');
assert.equal(run('starterGiftTower!==null'),true);
assert.equal(run('starterGiftTower.level'),1);
assert.equal(run('starterGiftTower.purchasePrice'),0);
assert.equal(run('starterGiftTower.starterGift'),true);
assert.equal(run('starterGiftTower.nonSellable'),false);
assert.equal(run('starterGiftTower.damage'),run('CONFIG.ELEPHANT_DAMAGE'));
assert.equal(run('state.starterGift.giftPlaced'),true);
assert.equal(run('canStartWave()'),true);
assert.equal(run('ui.sell.disabled'),false);
assert.equal(run('ui.sellRefund.textContent'),'50');
run('const starterCurrencyBeforeSell=state.currency,starterTowerCountBeforeSell=state.towers.length;sellSelected()');
assert.equal(run('state.currency'),run('starterCurrencyBeforeSell+50'));
assert.equal(run('state.towers.length'),run('starterTowerCountBeforeSell-1'));
assert.equal(run('state.starterGift.granted'),true);
assert.equal(run('grantStarterGiftAfterPaidPlacement()'),false);
run('const starterGiftSave=waveRewardSaveData();reset();restoreWaveRewardSaveData(starterGiftSave)');
assert.equal(run('state.starterGift.granted'),true);
assert.equal(run('state.starterGift.giftPlaced'),true);
run('reset();state.currency=9999;const upgradedStarter=createElephant("elephant",100,220,{starterGift:true});upgradedStarter.level=5;applyLevelStats(upgradedStarter);state.towers=[upgradedStarter];selectTower(upgradedStarter)');
assert.equal(run('sellRefundFor(upgradedStarter)'),50);
assert.equal(run('ui.sellRefund.textContent'),'50');
run('const upgradedStarterCurrency=state.currency;sellSelected();sellSelected()');
assert.equal(run('state.currency'),run('upgradedStarterCurrency+50'));
assert.equal(run('state.towers.length'),0);
run('reset();ui.startLevelSelect.value="5";buy()');
assert.equal(run('state.starterGift.firstPaidPurchased'),false);
assert.equal(run('state.placement'),'elephant');
assert.equal(run('ui.buyPapaya.disabled'),false);
assert.equal(run('ui.buyEyewear.disabled'),true);
assert.equal(run('extendedUI.buyFoodie.disabled'),true);
assert.equal(run('startingCurrencyForWave(1)'),100);
assert.equal(run('startingCurrencyForWave(25)'),100);
assert.equal(run('startingCurrencyForWave(50)'),100);
assert.equal(run('roundHalfUp(50.4)'),50);
assert.equal(run('roundHalfUp(50.5)'),51);
assert.equal(run('roundHalfUp(50.6)'),51);
assert.equal(run('sellRefundFor({purchasePrice:100})'),50);
assert.equal(run('sellRefundFor({purchasePrice:125})'),63);
assert.equal(run('sellRefundFor({purchasePrice:150})'),75);
assert.equal(run('sellRefundFor({purchasePrice:175})'),88);
assert.equal(run('sellRefundFor({purchasePrice:100.8})'),50);
assert.equal(run('sellRefundFor({purchasePrice:101})'),51);
assert.equal(run('sellRefundFor({purchasePrice:101.2})'),51);

// Wave completion rewards reserve once, animate, and settle independently of orb income.
assert.equal(run('CONFIG.baseWaveCompletionReward'),10);
assert.equal(run('CONFIG.goldenPapayaPlantCost'),125);
assert.equal(run('CONFIG.maximumGoldenPapayaPlants'),1);
assert.equal(run('CONFIG.goldenPapayaWaveRewardMultiplier'),1.5);
assert.equal(run('CONFIG.goldenPapayaPlantDamage'),0);
assert.equal(run('CONFIG.TOTAL_UNIT_LIMIT'),26);
run('reset();state.currency=0;const basicRewardJob={wave:1,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};const basicRewardOrb={wave:1};state.waveJobs=[basicRewardJob];resolveBall(basicRewardOrb,true);resolveBall(basicRewardOrb,true)');
assert.equal(run('basicRewardJob.resolved'),1);
assert.equal(run('basicRewardJob.completionRewardAmount'),10);
assert.equal(run('state.pendingWaveRewards.length'),1);
assert.equal(run('state.currency'),0);
run('updateWaveRewards(CONFIG.WAVE_REWARD_COLLECTION_DURATION+.01)');
assert.equal(run('state.currency'),10);
assert.equal(run('state.stats.waveIncome'),10);
assert.equal(run('state.pendingWaveRewards.length'),0);

run('reset();state.currency=0;const goldenRewardPlant={kind:"goldenPapaya",name:"WATERMELON FARM",purchasePrice:125,sold:false,level:1,damage:0,x:200,y:200,bob:0,rewardGlow:0};state.goldenPapayas=[goldenRewardPlant];const goldenRewardJob={wave:2,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};state.waveJobs=[goldenRewardJob];resolveBall({wave:2},true)');
assert.equal(run('goldenRewardJob.completionRewardAmount'),15);
assert.equal(run('state.pendingWaveRewards[0].amount'),15);
assert.ok(run('goldenRewardPlant.rewardGlow')>0);
assert.equal(run('papayaMultiplier()'),1);

// Selling before completion removes the multiplier; selling after reservation cannot change it.
run('reset();state.currency=0;const soldBeforePlant={kind:"goldenPapaya",name:"WATERMELON FARM",purchasePrice:125,sold:false,level:1,damage:0,x:100,y:100,bob:0};state.goldenPapayas=[soldBeforePlant];selectTower(soldBeforePlant)');
assert.equal(run('ui.sellRefund.textContent'),'63');
run('sellSelected();const soldBeforeJob={wave:3,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};state.waveJobs=[soldBeforeJob];resolveBall({wave:3},true)');
assert.equal(run('soldBeforeJob.completionRewardAmount'),10);
assert.equal(run('state.currency'),63);
run('settlePendingWaveRewards()');
assert.equal(run('state.currency'),73);

run('reset();state.currency=0;const soldAfterPlant={kind:"goldenPapaya",name:"WATERMELON FARM",purchasePrice:125,sold:false,level:1,damage:0,x:100,y:100,bob:0};state.goldenPapayas=[soldAfterPlant];const soldAfterJob={wave:4,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};state.waveJobs=[soldAfterJob];resolveBall({wave:4},true);selectTower(soldAfterPlant);sellSelected()');
assert.equal(run('state.pendingWaveRewards[0].amount'),15);
run('settlePendingWaveRewards()');
assert.equal(run('state.currency'),78);

// Partial, defeated, and post-completion purchase cases do not create an incorrect reward.
run('reset();state.currency=0;const partialRewardJob={wave:5,total:2,spawned:1,resolved:1,destroyed:1,rewarded:false};state.waveJobs=[partialRewardJob];reserveWaveCompletionReward(partialRewardJob)');
assert.equal(run('state.pendingWaveRewards.length'),0);
run('partialRewardJob.spawned=2;state.currentHealth=0;reserveWaveCompletionReward(partialRewardJob)');
assert.equal(run('state.pendingWaveRewards.length'),0);
run('state.currentHealth=100;partialRewardJob.resolved=2;reserveWaveCompletionReward(partialRewardJob);state.goldenPapayas=[{kind:"goldenPapaya",purchasePrice:125,sold:false,level:1,x:0,y:0}]');
assert.equal(run('state.pendingWaveRewards[0].amount'),10);
assert.equal(run('OrbProgression.rewardWithIncomeMultiplier(3,papayaMultiplier())'),3);

run('reset();state.currency=0;state.currentHealth=1;state.wave=1;const defeatRewardJob={wave:1,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};state.waveJobs=[defeatRewardJob];state.balls=[{special:false,isBoss:false,ghost:false,state:"active",targetable:true,x:path[path.length-1].x,y:path[path.length-1].y,seg:path.length-1,hp:1,maxHp:1,tier:0,reward:1,roll:0,hit:0,wave:1}];update(0)');
assert.equal(run('state.status'),'lost');
assert.equal(run('defeatRewardJob.completionRewardIssued||false'),false);
assert.equal(run('state.stats.waveIncome'),0);

// The one-unit reservation limit, cancellation, selection panel, and refund are enforced.
run('reset();state.currency=500;buyGoldenPapaya();buyGoldenPapaya()');
assert.equal(run('state.placement'),'goldenPapaya');
assert.equal(run('reservedGoldenPapayaCount()'),1);
run('cancelPlacement()');
assert.equal(run('reservedGoldenPapayaCount()'),0);
run('const selectedGolden={kind:"goldenPapaya",name:"WATERMELON FARM",purchasePrice:125,sold:false,level:1,damage:0,x:80,y:80,bob:0};state.goldenPapayas=[selectedGolden];selectTower(selectedGolden);updateUI()');
assert.equal(run('ui.towerName.textContent'),'WATERMELON FARM');
assert.equal(run('ui.towerDamage.textContent'),'1.5×');
assert.equal(run('ui.towerAttackSpeed.textContent'),'15');
assert.equal(run('ui.sellRefund.textContent'),'63');
assert.equal(run('extendedUI.buyGoldenPapaya.disabled'),true);
assert.equal(run('extendedUI.buyGoldenPapaya.classList.contains("maximum")'),true);

// Reward claim and pending animation data survive a save round-trip without duplication.
run('reset();state.currency=0;const saveRewardJob={wave:25,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};state.waveJobs=[saveRewardJob];state.goldenPapayas=[{kind:"goldenPapaya",name:"WATERMELON FARM",purchasePrice:125,sold:false,level:1,x:90,y:90}];resolveBall({wave:25},true);const savedWaveRewardData=JSON.stringify(waveRewardSaveData());state.waveJobs=[{wave:25,total:1,spawned:1,resolved:1,destroyed:1,rewarded:false}];state.goldenPapayas=[];state.pendingWaveRewards=[];restoreWaveRewardSaveData(JSON.parse(savedWaveRewardData))');
assert.equal(run('state.goldenPapayas.length'),1);
assert.equal(run('state.waveJobs[0].completionRewardIssued'),true);
assert.equal(run('state.pendingWaveRewards.length'),1);
assert.equal(run('reserveWaveCompletionReward(state.waveJobs[0])'),false);
run('settlePendingWaveRewards();settlePendingWaveRewards()');
assert.equal(run('state.currency'),15);

// Wave 50 settles its locked reward before entering the finale cutscene.
run('reset();state.currency=0;state.wave=50;state.goldenPapayas=[{kind:"goldenPapaya",purchasePrice:125,sold:false,level:1,x:100,y:100}];const finalRewardJob={wave:50,total:1,spawned:1,resolved:0,destroyed:0,rewarded:false};state.waveJobs=[finalRewardJob];resolveBall({wave:50},true);update(0)');
assert.equal(run('state.status'),'playing');
assert.equal(run('state.finale.phase'),'cutscene');
assert.equal(run('state.paused'),true);
assert.equal(run('state.currency'),15);
assert.equal(run('state.pendingWaveRewards.length'),0);
run('clearFinaleSave();reset()');
assert.equal(run('state.pendingWaveRewards.length'),0);
assert.equal(run('state.waveJobs.length'),0);

// Cancelling releases a reserved plant without charging currency.
run('state.currency=500;buyPapaya()');
assert.equal(run('state.placement'),'papaya');
assert.equal(run('reservedPapayaCount()'),1);
assert.equal(run('state.currency'),500);
run('cancelPlacement()');
assert.equal(run('reservedPapayaCount()'),0);
assert.equal(run('state.currency'),500);

// Five placed plants plus a reserved plant both enforce the maximum.
run('state.papayas=Array.from({length:5},(_,i)=>({kind:"papaya",name:"PAPAYA PLANT",level:1,incomeEffect:1.2,purchasePrice:100,x:i*70,y:50}));state.placement=null;buyPapaya()');
assert.equal(run('state.placement'),null);
run('state.papayas=Array.from({length:4},(_,i)=>({kind:"papaya",name:"PAPAYA PLANT",level:1,incomeEffect:1.2,purchasePrice:100,x:i*70,y:50}));state.placement="papaya";buyPapaya()');
assert.equal(run('reservedPapayaCount()'),5);

// Additive papaya multipliers for mixed and maximum levels.
approximately(run('papayaMultiplier()'),1.8);
run('state.papayas=[{incomeEffect:1.2},{incomeEffect:1.5}]');
approximately(run('papayaMultiplier()'),1.7);
run('state.papayas=Array.from({length:5},()=>({incomeEffect:1.2}))');
approximately(run('papayaMultiplier()'),2);
run('state.papayas=Array.from({length:5},()=>({incomeEffect:1.8}))');
approximately(run('papayaMultiplier()'),5);

// Elephant upgrades stop at Level 5, and sale ignores all upgrade spending.
assert.deepEqual(Array.from(run('[1,2,3,4].map(level=>upgradeCost({kind:"elephant",level}))')),[50,75,113,169]);
assert.equal(run('CONFIG.TIER0_ORB_HEALTH'),44);
assert.equal(run('CONFIG.TIER0_ORB_SPEED'),62);
assert.deepEqual(Array.from(run('CONFIG.EARLY_WAVE_ORB_COUNTS')),[9,11,12,13]);
assert.equal(run('spawnIntervalForWave(1)'),1.45);
assert.equal(run('spawnIntervalForWave(5)'),run('CONFIG.BALL_SPAWN_RATE'));
assert.equal(run('ballsForWave(1)'),9);
assert.equal(run('ballsForWave(4)'),13);
assert.equal(run('ballsForWave(5)'),14);
assert.equal(run('OrbProgression.hpFor(5,1,CONFIG.BALL_HEALTH)'),Math.round(50*1.25));
assert.equal(run('orbMovementSpeed({special:false,tier:0,hp:44,maxHp:44,ghost:false})'),62);
assert.equal(run('orbMovementSpeed({special:false,tier:1,hp:50,maxHp:50,ghost:false})'),70);
run('reset();const tierZeroWater={kind:"elephant",towerType:"base",damage:27,sold:false};const tierZeroTarget={tier:0,special:false,ghost:false};const bronzeTarget={tier:1,special:false,ghost:false};const tierZeroGhostTarget={tier:0,special:false,ghost:true};state.towers=[tierZeroWater]');
approximately(run('damageAgainst(tierZeroWater,tierZeroTarget)'),29.7);
assert.equal(run('damageAgainst(tierZeroWater,bronzeTarget)'),27);
assert.equal(run('damageAgainst(tierZeroWater,tierZeroGhostTarget)'),27);
run('reset();state.currency=0;const base={kind:"elephant",name:"WATER ELEPHANT",purchasePrice:100,sold:false,level:1,x:100,y:100,targetMode:"first"};applyLevelStats(base);state.towers=[base];selectTower(base)');
assert.equal(run('ui.sellRefund.textContent'),'50');
run('sellSelected();sellSelected()');
assert.equal(run('state.currency'),50);
assert.equal(run('state.towers.length'),0);
run('reset();state.currency=1000;const t={kind:"elephant",name:"WATER ELEPHANT",purchasePrice:100,sold:false,level:1,x:100,y:100,cooldown:0,angle:0,facing:1,attack:0,recoil:0,targetMode:"first"};applyLevelStats(t);state.towers=[t];selectTower(t)');
assert.equal(run('ui.upgradeCost.textContent'),'● 50');
run('upgradeSelected()');
assert.equal(run('ui.upgradeCost.textContent'),'● 75');
run('upgradeSelected()');
assert.equal(run('ui.upgradeCost.textContent'),'● 113');
run('upgradeSelected()');
assert.equal(run('ui.upgradeCost.textContent'),'● 169');
run('upgradeSelected()');
assert.equal(run('state.selectedTower.level'),5);
assert.equal(run('state.currency'),593);
assert.equal(run('ui.upgradeCost.textContent'),'MAX LEVEL');
run('upgradeSelected()');
assert.equal(run('state.selectedTower.level'),5);
assert.equal(run('state.currency'),593);
run('sellSelected();sellSelected()');
assert.equal(run('state.currency'),643);
assert.equal(run('state.towers.length'),0);

// Insufficient funds and switching selections preserve each tower's current price.
run('reset();state.currency=49;const a={kind:"elephant",name:"A",purchasePrice:100,sold:false,level:1,x:100,y:100,targetMode:"first"};const b={kind:"elephant",name:"B",purchasePrice:100,sold:false,level:3,x:200,y:100,targetMode:"first"};applyLevelStats(a);applyLevelStats(b);state.towers=[a,b];selectTower(a);upgradeSelected()');
assert.equal(run('a.level'),1);
assert.equal(run('state.currency'),49);
assert.equal(run('ui.upgradeCost.textContent'),'● 50');
run('selectTower(b)');
assert.equal(run('ui.upgradeCost.textContent'),'● 113');
run('selectTower(a)');
assert.equal(run('ui.upgradeCost.textContent'),'● 50');

// Papaya upgrades stop at Level 3 and sale refunds only half of its base price.
assert.deepEqual(Array.from(run('[1,2].map(level=>upgradeCost({kind:"papaya",level}))')),[120,180]);
run('reset();state.currency=0;const basePlant={kind:"papaya",name:"PAPAYA PLANT",purchasePrice:100,sold:false,level:1,incomeEffect:1.2,x:100,y:100,bob:0};state.papayas=[basePlant];selectTower(basePlant);sellSelected();sellSelected()');
assert.equal(run('state.currency'),50);
assert.equal(run('state.papayas.length'),0);
run('reset();state.currency=10.5;const fractionalPlant={kind:"papaya",name:"PAPAYA PLANT",purchasePrice:100,sold:false,level:1,incomeEffect:1.2,x:100,y:100,bob:0};state.papayas=[fractionalPlant];selectTower(fractionalPlant)');
assert.equal(run('ui.sellRefund.textContent'),'50');
run('sellSelected();sellSelected()');
assert.equal(run('state.currency'),60.5);
run('reset();state.currency=1000;const p={kind:"papaya",name:"PAPAYA PLANT",purchasePrice:100,sold:false,level:1,incomeEffect:1.2,x:100,y:100,bob:0};state.papayas=[p];selectTower(p)');
assert.equal(run('ui.upgradeCost.textContent'),'● 120');
run('upgradeSelected()');
assert.equal(run('ui.upgradeCost.textContent'),'● 180');
run('upgradeSelected();upgradeSelected()');
assert.equal(run('state.selectedTower.level'),3);
assert.equal(run('state.selectedTower.incomeEffect'),1.8);
assert.equal(run('state.currency'),700);
assert.equal(run('ui.upgradeCost.textContent'),'MAX LEVEL');
run('sellSelected();sellSelected()');
assert.equal(run('state.currency'),750);
assert.equal(run('state.papayas.length'),0);
run('reset();state.currency=119;const poorPlant={kind:"papaya",name:"PAPAYA PLANT",purchasePrice:100,sold:false,level:1,incomeEffect:1.2,x:100,y:100,bob:0};state.papayas=[poorPlant];selectTower(poorPlant);upgradeSelected()');
assert.equal(run('poorPlant.level'),1);
assert.equal(run('state.currency'),119);
assert.equal(run('ui.upgradeCost.textContent'),'● 120');

// Selling one of five plants immediately frees a purchasable slot.
run('reset();state.currency=1000;state.papayas=Array.from({length:5},(_,i)=>({kind:"papaya",name:"PAPAYA PLANT",purchasePrice:100,sold:false,level:1,incomeEffect:1.2,x:i*70,y:50,bob:0}));selectTower(state.papayas[0]);sellSelected();buyPapaya()');
assert.equal(run('state.papayas.length'),4);
assert.equal(run('state.placement'),'papaya');
assert.equal(run('reservedPapayaCount()'),5);

// Starting directly at Wave 25 uses Wave 25 size, tiers, and HP clocks.
run('reset();ui.startLevelSelect.value="25";launchWave();if(state.pendingWaveStart){const pending=state.pendingWaveStart;state.pendingWaveStart=null;state.paused=false;beginWave(pending.wave,pending.spawnSequence)}');
assert.equal(run('state.wave'),25);
assert.equal(run('state.currency'),100);
run('reset();state.currency=47.5;ui.startLevelSelect.value="25";launchWave();if(state.pendingWaveStart){const pending=state.pendingWaveStart;state.pendingWaveStart=null;state.paused=false;beginWave(pending.wave,pending.spawnSequence)}');
assert.equal(run('state.currency'),47.5);
assert.equal(run('latestWaveJob().normalTotal'),34);
assert.deepEqual(Array.from(run('latestWaveJob().spawnSequence.filter(item=>!item.special).slice(0,6).map(item=>item.tier)')),[0,0,0,0,0,1]);
assert.equal(run('OrbProgression.hpFor(25,5,CONFIG.BALL_HEALTH)'),Math.round(50*1.25**5));

// Only Wave 50 completion begins the finale, and restart clears plants/multiplier after either ending.
run('reset();state.wave=30;state.waveJobs=[{wave:30,total:39,spawned:39,resolved:39,destroyed:39,spawnTimer:1,rewarded:true,tierSequence:[]}];update(0)');
assert.equal(run('state.status'),'playing');
run('state.wave=50;state.waveJobs=[{wave:50,total:45,spawned:45,resolved:45,destroyed:45,spawnTimer:1,rewarded:true,tierSequence:[]}];update(0)');
assert.equal(run('state.finale.phase'),'cutscene');
run('clearFinaleSave();state.papayas=[{x:1,y:1,incomeEffect:1.8}];reset()');
assert.equal(run('state.papayas.length'),0);
assert.equal(run('papayaMultiplier()'),1);
run('finish("lost");reset()');
assert.equal(run('state.status'),'playing');
assert.equal(run('state.towers.length'),0);
assert.equal(run('upgradeCost({kind:"elephant",level:1})'),50);

// Food-orb windows begin at Wave 20, remain deterministic and capped, and include final Wave 50.
assert.equal(run('Array.from({length:19},(_,i)=>specialCountForWave(i+1)).every(count=>count===0)'),true);
assert.equal(run('Array.from({length:16},(_,i)=>ensureSpecialWindow(20+i*2)).every(window=>window.total<=5&&window.counts.reduce((a,b)=>a+b,0)===window.total)'),true);
assert.equal(run('generateSpecialWindow(50).counts.length'),1);
const savedWindows=run('JSON.stringify(state.specialWindows)');
run('reset();Array.from({length:16},(_,i)=>ensureSpecialWindow(20+i*2))');
assert.equal(run('JSON.stringify(state.specialWindows)'),savedWindows);
assert.ok(run('(()=>{for(let seed=0;seed<10000;seed++)if(generateSpecialWindow(20,seed).total===0&&generateSpecialWindow(22,seed).total===0)return seed;return -1})()')>=0,'Expected a seed with consecutive empty windows');
assert.ok(run('(()=>{for(let seed=0;seed<10000;seed++){const w=generateSpecialWindow(20,seed);if(w.total===5&&w.counts.includes(5))return seed}return -1})()')>=0,'Expected a valid five-in-one-round assignment');
run('reset();ui.startLevelSelect.value="20";launchWave();if(state.pendingWaveStart){const pending=state.pendingWaveStart;state.pendingWaveStart=null;state.paused=false;beginWave(pending.wave,pending.spawnSequence)}');
assert.equal(run('latestWaveJob().spawnSequence.filter(item=>!item.special).length'),29);
assert.equal(run('latestWaveJob().spawnSequence.length'),run('latestWaveJob().normalTotal+specialCountForWave(20)'));

// Food orbs take the two closest eligible elephants with stable tower-ID ties.
run('reset();const lure={attracted:[]};attractElephants(lure)');
assert.equal(run('lure.attracted.length'),0);
run('state.towers=[{towerId:1,behavior:"home",sold:false,x:0,y:0}];const lureOne={x:5,y:0,attracted:[]};attractElephants(lureOne)');
assert.equal(run('lureOne.attracted.length'),1);
assert.equal(run('state.towers[0].lureOrb===lureOne'),true);
run('state.towers=[{towerId:3,behavior:"home",sold:false,x:10,y:0},{towerId:1,behavior:"home",sold:false,x:-10,y:0},{towerId:2,behavior:"returning",sold:false,x:0,y:0}];const closestLure={x:0,y:0,attracted:[]};attractElephants(closestLure)');
assert.deepEqual(Array.from(run('closestLure.attracted.map(t=>t.towerId)')),[1,3]);

// Foodie Elephants lock onto an in-range food orb, never select ghosts, and
// only return to normal targets once no valid food orb remains.
run('reset();var foodiePriorityTower=createElephant("foodie",100,100);foodiePriorityTower.cooldown=1;var priorityNormalOrb={special:false,ghost:false,targetable:true,state:"active",x:120,y:100,seg:0,hp:50,maxHp:50,id:90};var priorityGhostOrb={special:false,ghost:true,targetable:true,state:"active",x:110,y:100,seg:0,hp:50,maxHp:50,id:91};var priorityFoodA={special:true,ghost:false,targetable:true,state:"active",x:130,y:100,seg:0,hp:8,maxHp:10,durability:8,id:7};var priorityFoodB={special:true,ghost:false,targetable:true,state:"active",x:135,y:100,seg:0,hp:4,maxHp:10,durability:4,id:8};state.towers=[foodiePriorityTower]');
assert.equal(run('chooseTarget(foodiePriorityTower,[priorityNormalOrb,priorityGhostOrb])'),run('priorityNormalOrb'));
assert.equal(run('chooseTarget(foodiePriorityTower,[priorityNormalOrb,priorityFoodA,priorityFoodB])'),run('priorityFoodB'));
assert.equal(run('foodiePriorityTower.foodTarget'),run('priorityFoodB'));
run('priorityFoodA.x=180;priorityFoodA.seg=0');
assert.equal(run('chooseTarget(foodiePriorityTower,[priorityNormalOrb,priorityFoodA,priorityFoodB])'),run('priorityFoodB'));
run('foodiePriorityTower.visualTarget=priorityNormalOrb;foodiePriorityTower.attack=.28;foodiePriorityTower.recoil=1;sprays=[{tower:foodiePriorityTower,target:priorityNormalOrb}];chooseTarget(foodiePriorityTower,[priorityNormalOrb,priorityFoodB])');
assert.equal(run('foodiePriorityTower.attack'),0);
assert.equal(run('sprays.length'),0);
run('state.balls=[priorityNormalOrb,priorityFoodB];update(0)');
assert.equal(run('foodiePriorityTower.visualTarget'),run('priorityFoodB'));
assert.equal(run('foodiePriorityTower.foodFocus'),true);
assert.equal(run('attackCooldownFor(foodiePriorityTower,priorityFoodB)<attackCooldownFor(foodiePriorityTower,priorityNormalOrb)'),true);
approximately(run('damageAgainst(foodiePriorityTower,priorityFoodB)'),run('foodiePriorityTower.damage*CONFIG.FOODIE_FOOD_ORB_DAMAGE_MULTIPLIER'));
run('priorityFoodB.targetable=false;priorityFoodB.state="defeated";state.balls=[priorityNormalOrb];update(0)');
assert.equal(run('foodiePriorityTower.foodTarget'),null);
assert.equal(run('foodiePriorityTower.visualTarget'),run('priorityNormalOrb'));
assert.equal(run('foodiePriorityTower.foodFocus'),false);
run('state.balls=[priorityGhostOrb];update(0)');
assert.equal(run('foodiePriorityTower.visualTarget'),null);

// Ten confirmed impacts defeat a special orb regardless of elephant level.
run('reset();state.currency=0;state.waveJobs=[{wave:10,total:2,spawned:2,resolved:0,destroyed:0,rewarded:false}];const food={special:true,state:"active",targetable:true,rewarded:false,x:100,y:100,seg:0,hp:10,maxHp:10,durability:10,maxDurability:10,hits:0,originalSpeed:70,lureDuration:20,lureElapsed:0,attracted:[],reward:10,wave:10};const hitter={kind:"elephant",level:1,x:100,y:100,behavior:"home",targetMode:"first",recoil:0,attack:0};applyLevelStats(hitter);state.balls=[food];state.towers=[hitter];fire(hitter,food)');
assert.equal(run('food.durability'),9);
approximately(run('orbMovementSpeed(food)'),75.6);
run('for(let i=0;i<4;i++)fire(hitter,food)');
assert.equal(run('food.durability'),5);
approximately(run('orbMovementSpeed(food)'),98);
run('for(let i=0;i<4;i++)fire(hitter,food)');
assert.equal(run('food.durability'),1);
run('fire(hitter,food);fire(hitter,food)');
assert.equal(run('state.balls.includes(food)'),false);
assert.equal(run('state.currency'),0);
run('update(1.2)');
assert.equal(run('state.currency'),10);
run('reset();state.waveJobs=[{wave:10,total:2,spawned:2,resolved:0,destroyed:0,rewarded:false}];const upgraded={kind:"elephant",level:5,x:0,y:0,behavior:"home",targetMode:"first",recoil:0,attack:0};applyLevelStats(upgraded);const durable={special:true,state:"active",targetable:true,rewarded:false,x:0,y:0,seg:0,hp:10,maxHp:10,durability:10,maxDurability:10,hits:0,originalSpeed:70,lureDuration:20,lureElapsed:0,attracted:[],reward:10,wave:10};state.balls=[durable];fire(upgraded,durable)');
assert.equal(run('durable.durability'),9);
run('upgraded.lureOrb=durable;fire(upgraded,durable)');
assert.equal(run('durable.durability'),9);

// Timer boundaries, eating, endpoint cleanup, and exact return positions.
run('reset();state.waveJobs=[{wave:10,total:2,spawned:2,resolved:0,destroyed:0,rewarded:false}];const eater={kind:"elephant",sold:false,x:100,y:118,homeX:40,homeY:40,behavior:"following",followIndex:0};const timed={special:true,state:"active",targetable:true,rewarded:false,x:100,y:100,seg:0,hp:10,maxHp:10,durability:10,maxDurability:10,hits:0,originalSpeed:0,lureDuration:10,lureElapsed:9.99,timerExpired:false,attracted:[eater],reward:10,wave:10};eater.lureOrb=timed;state.towers=[eater];state.balls=[timed];update(.01)');
assert.equal(run('timed.state'),'eating');
run('update(.9)');
assert.equal(run('state.balls.includes(timed)'),false);
assert.equal(run('eater.behavior'),'returning');
run('update(10)');
assert.equal(run('eater.x'),40);
assert.equal(run('eater.y'),40);
assert.equal(run('eater.behavior'),'home');
run('reset();state.waveJobs=[{wave:10,total:2,spawned:2,resolved:0,destroyed:0,rewarded:false}];const alone={special:true,state:"active",targetable:true,rewarded:false,x:0,y:115,seg:0,hp:10,maxHp:10,durability:10,maxDurability:10,hits:0,originalSpeed:0,lureDuration:20,lureElapsed:19.99,timerExpired:false,attracted:[],reward:10,wave:10};state.balls=[alone];update(.01)');
assert.equal(run('state.balls.includes(alone)'),false);
assert.equal(run('alone.timerExpired'),true);
run('reset();state.currency=0;state.waveJobs=[{wave:20,total:2,spawned:2,resolved:0,destroyed:0,rewarded:false}];const returner={kind:"elephant",sold:false,x:1140,y:1110,homeX:80,homeY:80,behavior:"following",followIndex:0};const escapee={special:true,state:"active",targetable:true,rewarded:false,x:1150,y:1120,seg:20,hp:10,maxHp:10,durability:10,maxDurability:10,hits:0,originalSpeed:70,lureDuration:20,lureElapsed:0,timerExpired:false,attracted:[returner],reward:10,wave:20};returner.lureOrb=escapee;state.towers=[returner];state.balls=[escapee];update(.2)');
assert.equal(run('state.currency'),0);
assert.equal(run('state.currentHealth'),99);
assert.equal(run('returner.behavior'),'returning');

// Endpoint damage uses internal tiers, caps normal orbs, and permits explicit bosses.
assert.equal(run('healthDamageForOrb({tier:0,isBoss:false})'),1);
assert.equal(run('healthDamageForOrb({tier:1,isBoss:false})'),5);
assert.equal(run('healthDamageForOrb({tier:2,isBoss:false})'),9);
assert.equal(run('healthDamageForOrb({tier:10,isBoss:false})'),41);
assert.equal(run('healthDamageForOrb({tier:30,isBoss:false})'),99);
assert.equal(run('healthDamageForOrb({tier:30,special:true,isBoss:false})'),99);
assert.equal(run('healthDamageForOrb({tier:0,isBoss:true,bossEndpointDamage:100})'),100);
assert.equal(run('healthDamageForOrb({tier:0,isBoss:true})'),100);
run('reset();const endpointOrb={tier:2,isBoss:false};applyEndpointDamage(endpointOrb);applyEndpointDamage(endpointOrb)');
assert.equal(run('state.currentHealth'),91);
run('const simultaneousA={tier:1,isBoss:false},simultaneousB={tier:2,isBoss:false};applyEndpointDamage(simultaneousA);applyEndpointDamage(simultaneousB)');
assert.equal(run('state.currentHealth'),77);
run('state.currency=123.5;applyEndpointDamage({tier:30,isBoss:false})');
assert.equal(run('state.currentHealth'),0);
assert.equal(run('state.status'),'lost');
assert.equal(run('state.currency'),123.5);
assert.equal(run('state.balls.length'),0);
assert.equal(run('state.currentHealth'),0);

// Speed cycles and reset cleanup cover active following/eating states.
run('reset();cycleGameSpeed()');assert.equal(run('state.gameSpeed'),1.5);
assert.equal(run('scaledGameDelta(2)'),3);
run('cycleGameSpeed()');assert.equal(run('state.gameSpeed'),2);
assert.equal(run('scaledGameDelta(2)'),4);
run('cycleGameSpeed()');assert.equal(run('state.gameSpeed'),1);
run('state.gameSpeed=2;state.balls=[{special:true,state:"eating",attracted:[]}];state.towers=[{behavior:"returning"}];reset()');
assert.equal(run('state.gameSpeed'),1);
assert.equal(run('state.currentHealth'),100);
assert.equal(run('state.maximumHealth'),100);
assert.equal(run('state.balls.length'),0);
assert.equal(run('state.towers.length'),0);

// The expanded world, camera bounds, late-wave cap, and direct starts cover Waves 15–50.
assert.equal(run('CONFIG.TOTAL_WAVES'),50);
assert.equal(run('CONFIG.WORLD_HEIGHT'),1360);
assert.equal(run('path.length'),22);
assert.ok(run('path.reduce((sum,p,i)=>i?sum+dist(path[i-1],p):0,0)')>3000);
run('setCameraY(9999)');assert.equal(run('state.cameraY'),680);
assert.ok(run('path[path.length-1].y-state.cameraY')>=0);
assert.ok(run('path[path.length-1].y-state.cameraY')<=run('viewportWorldHeight()'));
run('setCameraY(-5)');assert.equal(run('state.cameraY'),0);
run('canvas.getBoundingClientRect=()=>({left:0,top:0,width:1400,height:900});window.devicePixelRatio=2;resizeGameViewport()');
assert.equal(run('canvas.width'),2800);
assert.equal(run('canvas.height'),1800);
assert.equal(run('state.renderScale'),2.5);
assert.equal(run('viewportWorldHeight()'),720);
assert.equal(run('maximumCameraY()'),640);
run('setCameraY(0);updatePlacementPointer({clientX:700,clientY:450})');
assert.equal(run('mouse.x'),560);
assert.equal(run('mouse.y'),360);
run('canvas.getBoundingClientRect=()=>({left:0,top:0,width:1120,height:680});window.devicePixelRatio=1;resizeGameViewport()');
assert.equal(run('viewportWorldHeight()'),680);
assert.equal(run('validPlacement({x:100,y:1200})'),true);
run('lowerMapDiscovered=false;saveLowerMapDiscovery();tutorialData.completed=true;state.tutorialActive=false;reset();updateScrollDiscoveryHint()');
assert.equal(run('extendedUI.scrollDiscoveryHint.classList.contains("hidden")'),false);
run('setCameraY(CONFIG.LOWER_MAP_DISCOVERY_SCROLL)');
assert.equal(run('lowerMapDiscovered'),true);
assert.equal(run('extendedUI.scrollDiscoveryHint.classList.contains("hidden")'),true);
run('reset();updateScrollDiscoveryHint()');
assert.equal(run('extendedUI.scrollDiscoveryHint.classList.contains("hidden")'),true);
run('lowerMapDiscovered=false;saveLowerMapDiscovery();state.cameraY=0;cameraDrag={active:true,lastClientY:100,moved:false};handleCanvasPointerMove({clientX:100,clientY:50})');
assert.ok(run('state.cameraY')>0);
assert.equal(run('cameraDrag.moved'),true);
run('cameraDrag.active=false');
assert.equal(run('ballsForWave(50)'),45);
for(const wave of [15,20,35,40,45,50]){
  run(`reset();ui.startLevelSelect.value="${wave}";launchWave();if(state.pendingWaveStart){const pending=state.pendingWaveStart;state.pendingWaveStart=null;state.paused=false;beginWave(pending.wave,pending.spawnSequence)}`);
  assert.equal(run('state.wave'),wave);
  assert.ok(run('latestWaveJob().spawnSequence.some(item=>!item.special&&item.ghost)'));
  assert.ok(run('latestWaveJob().spawnSequence.some(item=>!item.special&&!item.ghost)'));
}
assert.equal(run('latestWaveJob().spawnSequence.filter(item=>!item.special&&item.tier===0).length'),4);
assert.equal(run('latestWaveJob().spawnSequence.filter(item=>!item.special&&item.tier===10).length'),5);
assert.ok(run('spawnIntervalForWave(50)')<run('spawnIntervalForWave(30)'));
run('reset();state.tutorialActive=false;state.wave=49;state.waveJobs=[{wave:49,total:45,spawned:45,resolved:36,destroyed:36,rewarded:false}];launchWave();if(state.pendingWaveStart){const pending=state.pendingWaveStart;state.pendingWaveStart=null;state.paused=false;beginWave(pending.wave,pending.spawnSequence)}');
assert.equal(run('state.wave'),50);
run('reset();state.tutorialActive=false;state.wave=49;state.waveJobs=[{wave:49,total:45,spawned:45,resolved:36,destroyed:36,rewarded:false}];state.autoWaves=true;update(3.1);if(state.pendingWaveStart){const pending=state.pendingWaveStart;state.pendingWaveStart=null;state.paused=false;beginWave(pending.wave,pending.spawnSequence)}');
assert.equal(run('state.wave'),50);

// New tiers retain independent HP clocks, rewards, endpoint damage, and required visual accents.
for(const tier of [7,8,9,10]){
  const wave=35+(tier-7)*5;
  assert.equal(run(`OrbProgression.hpFor(${wave},${tier},CONFIG.BALL_HEALTH)`),Math.round(50*1.25**tier));
  assert.equal(run(`OrbProgression.TIERS[${tier}].currencyReward`),tier+1);
  assert.equal(run(`healthDamageForOrb({tier:${tier},isBoss:false})`),1+tier*4);
  assert.ok(run(`!!OrbProgression.TIERS[${tier}].visual.glow`));
}

// Ghost variants preserve tier stats, move exactly 5% faster, and require eyewear targeting.
approximately(run('orbMovementSpeed({special:false,ghost:true})/orbMovementSpeed({special:false,ghost:false})'),1.05);
approximately(run('orbMovementSpeed({special:false,ghost:true,hp:25,maxHp:100})/orbMovementSpeed({special:false,ghost:false,hp:25,maxHp:100})'),1.05);
run('reset();state.currency=0;const normalTower=createElephant("elephant",100,100),specTower=createElephant("eyewear",100,100),ghostTarget={special:false,ghost:true,targetable:true,state:"active",tier:3,hp:20,maxHp:20,reward:4,x:110,y:100,seg:0,wave:15},normalTarget={special:false,ghost:false,targetable:true,state:"active",tier:3,hp:20,maxHp:20,reward:4,x:105,y:100,seg:0,wave:15};state.towers=[normalTower,specTower];state.balls=[ghostTarget,normalTarget]');
assert.equal(run('canTowerTarget(normalTower,ghostTarget)'),false);
assert.equal(run('canTowerTarget(specTower,ghostTarget)'),true);
assert.equal(run('chooseTarget(specTower,[normalTarget,ghostTarget])===ghostTarget'),true);
run('fire(normalTower,ghostTarget)');assert.equal(run('ghostTarget.hp'),20);
approximately(run('damageAgainst(specTower,normalTarget)'),run('specTower.damage*0.95'));
approximately(run('damageAgainst(specTower,ghostTarget)'),run('specTower.damage'));
run('ghostTarget.hp=1;fire(specTower,ghostTarget)');
assert.equal(run('state.currency'),0);
assert.equal(run('destructionEffects.length'),1);
run('fire(specTower,ghostTarget)');assert.equal(run('destructionEffects.length'),1);
run('normalTower.cooldown=100;specTower.cooldown=100;update(1);update(.05)');
assert.equal(run('currencyLights.length'),1);
run('update(.7)');
assert.equal(run('state.currency'),4);
assert.equal(run('healthDamageForOrb({tier:3,ghost:true,isBoss:false})'),13);

// First in-range ghost detection is player-wide, persistent, and reacts on only one closest scout.
run('encyclopediaData=normalizeEncyclopediaData(null);noticedGhostTiers=new Set();reset();tutorialData.completed=true;state.tutorialActive=false;const farScout=createElephant("eyewear",80,100),nearScout=createElephant("eyewear",135,100),waterScout=createElephant("elephant",145,100),firstGhost={special:false,ghost:true,targetable:true,state:"active",tier:3,hp:100,maxHp:100,reward:4,x:150,y:100,seg:0,wave:15};state.towers=[farScout,nearScout,waterScout];state.balls=[firstGhost];detectNewGhostTiers()');
assert.equal(run('noticedGhostTiers.has(3)'),true);
assert.equal(run('!!nearScout.ghostAlert'),true);
assert.equal(run('!!farScout.ghostAlert'),false);
assert.equal(run('!!waterScout.ghostAlert'),false);
assert.equal(run('encyclopediaRecord("ghost-tier-3").encounteredCount'),1);
assert.equal(run('encyclopediaRecord("ghost-tier-3").defeatCount'),0);
assert.equal(run('knowledgeLights.length'),0);
run('detectNewGhostTiers()');
assert.equal(run('nearScout.ghostAlertQueue.length'),0);
run('updateGhostAlert(nearScout,.9)');
assert.equal(run('nearScout.ghostAlert'),null);
run('const nextGhost={special:false,ghost:true,targetable:true,state:"active",tier:4,hp:100,maxHp:100,reward:5,x:151,y:100,seg:0,wave:20};state.balls=[nextGhost];detectNewGhostTiers();saveEncyclopediaData()');
assert.equal(run('noticedGhostTiers.has(4)'),true);
assert.equal(run('encyclopediaRecord("ghost-tier-4").defeatCount'),0);
run('noticedGhostTiers=new Set();encyclopediaData=loadEncyclopediaData();noticedGhostTiers=new Set(encyclopediaData.noticedGhostTiers)');
assert.deepEqual(Array.from(run('[...noticedGhostTiers].sort((a,b)=>a-b)')),[3,4]);
run('nearScout.ghostAlert=null;nearScout.ghostAlertQueue=[];state.balls=[nextGhost];detectNewGhostTiers()');
assert.equal(run('nearScout.ghostAlert'),null);
run('const undetectedGhost={ghost:true,tier:5,wave:25};recordOrbEscape(undetectedGhost)');
assert.equal(run('encyclopediaRecord("ghost-tier-5").encounteredCount'),0);
assert.equal(run('encyclopediaRecord("ghost-tier-5").escapeCount'),0);
run('noticedGhostTiers=new Set();encyclopediaData=normalizeEncyclopediaData(null);const outOfRangeScout=createElephant("eyewear",50,50),distantGhost={special:false,ghost:true,targetable:true,state:"active",tier:6,hp:100,maxHp:100,x:600,y:600,seg:0,wave:30};state.towers=[outOfRangeScout];state.balls=[distantGhost];detectNewGhostTiers()');
assert.equal(run('noticedGhostTiers.has(6)'),false);
assert.equal(run('encyclopediaRecord("ghost-tier-6").encounteredCount'),0);
run('distantGhost.x=100;distantGhost.y=50;detectNewGhostTiers()');
assert.equal(run('noticedGhostTiers.has(6)'),true);

// Eyewear units share limits but retain independent upgrades, refunds, and group penalties.
assert.equal(run('upgradeCost({kind:"elephant",towerType:"eyewear",level:1})'),100);
assert.equal(run('upgradeCost({kind:"elephant",towerType:"eyewear",level:4})'),338);
run('reset();state.currency=5000;const maxSpecs=createElephant("eyewear",50,50);state.towers=[maxSpecs];selectTower(maxSpecs);for(let i=0;i<8;i++)upgradeSelected()');
assert.equal(run('maxSpecs.level'),5);
run('reset();state.currency=0;const soldSpecs=createElephant("eyewear",50,50);soldSpecs.level=5;applyLevelStats(soldSpecs);state.towers=[soldSpecs];selectTower(soldSpecs)');
assert.equal(run('ui.sellRefund.textContent'),'63');
run('sellSelected();sellSelected()');
assert.equal(run('state.currency'),63);
run('reset();state.towers=[...Array.from({length:5},(_,i)=>createElephant("elephant",i*10,0)),...Array.from({length:3},(_,i)=>createElephant("eyewear",i*10,30))]');
approximately(run('groupPenaltyMultiplier(state.towers[0])'),.92);
approximately(run('groupPenaltyMultiplier(state.towers[5])'),.96);
run('state.towers=Array.from({length:15},(_,i)=>createElephant(i%2?"eyewear":"elephant",i*10,0));state.placement=null;state.currency=1000;buyEyewear()');
assert.equal(run('state.placement'),null);

// The foodie elephant type has independent stats, targeting, lure immunity, upgrades, refund, and cap.
assert.equal(run('CONFIG.eyewearElephantCost'),125);
assert.equal(run('CONFIG.foodieElephantCost'),150);
assert.deepEqual(Array.from(run('[1,2,3,4].map(level=>upgradeCost({kind:"elephant",towerType:"foodie",level}))')),[125,188,282,422]);
run('reset();const foodieUnit=createElephant("foodie",0,0),foodNormal={special:false,ghost:false,targetable:true,state:"active"},foodGhost={special:false,ghost:true,targetable:true,state:"active"},foodOrb={special:true,ghost:false,targetable:true,state:"active"};state.towers=[foodieUnit]');
approximately(run('foodieUnit.attackSpeed'),.75/.8);
approximately(run('damageAgainst(foodieUnit,foodNormal)'),run('foodieUnit.damage*.98'));
approximately(run('damageAgainst(foodieUnit,foodOrb)'),run('foodieUnit.damage*1.05'));
approximately(run('attackCooldownFor(foodieUnit,foodOrb)'),run('foodieUnit.attackSpeed/1.03'));
assert.equal(run('canTowerTarget(foodieUnit,foodGhost)'),false);
run('const lureWithFoodie={x:0,y:0,attracted:[]};state.towers=[foodieUnit,{towerId:2,towerType:"base",behavior:"home",sold:false,x:20,y:0},{towerId:3,towerType:"eyewear",behavior:"home",sold:false,x:30,y:0}];attractElephants(lureWithFoodie)');
assert.equal(run('lureWithFoodie.attracted.includes(foodieUnit)'),false);
assert.deepEqual(Array.from(run('lureWithFoodie.attracted.map(t=>t.towerId)')),[2,3]);
run('reset();const animatedFoodie=createElephant("foodie",100,100),foodieNormalTarget={special:false,ghost:false,targetable:true,state:"active",tier:0,hp:100,maxHp:100,reward:1,x:120,y:100,seg:0,wave:1};state.towers=[animatedFoodie];state.balls=[foodieNormalTarget];animatedFoodie.cooldown=.5;update(.01)');
assert.equal(run('animatedFoodie.foodFocus'),false);
assert.deepEqual(Object.keys(run('elephantAttachmentAnchors(animatedFoodie).glassesAnchor')).sort(),['x','y']);
assert.equal(run('elephantAttachmentAnchors(animatedFoodie).foodPose.hidden'),false);
run('animatedFoodie.attack=.2');
assert.equal(run('foodieFoodPose(animatedFoodie).raise'),0);
run('const focusedFoodTarget={special:true,ghost:false,targetable:true,state:"active",timerExpired:true,originalSpeed:0,hits:0,tier:0,hp:10,maxHp:10,durability:10,maxDurability:10,reward:10,x:120,y:100,seg:0,wave:20};state.balls=[focusedFoodTarget];animatedFoodie.cooldown=.5;update(.01)');
assert.equal(run('animatedFoodie.foodFocus'),true);
assert.equal(run('foodieFoodPose(animatedFoodie).hidden'),true);
run('animatedFoodie.cooldown=0;update(.01)');
approximately(run('animatedFoodie.cooldown'),run('attackCooldownFor(animatedFoodie,focusedFoodTarget)'));
run('window.matchMedia=()=>({matches:true})');
assert.equal(run('prefersReducedMotion()'),true);
run('drawElephant(animatedFoodie,false,true,false);drawGhostAlert(nearScout);window.matchMedia=undefined');
run('reset();state.currency=0;const soldFoodie=createElephant("foodie",50,50);soldFoodie.level=5;applyLevelStats(soldFoodie);state.towers=[soldFoodie];selectTower(soldFoodie)');
assert.equal(run('ui.sellRefund.textContent'),'75');
run('sellSelected();sellSelected()');
assert.equal(run('state.currency'),75);
run('reset();state.currency=9999;state.towers=[...Array.from({length:15},(_,i)=>createElephant(i%2?"eyewear":"elephant",i,0)),...Array.from({length:5},(_,i)=>createElephant("foodie",i,20))];state.papayas=Array.from({length:4},(_,i)=>({kind:"papaya",x:i,y:40,incomeEffect:1.2}));buyFoodie()');
assert.equal(run('state.placement'),null);
assert.equal(run('reservedElephantCount()'),15);
assert.equal(run('reservedFoodieCount()'),5);
assert.equal(run('reservedTotalUnitCount()'),24);
run('buyPapaya()');assert.equal(run('state.placement'),'papaya');assert.equal(run('reservedTotalUnitCount()'),25);
run('cancelPlacement();state.papayas.push({kind:"papaya",x:10,y:40,incomeEffect:1.2});buyPapaya()');assert.equal(run('state.placement'),null);
run('buyGoldenPapaya()');assert.equal(run('state.placement'),'goldenPapaya');assert.equal(run('reservedTotalUnitCount()'),26);
run('cancelPlacement();buyPapaya()');assert.equal(run('state.placement'),null);

// Destruction reserves rewards, prevents duplicate hits, and settles both collection paths once.
run('encyclopediaData=normalizeEncyclopediaData(null);reset();state.currency=0;state.waveJobs=[{wave:20,total:2,spawned:2,resolved:0,destroyed:0,rewarded:false}];const collectionTower=createElephant("elephant",100,100),collectionOrb={special:false,ghost:false,targetable:true,state:"active",tier:4,hp:1,maxHp:100,reward:5,x:110,y:100,seg:0,wave:20};state.towers=[collectionTower];state.balls=[collectionOrb];fire(collectionTower,collectionOrb);fire(collectionTower,collectionOrb)');
assert.equal(run('state.currency'),0);
assert.equal(run('state.balls.length'),0);
assert.equal(run('destructionEffects.length'),1);
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-4"))'),'discoveryPending');
run('setCameraY(680);update(1);draw();update(.05)');
assert.equal(run('currencyLights.length'),1);
assert.equal(run('knowledgeLights.length'),1);
const discoveryStartY=run('knowledgeLights[0].startScreenY');
run('setCameraY(0)');
assert.equal(run('knowledgeLights[0].startScreenY'),discoveryStartY);
run('update(.9)');
assert.equal(run('state.currency'),5);
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-4"))'),'discovered');
run('encyclopediaData=normalizeEncyclopediaData(null);reset();state.currency=0;state.waveJobs=[{wave:30,total:3,spawned:3,resolved:0,destroyed:0,rewarded:false}];const simultaneousTower=createElephant("elephant",0,0),sameA={special:false,ghost:false,targetable:true,state:"active",tier:6,hp:1,maxHp:1,reward:7,x:0,y:0,seg:0,wave:30},sameB={special:false,ghost:false,targetable:true,state:"active",tier:6,hp:1,maxHp:1,reward:7,x:1,y:0,seg:0,wave:30};state.towers=[simultaneousTower];state.balls=[sameA,sameB];fire(simultaneousTower,sameA);fire(simultaneousTower,sameB);update(1);update(.05)');
assert.equal(run('knowledgeLights.length'),1);
assert.equal(run('currencyLights.length'),1);
run('settlePendingCollections()');
assert.equal(run('state.currency'),14);
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-6"))'),'discovered');
assert.equal(run('currencyLights.length+knowledgeLights.length+destructionEffects.length'),0);

// Tutorial start, every-step skipping, replay safety, completion, and persistence.
run('tutorialData=normalizeTutorialData(null);state.tutorialActive=false;startTutorialIfNeeded()');
assert.equal(run('state.tutorialActive'),true);
assert.equal(run('state.gameSpeed'),1);
assert.equal(run('state.autoWaves'),false);
assert.equal(run('TUTORIAL_STEPS.length'),23);

// Tutorial placement guidance is world-space, useful for Wave 1, and reacts to occupancy and camera changes.
run('reset();tutorialData=normalizeTutorialData({started:true,step:6});state.tutorialActive=true;state.placement="elephant";state.cameraY=0;tutorialPlacementGuide={signature:"",recommended:null,fallback:[]};updateTutorialPlacementGuide()');
assert.equal(run('tutorialPlacementGuidanceActive()'),true);
assert.ok(run('tutorialPlacementGuide.recommended!==null'));
assert.equal(run('validPlacement(tutorialPlacementGuide.recommended)'),true);
assert.equal(run('usefulTutorialPlacement(tutorialPlacementGuide.recommended)'),true);
assert.ok(run('tutorialTrackCoverage(tutorialPlacementGuide.recommended)')>=run('CONFIG.TUTORIAL_MINIMUM_TRACK_COVERAGE'));
assert.ok(run('tutorialPlacementGuide.recommended.y')>=run('state.cameraY'));
assert.ok(run('tutorialPlacementGuide.recommended.y')<=run('state.cameraY+viewportWorldHeight()'));
assert.equal(run('earlyTrackSegments().some(segment=>pointSegmentDistance(tutorialPlacementGuide.recommended,segment.a,segment.b)<=CONFIG.ELEPHANT_RADIUS)'),true);
assert.ok(run('tutorialPlacementCandidates().length')>1);
assert.equal(run('usefulTutorialPlacement(tutorialPlacementCandidates()[1])'),true);
run('const firstTutorialRecommendation={...tutorialPlacementGuide.recommended};state.towers=[createElephant("elephant",firstTutorialRecommendation.x,firstTutorialRecommendation.y)];updateTutorialPlacementGuide()');
assert.equal(run('validPlacement(firstTutorialRecommendation)'),false);
assert.ok(run('tutorialPlacementGuide.recommended===null||tutorialPlacementGuide.recommended.x!==firstTutorialRecommendation.x||tutorialPlacementGuide.recommended.y!==firstTutorialRecommendation.y'));
run('state.towers=[];setCameraY(400);tutorialPlacementGuide.signature="";updateTutorialPlacementGuide()');
assert.ok(run('tutorialPlacementGuide.recommended!==null'));
assert.ok(run('tutorialPlacementGuide.recommended.y')>=run('state.cameraY'));
assert.ok(run('tutorialPlacementGuide.recommended.y')<=run('state.cameraY+viewportWorldHeight()'));
assert.equal(run('usefulTutorialPlacement(tutorialPlacementGuide.recommended)'),true);
run('state.viewportWorldHeight=420;tutorialPlacementGuide.signature="";updateTutorialPlacementGuide()');
assert.ok(run('tutorialPlacementGuide.recommended!==null'));
assert.ok(run('tutorialPlacementGuide.recommended.y')<=run('state.cameraY+viewportWorldHeight()'));
run('state.viewportWorldHeight=680;tutorialPlacementGuide.signature="";updateTutorialPlacementGuide()');
assert.equal(run('validPlacement({x:100,y:1300})'),true);
assert.equal(run('placementAllowed({x:100,y:1300})'),false);
assert.match(run('TUTORIAL_STEPS[8].text'),/Place your Water Elephant here so it can reach the track\./);
assert.match(run('TUTORIAL_STEPS[9].text'),/free starter Water Elephant/);
run('reset();tutorialData=normalizeTutorialData({started:true,step:9});state.tutorialActive=true;state.towers=[createElephant("elephant",350,370)];state.starterGift={firstPaidPurchased:true,paidPlacementPending:false,granted:true,giftPlacementPending:true,giftPlaced:false,giftStartWaived:false};state.placement="starterGiftElephant";state.cameraY=0;tutorialPlacementGuide={signature:"",recommended:null,fallback:[]};updateTutorialPlacementGuide()');
assert.equal(run('tutorialPlacementGuidanceActive()'),true);
assert.ok(run('tutorialPlacementGuide.recommended!==null'));
assert.ok(run('dist(tutorialPlacementGuide.recommended,state.towers[0])>=CONFIG.TUTORIAL_SECOND_PLACEMENT_SEPARATION'));
assert.match(fs.readFileSync('./game.js','utf8'),/Place the elephant closer to the track so it can attack passing orbs\./);
run('tutorialData.step=6;tutorialAction("placed")');
assert.equal(run('tutorialData.step'),9);
run('replayTutorial()');
assert.equal(run('tutorialPlacementGuide.signature'),'');
assert.equal(run('lowerMapDiscovered'),false);
assert.equal(run('state.cameraY'),0);
assert.equal(run('extendedUI.scrollDiscoveryHint.classList.contains("hidden")'),false);
run('reset()');
assert.equal(run('tutorialPlacementGuide.recommended'),null);

assert.equal(run('(()=>{for(let step=0;step<CONFIG.TUTORIAL_STEP_COUNT;step++){tutorialData=normalizeTutorialData({started:true,step});state.tutorialActive=true;skipTutorial();if(!tutorialData.completed||state.tutorialActive)return false}return true})()'),true);
run('tutorialData=normalizeTutorialData({completed:true,contexts:{ghost:true},step:7});saveTutorialData();tutorialData=loadTutorialData()');
assert.equal(run('tutorialData.step'),7);
assert.equal(run('tutorialData.contexts.ghost'),true);
run('state.currency=321;state.towers=[createElephant("elephant",1,1)];encyclopediaData.records["tier-0"]={...blankEncyclopediaRecord(),encounteredCount:1};const replayCurrency=state.currency,replayTowers=state.towers.length,replayEntries=Object.keys(encyclopediaData.records).length;replayTutorial()');
assert.equal(run('state.currency'),run('replayCurrency'));
assert.equal(run('state.towers.length'),run('replayTowers'));
assert.equal(run('Object.keys(encyclopediaData.records).length'),run('replayEntries'));
run('lowerMapDiscovered=false;saveLowerMapDiscovery();state.cameraY=0;tutorialData.step=21;state.tutorialActive=true;renderTutorial()');
assert.equal(run('extendedUI.tutorialContinue.disabled'),true);
assert.match(run('extendedUI.tutorialText.textContent'),/The track continues below\. Scroll down to see the rest of the map\./);
run('setCameraY(CONFIG.LOWER_MAP_DISCOVERY_SCROLL)');
assert.equal(run('tutorialData.step'),22);
assert.equal(run('lowerMapDiscovered'),true);
run('tutorialData.step=22;state.tutorialActive=true;advanceTutorial()');
assert.equal(run('tutorialData.completed'),true);
run('tutorialData=normalizeTutorialData({completed:true,contexts:{}});state.tutorialActive=false;showContextTutorial("ghost","Ghost help","#buyEyewear")');
assert.equal(run('tutorialData.contexts.ghost'),true);
run('state.contextTutorial=null;showContextTutorial("ghost","Duplicate","#buyEyewear")');
assert.equal(run('state.contextTutorial'),null);

// Fixed wave labels distinguish active, waiting, and automatic countdown states.
run('reset();updateWaveDisplay()');assert.equal(run('extendedUI.waveCenterLabel.textContent'),'Next Wave: 1 / 50');
run('launchWave();updateWaveDisplay()');assert.equal(run('extendedUI.waveCenterLabel.textContent'),'Wave 1 / 50');
run('state.autoCountdown=2.4;updateWaveDisplay()');assert.equal(run('extendedUI.waveCountdown.textContent'),'Next wave starts in 3…');

// Encyclopedia records are data-driven, migrate safely, and count each outcome exactly once.
assert.equal(run('Object.keys(normalizeEncyclopediaData("not-json").records).length'),0);
assert.equal(run('normalizeEncyclopediaData({version:0,records:{"tier-0":{encounteredCount:-4,defeatCount:2.8,escapeCount:"bad",firstEncounterWave:0}}}).records["tier-0"].defeatCount'),2);
run('encyclopediaData=normalizeEncyclopediaData(null)');
assert.deepEqual(
  Array.from(run('encyclopediaEntries().filter(entry=>entry.category==="normal").map(entry=>entry.tier)')),
  Array.from({length:11},(_,tier)=>tier)
);
assert.equal(run('encyclopediaEntries().length'),14);
run('const ghostEntry={tier:7,ghost:true,wave:35};recordOrbEncounter(ghostEntry)');
assert.equal(run('encyclopediaRecord("ghost-tier-7").encounteredCount'),1);
assert.equal(run('encyclopediaRecord("tier-7").encounteredCount'),0);
run('const ghostUnlockIds=recordOrbDefeat(ghostEntry);completeEncyclopediaUnlock(ghostUnlockIds);showEncyclopediaDetailWithGhost("tier-7")');
assert.equal(run('encyclopediaRecord("ghost-tier-7").defeatCount'),1);
assert.equal(run('ui.encyclopediaDetail.innerHTML.includes("GHOST VARIANT")'),true);
run('const ghostEscape={tier:8,ghost:true,wave:40};recordOrbEncounter(ghostEscape);recordOrbEscape(ghostEscape);recordOrbEscape(ghostEscape)');
assert.equal(run('encyclopediaRecord("ghost-tier-8").escapeCount'),1);
assert.equal(run('encyclopediaRecord("ghost-tier-8").defeatCount'),0);
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-0"))'),'undiscovered');
run('const seenOnly={tier:0,wave:1};recordOrbEncounter(seenOnly);recordOrbEncounter(seenOnly)');
assert.equal(run('encyclopediaRecord("tier-0").encounteredCount'),1);
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-0"))'),'undiscovered');
run('recordOrbDefeat(seenOnly);recordOrbDefeat(seenOnly)');
assert.equal(run('encyclopediaRecord("tier-0").defeatCount'),1);
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-0"))'),'discoveryPending');
run('completeEncyclopediaUnlock(["tier-0"])');
assert.equal(run('encyclopediaState(encyclopediaRecord("tier-0"))'),'discovered');
run('const escapedEntry={tier:1,wave:5};recordOrbEncounter(escapedEntry);recordOrbEscape(escapedEntry);recordOrbEscape(escapedEntry)');
assert.equal(run('encyclopediaRecord("tier-1").encounteredCount'),1);
assert.equal(run('encyclopediaRecord("tier-1").escapeCount'),1);
assert.equal(run('encyclopediaRecord("tier-1").defeatCount'),0);
run('for(let i=0;i<4;i++){const duplicate={tier:2,wave:10};recordOrbEncounter(duplicate);recordOrbDefeat(duplicate)}');
assert.equal(run('encyclopediaRecord("tier-2").encounteredCount'),4);
assert.equal(run('encyclopediaRecord("tier-2").defeatCount'),4);

// Both attack destruction and elephant eating complete the same special-food entry.
run('reset();state.waveJobs=[{wave:10,total:3,spawned:3,resolved:0,destroyed:0,rewarded:false}];const foodAttack={special:true,state:"active",targetable:true,rewarded:false,x:0,y:0,attracted:[],reward:10,wave:10};const foodEat={special:true,state:"eating",targetable:false,rewarded:false,x:0,y:0,attracted:[],reward:10,wave:10};state.balls=[foodAttack,foodEat];recordOrbEncounter(foodAttack);recordOrbEncounter(foodEat);defeatSpecial(foodAttack,false);defeatSpecial(foodEat,true)');
assert.equal(run('encyclopediaRecord("special-food").encounteredCount'),2);
assert.equal(run('encyclopediaRecord("special-food").defeatCount'),2);

// Starting later discovers only the type that actually spawns, and restart preserves progress.
run('encyclopediaData=normalizeEncyclopediaData(null);reset();const directJob={wave:25,total:1,normalTotal:1,spawnSequence:[{special:false,tier:5}],spawned:0,resolved:0,destroyed:0,rewarded:false};spawnBall(directJob)');
assert.equal(run('encyclopediaRecord("tier-5").encounteredCount'),1);
assert.equal(run('Object.values(encyclopediaData.records).filter(record=>record.encounteredCount>0).length'),1);
run('saveEncyclopediaData();reset()');
assert.equal(run('encyclopediaRecord("tier-5").encounteredCount'),1);
run('encyclopediaData=normalizeEncyclopediaData(null);encyclopediaData=loadEncyclopediaData()');
assert.equal(run('encyclopediaRecord("tier-5").encounteredCount'),1);
run('localStorage.setItem(ENCYCLOPEDIA_STORAGE_KEY,"{broken");encyclopediaData=loadEncyclopediaData()');
assert.equal(run('Object.keys(encyclopediaData.records).length'),0);

// The modal pauses simulation, renders locked entries, filters, and produces speed-independent notices.
run('ui.encyclopediaCategory.value="all";ui.encyclopediaTier.value="all";ui.encyclopediaDiscovered.checked=false;const encyclopediaPauseTime=state.gameTime;openEncyclopedia();update(5)');
assert.equal(run('state.paused'),true);
assert.equal(run('state.gameTime'),run('encyclopediaPauseTime'));
assert.equal(run('ui.encyclopediaGrid.innerHTML.includes("???")'),true);
run('[1,1.5,2].forEach(speed=>{state.gameSpeed=speed;showEncyclopediaNotice(`Orb Encountered at ${speed}`)})');
assert.equal(run('ui.encyclopediaNotification.textContent'),'Orb Encountered at 2');
run('closeEncyclopedia()');
assert.equal(run('state.paused'),false);

// Debug activation, password, and command submissions remain reusable after closing.
run('reset();tutorialData.completed=true;state.tutorialActive=false;var reusableSubmit={prevented:0,preventDefault(){this.prevented++}};var debugStartCurrency=state.currency');
for(let attempt=0;attempt<3;attempt++){
  run('openOwnerCode();debugUI.codeInput.value="who is your daddy";submitOwnerCode(reusableSubmit)');
  assert.equal(run('debugUI.codeModal.classList.contains("hidden")'),true);
  run('debugUI.passwordInput.value="Because I am the owner";submitOwnerPassword(reusableSubmit)');
  assert.equal(run('state.debugConsoleOpen'),true);
  run(`debugUI.input.value="${attempt?'/money 100':'/help'}";submitDebugCommand(reusableSubmit)`);
  run('closeDebugConsole()');
  assert.equal(run('state.debugUnlocked'),false);
}
assert.equal(run('state.currency'),run('debugStartCurrency+200'));
assert.equal(run('reusableSubmit.prevented'),9);
run('openOwnerCode();debugUI.codeInput.value="wrong";submitOwnerCode(reusableSubmit)');
assert.equal(run('debugUI.codeModal.classList.contains("hidden")'),false);
run('debugUI.codeInput.value="who is your daddy";submitOwnerCode(reusableSubmit);debugUI.passwordInput.value="wrong";submitOwnerPassword(reusableSubmit)');
assert.equal(run('debugUI.passwordModal.classList.contains("hidden")'),true);

// Admin credentials are exact and its dispatcher cannot reach Owner-only commands.
run('reset();tutorialData.completed=true;state.tutorialActive=false;var adminStartCurrency=state.currency;openAdminCode();adminDebugUI.codeInput.value="who is your mommy ";submitAdminCode(reusableSubmit)');
assert.equal(run('adminDebugUI.codeModal.classList.contains("hidden")'),false);
assert.equal(run('state.currency'),run('adminStartCurrency'));
run('adminDebugUI.codeInput.value="who is your mommy";submitAdminCode(reusableSubmit);adminDebugUI.passwordInput.value="because I am the admin";submitAdminPassword(reusableSubmit)');
assert.equal(run('adminDebugUI.passwordModal.classList.contains("hidden")'),false);
assert.equal(run('state.currency'),run('adminStartCurrency'));
run('adminDebugUI.passwordInput.value="Because I am the admin";submitAdminPassword(reusableSubmit)');
assert.equal(run('state.adminDebugConsoleOpen'),true);
run('executeAdminDebugCommand("/spawn engineer 1");executeAdminDebugCommand("/money 15")');
assert.equal(run('state.balls.filter(orb=>orb.specialType==="engineer").length'),1);
assert.equal(run('state.currency'),run('adminStartCurrency+15'));
run('var adminOrbCount=state.balls.length;executeAdminDebugCommand("/kill all")');
assert.equal(run('state.balls.length'),run('adminOrbCount'));
run('closeAdminDebugConsole()');
assert.equal(run('state.adminDebugConsoleOpen'),false);

// Owner-only kill destroys the requested targets while retaining Engineer holes.
run('reset();tutorialData.completed=true;state.tutorialActive=false;debugWrite=(message,kind)=>{state.debugMessage=message;state.debugKind=kind};debugSpecialOrb("engineer");var killedEngineer=state.balls[0];createEngineerHole(killedEngineer);executeDebugCommand("/kill engineer")');
assert.equal(run('state.balls.some(orb=>orb.specialType==="engineer")'),false);
assert.equal(run('state.engineerHoles.length>=1'),true);
assert.equal(run('state.engineerHoles[0].repairing'),false);
run('debugNormalOrb(0,false);debugNormalOrb(0,true);debugSpecialOrb("food");debugSpecialOrb("fume");state.balls.push({special:false,isBoss:true,ghost:false,state:"active",targetable:true,x:path[0].x,y:path[0].y,hp:100,maxHp:100,tier:10,reward:0,wave:0});executeDebugCommand("/kill boss")');
assert.equal(run('state.balls.some(orb=>orb.isBoss)'),false);
assert.equal(run('state.balls.length'),4);
run('executeDebugCommand("/kill all")');
assert.equal(run('state.balls.length'),0);
assert.equal(run('state.engineerHoles.length>=1'),true);

// Fume Orbs select the closest eligible elephants, cancel attacks immediately,
// move them safely away, ignore gas masks/other lures, and return them exactly.
run('reset();tutorialData.completed=true;state.tutorialActive=false;var fumeNear=createElephant("elephant",100,220),fumeSecond=createElephant("eyewear",100,320),fumeFar=createElephant("elephant",100,600),fumeGas=createElephant("gas",100,145),fumeFoodBusy=createElephant("elephant",100,420),otherFoodOrb={special:true,specialType:"food",state:"active",attracted:[fumeFoodBusy]};fumeFoodBusy.lureOrb=otherFoodOrb;fumeFoodBusy.behavior="following";fumeNear.attack=.28;fumeSecond.attack=.28;fumeGas.attack=.28;sprays=[{tower:fumeNear},{tower:fumeSecond},{tower:fumeGas}];state.towers=[fumeNear,fumeSecond,fumeFar,fumeGas,fumeFoodBusy];var testedFume={special:true,specialType:"fume",state:"active",targetable:true,x:0,y:115,attracted:[]};state.balls=[testedFume];var fumeNearHome={x:fumeNear.x,y:fumeNear.y},fumeSecondHome={x:fumeSecond.x,y:fumeSecond.y};affectElephants(testedFume)');
assert.deepEqual(Array.from(run('testedFume.attracted.map(t=>t.towerId)')),Array.from(run('[fumeNear.towerId,fumeSecond.towerId]')));
assert.equal(run('fumeNear.behavior'),'fleeingFumeOrb');
assert.equal(run('fumeNear.attack'),0);
assert.equal(run('sprays.some(s=>s.tower===fumeNear||s.tower===fumeSecond)'),false);
assert.equal(run('fumeGas.behavior'),'home');
assert.equal(run('fumeGas.attack'),.28);
assert.equal(run('fumeFoodBusy.lureOrb===otherFoodOrb'),true);
assert.equal(run('dist(fumeNear.fleeTo,testedFume)>dist(fumeNearHome,testedFume)'),true);
assert.equal(run('fumeNear.fleeTo.x>=TOWER_R&&fumeNear.fleeTo.x<=CONFIG.WORLD_WIDTH-TOWER_R&&fumeNear.fleeTo.y>=TOWER_R&&fumeNear.fleeTo.y<=CONFIG.WORLD_HEIGHT-TOWER_R'),true);
assert.equal(run('fumeNear.fleeRoute.length'),1);
run('update(.25)');
assert.equal(run('dist(fumeNear,testedFume)>dist(fumeNearHome,testedFume)'),true);
run('releaseElephants(testedFume);state.balls=[];for(let i=0;i<300&&(fumeNear.behavior!=="home"||fumeSecond.behavior!=="home");i++)update(.05)');
assert.deepEqual(Array.from(run('[fumeNear.x,fumeNear.y,fumeSecond.x,fumeSecond.y]')),Array.from(run('[fumeNearHome.x,fumeNearHome.y,fumeSecondHome.x,fumeSecondHome.y]')));
assert.equal(run('fumeNear.fumeAffected'),false);

// Active fumes fill open fear slots when elephants are placed after the orb.
run('reset();tutorialData.completed=true;state.tutorialActive=false;debugSpecialOrb("fume");var lateFume=state.balls[0],lateOne=createElephant("elephant",100,220);state.towers.push(lateOne);scanActiveFumeOrbs(true)');
assert.equal(run('lateOne.behavior'),'fleeingFumeOrb');
run('var lateTwo=createElephant("elephant",100,320);state.towers.push(lateTwo);scanActiveFumeOrbs(true);var lateThree=createElephant("elephant",100,420);state.towers.push(lateThree);scanActiveFumeOrbs(true);var lateGas=createElephant("gas",100,520);state.towers.push(lateGas);scanActiveFumeOrbs(true)');
assert.equal(run('lateFume.attracted.length'),2);
assert.equal(run('lateThree.behavior'),'home');
assert.equal(run('lateGas.behavior'),'home');
run('releaseElephants(lateFume);state.balls=[];for(let i=0;i<200&&(lateOne.behavior!=="home"||lateTwo.behavior!=="home");i++)update(.05)');
assert.deepEqual(Array.from(run('[lateOne.x,lateOne.y,lateTwo.x,lateTwo.y]')),[100,220,100,320]);

// Splash Elephants pulse every valid non-ghost orb in their entire radius once.
run('reset();tutorialData.completed=true;state.tutorialActive=false;const pulseTower=createElephant("splash",500,600),pulseNormalA={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:510,y:600,seg:0,wave:1},pulseNormalB={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:500+pulseTower.radius-1,y:600,seg:0,wave:1},pulseFood={special:true,specialType:"food",targetable:true,state:"active",durability:10,maxDurability:10,hp:10,x:490,y:610,seg:0,wave:1},pulseFume={special:true,specialType:"fume",targetable:true,state:"active",durability:10,maxDurability:10,hp:10,x:510,y:610,seg:0,wave:1},pulseGhost={special:false,ghost:true,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:505,y:605,seg:0,wave:1};state.towers=[pulseTower];state.balls=[pulseNormalA,pulseNormalB,pulseFood,pulseFume,pulseGhost];pulseTower.splashPulseCooldown=0;update(.01);for(let i=0;i<38;i++)updateSplashPulse(pulseTower,.03)');
assert.equal(run('pulseNormalA.hp<pulseNormalA.maxHp'),true);
assert.equal(run('pulseNormalB.hp<pulseNormalB.maxHp'),true);
assert.equal(run('pulseFood.durability'),9);
assert.equal(run('pulseFume.durability'),9);
assert.equal(run('pulseGhost.hp'),100);
assert.equal(run('splashPulses.length'),1);
const damageAfterFirstPulse=run('pulseNormalA.hp');
run('update(4.9)');
assert.equal(run('pulseNormalA.hp'),damageAfterFirstPulse);

// An empty Splash Elephant remains ready, then attacks immediately when a valid orb arrives.
run('reset();tutorialData.completed=true;state.tutorialActive=false;const waitingSplash=createElephant("splash",500,600);waitingSplash.splashPulseCooldown=0;state.towers=[waitingSplash];update(.1)');
assert.equal(run('splashPulses.length'),0);
assert.equal(run('waitingSplash.splashPulseState'),'ready');
assert.equal(run('waitingSplash.splashPulseCooldown'),0);
run('const waitingTarget={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:510,y:600,seg:0,wave:1};state.balls=[waitingTarget];update(.01);for(let i=0;i<38;i++)updateSplashPulse(waitingSplash,.03)');
assert.equal(run('waitingTarget.hp<100'),true);
assert.equal(run('waitingSplash.splashPulseCooldown'),run('CONFIG.SPLASH_PULSE_COOLDOWN'));
assert.equal(run('waitingSplash.splashPulseState'),'coolingDown');

// Exercise the new papaya and high-tier render paths without a browser.
run('state.papayas=[{x:100,y:100,bob:0,incomeEffect:1.2}];state.balls=[4,5,6].map((tier,i)=>({special:false,x:200+i*45,y:100,tier,hp:10,maxHp:20,roll:0,hit:0}));state.balls.push({special:true,x:380,y:100,durability:7,maxDurability:10,roll:0,hit:0});draw()');

// Late-game render/update smoke test uses the full 25-unit limit and a capped 45-orb wave.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.wave=50;state.waveJobs=[{wave:50,total:45,spawned:45,resolved:0,destroyed:0,rewarded:false,spawnTimer:1}];state.towers=[...Array.from({length:15},(_,i)=>createElephant(i%3===0?"eyewear":"elephant",70+(i%5)*190,80+Math.floor(i/5)*300)),...Array.from({length:5},(_,i)=>createElephant("foodie",120+i*190,1250))];state.papayas=Array.from({length:5},(_,i)=>({kind:"papaya",x:80+i*200,y:660,bob:i,incomeEffect:1.2}));state.balls=buildWaveSequence(50).filter(item=>!item.special).slice(0,45).map((item,i)=>({special:false,ghost:item.ghost,targetable:true,state:"active",x:path[0].x+i,y:path[0].y,seg:0,tier:item.tier,hp:OrbProgression.hpFor(50,item.tier,CONFIG.BALL_HEALTH),maxHp:OrbProgression.hpFor(50,item.tier,CONFIG.BALL_HEALTH),reward:item.tier+1,roll:0,hit:0,wave:50}));update(.016);draw()');
assert.equal(run('state.towers.length+state.papayas.length'),25);
assert.equal(run('state.balls.length'),45);

// Floor management: repair removes hazards, reinforcement needs two hits when every known tile is reinforced, and mines destroy Engineers.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.engineerHoles=[{x:120,y:400,radius:24,repairing:true,playerRepairing:true,repairLife:.01}];update(.02)');
assert.equal(run('(state.engineerHoles||[]).length'),0);
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.floorTiles=[{key:"120:400",x:120,y:400,level:1,damage:0}];const engineer={special:true,specialType:"engineer",state:"active",rewarded:false,attracted:[]};createEngineerHole(engineer)');
assert.equal(run('(state.engineerHoles||[]).length'),0);
run('createEngineerHole(engineer)');
assert.equal(run('(state.engineerHoles||[]).length'),1);
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.floorTiles=[{key:"120:400",x:120,y:400,level:2,damage:0}];const minedEngineer={special:true,specialType:"engineer",state:"active",rewarded:false,attracted:[],reward:1,x:120,y:400};state.balls=[minedEngineer];createEngineerHole(minedEngineer)');
assert.equal(run('state.balls.includes(minedEngineer)'),false);

// Normal mines can be selected for an explicit Level 2 upgrade.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.floorTiles=[{key:"140:420",x:140,y:420,level:2,mineLevel:1,damage:0}];var mineUpgrade=floorActionAt({x:140,y:420})');
assert.equal(run('mineUpgrade.kind'),'upgradeMine');
assert.equal(run('mineUpgrade.cost'),run('CONFIG.landmineLevelTwoUpgradeCost'));

// A Level 2 mine consumes itself, destroys the Engineer, and damages only the two closest extra orbs.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.floorTiles=[{key:"140:420",x:140,y:420,level:2,mineLevel:2,damage:0}];const blastEngineer={special:true,specialType:"engineer",state:"active",targetable:true,rewarded:false,attracted:[],reward:1,x:140,y:420};const blastA={special:false,ghost:false,state:"active",targetable:true,hp:100,maxHp:100,tier:1,reward:1,x:160,y:420};const blastB={special:false,ghost:false,state:"active",targetable:true,hp:100,maxHp:100,tier:1,reward:1,x:180,y:420};const blastC={special:false,ghost:false,state:"active",targetable:true,hp:100,maxHp:100,tier:1,reward:1,x:200,y:420};state.balls=[blastEngineer,blastA,blastB,blastC];createEngineerHole(blastEngineer)');
assert.equal(run('state.floorTiles[0].level'),1);
assert.equal(run('state.balls.includes(blastEngineer)'),false);
assert.equal(run('blastA.hp'),50);
assert.equal(run('blastB.hp'),50);
assert.equal(run('blastC.hp'),100);

// Only Level 2 mines injure fleeing elephants; injury penalties last for the run.
run('reset();tutorialData.completed=true;state.tutorialActive=false;delete achievementData.unlocked["watch-your-step"];state.currentHealth=95;const injuredTower=createElephant("elephant",140,420),injuryTarget={special:false,ghost:false,tier:1};injuredTower.behavior="fleeingFumeOrb";state.towers=[injuredTower];state.floorTiles=[{key:"140:420",x:140,y:420,level:2,mineLevel:2,damage:0}];const healthyDamage=injuryDamageAgainstBase(injuredTower,injuryTarget),healthyCooldown=injuryAttackCooldownBase(injuredTower,injuryTarget);injureElephantWithMine(injuredTower,state.floorTiles[0])');
assert.equal(run('injuredTower.injured'),true);
approximately(run('damageAgainst(injuredTower,injuryTarget)'),run('healthyDamage*.75'));
approximately(run('attackCooldownFor(injuredTower,injuryTarget)'),run('healthyCooldown/.7'));
assert.equal(run('state.floorTiles[0].level'),1);
assert.equal(run('achievementData.unlocked["watch-your-step"]!==undefined'),true);
run('const normalMine={key:"200:420",x:200,y:420,level:2,mineLevel:1,damage:0},safeFleeing=createElephant("elephant",200,420);safeFleeing.behavior="fleeingFumeOrb";state.floorTiles=[normalMine];state.towers=[safeFleeing];update(0)');
assert.equal(run('safeFleeing.injured'),undefined);
assert.equal(run('normalMine.level'),2);

// Engineer fumes follow Fume immunity rules: Gas Mask Elephants stay put.
run('reset();tutorialData.completed=true;state.tutorialActive=false;const engineerFear={special:true,specialType:"engineer",x:150,y:150,attracted:[]},engineerWater=createElephant("elephant",170,150),engineerGas=createElephant("gas",180,150);state.towers=[engineerWater,engineerGas];affectElephants(engineerFear)');
assert.equal(run('engineerWater.behavior'),'fleeingFumeOrb');
assert.equal(run('engineerGas.behavior'),'home');

// Level 5 Splash Elephants must make one permanent specialization choice.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.currency=9999;const levelFiveSplash=createElephant("splash",300,300);levelFiveSplash.level=4;applyLevelStats(levelFiveSplash);state.towers=[levelFiveSplash];selectTower(levelFiveSplash);upgradeSelected()');
assert.equal(run('levelFiveSplash.level'),5);
assert.equal(run('levelFiveSplash.specializationPending'),true);
assert.equal(run('levelFiveSplash.specializationChosen'),false);
assert.equal(run('state.splashSpecializationTower'),run('levelFiveSplash'));
assert.equal(run('state.paused'),false);
assert.equal(run('splashSpecializationUI.modal.classList.contains("hidden")'),false);
assert.equal(run('state.selectedTower'),run('levelFiveSplash'));
run('closeSplashSpecialization()');
assert.equal(run('state.splashSpecializationTower'),null);
assert.equal(run('levelFiveSplash.specializationPending'),true);
assert.equal(run('ui.towerLevel.textContent.includes("SPECIALIZATION REQUIRED")'),true);
run('selectTower(levelFiveSplash)');
assert.equal(run('state.splashSpecializationTower'),run('levelFiveSplash'));
run('chooseSplashSpecialization("standard")');
assert.equal(run('levelFiveSplash.splashSpecialization'),'standard');
assert.equal(run('levelFiveSplash.specializationChosen'),true);
assert.equal(run('levelFiveSplash.specializationPending'),false);
assert.equal(run('levelFiveSplash.name'),'STANDARD SPLASH ELEPHANT');
run('state.currency=9999;selectTower(levelFiveSplash);upgradeSelected()');
assert.equal(run('levelFiveSplash.splashSpecialization'),'standard');
assert.equal(run('state.splashSpecializationTower'),null);
run('const loadedUnspecializedSplash=createElephant("splash",500,300);loadedUnspecializedSplash.level=5;applyLevelStats(loadedUnspecializedSplash);state.towers=[levelFiveSplash,loadedUnspecializedSplash];selectTower(loadedUnspecializedSplash)');
assert.equal(run('state.splashSpecializationTower'),run('loadedUnspecializedSplash'));
assert.equal(run('loadedUnspecializedSplash.specializationPending'),true);
run('chooseSplashSpecialization("gas")');
assert.equal(run('loadedUnspecializedSplash.splashSpecialization'),'gas');
assert.equal(run('loadedUnspecializedSplash.specializationChosen'),true);
run('selectTower(loadedUnspecializedSplash)');
assert.equal(run('state.splashSpecializationTower'),null);
run('const chosenSplashTypes=["gas","foodie","ghost"].map((type,index)=>{const tower=createElephant("splash",350+index*60,300);tower.level=5;applyLevelStats(tower);state.splashSpecializationTower=tower;chooseSplashSpecialization(type);return tower.splashSpecialization})');
assert.deepEqual(Array.from(run('chosenSplashTypes')),['gas','foodie','ghost']);

// All four choices keep Splash's AoE stats; non-standard variants reduce final damage by 5%.
run('const specs=["standard","gas","foodie","ghost"].map((specialization,index)=>{const tower=createElephant("splash",400+index*80,300);tower.level=5;applyLevelStats(tower);tower.splashSpecialization=specialization;tower.name=splashSpecializationName(tower);return tower});const specTarget={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:200,maxHp:200,reward:1,x:400,y:300};state.towers=specs');
const standardSplashDamage=run('damageAgainst(specs[0],specTarget)');
approximately(run('damageAgainst(specs[1],specTarget)'),standardSplashDamage*.95);
approximately(run('damageAgainst(specs[2],specTarget)'),standardSplashDamage*.95);
approximately(run('damageAgainst(specs[3],specTarget)'),standardSplashDamage*.95);
assert.equal(run('specs.every(t=>t.radius===specs[0].radius)'),true);

// Ghost Scout Splash includes ghosts in its area-wide pulse; Foodie Splash orders Food Orbs first.
run('const ghostSplash=specs[3],ghostPulse={special:false,ghost:true,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:ghostSplash.x+10,y:ghostSplash.y},normalPulse={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:ghostSplash.x+18,y:ghostSplash.y};state.balls=[ghostPulse,normalPulse]');
assert.equal(run('splashTargetsInRange(ghostSplash).length'),2);
run('ghostSplash.splashAttack={phase:"spraying",elapsed:0,hitApplied:false};applySplashPulseHit(ghostSplash)');
assert.equal(run('ghostPulse.hp<100&&normalPulse.hp<100'),true);
run('const foodieSplash=specs[2],foodPriorityNormal={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:100,maxHp:100,reward:1,x:foodieSplash.x+10,y:foodieSplash.y},foodPriorityOrb={special:true,specialType:"food",targetable:true,state:"active",durability:10,maxDurability:10,hp:10,x:foodieSplash.x+20,y:foodieSplash.y};state.balls=[foodPriorityNormal,foodPriorityOrb]');
assert.equal(run('splashTargetsInRange(foodieSplash)[0]'),run('foodPriorityOrb'));

// Gas and Foodie Splash variants inherit their respective fear/lure immunities.
run('const gasSplash=specs[1];gasSplash.behavior="home";const gasFume={special:true,specialType:"fume",x:gasSplash.x+10,y:gasSplash.y,attracted:[]};state.towers=[gasSplash];affectElephants(gasFume)');
assert.equal(run('gasSplash.behavior'),'home');
run('foodieSplash.behavior="home";const foodLure={special:true,specialType:"food",x:foodieSplash.x+10,y:foodieSplash.y,attracted:[]};state.towers=[foodieSplash];affectElephants(foodLure)');
assert.equal(run('foodieSplash.behavior'),'home');

// Robot Elephants cap at three placements and Mini Robots use Tier 0 scaling while marching backward from the exit.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.wave=10;const robots=[createRobotElephant(100,300),createRobotElephant(200,300),createRobotElephant(300,300)];state.towers=robots');
assert.equal(run('robotElephantCount()'),3);
assert.equal(run('robotElephantCount()<ROBOT_ELEPHANT_LIMIT'),false);
const tierZeroWaveTen=run('OrbProgression.hpFor(10,0,CONFIG.TIER0_ORB_HEALTH)');
assert.equal(run('miniRobotMaximumHealth(robots[0])'),Math.round(tierZeroWaveTen*.85));
run('robots[0].level=5;applyLevelStats(robots[0])');
assert.equal(run('miniRobotMaximumHealth(robots[0])'),Math.round(Math.round(tierZeroWaveTen*1.8)*.85));
run('state.miniRobots=[];const backwardMini=createMiniRobot(robots[0]);const miniStartSegment=backwardMini.backSeg,miniStartX=backwardMini.x,miniStartY=backwardMini.y;moveMiniRobotBackward(backwardMini,1)');
assert.equal(run('backwardMini.backSeg<miniStartSegment||backwardMini.x!==miniStartX||backwardMini.y!==miniStartY'),true);
assert.equal(run('Math.abs(backwardMini.turn)<=Math.PI/2'),true);
assert.equal(run('path.slice(1).every((point,index)=>{const previous=path[index],mini={facing:1,turn:0};setMiniRobotTravelDirection(mini,previous.x-point.x,previous.y-point.y);return Math.abs(mini.targetTurn)<=Math.PI/2&&Math.abs(mini.facing)===1})'),true);
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.currency=9999;buyRobotElephant()');
assert.equal(run('state.placement'),'robot');
assert.equal(run('placementRange()'),run('CONFIG.ELEPHANT_RADIUS'));
run('mouse.x=420;mouse.y=360;mouse.inside=true;draw()');
run('const robotTower=createRobotElephant(420,360);state.towers=[robotTower];selectTower(robotTower)');
assert.equal(run('robotTower.towerType'),'robot');
assert.equal(run('robotTower.radius'),0);
assert.equal(run('ui.selectedTypeLabel.textContent'),'SELECTED ROBOT ELEPHANT');
assert.equal(run('ui.towerName.textContent'),'ROBOT ELEPHANT');
run('drawElephant(robotTower,false,true,true);drawElephant(robotTower,true,true,false)');
run('upgradeSelected();upgradeSelected();upgradeSelected();upgradeSelected()');
assert.equal(run('robotTower.level'),5);
assert.equal(run('ui.towerRange.textContent'),'Gun • RPG • Crowbar');
run('const restoredRobot={kind:"elephant",towerType:"robot",towerId:77,name:"ROBOT ELEPHANT",purchasePrice:ROBOT_ELEPHANT_COST,sold:false,level:3,x:500,y:360,homeX:500,homeY:360,behavior:"home",cooldown:0,angle:-.4,facing:1,attack:0,recoil:0,targetMode:"first",miniSpawnTimer:.1};applyLevelStats(restoredRobot);state.towers=[restoredRobot];selectTower(restoredRobot);drawElephant(restoredRobot,false,true,true);createMiniRobot(restoredRobot);drawMiniRobot(state.miniRobots[0])');
assert.equal(run('restoredRobot.radius'),0);
assert.equal(run('canTowerTarget(restoredRobot,{})'),false);
assert.equal(run('ui.towerAttackSpeed.textContent'),'Does not attack');
assert.equal(run('ui.upgradePreview.textContent'),'Deploys Mini Robots from the track exit. Does not attack.');
assert.equal(run('state.miniRobots.length'),1);

// Mini Robots shut down at the start before they can attack freshly spawned orbs.
run('const endpointOwner=restoredRobot;endpointOwner.miniSpawnTimer=999;const startPoint=path[0],endpointMini={owner:endpointOwner,x:startPoint.x,y:startPoint.y,backSeg:0,hp:10,maxHp:10,damage:99,attackSpeed:1,cooldown:0,weapon:"gun",dead:false};const freshOrb={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:50,maxHp:50,reward:9,x:startPoint.x,y:startPoint.y};state.currency=321;state.miniRobots=[endpointMini];state.balls=[freshOrb];state.miniRobotEffects=[];updateMiniRobots(.1)');
assert.equal(run('state.miniRobots.length'),0);
assert.equal(run('freshOrb.hp'),50);
assert.equal(run('state.currency'),321);
assert.equal(run('state.miniRobotEffects.some(effect=>effect.reason==="shutdown")'),true);

// Each special-orb introduction is acknowledged once per run, and skipped introductions combine.
run('reset();state.tutorialActive=false;const ghostWarning=warningLinesForSequence([],15);state.pendingWaveStart={wave:15,spawnSequence:[],warningTypes:ghostWarning.map(line=>line.type)};continueSpecialWarning()');
assert.deepEqual(Array.from(run('ghostWarning.map(line=>line.type)')),['ghost']);
assert.deepEqual(Array.from(run('warningLinesForSequence([],16).map(line=>line.type)')),[]);
run('const foodWarning=warningLinesForSequence([],20);state.pendingWaveStart={wave:20,spawnSequence:[],warningTypes:foodWarning.map(line=>line.type)};continueSpecialWarning()');
assert.deepEqual(Array.from(run('foodWarning.map(line=>line.type)')),['food']);
run('const fumeWarning=warningLinesForSequence([],25);state.pendingWaveStart={wave:25,spawnSequence:[],warningTypes:fumeWarning.map(line=>line.type)};continueSpecialWarning()');
assert.deepEqual(Array.from(run('fumeWarning.map(line=>line.type)')),['fume']);
assert.equal(run('fumeWarning[0].text.includes("mutate into Engineer Orbs")'),true);
assert.deepEqual(Array.from(run('warningLinesForSequence([],30).map(line=>line.type)')),[]);
run('reset();const combinedWarning=warningLinesForSequence([],25)');
assert.deepEqual(Array.from(run('combinedWarning.map(line=>line.type)')),['ghost','food','fume']);

// Level 5 Minis keep their spawn weapon; all three weapons retain equal damage.
run('const robotWeaponTarget={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:300,maxHp:300,reward:1,x:backwardMini.x+30,y:backwardMini.y};state.balls=[robotWeaponTarget];const robotDamage=backwardMini.damage;backwardMini.glitchBatch=false;backwardMini.permanentWeapon="gun";gameRandom=()=>.8;miniRobotAttack(backwardMini,robotWeaponTarget);const gunHp=robotWeaponTarget.hp,gunType=state.miniRobotEffects.at(-1).type;robotWeaponTarget.hp=300;gameRandom=()=>.01;miniRobotAttack(backwardMini,robotWeaponTarget);const gunHpAgain=robotWeaponTarget.hp,gunTypeAgain=state.miniRobotEffects.at(-1).type;const rpgMini={...backwardMini,permanentWeapon:"rpg",weapon:"rpg",activeWeapon:"rpg",cooldown:0};robotWeaponTarget.hp=300;miniRobotAttack(rpgMini,robotWeaponTarget);const rpgHp=robotWeaponTarget.hp,rpgType=state.miniRobotEffects.at(-1).type;const crowbarMini={...backwardMini,permanentWeapon:"crowbar",weapon:"crowbar",activeWeapon:"crowbar",cooldown:0};robotWeaponTarget.hp=300;miniRobotAttack(crowbarMini,robotWeaponTarget);const crowbarHp=robotWeaponTarget.hp,crowbarType=state.miniRobotEffects.at(-1).type');
assert.deepEqual(Array.from(run('[gunHp,gunHpAgain,rpgHp,crowbarHp]')),[300-run('robotDamage'),300-run('robotDamage'),300-run('robotDamage'),300-run('robotDamage')]);
assert.deepEqual(Array.from(run('[gunType,gunTypeAgain,rpgType,crowbarType]')),['gun','gun','rpg','crowbar']);
run('reset();state.forceMiniRobotGlitchBatch=true;const glitchOwner={level:5,miniSpawnTimer:999};const glitchMinis=Array.from({length:21},()=>createMiniRobot(glitchOwner));gameRandom=()=>.8');
assert.equal(run('glitchMinis.slice(0,20).every(mini=>mini.glitchBatch)'),true);
assert.equal(run('glitchMinis[20].glitchBatch'),false);
run('const ghostMiniTarget={special:false,ghost:true,targetable:true,state:"active",hp:20,x:100,y:100},foodMiniTarget={special:true,specialType:"food",targetable:true,state:"active",hp:20,x:100,y:100},fumeMiniTarget={special:true,specialType:"fume",targetable:true,state:"active",hp:20,x:110,y:100},engineerMiniTarget={special:true,specialType:"engineer",targetable:true,state:"active",hp:20,x:120,y:100};setMiniRobotFacing(backwardMini,0,-1,true)');
assert.equal(run('miniRobotCanTarget(ghostMiniTarget)'),false);
assert.equal(run('miniRobotCanTarget(foodMiniTarget)'),false);
assert.equal(run('miniRobotCanTarget(fumeMiniTarget)'),false);
assert.equal(run('Math.abs(backwardMini.turn)<=Math.PI/2'),true);
run('const afraidMini={owner:{level:1,miniSpawnTimer:999},x:100,y:100,backSeg:1,hp:30,maxHp:30,damage:99,attackSpeed:1,cooldown:0,weapon:"gun",permanentWeapon:"gun",activeWeapon:"gun",dead:false,facing:1,turn:0,targetTurn:0,fleeLife:0};const normalMiniTarget={special:false,ghost:false,targetable:true,state:"active",hp:100,maxHp:100,reward:1,x:102,y:100};state.towers=[];state.miniRobots=[afraidMini];state.balls=[normalMiniTarget,engineerMiniTarget];updateMiniRobots(.1)');
assert.equal(run('afraidMini.fleeLife>0'),true);
assert.equal(run('normalMiniTarget.hp'),100);

// Ramming resolves all three current-health outcomes and gives Mini Robots a destruction effect.
run('gameRandom=()=>.5;const collisionOwner=robots[0];collisionOwner.miniSpawnTimer=999;function collisionCase(miniHp,orbHp){const mini={owner:collisionOwner,x:100,y:100,backSeg:1,hp:miniHp,maxHp:miniHp,damage:0,attackSpeed:1,cooldown:1,weapon:"gun",dead:false};const orb={special:false,ghost:false,targetable:true,state:"active",tier:1,hp:orbHp,maxHp:orbHp,reward:1,x:100,y:100,wave:0};state.miniRobots=[mini];state.balls=[orb];state.miniRobotEffects=[];updateMiniRobots(0);return{miniAlive:state.miniRobots.length,orbAlive:state.balls.length,effects:state.miniRobotEffects.length}}var miniLoses=collisionCase(5,10),orbLoses=collisionCase(10,5),bothLose=collisionCase(7,7)');
assert.deepEqual(JSON.parse(JSON.stringify(run('miniLoses'))),{miniAlive:0,orbAlive:1,effects:1});
assert.deepEqual(JSON.parse(JSON.stringify(run('orbLoses'))),{miniAlive:1,orbAlive:0,effects:0});
assert.deepEqual(JSON.parse(JSON.stringify(run('bothLose'))),{miniAlive:0,orbAlive:0,effects:1});

// Q owns Floor Management; R rotates a placement in four safe, persistent poses.
assert.match(html,/id="floorManage" class="floor-manage" type="button" hidden><b>Q<\/b>/);
assert.match(fs.readFileSync('./game.js','utf8'),/event\.key\.toLowerCase\(\)===\'q\'/);
assert.match(fs.readFileSync('./game.js','utf8'),/owner\.miniSpawnTimer=8/);
assert.match(html,/id="rotatePlacementHint"[^>]*>R — ROTATE/);
run('reset();state.placement="elephant";state.placementRotation=0;const rotation0=placementPreviewPose();state.placementRotation=1;const rotation90=placementPreviewPose();state.placementRotation=2;const rotation180=placementPreviewPose();state.placementRotation=3;const rotation270=placementPreviewPose()');
assert.equal(run('rotation0.facing'),1);
assert.equal(run('rotation90.angle'),Math.PI/2);
assert.deepEqual(JSON.parse(JSON.stringify(run('rotation180'))),{angle:-.4,facing:-1});
assert.equal(run('rotation270.angle'),-Math.PI/2);
run('state.placementRotation=2;const rotatedPlaced=createElephant("base",360,340);state.placement=null');
assert.deepEqual(JSON.parse(JSON.stringify(run('({angle:rotatedPlaced.angle,facing:rotatedPlaced.facing,rotation:rotatedPlaced.placementRotation})'))),{angle:-.4,facing:-1,rotation:2});

// Clear attacks retain damage while exposing their target and the RPG destruction cloud metadata.
run('state.balls=[{special:false,ghost:false,targetable:true,state:"active",tier:1,hp:1,maxHp:1,reward:1,x:backwardMini.x+30,y:backwardMini.y}];gameRandom=()=>.4;miniRobotAttack(backwardMini,state.balls[0])');
assert.equal(run('state.miniRobotEffects.at(-1).destroyedTarget'),true);
assert.equal(run('state.miniRobotEffects.at(-1).hitX'),run('backwardMini.x+30'));

// The post-Wave-50 finale has a cinematic, fixed sequence, calculated boss HP, and replay UI.
const finaleCss=fs.readFileSync('./finale.css','utf8');
assert.match(html,/id="finaleCutscene"/);
assert.match(html,/id="skipFinaleCutscene"/);
assert.match(html,/id="bossHealthHud"/);
assert.match(html,/<section id="bossHealthHud"/);
assert.doesNotMatch(html,/<aside id="bossHealthHud"/);
assert.match(html,/id="replayFinale"/);
assert.match(finaleCss,/\.finale-scene\.fusion/);
assert.match(finaleCss,/\.boss-health-hud/);
assert.match(finaleCss,/\.boss-health-hud\{[^}]*height:auto;[^}]*pointer-events:none/);
assert.deepEqual(Array.from(run('FINAL_ENCOUNTER_SEQUENCE.map(marker=>marker.boss?"boss":marker.special?marker.specialType:`tier-${marker.tier}`)')),[
  'tier-0','tier-1','tier-2','tier-3','tier-4','tier-5','food','tier-6','fume','tier-7','engineer','tier-8','tier-9','tier-10','boss'
]);
const expectedFinalBossHp=run('2*FINAL_ENCOUNTER_SEQUENCE.slice(0,-1).reduce((sum,marker)=>sum+finaleOrbMaximumHealth(marker),0)');
assert.equal(run('calculateFinalBossMaximumHealth()'),expectedFinalBossHp);

// Watching or skipping always enters the encounter; replaying later does not start it again.
run('clearFinaleSave();reset();tutorialData.completed=true;state.tutorialActive=false;state.wave=50;state.waveJobs=[{wave:50,total:1,spawned:1,resolved:1,destroyed:1,rewarded:true}];beginFinaleFromWave50()');
assert.equal(run('state.finale.phase'),'cutscene');
run('updateFinaleCutscene(11)');
assert.equal(run('state.finale.phase'),'encounter');
assert.equal(run('state.balls.length'),0);
run('state.finale.phase="complete";state.status="won";showFinaleCutscene(true,0);endFinaleCutscene()');
assert.equal(run('state.finale.phase'),'complete');
assert.equal(run('state.balls.length'),0);
run('state.status="playing";state.finale={phase:"cutscene",cutsceneTime:0,nextIndex:0,bossMaxHp:0};endFinaleCutscene()');
assert.equal(run('state.finale.phase'),'encounter');

// Exactly one finale orb is active, and the pre-boss markers use their normal special mechanics.
run('state.finale.nextIndex=0;state.finale.spawnDelay=0;state.balls=[];updateFinalEncounter(0)');
assert.equal(run('state.balls.length'),1);
assert.equal(run('state.balls[0].tier'),0);
run('updateFinalEncounter(10)');
assert.equal(run('state.balls.length'),1);
run('state.balls=[];let finaleRandom=.137;gameRandom=()=>{finaleRandom=(finaleRandom+.271)%1;return finaleRandom};const finaleSpecials=[];for(const index of [6,8,10]){const orb=spawnFinalEncounterOrb(index);finaleSpecials.push({type:orb.specialType,durability:orb.maxDurability,hole:!!orb.engineerHole});state.balls=[]}');
assert.deepEqual(JSON.parse(JSON.stringify(run('finaleSpecials'))),[
  {type:'food',durability:10,hole:false},{type:'fume',durability:10,hole:false},{type:'engineer',durability:10,hole:true}
]);

// The boss is a non-Ghost target for every attacking elephant family and exposes exact health.
run('state.balls=[];state.finale.bossMaxHp=calculateFinalBossMaximumHealth();const finaleBoss=createFusedPrismaticBoss(14);updateBossHealthHud()');
assert.equal(run('finaleBoss.maxHp'),expectedFinalBossHp);
assert.equal(run('finaleBoss.ghost'),false);
assert.equal(run('finaleBoss.bossEndpointDamage'),100);
assert.equal(run('["base","eyewear","foodie","gas","splash"].every(type=>canTowerTarget({towerType:type,lureOrb:null},finaleBoss))'),true);
assert.equal(run('finaleUI.bossText.textContent'),`${expectedFinalBossHp.toLocaleString()} / ${expectedFinalBossHp.toLocaleString()} HP`);
run('drawBall(finaleBoss)');

// Saving during the cutscene or encounter restores the exact stage, completed index, and active orb HP/position.
run('state.finale={phase:"cutscene",cutsceneTime:4.25,nextIndex:0,bossMaxHp:0,spawnDelay:0};saveFinaleState();const cutsceneSave=loadFinaleState();state.finale={phase:"idle"};restoreFinaleSave(cutsceneSave)');
assert.equal(run('state.finale.phase'),'cutscene');
assert.equal(run('state.finale.cutsceneTime'),4.25);
run('endFinaleCutscene();state.finale.nextIndex=5;state.finale.spawnDelay=0;state.balls=[];const savedActive=spawnFinalEncounterOrb(5);savedActive.hp=Math.max(1,savedActive.maxHp-17);savedActive.x=321;savedActive.y=222;saveFinaleState();const encounterSave=loadFinaleState();state.balls=[];state.finale={phase:"idle"};restoreFinaleSave(encounterSave)');
assert.equal(run('state.finale.phase'),'encounter');
assert.equal(run('state.finale.nextIndex'),5);
assert.equal(run('state.balls[0].finalEncounterIndex'),5);
assert.equal(run('state.balls[0].x'),321);
assert.equal(run('state.balls[0].hp'),run('Math.max(1,state.balls[0].maxHp-17)'));

// Defeating the boss wins once; leaking it applies the boss-only 100 endpoint damage and loses the run.
run('clearFinaleSave();reset();tutorialData.completed=true;state.tutorialActive=false;state.status="playing";state.wave=50;state.finale={phase:"encounter",nextIndex:14,bossMaxHp:calculateFinalBossMaximumHealth(),spawnDelay:0};state.waveJobs=[createFinalEncounterJob(14)];const defeatedBoss=createFusedPrismaticBoss(14);defeatedBoss.hp=1;hitOrb({towerType:"base",damage:2,lureOrb:null},defeatedBoss)');
assert.equal(run('state.finale.phase'),'complete');
assert.equal(run('state.status'),'won');
run('clearFinaleSave();reset();tutorialData.completed=true;state.tutorialActive=false;state.status="playing";state.currentHealth=100;state.wave=50;state.finale={phase:"encounter",nextIndex:14,bossMaxHp:calculateFinalBossMaximumHealth(),spawnDelay:0};state.waveJobs=[createFinalEncounterJob(14)];const leakedBoss=createFusedPrismaticBoss(14);const finaleExit=path[path.length-1];leakedBoss.x=finaleExit.x;leakedBoss.y=finaleExit.y;leakedBoss.seg=path.length-1;update(0)');
assert.equal(run('state.finale.phase'),'failed');
assert.equal(run('state.status'),'lost');
assert.equal(run('state.currentHealth'),0);
assert.equal(run('state.stats.healthLost'),100);
run('clearFinaleSave()');

// Robot Level 5 specialization panel, targeting rules, visible state, and shared Mini Robot cap.
assert.match(html,/id="robotSpecializationModal"/);
assert.match(html,/data-robot-specialization="ghost"/);
assert.match(html,/data-robot-specialization="food"/);
assert.match(html,/data-robot-specialization="fume"/);
assert.match(fs.readFileSync('./robot-specialization.css','utf8'),/\.robot-specialization-modal\{position:fixed/);
run('clearFinaleSave();reset();tutorialData.completed=true;state.tutorialActive=false;state.currency=9999;const autoRobot=createRobotElephant(340,330);state.towers=[autoRobot];selectTower(autoRobot);upgradeSelected();upgradeSelected();upgradeSelected();upgradeSelected()');
assert.equal(run('autoRobot.level'),5);
assert.equal(run('autoRobot.robotSpecializationPending'),true);
assert.equal(run('robotSpecializationUI.modal.classList.contains("hidden")'),false);
run('closeRobotSpecialization()');
assert.equal(run('autoRobot.robotSpecializationChosen'),false);
assert.equal(run('autoRobot.robotSpecializationPending'),true);
run('selectTower(null);selectTower(autoRobot)');
assert.equal(run('robotSpecializationUI.modal.classList.contains("hidden")'),false);
run('chooseRobotSpecialization("standard")');
assert.equal(run('autoRobot.robotSpecialization'),'standard');
assert.equal(run('autoRobot.robotSpecializationChosen'),true);

run('const specRobots=["ghost","food","fume"].map((type,index)=>{const tower=createRobotElephant(420+index*70,330);tower.level=5;tower.robotSpecializationPending=true;state.towers.push(tower);openRobotSpecialization(tower);chooseRobotSpecialization(type);return tower})');
assert.deepEqual(Array.from(run('specRobots.map(tower=>tower.robotSpecialization)')),['ghost','food','fume']);
assert.equal(run('specRobots.every(tower=>tower.robotSpecializationChosen)'),true);

// Rebalanced final stats apply after level scaling, and Ghost damage only takes its extra normal-orb penalty.
run('state.wave=10;const robotSpecGhostOwner=specRobots[0];const robotSpecFoodOwner=specRobots[1];const robotSpecFumeOwner=specRobots[2];const robotSpecStandardOwner=autoRobot;state.miniRobots=[];const robotSpecGhostMini=createMiniRobot(robotSpecGhostOwner),robotSpecFoodMini=createMiniRobot(robotSpecFoodOwner),robotSpecFumeMini=createMiniRobot(robotSpecFumeOwner),robotSpecStandardMini=createMiniRobot(robotSpecStandardOwner);const robotSpecGhostTarget={special:false,ghost:true,targetable:true,state:"active",hp:500,maxHp:500,x:robotSpecGhostMini.x+10,y:robotSpecGhostMini.y};const robotSpecNormalTarget={special:false,ghost:false,targetable:true,state:"active",hp:500,maxHp:500,x:robotSpecGhostMini.x+10,y:robotSpecGhostMini.y};const robotSpecFoodTarget={special:true,specialType:"food",targetable:true,state:"active",durability:10,maxDurability:10,hp:10,maxHp:10,x:robotSpecFoodMini.x+16,y:robotSpecFoodMini.y};const robotSpecFumeTarget={special:true,specialType:"fume",targetable:true,state:"active",durability:10,maxDurability:10,hp:10,maxHp:10,x:robotSpecFumeMini.x+20,y:robotSpecFumeMini.y};const robotSpecBaseMiniHp=miniRobotBaseMaximumHealth(robotSpecGhostOwner),robotSpecBaseMiniDamage=CONFIG.ELEPHANT_DAMAGE*Math.pow(1+CONFIG.DAMAGE_PER_LEVEL,robotSpecGhostOwner.level-1);state.balls=[robotSpecGhostTarget,robotSpecNormalTarget,robotSpecFoodTarget,robotSpecFumeTarget]');
assert.equal(run('robotSpecGhostMini.maxHp'),run('Math.round(robotSpecBaseMiniHp*.85)'));
approximately(run('robotSpecGhostMini.damage'),run('robotSpecBaseMiniDamage*.9'));
assert.equal(run('miniRobotCanTarget(robotSpecGhostTarget,robotSpecGhostMini)'),true);
assert.equal(run('miniRobotCanTarget(robotSpecGhostTarget,robotSpecStandardMini)'),false);
assert.equal(run('miniRobotCanTarget(robotSpecFoodTarget,robotSpecFoodMini)'),true);
assert.equal(run('miniRobotCanTarget(robotSpecFoodTarget,robotSpecStandardMini)'),false);
assert.equal(run('miniRobotFumeThreat(robotSpecFumeMini)'),null);
run('robotSpecGhostMini.permanentWeapon="gun";robotSpecGhostMini.glitchBatch=false;miniRobotAttack(robotSpecGhostMini,robotSpecGhostTarget);const robotSpecGhostDamage=500-robotSpecGhostTarget.hp;robotSpecGhostTarget.hp=500;miniRobotAttack(robotSpecGhostMini,robotSpecNormalTarget);const robotSpecGhostNormalDamage=500-robotSpecNormalTarget.hp;robotSpecFoodMini.permanentWeapon="gun";robotSpecFoodMini.glitchBatch=false;miniRobotAttack(robotSpecFoodMini,robotSpecFoodTarget)');
approximately(run('robotSpecGhostDamage'),run('robotSpecGhostMini.damage'));
approximately(run('robotSpecGhostNormalDamage'),run('robotSpecGhostMini.damage*.98'));
assert.equal(run('robotSpecFoodTarget.durability'),9);

// Food is priority-targeted; Fume immune Minis continue attacking rather than fleeing.
run('robotSpecFoodMini.cooldown=0;robotSpecFoodMini.backSeg=1;robotSpecFoodMini.x=100;robotSpecFoodMini.y=100;robotSpecFoodTarget.x=145;robotSpecFoodTarget.y=100;const robotSpecNearbyNormal={special:false,ghost:false,targetable:true,state:"active",hp:500,maxHp:500,x:130,y:100};const robotSpecNearbyFume={special:true,specialType:"fume",targetable:true,state:"active",durability:10,maxDurability:10,hp:10,maxHp:10,x:110,y:100};robotSpecFumeMini.cooldown=0;robotSpecFumeMini.backSeg=1;robotSpecFumeMini.y=100;robotSpecFumeMini.x=100;const robotSpecFumeNormal={special:false,ghost:false,targetable:true,state:"active",hp:500,maxHp:500,x:145,y:100};state.towers=[];state.miniRobots=[robotSpecFoodMini,robotSpecFumeMini];state.balls=[robotSpecNearbyNormal,robotSpecFoodTarget,robotSpecNearbyFume,robotSpecFumeNormal];const robotSpecFoodPriority=state.balls.filter(orb=>miniRobotCanTarget(orb,robotSpecFoodMini)).sort((a,b)=>Number(b.special&&b.specialType==="food")-Number(a.special&&a.specialType==="food")||dist(robotSpecFoodMini,a)-dist(robotSpecFoodMini,b))[0];updateMiniRobots(.01)');
assert.equal(run('robotSpecFoodPriority===robotSpecFoodTarget'),true);
assert.equal(run('robotSpecFumeMini.fleeLife||0'),0);
assert.equal(run('robotSpecFumeMini.attackTarget?.special'),false);

// Five active Minis are shared fairly; timers freeze at cap and the next owner replaces a despawned Mini.
run('reset();tutorialData.completed=true;state.tutorialActive=false;state.status="playing";state.wave=10;const capOwners=[createRobotElephant(100,300),createRobotElephant(200,300),createRobotElephant(300,300)];for(const owner of capOwners){owner.miniSpawnTimer=0;owner.level=5;owner.robotSpecialization="standard";owner.robotSpecializationChosen=true}state.towers=capOwners;state.miniRobots=[];state.miniRobotSpawnCursor=0;for(let tick=0;tick<5;tick++){for(const owner of capOwners)owner.miniSpawnTimer=0;updateMiniRobots(0)}const capSpawnOrder=state.miniRobots.map(mini=>mini.owner.towerId);const pausedTimers=capOwners.map(owner=>owner.miniSpawnTimer);updateMiniRobots(3);const frozenTimers=capOwners.map(owner=>owner.miniSpawnTimer);destroyMiniRobot(state.miniRobots[0]);for(const owner of capOwners)owner.miniSpawnTimer=0;updateMiniRobots(0);for(const owner of capOwners)owner.miniSpawnTimer=0;updateMiniRobots(0);const replacementOwner=state.miniRobots.at(-1).owner.towerId');
assert.equal(run('state.miniRobots.length'),5);
assert.deepEqual(Array.from(run('capSpawnOrder.slice(0,5)')),[run('capOwners[0].towerId'),run('capOwners[1].towerId'),run('capOwners[2].towerId'),run('capOwners[0].towerId'),run('capOwners[1].towerId')]);
assert.deepEqual(JSON.parse(JSON.stringify(run('pausedTimers'))),JSON.parse(JSON.stringify(run('frozenTimers'))));
assert.equal(run('replacementOwner'),run('capOwners[2].towerId'));
run('clearFinaleSave()');

console.log('Game integration tests passed: 50 waves, towers, finale, robot specializations, collections, tutorials, limits, persistence, controls, and render paths.');
