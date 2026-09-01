// Data-driven first section of the Frozen Expanse opening cinematic.
(function(root){
  'use strict';
  const MAP_ID='frozen_expanse',VIEW_KEY='elephant-track-ice-opening-viewed-v1';
  const ICE_OPENING_SCENES=Object.freeze([
    {id:'arrival',duration:4.5},
    {id:'lab-reveal',duration:3.4,dialogue:'Elephants are stronger. We need a solution.',followupDialogue:'Begin testing the cold-serum.'},
    {id:'failed-one',duration:4.1,dialogue:'First sample was a failure. We need to try again.'},
    {id:'failed-two',duration:3.7,dialogue:'Another failure.'},
    {id:'failed-three',duration:4.2,dialogue:'The reaction is not constant, only more testing will give us a clear answer.'},
    {id:'shield-create',duration:4.3,dialogue:'Perfect. Shield of living ice.'},
    {id:'snow-create',duration:4.3,dialogue:'And this one freezes them in place.'},
    {id:'freeze-test',duration:4.2,dialogue:"Now let's see what the elephants can do against them."},
    {id:'freeze-result',duration:3.1,dialogue:'Frozen. Exactly as we wanted.'},
    {id:'shield-hit-one',duration:2.7},
    {id:'shield-hit-two',duration:3.4,dialogue:'The shield can be broken... but it will slow them.'},
    {id:'success',duration:2.8},
    {id:'fade',duration:1.5}
  ]);
  root.ICE_OPENING_SCENES=ICE_OPENING_SCENES;
  const modal=document.querySelector('#iceOpeningCutscene'),scene=document.querySelector('#iceOpeningScene'),speech=document.querySelector('.ice-scientist-speech'),characterCanvas=document.querySelector('#iceOpeningCharacters'),injectionCanvas=document.querySelector('#iceOpeningInjection'),skip=document.querySelector('#skipIceOpeningCutscene'),mapSelectionModal=document.querySelector('#mapSelectionModal'),difficultyModal=document.querySelector('#difficultyModal'),replayNotice=document.querySelector('#iceOpeningReplayNotice');
  // Render the existing gameplay orb at this resolution, then composite it
  // one-to-one into the laboratory close-up.  This keeps the large scientist
  // crisp rather than enlarging a small raster capture.
  const PLATINUM_CUTSCENE_SCALE=5.6848;
  const INJECTION_COMPLETE_AT=2.15;
  // The exterior takes .8 seconds to clear. The opening speech is gated until
  // the laboratory and its gameplay-rendered scientist are visibly established.
  const DIALOGUE_CUES=Object.freeze({'lab-reveal':1.05,'failed-one':4.1,'failed-two':4.1,'failed-three':4.2,'shield-create':2.85,'snow-create':2.85,'freeze-test':.7,'freeze-result':1.1,'shield-hit-two':3});
  // Cutscene-only event gates mirror gameplay visual durations while providing
  // deliberate result holds; gameplay attack speed and mutation rules stay out
  // of this data entirely.
  const OUTDOOR_TEST_TIMING=Object.freeze({snow:{prepareAt:.7,impactAt:1.28,frozenHold:2},shield:{windupDuration:.3,projectileDuration:.42,firstImpactAt:.9,crackHold:1.25,secondImpactAt:.9,postBreakHold:2}});
  const TRIAL_SUBJECT_IDS=Object.freeze(['failed-one','failed-two','failed-three','tier-ten','tier-nine']);
  // This is deliberately runtime-only.  A cinematic is a screen overlay, not a
  // map run: nothing in this object belongs in the player profile or run save.
  const runtime={active:false,replay:false,index:0,elapsed:0,cinematicTime:0,previousPaused:false,returnState:null,cutsceneState:null,lastError:null,dialogue:null,trialSubjects:{},survivorMetrics:null};
  function hasViewed(){try{return localStorage.getItem(VIEW_KEY)==='viewed'}catch{return false}}
  function markViewed(){try{localStorage.setItem(VIEW_KEY,'viewed')}catch{}}
  function clearPhaseDialogue(){runtime.dialogue=null;if(scene)scene.dataset.dialogue='';if(speech)speech.dataset.dialogue=''}
  function lockSurvivorTransforms(){
    if(!scene)return;
    for(const selector of ['.survivor-nine','.survivor-ten','.tier-nine-orb','.tier-ten-orb'])for(const node of scene.querySelectorAll?.(selector)||[]){node.style.transform='translate(0, 0) scale(1) rotate(0deg)';node.style.animation='none';node.style.transition='none';node.style.filter='none'}
  }
  function subjectDataKey(id){return`subject${id.replace(/(^|-)([a-z])/g,(_,prefix,letter)=>letter.toUpperCase())}`}
  function resetTrialSubjects(){runtime.trialSubjects=Object.fromEntries(TRIAL_SUBJECT_IDS.map(id=>[id,'untested']));runtime.survivorMetrics=null;if(scene)for(const id of TRIAL_SUBJECT_IDS)scene.dataset[subjectDataKey(id)]='untested';lockSurvivorTransforms()}
  function setTrialSubjectState(id,value){if(!TRIAL_SUBJECT_IDS.includes(id)||runtime.trialSubjects[id]===value)return;runtime.trialSubjects[id]=value;if(scene)scene.dataset[subjectDataKey(id)]=value}
  function updateTrialSubjectStates(phase){const subject=phase==='shield-create'?'tier-ten':phase==='snow-create'?'tier-nine':phase;if(!TRIAL_SUBJECT_IDS.includes(subject))return;if(runtime.trialSubjects[subject]==='untested')setTrialSubjectState(subject,'testing');if(runtime.elapsed<INJECTION_COMPLETE_AT)return;if(subject.startsWith('failed-')){if(runtime.elapsed>=4)setTrialSubjectState(subject,'failed');return}setTrialSubjectState(subject,subject==='tier-ten'?'survivedIceShield':'survivedSnowCap')}
  function outdoorResultHoldComplete(phase){if(phase==='freeze-test')return runtime.elapsed>=OUTDOOR_TEST_TIMING.snow.impactAt+OUTDOOR_TEST_TIMING.snow.frozenHold;if(phase==='shield-hit-one')return runtime.elapsed>=OUTDOOR_TEST_TIMING.shield.firstImpactAt+OUTDOOR_TEST_TIMING.shield.crackHold;if(phase==='shield-hit-two')return runtime.elapsed>=OUTDOOR_TEST_TIMING.shield.secondImpactAt+OUTDOOR_TEST_TIMING.shield.postBreakHold;return true}
  function setPhase(index){runtime.index=index;runtime.elapsed=0;clearPhaseDialogue();if(scene){const phase=ICE_OPENING_SCENES[index]||{};scene.dataset.phase=phase.id||'fade';delete scene.dataset.injectionComplete}lockSurvivorTransforms();drawOpeningCharacters()}
  function dialogueReadDuration(text){return Math.max(2.5,Math.min(5.4,String(text||'').length/25))}
  function phaseDialogueLines(phase){if(!phase?.dialogue)return[];const lines=[{text:phase.dialogue,cue:DIALOGUE_CUES[phase.id]??0}];if(phase.followupDialogue)lines.push({text:phase.followupDialogue,cue:0});return lines}
  function updatePhaseDialogue(phase){const lines=phaseDialogueLines(phase);if(!lines.length)return true;let current=runtime.dialogue;if(!current){current=runtime.dialogue={phase:runtime.index,line:0,startedAt:null,complete:false}}const line=lines[current.line];if(current.startedAt===null){if(runtime.elapsed<line.cue)return false;current.startedAt=runtime.elapsed;current.duration=dialogueReadDuration(line.text);if(scene)scene.dataset.dialogue=line.text;if(speech)speech.dataset.dialogue=line.text;return false}if(runtime.elapsed-current.startedAt<current.duration)return false;if(current.line<lines.length-1){current.line++;current.startedAt=null;if(scene)scene.dataset.dialogue='';if(speech)speech.dataset.dialogue='';return false}current.complete=true;if(scene)scene.dataset.dialogue='';if(speech)speech.dataset.dialogue='';return true}
  // These cutscene frames call the active gameplay renderers directly.  They
  // are captured from the game canvas, then composited into the cinematic;
  // no cutscene-specific approximation of the elephant or orb exists here.
  function captureGameplaySprite(drawSprite,subject,size=150,renderScale=1,ringRotation=0,renderTime=null){if(typeof ctx==='undefined'||!ctx?.getImageData||!canvas)return null;const scale=Math.max(1,renderScale),frameSize=Math.max(1,Math.min(Math.ceil(size*scale),canvas.width,canvas.height)),cx=frameSize/(2*scale),cy=frameSize/(2*scale),saved=ctx.getImageData(0,0,frameSize,frameSize),previousGameTime=state?.gameTime;try{if(state&&Number.isFinite(renderTime))state.gameTime=renderTime;else if(ringRotation&&state)state.gameTime=ringRotation/1.8;ctx.save();ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,frameSize/scale,frameSize/scale);drawSprite({...subject,x:cx,y:cy});const frame=ctx.getImageData(0,0,frameSize,frameSize),sprite=document.createElement('canvas');sprite.width=frameSize;sprite.height=frameSize;sprite.getContext('2d').putImageData(frame,0,0);return sprite}finally{if((ringRotation||Number.isFinite(renderTime))&&state)state.gameTime=previousGameTime;ctx.putImageData(saved,0,0);ctx.restore()}}
  const INJECTION_PHASES=Object.freeze({
    'failed-one':{x:.742,y:.43,supplyIndex:0},'failed-two':{x:.83,y:.43,supplyIndex:1},'failed-three':{x:.918,y:.43,supplyIndex:2},
    'shield-create':{x:.34,y:.33,supplyIndex:3},'snow-create':{x:.46,y:.33,supplyIndex:4}
  });
  const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  function syncSurvivorChamberDimensions(rect){
    const originals=scene?.querySelectorAll?.('.ice-chambers .ice-chamber'),firstChamber=originals?.[0],secondChamber=originals?.[1],bounds=firstChamber?.getBoundingClientRect?.(),secondBounds=secondChamber?.getBoundingClientRect?.();
    if(bounds?.width&&bounds?.height){
      const viewportChanged=!runtime.survivorMetrics||runtime.survivorMetrics.viewportWidth!==rect.width||runtime.survivorMetrics.viewportHeight!==rect.height;
      if(viewportChanged){
        const centerGap=secondBounds?.width?secondBounds.left+secondBounds.width/2-(bounds.left+bounds.width/2):bounds.width;
        // Capture a scale from the fixed chamber geometry, never from an
        // animated .chamber-orb bounding box.  A failed orb may transform,
        // but Tier 9 and Tier 10 keep this base scale for the whole playback.
        runtime.survivorMetrics={viewportWidth:rect.width,viewportHeight:rect.height,width:bounds.width,height:bounds.height,centerGap,orbDiameter:bounds.width*.56};
      }
      const metrics=runtime.survivorMetrics;scene.style.setProperty('--survivor-chamber-width',`${metrics.width}px`);scene.style.setProperty('--survivor-chamber-height',`${metrics.height}px`);scene.style.setProperty('--original-chamber-center-gap',`${metrics.centerGap}px`);return metrics;
    }
    return runtime.survivorMetrics||{width:rect.width*.078,height:rect.height*.36,orbDiameter:rect.width*.078*.56};
  }
  function injectionTargetPosition(rect,phase){const targetData=INJECTION_PHASES[phase];if(!targetData)return null;const survivor=(phase==='shield-create'?'survivor-ten':phase==='snow-create'?'survivor-nine':null),chamber=survivor&&scene?.querySelector?.(`.${survivor}`),stand=chamber?.querySelector?.('i'),bounds=chamber?.getBoundingClientRect?.(),standBounds=stand?.getBoundingClientRect?.(),originalOrb=scene?.querySelector?.('.ice-chambers .chamber-orb')?.getBoundingClientRect?.(),orbDiameter=runtime.survivorMetrics?.orbDiameter||originalOrb?.width;if(bounds?.width&&standBounds?.top&&orbDiameter)return{x:bounds.left-rect.left+bounds.width/2,y:standBounds.top-rect.top-orbDiameter/2-2};return{x:rect.width*targetData.x,y:rect.height*targetData.y}}
  function injectionProgress(phase){return INJECTION_PHASES[phase]?Math.max(0,runtime.elapsed):null}
  function scientistPosition(rect,phase,elapsed){
    const idle={x:rect.width*.54,y:rect.height*.47},table={x:rect.width*.49,y:rect.height*.57},targetData=INJECTION_PHASES[phase];if(!targetData)return idle;
    const target=injectionTargetPosition(rect,phase),angle=Math.atan2(target.y-table.y,target.x-table.x),nearTarget={x:target.x-Math.cos(angle)*116,y:target.y-Math.sin(angle)*116};
    if(elapsed<.45){const p=easeInOut(elapsed/.45);return{x:idle.x+(table.x-idle.x)*p,y:idle.y+(table.y-idle.y)*p}}
    if(elapsed<.65)return table;
    if(elapsed<1.1){const p=easeInOut((elapsed-.65)/.45);return{x:table.x+(nearTarget.x-table.x)*p,y:table.y+(nearTarget.y-table.y)*p}}
    if(elapsed<2.15)return nearTarget;
    if(elapsed<2.85){const p=easeInOut((elapsed-2.15)/.7);return{x:nearTarget.x+(table.x-nearTarget.x)*p,y:nearTarget.y+(table.y-nearTarget.y)*p}}
    if(elapsed<3.4){const p=easeInOut((elapsed-2.85)/.55);return{x:table.x+(idle.x-table.x)*p,y:table.y+(idle.y-table.y)*p}}
    return idle;
  }
  function drawOpeningInjection(rect,ratio,phase){
    if(!injectionCanvas?.getContext)return;
    const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(injectionCanvas.width!==w||injectionCanvas.height!==h){injectionCanvas.width=w;injectionCanvas.height=h}
    const out=injectionCanvas.getContext('2d'),elapsed=injectionProgress(phase);out.setTransform(ratio,0,0,ratio,0,0);out.clearRect(0,0,rect.width,rect.height);
    if(elapsed===null){injectionCanvas.style.zIndex='21';characterCanvas.style.zIndex='18';return}
    const target=injectionTargetPosition(rect,phase),home={x:rect.width*.49,y:rect.height*.57};
    const direction=Math.atan2(target.y-home.y,target.x-home.x),reach={x:target.x-Math.cos(direction)*46,y:target.y-Math.sin(direction)*46};
    let position=home,plunger=0,serum=0;
    if(elapsed<.65)position=home;
    else if(elapsed<1.35) {const p=easeInOut((elapsed-.65)/.7);position={x:home.x+(reach.x-home.x)*p,y:home.y+(reach.y-home.y)*p}}
    else if(elapsed<1.85){const p=easeInOut((elapsed-1.35)/.5);position={x:reach.x+Math.cos(direction)*10*p,y:reach.y+Math.sin(direction)*10*p};plunger=p;serum=p}
    else if(elapsed<2.15){position={x:reach.x+Math.cos(direction)*10,y:reach.y+Math.sin(direction)*10};plunger=1;serum=1}
    else if(elapsed<2.85){const p=easeInOut((elapsed-2.15)/.7);position={x:reach.x+(home.x-reach.x)*p,y:reach.y+(home.y-reach.y)*p};serum=Math.max(0,1-p)}
    else return;
    const inserting=elapsed>=1.35&&elapsed<=1.85;injectionCanvas.style.zIndex=inserting?'19':'21';characterCanvas.style.zIndex=inserting?'20':'18';
    out.save();out.translate(position.x,position.y);out.rotate(direction);out.lineCap='round';
    out.strokeStyle='#d9f7ff';out.lineWidth=2;out.beginPath();out.moveTo(27,0);out.lineTo(51,0);out.stroke();out.strokeStyle='#7f9aa4';out.lineWidth=1;out.beginPath();out.moveTo(27,2);out.lineTo(51,2);out.stroke();
    out.fillStyle='#dffcff';out.strokeStyle='#58808d';out.lineWidth=2;out.beginPath();out.roundRect(-35,-11,62,22,6);out.fill();out.stroke();
    out.fillStyle='#69e7ff';out.globalAlpha=.28+.62*serum;out.fillRect(-29,-6,48*serum,12);out.globalAlpha=1;
    out.strokeStyle='#f7ffff';out.lineWidth=1;for(const x of [-20,-5,10,22]){out.beginPath();out.moveTo(x,-7);out.lineTo(x,-2);out.stroke()}
    const handle=-39-13*(1-plunger);out.strokeStyle='#a9c6ce';out.lineWidth=4;out.beginPath();out.moveTo(-35,0);out.lineTo(handle,0);out.stroke();out.strokeStyle='#e7fbff';out.lineWidth=3;out.beginPath();out.moveTo(handle,-10);out.lineTo(handle,10);out.stroke();
    out.restore();
    if(serum>.04){out.save();out.globalAlpha=.16+.35*serum;out.fillStyle='#8beeff';out.shadowColor='#66eaff';out.shadowBlur=16;out.beginPath();out.arc(target.x,target.y,13+serum*9,0,Math.PI*2);out.fill();out.restore()}
  }
  function isOutdoorTestPhase(phase){return['freeze-test','freeze-result','shield-hit-one','shield-hit-two'].includes(phase)}
  function drawOutdoorRecorder(out,scientist,elapsed){
    // Recording is deliberately non-diegetic: a brief platinum-ring pulse and
    // tiny fading data sparks, never a card, tablet, panel, or floating box.
    const pulse=.35+.3*Math.sin(elapsed*5);out.save();out.globalCompositeOperation='destination-over';out.globalAlpha=pulse;out.strokeStyle='#dffcff';out.shadowColor='#8eeeff';out.shadowBlur=8;out.lineWidth=1.8;out.beginPath();out.arc(scientist.x,scientist.y-2,44,-.22,.58);out.stroke();out.globalCompositeOperation='source-over';out.fillStyle='#dffcff';out.shadowBlur=5;
    for(let index=0;index<4;index++){const phase=(elapsed*.9+index*.23)%1,angle=-.75+index*.52,x=scientist.x+Math.cos(angle)*(45+phase*12),y=scientist.y-14+Math.sin(angle)*(28+phase*7);out.globalAlpha=(1-phase)*.65;out.fillRect(x-1.5,y-1.5,3,3)}out.restore();
  }
  function drawOutdoorWaterAttack(out,elephant,target,elapsed,impactAt){
    // Reuse the normal Water Elephant's gameplay spray renderer exactly. The
    // only cutscene work here is placing that captured effect between the
    // actor and target at a slower, readable playback speed.
    const {projectileDuration}=OUTDOOR_TEST_TIMING.shield,fireAt=impactAt-projectileDuration,progress=Math.max(0,Math.min(1,(elapsed-fireAt)/projectileDuration));if(!progress||progress>=1||typeof drawSpray!=='function')return;
    const sign=target.x>=elephant.x?1:-1,start={x:elephant.x+38*sign,y:elephant.y+4},distance=Math.max(80,Math.hypot(target.x-start.x,target.y-start.y)),frameSize=Math.ceil(distance+48),spray=captureGameplaySprite(drawSpray,{x1:24,y1:frameSize/2,x2:frameSize-24,y2:frameSize/2,life:.28*(1-progress),max:.28,seed:17},frameSize);
    if(!spray)return;const angle=Math.atan2(target.y-start.y,target.x-start.x);out.save();out.translate((start.x+target.x)/2,(start.y+target.y)/2);out.rotate(angle);out.drawImage(spray,-spray.width/2,-spray.height/2);out.restore();
  }
  function drawOutdoorTestEffects(out,rect,phase,elapsed,snow,shield,elephant){out.save();if(phase==='freeze-test'){const {prepareAt,impactAt}=OUTDOOR_TEST_TIMING.snow,progress=Math.max(0,Math.min(1,(elapsed-prepareAt)/(impactAt-prepareAt)));if(progress>0&&progress<1){const x=snow.x+(elephant.x-snow.x)*progress,y=snow.y-7+(elephant.y-7-(snow.y-7))*progress;out.fillStyle='#dffcff';out.shadowColor='#74e9ff';out.shadowBlur=12;out.beginPath();out.arc(x,y,5,0,Math.PI*2);out.fill();for(let index=0;index<4;index++){const angle=index*Math.PI/2+elapsed*6;out.globalAlpha=.72;out.beginPath();out.arc(x+Math.cos(angle)*5,y+Math.sin(angle)*5,1.5,0,Math.PI*2);out.fill()}}}if(phase==='shield-hit-one')drawOutdoorWaterAttack(out,elephant,shield,elapsed,OUTDOOR_TEST_TIMING.shield.firstImpactAt);if(phase==='shield-hit-two')drawOutdoorWaterAttack(out,elephant,shield,elapsed,OUTDOOR_TEST_TIMING.shield.secondImpactAt);out.restore()}
  function drawOpeningCharacters(){
    if(!characterCanvas?.getContext||!scene)return;
    lockSurvivorTransforms();
    const rect=scene.getBoundingClientRect(),ratio=Math.max(1,root.devicePixelRatio||1),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(characterCanvas.width!==w||characterCanvas.height!==h){characterCanvas.width=w;characterCanvas.height=h}
    const out=characterCanvas.getContext('2d'),phase=scene.dataset.phase||'',outdoors=isOutdoorTestPhase(phase),size=150;
    const scientist=outdoors?{x:rect.width*.83,y:rect.height*.36}:scientistPosition(rect,phase,runtime.elapsed);
    const orb={special:false,tier:8,roll:0,hp:100,maxHp:100};
    const shieldTest=phase==='shield-hit-one'||phase==='shield-hit-two';
    const shieldImpactAt=phase==='shield-hit-one'?OUTDOOR_TEST_TIMING.shield.firstImpactAt:phase==='shield-hit-two'?OUTDOOR_TEST_TIMING.shield.secondImpactAt:Infinity;
    const shieldHits=phase==='shield-hit-one'?(runtime.elapsed<shieldImpactAt?2:1):phase==='shield-hit-two'?(runtime.elapsed<shieldImpactAt?1:0):2;
    const shieldCrackLife=phase==='shield-hit-one'&&runtime.elapsed>=shieldImpactAt ? .42 : phase==='shield-hit-two'&&runtime.elapsed>=shieldImpactAt ? Math.max(0,.62-(runtime.elapsed-shieldImpactAt)) : 0;
    const tierTen={special:false,tier:10,roll:0,hp:100,maxHp:100,iceShieldHits:shieldHits,iceShieldMaxHits:2,iceShieldImpactLife:shieldCrackLife,iceShieldCrackLife:shieldCrackLife};
    const tierTenBase={special:false,tier:10,roll:0,hp:100,maxHp:100};
    const tierNine={special:false,tier:9,roll:0,hp:100,maxHp:100,snowCovered:true,snowAttackFlash:phase==='freeze-test'&&runtime.elapsed>=OUTDOOR_TEST_TIMING.snow.prepareAt&&runtime.elapsed<OUTDOOR_TEST_TIMING.snow.impactAt?.45:0};
    const tierNineBase={special:false,tier:9,roll:0,hp:100,maxHp:100};
    const tierTenState=runtime.trialSubjects['tier-ten']||'untested',tierNineState=runtime.trialSubjects['tier-nine']||'untested';
    out.setTransform(ratio,0,0,ratio,0,0);out.clearRect(0,0,rect.width,rect.height);
    const paint=(sprite,x,y,displayScale=1)=>{if(sprite){const drawSize=sprite.width*displayScale;out.drawImage(sprite,x-drawSize/2,y-drawSize/2,drawSize,drawSize)}};
    const sharedChamber=syncSurvivorChamberDimensions(rect),labTierTen=injectionTargetPosition(rect,'shield-create'),labTierNine=injectionTargetPosition(rect,'snow-create');
    // Keep the inactive mutation in view, but set it back from the active test
    // subject so both real gameplay orbs remain legible on the snow.
    const outdoorSnow=shieldTest?{x:rect.width*.74,y:rect.height*.65}:{x:rect.width*.56,y:rect.height*.60};
    const outdoorShield=shieldTest?{x:rect.width*.56,y:rect.height*.60}:{x:rect.width*.74,y:rect.height*.65};
    const elephantPosition={x:rect.width*.29,y:rect.height*.70};
    const activeTestOrb=shieldTest?outdoorShield:outdoorSnow,elephantFacing=activeTestOrb.x>=elephantPosition.x?1:-1;
    const {windupDuration,projectileDuration}=OUTDOOR_TEST_TIMING.shield,windupStart=shieldImpactAt-projectileDuration-windupDuration,projectileStart=shieldImpactAt-projectileDuration;
    const windingUp=shieldTest&&runtime.elapsed>=windupStart&&runtime.elapsed<projectileStart,firing=shieldTest&&runtime.elapsed>=projectileStart&&runtime.elapsed<=shieldImpactAt,windupProgress=windingUp?Math.max(0,Math.min(1,(runtime.elapsed-windupStart)/windupDuration)):0;
    const elephant={kind:'elephant',towerType:'base',sold:false,facing:outdoors?elephantFacing:1,angle:0,recoil:firing?.9:windupProgress*.9,walking:false,attack:windingUp||firing?1:0,behavior:'home'};
    if(phase==='freeze-result'||phase==='freeze-test'&&runtime.elapsed>=OUTDOOR_TEST_TIMING.snow.impactAt){elephant.freezeWarmingRemaining=1;elephant.freezeFrostLife=1}
    const tierTenTarget=outdoors?outdoorShield:labTierTen,tierNineTarget=outdoors?outdoorSnow:labTierNine;
    const paintChamberOrb=(sprite,x,y)=>paint(sprite,x,y,Math.max(.1,sharedChamber.orbDiameter*5/sprite.width));
    const paintTestOrb=(sprite,x,y)=>outdoors?paint(sprite,x,y,1):paintChamberOrb(sprite,x,y);
    paint(captureGameplaySprite(drawBall,orb,size,PLATINUM_CUTSCENE_SCALE,Math.PI/4),scientist.x,scientist.y);
    if(tierTenState!=='failed')paintTestOrb(captureGameplaySprite(drawBall,tierTenState==='survivedIceShield'?tierTen:tierTenBase,size,1,0,runtime.cinematicTime),tierTenTarget.x,tierTenTarget.y);
    if(tierNineState!=='failed')paintTestOrb(captureGameplaySprite(drawBall,tierNineState==='survivedSnowCap'?tierNine:tierNineBase,size),tierNineTarget.x,tierNineTarget.y);
    if(outdoors){
      paint(captureGameplaySprite(drawElephant,elephant,size),elephantPosition.x,elephantPosition.y,1.1);
      drawOutdoorRecorder(out,scientist,runtime.elapsed);
      drawOutdoorTestEffects(out,rect,phase,runtime.elapsed,outdoorSnow,outdoorShield,elephantPosition);
    }
    drawOpeningInjection(rect,ratio,phase);
  }
  function cloneForCutscene(value){
    if(value==null)return null;
    try{return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}catch{return null}
  }
  function captureReturnState(){
    const mapSelectionOpen=!!mapSelectionModal&&!mapSelectionModal.classList.contains('hidden'),difficultyOpen=!!difficultyModal&&!difficultyModal.classList.contains('hidden');
    // Retain an in-memory record of the exact context we covered.  It is not
    // restored into state because the cutscene never mutates a playable run.
    return{screen:mapSelectionOpen?'map-select':difficultyOpen?'difficulty-select':'game',mapSelectionOpen,difficultyOpen,paused:!!state?.paused,activeMapId:root.GameContent?.activeMap?.id||null,activeRun:state?.difficultyLocked?cloneForCutscene(state):null};
  }
  function restoreReturnState(returnState){
    if(state)state.paused=!!returnState?.paused;
    if(returnState?.mapSelectionOpen)mapSelectionModal?.classList.remove('hidden');
    if(returnState?.difficultyOpen)difficultyModal?.classList.remove('hidden');
  }
  function finishIceOpening(){
    if(!runtime.active)return;
    const returnState=runtime.returnState;
    runtime.active=false;runtime.cutsceneState=null;root.iceOpeningCutsceneState=null;clearPhaseDialogue();if(!runtime.replay)markViewed();modal?.classList.add('hidden');scene?.removeAttribute('data-replaying');
    restoreReturnState(returnState||{paused:runtime.previousPaused});runtime.returnState=null;
    updateUI?.();
  }
  function startIceMapOpeningCutscene({replay=false,returnState}={}){
    // Automatic campaign playback belongs only to an active Ice Map run.
    // Replays are intentionally available from the Ice Map card as well.
    if(runtime.active||(!replay&&root.GameContent?.activeMap?.id!==MAP_ID))return false;
    runtime.active=true;runtime.replay=!!replay;runtime.returnState=returnState||captureReturnState();runtime.cutsceneState={mode:'cutscene',cutsceneId:'ice-map-opening',returnScreen:runtime.returnState.screen};root.iceOpeningCutsceneState=runtime.cutsceneState;runtime.previousPaused=!!state?.paused;runtime.lastError=null;runtime.cinematicTime=0;
    try{
      if(state)state.paused=true;
      // Reveal first: phase drawing reads the scene dimensions and must never
      // render against a display:none canvas.
      mapSelectionModal?.classList.add('hidden');difficultyModal?.classList.add('hidden');modal?.classList.remove('hidden');
      if(scene){scene.dataset.replaying=runtime.replay?'true':'false';scene.dataset.syringesUsed='0';resetTrialSubjects();void scene.offsetWidth}
      setPhase(0);skip?.focus?.();return true;
    }catch(error){
      runtime.active=false;runtime.cutsceneState=null;root.iceOpeningCutsceneState=null;runtime.lastError=error;modal?.classList.add('hidden');restoreReturnState(runtime.returnState);runtime.returnState=null;console.error('[Ice opening] Failed to start.',error);return false;
    }
  }
  function updateIceOpening(dt){
    if(!runtime.active)return;
    const cutsceneDelta=Math.max(0,dt)/Math.max(1,state?.gameSpeed||1);runtime.elapsed+=cutsceneDelta;runtime.cinematicTime+=cutsceneDelta;
    const phase=ICE_OPENING_SCENES[runtime.index]?.id;
    const phaseData=ICE_OPENING_SCENES[runtime.index];
    if(phase&&INJECTION_PHASES[phase]&&runtime.elapsed>=INJECTION_COMPLETE_AT&&scene){scene.dataset.injectionComplete='true';scene.dataset.syringesUsed=String(INJECTION_PHASES[phase].supplyIndex+1)}
    updateTrialSubjectStates(phase);
    updatePhaseDialogue(phaseData);
    drawOpeningCharacters();
    while(runtime.active&&runtime.elapsed>=ICE_OPENING_SCENES[runtime.index].duration){
      if(!outdoorResultHoldComplete(ICE_OPENING_SCENES[runtime.index].id)||!updatePhaseDialogue(ICE_OPENING_SCENES[runtime.index]))break;
      runtime.elapsed-=ICE_OPENING_SCENES[runtime.index].duration;
      if(runtime.index>=ICE_OPENING_SCENES.length-1){finishIceOpening();break}
      setPhase(runtime.index+1);
    }
  }
  root.startIceMapOpeningCutscene=startIceMapOpeningCutscene;
  root.playIceOpeningCutscene=startIceMapOpeningCutscene;
  root.finishIceOpeningCutscene=finishIceOpening;
  root.iceOpeningCutsceneRuntime=runtime;
  skip?.addEventListener('click',finishIceOpening);

  // Difficulty selection is the last setup step before Wave 1, so the first
  // automatic viewing begins here. Replays never mutate this viewed flag's
  // meaning or any campaign/run data.
  const setDifficultyOpeningBase=setRunDifficulty;
  setRunDifficulty=function(key){
    const wasLocked=!!state?.difficultyLocked,result=setDifficultyOpeningBase(key);
    if(!wasLocked&&state?.difficultyLocked&&state.wave===0&&!hasViewed())startIceMapOpeningCutscene({replay:false});
    return result;
  };

  // While active, this outer update wrapper advances only cinematic time.
  // Gameplay simulation, waves, towers, income, and stat collection remain idle.
  const updateOpeningBase=update;
  update=function(dt){if(runtime.active){updateIceOpening(dt);return}return updateOpeningBase(dt)};

  let replayNoticeTimer=0;
  function showReplayNotice(message){
    if(!replayNotice)return;
    replayNotice.textContent=message;replayNotice.classList.remove('hidden');clearTimeout(replayNoticeTimer);replayNoticeTimer=setTimeout(()=>replayNotice.classList.add('hidden'),3200);
  }
  function startReplayFromControl(){
    try{
      const started=startIceMapOpeningCutscene({replay:true,returnState:captureReturnState()});
      if(!started){if(runtime.lastError){console.error('[Ice opening replay] Failed to start.',runtime.lastError);showReplayNotice('OPENING REPLAY COULD NOT START.')}else{console.error('[Ice opening replay] Cutscene is already active.');showReplayNotice('OPENING REPLAY IS ALREADY PLAYING.');}}
      return started;
    }catch(error){console.error('[Ice opening replay] Failed to start.',error);showReplayNotice('OPENING REPLAY COULD NOT START.');return false}
  }
  function installReplayButton(){
    const card=document.querySelector('.map-card.frozen'),copy=card?.querySelector('.map-card-copy');
    if(!copy||copy.querySelector?.('[data-action="replay-ice-opening"]'))return;
    const button=document.createElement('button');button.type='button';button.dataset.action='replay-ice-opening';button.textContent='REPLAY OPENING';button.className='replay-ice-opening';button.disabled=false;copy.appendChild(button);
  }
  const mapGrid=document.querySelector('#mapSelectionGrid');
  mapGrid?.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-action="replay-ice-opening"]');
    if(!button||button.disabled)return;
    event.preventDefault();event.stopPropagation();startReplayFromControl();
  });
  if(mapGrid&&typeof MutationObserver==='function')new MutationObserver(installReplayButton).observe(mapGrid,{childList:true,subtree:true});
  installReplayButton();
  // The modal blocks pointer/touch events visually; this capture guard also
  // prevents keyboard or stray background input from changing the paused run.
  document.addEventListener?.('keydown',event=>{if(runtime.active){event.preventDefault?.();event.stopImmediatePropagation?.()}},true);
  window.addEventListener?.('pagehide',()=>{if(runtime.active){runtime.active=false;runtime.cutsceneState=null;root.iceOpeningCutsceneState=null;modal?.classList.add('hidden')}});
})(globalThis);
