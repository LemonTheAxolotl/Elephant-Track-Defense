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
    {id:'freeze-intro',duration:3.1,dialogue:"Now let's see what the elephants can do against them."},
    {id:'freeze-test',duration:4.2,dialogue:'Frozen. Exactly as we wanted.'},
    {id:'freeze-result',duration:3.1},
    {id:'shield-hit-one',duration:2.7},
    {id:'shield-hit-two',duration:3.4,dialogue:'The shield can be broken... but it will slow them.'},
    {id:'formula-refinement',duration:3.5,dialogue:'The first results were unstable. The formula needs to be precise.'},
    {id:'refinement-batch-one-prep',duration:2.2,dialogue:'A refined dose. Test the new samples.'},
    {id:'refinement-one-a',duration:3.7,dialogue:'Still unstable.'},
    {id:'refinement-one-b',duration:3.5},
    {id:'refinement-one-c',duration:3.5},
    {id:'refinement-transition',duration:2.4},
    {id:'refinement-batch-two-prep',duration:2.2},
    {id:'refinement-two-a',duration:3.5},
    {id:'refinement-two-b',duration:3.7,dialogue:'Some are responding. The serum is getting closer.'},
    {id:'refinement-two-c',duration:3.5},
    {id:'final-refinement',duration:3.4,dialogue:'One final refinement.'},
    {id:'refinement-final-prep',duration:2.2},
    {id:'refinement-final-a',duration:3.5},
    {id:'refinement-final-b',duration:3.5},
    {id:'refinement-final-c',duration:4.2,dialogue:'Stable results. The solution works.'},
    {id:'fade-to-elephant-base',duration:1.35},
    {id:'base-team-entry',duration:4.1,dialogue:'Bring the test subject over.'},
    {id:'base-serum-injection',duration:4.2,dialogue:'One dose. Watch closely.'},
    {id:'base-fire-result',duration:2.5,dialogue:'Good. The change held.'},
    {id:'base-north-motion',duration:2.8,dialogue:'Something just forced the door.'},
    {id:'base-orb-breach',duration:3.4},
    {id:'base-snowcap-freeze',duration:3.7,dialogue:'Get back. That cold is spreading.'},
    {id:'base-shield-defense',duration:3.3,dialogue:'Water won’t get through that shell.'},
    {id:'base-fire-order',duration:2.8,dialogue:'Fire unit. Take the shot.'},
    {id:'base-fire-break',duration:3.5,dialogue:'That did it. The shield is gone.'},
    {id:'base-fire-immunity',duration:3.6,dialogue:'It didn’t freeze the fire unit.'},
    {id:'base-ghost-rescue',duration:3.8,dialogue:'I’ve got the survivors. Keep one alive.'},
    {id:'base-heater-one',duration:2.6,dialogue:'The heater failed.'},
    {id:'base-heater-two',duration:2.3,dialogue:'Reset it.'},
    {id:'base-heater-three',duration:2.6,dialogue:'Again.'},
    {id:'base-heater-success',duration:4,dialogue:'There. Don’t let it stop.'},
    {id:'fade',duration:1.5}
  ]);
  root.ICE_OPENING_SCENES=ICE_OPENING_SCENES;
  const modal=document.querySelector('#iceOpeningCutscene'),scene=document.querySelector('#iceOpeningScene'),speech=document.querySelector('.ice-scientist-speech'),characterCanvas=document.querySelector('#iceOpeningCharacters'),injectionCanvas=document.querySelector('#iceOpeningInjection'),skip=document.querySelector('#skipIceOpeningCutscene'),pauseButton=document.querySelector('#pauseIceOpeningCutscene'),cutsceneMenu=document.querySelector('#iceCutsceneControls'),cutsceneMenuToggle=document.querySelector('#iceCutsceneMenuToggle'),cutsceneMenuPanel=document.querySelector('#iceCutsceneMenu'),cutsceneSpeedButtons=[...(document.querySelectorAll?.('[data-cutscene-speed]')||[])],mapSelectionModal=document.querySelector('#mapSelectionModal'),difficultyModal=document.querySelector('#difficultyModal'),replayNotice=document.querySelector('#iceOpeningReplayNotice');
  // Render the existing gameplay orb at this resolution, then composite it
  // one-to-one into the laboratory close-up.  This keeps the large scientist
  // crisp rather than enlarging a small raster capture.
  const PLATINUM_CUTSCENE_SCALE=5.6848;
  // drawTierEffects rotates Tier 8 rings at gameTime * 1.8.  Feeding it
  // 0.35× cinematic time gives the existing ring group a calm ~10-second turn.
  const SCIENTIST_RING_TIME_SCALE=.35;
  const INJECTION_COMPLETE_AT=2.15;
  // The exterior takes .8 seconds to clear. The opening speech is gated until
  // the laboratory and its gameplay-rendered scientist are visibly established.
  const DIALOGUE_CUES=Object.freeze({'lab-reveal':1.05,'failed-one':4.1,'failed-two':4.1,'failed-three':4.2,'shield-create':2.85,'snow-create':2.85,'formula-refinement':1.2,'refinement-batch-one-prep':1.15,'refinement-one-a':3.55,'refinement-two-b':2.8,'final-refinement':1.1,'refinement-final-c':3,'freeze-intro':.25,'freeze-test':1.28,'shield-hit-two':3,'base-team-entry':1.6,'base-serum-injection':.7,'base-fire-result':.8,'base-north-motion':1.1,'base-snowcap-freeze':.12,'base-shield-defense':1.75,'base-fire-order':.75,'base-fire-break':2.8,'base-fire-immunity':2.1,'base-ghost-rescue':1.9,'base-heater-one':1.15,'base-heater-two':.45,'base-heater-three':.25,'base-heater-success':1.45});
  // Cutscene-only event gates mirror gameplay visual durations while providing
  // deliberate result holds; gameplay attack speed and mutation rules stay out
  // of this data entirely.
  const OUTDOOR_TEST_TIMING=Object.freeze({snow:{prepareAt:.7,impactAt:1.28,frozenHold:2},shield:{windupDuration:.3,projectileDuration:.42,firstImpactAt:.9,crackHold:1.25,secondImpactAt:.9,postBreakHold:2}});
  const OUTDOOR_PHASE_IDS=Object.freeze(['freeze-intro','freeze-test','freeze-result','shield-hit-one','shield-hit-two']);
  const ELEPHANT_BASE_PHASE_IDS=Object.freeze(['base-team-entry','base-serum-injection','base-fire-result','base-north-motion','base-orb-breach','base-snowcap-freeze','base-shield-defense','base-fire-order','base-fire-break','base-fire-immunity','base-ghost-rescue','base-heater-one','base-heater-two','base-heater-three','base-heater-success']);
  const TRIAL_SUBJECT_IDS=Object.freeze(['failed-one','failed-two','failed-three','tier-ten','tier-nine']);
  const REFINEMENT_SUBJECTS=Object.freeze([
    {id:'refinement-one-a',tier:2,batch:1,slot:0},{id:'refinement-one-b',tier:3,batch:1,slot:1},{id:'refinement-one-c',tier:4,batch:1,slot:2},
    {id:'refinement-two-a',tier:3,batch:2,slot:0},{id:'refinement-two-b',tier:4,batch:2,slot:1},{id:'refinement-two-c',tier:5,batch:2,slot:2},
    {id:'refinement-final-a',tier:4,batch:3,slot:0},{id:'refinement-final-b',tier:5,batch:3,slot:1},{id:'refinement-final-c',tier:6,batch:3,slot:2}
  ]);
  const REFINEMENT_SUBJECT_IDS=Object.freeze(REFINEMENT_SUBJECTS.map(subject=>subject.id));
  const SCIENTIST_ORB_ENTITY=Object.freeze({id:'scientistOrbEntity',tier:8,kind:'scientist'});
  const GHOST_SCOUT_CUTSCENE_ACTOR=Object.freeze({id:'ghostScoutScientistEntity',kind:'elephant',towerType:'eyewear',cutsceneOnly:true});
  // Cutscene world units per second.  This is intentionally half the former
  // Ghost Scout pace and is evaluated against the actual canvas distance, so
  // wider routes take longer rather than being squeezed into a fixed tween.
  const GHOST_SCOUT_CUTSCENE_WALK_SPEED=245;
  const GHOST_SCOUT_INJECTION_PAUSES=Object.freeze({tray:.5,subject:.4,result:.6,work:.4});
  function easedProgress(value){const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)}
  function routeDistance(a,b){return Math.hypot(b.x-a.x,b.y-a.y)}
  function routePoint(a,b,progress){const t=easedProgress(progress);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}
  function ghostScoutInjectionRoute(rect,elapsed){
    const start={x:rect.width*.20,y:rect.height*.67},tray={x:rect.width*.52,y:rect.height*.67},subject={x:rect.width*.56,y:rect.height*.65},toTray=routeDistance(start,tray)/GHOST_SCOUT_CUTSCENE_WALK_SPEED,toSubject=routeDistance(tray,subject)/GHOST_SCOUT_CUTSCENE_WALK_SPEED,toWork=routeDistance(subject,start)/GHOST_SCOUT_CUTSCENE_WALK_SPEED;
    const trayPauseEnd=toTray+GHOST_SCOUT_INJECTION_PAUSES.tray,subjectArrival=trayPauseEnd+toSubject,subjectPauseEnd=subjectArrival+GHOST_SCOUT_INJECTION_PAUSES.subject,injectionDuration=.8,injectionEnd=subjectPauseEnd+injectionDuration,resultPauseEnd=injectionEnd+GHOST_SCOUT_INJECTION_PAUSES.result,workArrival=resultPauseEnd+toWork,completeAt=workArrival+GHOST_SCOUT_INJECTION_PAUSES.work;
    let position=start,walking=false;
    if(elapsed<toTray){position=routePoint(start,tray,elapsed/toTray);walking=true}
    else if(elapsed<subjectArrival){position=elapsed<trayPauseEnd?tray:routePoint(tray,subject,(elapsed-trayPauseEnd)/toSubject);walking=elapsed>=trayPauseEnd}
    else if(elapsed<resultPauseEnd)position=subject;
    else if(elapsed<workArrival){position=routePoint(subject,start,(elapsed-resultPauseEnd)/toWork);walking=true}
    return{position,walking,trayArrivalAt:toTray,takeSyringeAt:trayPauseEnd,subjectArrivalAt:subjectArrival,injectionStartAt:subjectPauseEnd,injectionEndAt:injectionEnd,resultPauseEndAt:resultPauseEnd,transformationStartsAt:injectionEnd+.08,transformationSwapAt:injectionEnd+.48,completeAt,syringeVisible:elapsed>=trayPauseEnd&&elapsed<injectionEnd,injectionProgress:Math.max(0,Math.min(1,(elapsed-subjectPauseEnd)/injectionDuration)),injectionTravel:Math.max(0,Math.min(1,(elapsed-subjectPauseEnd)/.32)),complete:elapsed>=completeAt};
  }
  function elephantBaseGhostPosition(rect,phase,elapsed){
    const entryProgress=Math.max(0,Math.min(1,(elapsed-.7)/1.6));
    if(phase==='base-team-entry')return{x:rect.width*(.13+.07*entryProgress),y:rect.height*.67};
    if(phase==='base-serum-injection')return ghostScoutInjectionRoute(rect,elapsed).position;
    if(phase==='base-ghost-rescue'){const progress=elapsed<.2?0:elapsed<1.55?easedProgress((elapsed-.2)/1.35):elapsed<2.35?1:1-easedProgress(Math.min(1,(elapsed-2.35)/.75));return{x:rect.width*(.42+.24*progress),y:rect.height*.66}}
    if(phase.startsWith('base-heater'))return{x:rect.width*.61,y:rect.height*.66};
    return{x:rect.width*.20,y:rect.height*.67};
  }
  // This is deliberately runtime-only.  A cinematic is a screen overlay, not a
  // map run: nothing in this object belongs in the player profile or run save.
  // This is the sole clock multiplier for the cinematic.  It deliberately
  // lives outside gameplay state: neither map speed nor a tower/orb animation
  // can change how quickly an Ice opening plays.
  const runtime={active:false,paused:false,replay:false,index:0,elapsed:0,cinematicTime:0,playbackSpeed:1,previousPaused:false,returnState:null,cutsceneState:null,lastError:null,dialogue:null,trialSubjects:{},refinementSubjects:{},survivorMetrics:null,usedSyringeIds:new Set()};
  const CUTSCENE_PLAYBACK_SPEEDS=Object.freeze([1,1.5,2]);
  let cutsceneAnimationObserver=null;
  function activeCutsceneAnimations(){
    try{return scene?.getAnimations?.({subtree:true})||[]}catch(error){runtime.lastAnimationError=error;return[]}
  }
  // CSS keyframes and transitions surface as Web Animations in every browser
  // we support.  playbackRate changes their effective duration in place
  // (base duration / cutscenePlaybackSpeed), preserving current progress
  // rather than resetting a ring, fade, or injection back to frame zero.
  function syncCutsceneAnimationPlaybackRate(){
    for(const animation of activeCutsceneAnimations()){
      try{animation.playbackRate=runtime.playbackSpeed;if(runtime.paused)animation.pause?.();else if(animation.playState==='paused')animation.play?.()}catch(error){runtime.lastAnimationError=error}
    }
  }
  function observeCutsceneAnimations(){
    if(cutsceneAnimationObserver||!scene||typeof MutationObserver!=='function')return;
    cutsceneAnimationObserver=new MutationObserver(()=>syncCutsceneAnimationPlaybackRate());
    cutsceneAnimationObserver.observe(scene,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','data-phase','data-dialogue','data-outdoor-test','data-elephant-base']});
  }
  function updateCutscenePlaybackSpeedUI(){
    for(const button of cutsceneSpeedButtons){const speed=Number(button.dataset.cutsceneSpeed),active=speed===runtime.playbackSpeed;button.classList.toggle?.('active',active);button.setAttribute?.('aria-pressed',String(active))}
    scene?.setAttribute?.('data-playback-speed',String(runtime.playbackSpeed));
    scene?.style?.setProperty?.('--cutscene-playback-speed',String(runtime.playbackSpeed));
    syncCutsceneAnimationPlaybackRate();
  }
  function setCutscenePlaybackSpeed(speed){const value=Number(speed);if(!CUTSCENE_PLAYBACK_SPEEDS.includes(value))return false;runtime.playbackSpeed=value;root.cutscenePlaybackSpeed=value;updateCutscenePlaybackSpeedUI();return true}
  function updateCutscenePauseUI(){if(!pauseButton)return;pauseButton.textContent=runtime.paused?'RESUME':'PAUSE';pauseButton.setAttribute?.('aria-pressed',String(runtime.paused))}
  function setCutscenePaused(paused){if(!runtime.active)return false;runtime.paused=!!paused;updateCutscenePauseUI();scene?.setAttribute?.('data-cutscene-paused',String(runtime.paused));syncCutsceneAnimationPlaybackRate();return runtime.paused}
  function setCutsceneMenuOpen(open){
    const expanded=!!open;
    cutsceneMenu?.classList.toggle?.('open',expanded);
    if(cutsceneMenuToggle){cutsceneMenuToggle.textContent=expanded?'<':'>';cutsceneMenuToggle.setAttribute?.('aria-expanded',String(expanded));cutsceneMenuToggle.setAttribute?.('aria-label',expanded?'Close cutscene controls':'Open cutscene controls')}
    cutsceneMenuPanel?.setAttribute?.('aria-hidden',String(!expanded));
  }
  function hasViewed(){try{return localStorage.getItem(VIEW_KEY)==='viewed'}catch{return false}}
  function markViewed(){try{localStorage.setItem(VIEW_KEY,'viewed')}catch{}}
  function dialogueRect(left,top,width,height){return{left,top,width,height,right:left+width,bottom:top+height}}
  function dialogueRectsOverlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
  function dialogueOverlapArea(a,b){if(!dialogueRectsOverlap(a,b))return 0;return(Math.min(a.right,b.right)-Math.max(a.left,b.left))*(Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))}
  function dialogueSpeakerForPhase(rect,phase){
    if(isElephantBasePhase(phase)){const ghost=elephantBaseGhostPosition(rect,phase,runtime.elapsed),bounds=dialogueRect(ghost.x-58,ghost.y-82,116,126);return{x:ghost.x,y:bounds.top-10,label:phase==='base-ghost-rescue'?'GHOST SCOUT':'SCIENTIST ELEPHANT',bounds}}
    if(isOutdoorTestPhase(phase)){const x=rect.width*.83,y=rect.height*.36,radius=Math.min(rect.width*.105,112),bounds=dialogueRect(x-radius,y-radius,radius*2,radius*2);return{x,y:bounds.top-10,label:'SCIENTIST',bounds};}
    const scientist=scientistPosition(rect,phase,runtime.elapsed),radius=Math.min(rect.width*.22,rect.height*.36),bounds=dialogueRect(scientist.x-radius,scientist.y-radius,radius*2,radius*2);return{x:scientist.x,y:bounds.top-12,label:'SCIENTIST',bounds};
  }
  function dialogueProtectedBounds(rect,phase,speaker){
    const protectedAreas=[speaker.bounds];
    const add=(left,top,width,height)=>protectedAreas.push(dialogueRect(left,top,width,height));
    const addCenter=(x,y,width,height)=>add(x-width/2,y-height/2,width,height);
    const addControls=()=>{const sceneBounds=scene.getBoundingClientRect?.();for(const node of [pauseButton,cutsceneMenu]){const bounds=node?.getBoundingClientRect?.();if(bounds?.width&&sceneBounds)add(bounds.left-sceneBounds.left,bounds.top-sceneBounds.top,bounds.width,bounds.height)}};
    if(isOutdoorTestPhase(phase)){addCenter(rect.width*.29,rect.height*.70,120,118);addCenter(rect.width*.56,rect.height*.60,94,94);addCenter(rect.width*.74,rect.height*.65,94,94);if(phase==='freeze-test'||phase==='shield-hit-one'||phase==='shield-hit-two')add(rect.width*.29,rect.height*.54,rect.width*.48,rect.height*.19);addControls();return protectedAreas}
    if(isElephantBasePhase(phase)){
      if(phase.startsWith('base-heater')){add(rect.width*.745,rect.height*.43,rect.width*.23,rect.height*.44);for(const x of [.35,.47])addCenter(rect.width*x,rect.height*.69,88,104)}
      else if(phase==='base-ghost-rescue'){const pod=baseSnowcapContainmentLayout(rect);add(pod.x-pod.w*.08,pod.y-pod.h*.20,pod.w*1.16,pod.h*1.32);for(const x of [.31,.59])addCenter(rect.width*x,rect.height*.68,86,104)}
      else if(['base-snowcap-freeze','base-shield-defense','base-fire-order','base-fire-break','base-fire-immunity'].includes(phase)){for(const x of [.30,.42,.52,.62])addCenter(rect.width*x,rect.height*.67,112,126);for(const point of [{x:.72,y:.52},{x:.79,y:.45},{x:.83,y:.61},{x:.91,y:.64}])addCenter(rect.width*point.x,rect.height*point.y,94,94);if(phase==='base-fire-break')add(rect.width*.62,rect.height*.53,rect.width*.30,rect.height*.22)}
      else{add(rect.width*.71,rect.height*.11,rect.width*.25,rect.height*.48);for(const x of [.34,.52,.66])addCenter(rect.width*x,rect.height*.65,112,126)}
      addControls();return protectedAreas;
    }
    for(const node of scene?.querySelectorAll?.('.ice-chambers .ice-chamber,.ice-survivor-chambers .ice-chamber')||[]){const bounds=node.getBoundingClientRect?.(),sceneBounds=scene.getBoundingClientRect?.();if(bounds?.width&&sceneBounds)add(bounds.left-sceneBounds.left,bounds.top-sceneBounds.top,bounds.width,bounds.height)}
    if(injectionPhaseData(phase)){const home=injectionTablePosition(rect,phase),target=injectionTargetPosition(rect,phase),left=Math.min(home.x,target.x)-44,top=Math.min(home.y,target.y)-28;add(left,top,Math.abs(target.x-home.x)+88,Math.abs(target.y-home.y)+56)}
    if(isRefinementPhase(phase))add(rect.width*.055,rect.height*.46,rect.width*.29,rect.height*.25);
    addControls();return protectedAreas;
  }
  function setCutsceneDialogueText(text,label=''){
    if(!speech)return;
    speech.dataset.dialogue=text||'';
    const speakerLabel=speech.querySelector?.('.ice-speech-speaker'),speechText=speech.querySelector?.('.ice-speech-text');
    if(speakerLabel)speakerLabel.textContent=label;
    if(speechText)speechText.textContent=text||'';
  }
  function positionCutsceneDialogue(){
    if(!scene||!speech||!runtime.active||!speech.dataset.dialogue)return;
    const rect=cutsceneViewportRect(),phase=scene.dataset.phase||'',speaker=dialogueSpeakerForPhase(rect,phase),margin=Math.max(12,Math.min(22,rect.width*.03)),boxWidth=Math.min(Math.max(170,speech.offsetWidth||280),Math.max(170,rect.width-margin*2)),boxHeight=Math.max(54,speech.offsetHeight||70),gap=24,areas=dialogueProtectedBounds(rect,phase,speaker),clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
    const candidate=(placement,left,top)=>{left=clamp(left,margin,rect.width-boxWidth-margin);top=clamp(top,margin,rect.height-boxHeight-margin);const box=dialogueRect(left,top,boxWidth,boxHeight);let tail;if(placement==='left')tail=dialogueRect(box.right,clamp(speaker.bounds.top+speaker.bounds.height/2-11,box.top+16,box.bottom-38),12,22);else if(placement==='right')tail=dialogueRect(box.left-12,clamp(speaker.bounds.top+speaker.bounds.height/2-11,box.top+16,box.bottom-38),12,22);else tail=dialogueRect(clamp(speaker.bounds.left+speaker.bounds.width/2-11,box.left+18,box.right-40),box.bottom,22,12);const collisions=areas.reduce((score,area)=>score+dialogueOverlapArea(box,area)*3+dialogueOverlapArea(tail,area)*5,0);return{placement,left,top,box,tail,collisions}};
    const s=speaker.bounds,candidates=[candidate('above',s.left+s.width/2-boxWidth/2,s.top-boxHeight-gap),candidate('above-left',s.left-boxWidth-gap,s.top-boxHeight-gap),candidate('above-right',s.right+gap,s.top-boxHeight-gap),candidate('left',s.left-boxWidth-gap,s.top+s.height/2-boxHeight/2),candidate('right',s.right+gap,s.top+s.height/2-boxHeight/2)];
    const chosen=candidates.find(option=>option.collisions===0)||candidates.sort((a,b)=>a.collisions-b.collisions)[0],tailX=chosen.tail.left-chosen.left+11,tailY=chosen.tail.top-chosen.top+11;
    speech.style.left=`${chosen.left}px`;speech.style.top=`${chosen.top}px`;speech.style.setProperty('--ice-speech-tail-x',`${tailX}px`);speech.style.setProperty('--ice-speech-tail-y',`${tailY}px`);speech.dataset.speechPlacement=chosen.placement;
    const speakerLabel=speech.querySelector?.('.ice-speech-speaker');if(speakerLabel)speakerLabel.textContent=speaker.label;
  }
  function clearPhaseDialogue(){runtime.dialogue=null;if(scene)scene.dataset.dialogue='';setCutsceneDialogueText('')}
  function lockSurvivorTransforms(){
    if(!scene)return;
    for(const selector of ['.survivor-nine','.survivor-ten','.tier-nine-orb','.tier-ten-orb'])for(const node of scene.querySelectorAll?.(selector)||[]){node.style.transform='translate(0, 0) scale(1) rotate(0deg)';node.style.animation='none';node.style.transition='none';node.style.filter='none'}
  }
  function restoreCutsceneVisualVisibility(){
    if(!scene)return;
    for(const node of [characterCanvas,injectionCanvas,...(scene.querySelectorAll?.('.ice-chambers,.ice-chambers .ice-chamber,.ice-chambers .ice-chamber i,.ice-survivor-chambers,.ice-survivor-chambers .ice-chamber')||[])])if(node){node.style.opacity='1';node.style.visibility='visible';node.style.transform=node.matches?.('.ice-chamber')?'translate(0, 0) scale(1) rotate(0deg)':'';if(node===characterCanvas||node===injectionCanvas)node.style.display='block'}
  }
  function subjectDataKey(id){return`subject${id.replace(/(^|-)([a-z])/g,(_,prefix,letter)=>letter.toUpperCase())}`}
  function resetTrialSubjects(){runtime.trialSubjects=Object.fromEntries(TRIAL_SUBJECT_IDS.map(id=>[id,'untested']));runtime.survivorMetrics=null;if(scene)for(const id of TRIAL_SUBJECT_IDS)scene.dataset[subjectDataKey(id)]='untested';lockSurvivorTransforms()}
  function resetRefinementSubjects(){runtime.refinementSubjects=Object.fromEntries(REFINEMENT_SUBJECT_IDS.map(id=>[id,'untested']));if(scene)for(const id of REFINEMENT_SUBJECT_IDS)scene.dataset[subjectDataKey(id)]='untested'}
  function setTrialSubjectState(id,value){if(!TRIAL_SUBJECT_IDS.includes(id)||runtime.trialSubjects[id]===value)return;runtime.trialSubjects[id]=value;if(scene)scene.dataset[subjectDataKey(id)]=value}
  function setRefinementSubjectState(id,value){if(!REFINEMENT_SUBJECT_IDS.includes(id)||runtime.refinementSubjects[id]===value)return;runtime.refinementSubjects[id]=value;if(scene)scene.dataset[subjectDataKey(id)]=value}
  function updateTrialSubjectStates(phase){const subject=phase==='shield-create'?'tier-ten':phase==='snow-create'?'tier-nine':phase;if(!TRIAL_SUBJECT_IDS.includes(subject))return;if(runtime.trialSubjects[subject]==='untested')setTrialSubjectState(subject,'testing');if(runtime.elapsed<INJECTION_COMPLETE_AT)return;if(subject.startsWith('failed-')){if(runtime.elapsed>=4)setTrialSubjectState(subject,'failed');return}setTrialSubjectState(subject,subject==='tier-ten'?'survivedIceShield':'survivedSnowCap')}
  function updateRefinementSubjectStates(phase){const data=REFINEMENT_INJECTION_PHASES[phase];if(!data)return;const subject=data.subject;if(runtime.refinementSubjects[subject]==='untested')setRefinementSubjectState(subject,'testing');/* The syringe has visibly withdrawn before any sample reacts. */if(runtime.elapsed<2.85)return;if(data.result==='failed'){if(runtime.elapsed>=3.2)setRefinementSubjectState(subject,'failed');return}setRefinementSubjectState(subject,data.result)}
  function outdoorResultHoldComplete(phase){if(phase==='freeze-test')return runtime.elapsed>=OUTDOOR_TEST_TIMING.snow.impactAt+OUTDOOR_TEST_TIMING.snow.frozenHold;if(phase==='shield-hit-one')return runtime.elapsed>=OUTDOOR_TEST_TIMING.shield.firstImpactAt+OUTDOOR_TEST_TIMING.shield.crackHold;if(phase==='shield-hit-two')return runtime.elapsed>=OUTDOOR_TEST_TIMING.shield.secondImpactAt+OUTDOOR_TEST_TIMING.shield.postBreakHold;return true}
  function setPhase(index){runtime.index=index;runtime.elapsed=0;clearPhaseDialogue();if(scene){const phase=ICE_OPENING_SCENES[index]||{},outdoors=isOutdoorTestPhase(phase.id),elephantBase=isElephantBasePhase(phase.id);scene.dataset.phase=phase.id||'fade';scene.dataset.refinementBatch=String(refinementBatchForPhase(phase.id)||'');scene.dataset.outdoorTest=outdoors?'true':'false';scene.dataset.elephantBase=elephantBase?'true':'false';if(!elephantBase)delete scene.dataset.iceshieldState;const outdoorLayer=scene.querySelector?.('.ice-outdoor-test');if(outdoorLayer){outdoorLayer.style.opacity=outdoors?'1':'';outdoorLayer.style.visibility=outdoors?'visible':''}delete scene.dataset.injectionComplete;delete scene.dataset.activeSyringeId;selectCutsceneSyringe(phase.id)}restoreCutsceneVisualVisibility();lockSurvivorTransforms();drawOpeningCharacters()}
  function dialogueReadDuration(text){return Math.max(2.5,Math.min(5.4,String(text||'').length/25))}
  function cutsceneViewportRect(){const bounds=scene?.getBoundingClientRect?.();return bounds?.width&&bounds?.height?bounds:{width:Math.max(1,scene?.offsetWidth||1100),height:650}}
  function baseSerumInjectionComplete(){return ghostScoutInjectionRoute(cutsceneViewportRect(),runtime.elapsed).complete}
  function phaseDialogueLines(phase){if(!phase?.dialogue)return[];const cue=phase.id==='freeze-test'?OUTDOOR_TEST_TIMING.snow.impactAt:phase.id==='base-serum-injection'?ghostScoutInjectionRoute(cutsceneViewportRect(),runtime.elapsed).trayArrivalAt:(DIALOGUE_CUES[phase.id]??0),lines=[{text:phase.dialogue,cue}];if(phase.followupDialogue)lines.push({text:phase.followupDialogue,cue:0});return lines}
  function updatePhaseDialogue(phase){const lines=phaseDialogueLines(phase);if(!lines.length)return true;let current=runtime.dialogue;if(!current){current=runtime.dialogue={phase:runtime.index,line:0,startedAt:null,complete:false}}const line=lines[current.line];if(current.startedAt===null){if(runtime.elapsed<line.cue)return false;current.startedAt=runtime.elapsed;current.duration=dialogueReadDuration(line.text);if(scene)scene.dataset.dialogue=line.text;setCutsceneDialogueText(line.text);positionCutsceneDialogue();return false}if(runtime.elapsed-current.startedAt<current.duration)return false;if(current.line<lines.length-1){current.line++;current.startedAt=null;if(scene)scene.dataset.dialogue='';setCutsceneDialogueText('');return false}current.complete=true;if(scene)scene.dataset.dialogue='';setCutsceneDialogueText('');return true}
  // These cutscene frames call the active gameplay renderers directly.  They
  // are captured from the game canvas, then composited into the cinematic;
  // no cutscene-specific approximation of the elephant or orb exists here.
  function captureGameplaySprite(drawSprite,subject,size=150,renderScale=1,ringRotation=0,renderTime=null){if(typeof ctx==='undefined'||!ctx?.getImageData||!canvas)return null;const scale=Math.max(1,renderScale),frameSize=Math.max(1,Math.min(Math.ceil(size*scale),canvas.width,canvas.height)),cx=frameSize/(2*scale),cy=frameSize/(2*scale),saved=ctx.getImageData(0,0,frameSize,frameSize),previousGameTime=state?.gameTime;try{if(state&&Number.isFinite(renderTime))state.gameTime=renderTime;else if(ringRotation&&state)state.gameTime=ringRotation/1.8;ctx.save();ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,frameSize/scale,frameSize/scale);drawSprite({...subject,x:cx,y:cy});const frame=ctx.getImageData(0,0,frameSize,frameSize),sprite=document.createElement('canvas');sprite.width=frameSize;sprite.height=frameSize;sprite.getContext('2d').putImageData(frame,0,0);return sprite}catch(error){runtime.lastRenderError=error;return null}finally{if((ringRotation||Number.isFinite(renderTime))&&state)state.gameTime=previousGameTime;ctx.putImageData(saved,0,0);ctx.restore()}}
  function captureGameplayBackdrop(width,height){
    if(typeof ctx==='undefined'||!ctx?.getImageData||!canvas||typeof drawFrozenGround!=='function')return null;
    const w=Math.max(1,Math.min(Math.ceil(width),canvas.width)),h=Math.max(1,Math.min(Math.ceil(height),canvas.height)),saved=ctx.getImageData(0,0,w,h),sprite=document.createElement('canvas');
    try{ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);drawFrozenGround();sprite.width=w;sprite.height=h;sprite.getContext('2d').putImageData(ctx.getImageData(0,0,w,h),0,0);return sprite}catch(error){runtime.lastRenderError=error;return null}finally{ctx.putImageData(saved,0,0);ctx.restore()}
  }
  const INJECTION_PHASES=Object.freeze({
    'failed-one':{x:.742,y:.43,supplyIndex:0},'failed-two':{x:.83,y:.43,supplyIndex:1},'failed-three':{x:.918,y:.43,supplyIndex:2},
    'shield-create':{x:.34,y:.33,supplyIndex:3},'snow-create':{x:.46,y:.33,supplyIndex:4}
  });
  // This is a separate batch.  It never shares an element, transform, or
  // terminal state with the five original subjects.
  const REFINEMENT_INJECTION_PHASES=Object.freeze({
    'refinement-one-a':{subject:'refinement-one-a',supplyIndex:0,result:'failed'},'refinement-one-b':{subject:'refinement-one-b',supplyIndex:1,result:'failed'},'refinement-one-c':{subject:'refinement-one-c',supplyIndex:2,result:'failed'},
    'refinement-two-a':{subject:'refinement-two-a',supplyIndex:3,result:'failed'},'refinement-two-b':{subject:'refinement-two-b',supplyIndex:4,result:'survivedSnowCap'},'refinement-two-c':{subject:'refinement-two-c',supplyIndex:5,result:'survivedIceShield'},
    'refinement-final-a':{subject:'refinement-final-a',supplyIndex:6,result:'survivedSnowCap'},'refinement-final-b':{subject:'refinement-final-b',supplyIndex:7,result:'survivedIceShield'},'refinement-final-c':{subject:'refinement-final-c',supplyIndex:8,result:'survivedSnowCap'}
  });
  function injectionPhaseData(phase){return INJECTION_PHASES[phase]||REFINEMENT_INJECTION_PHASES[phase]||null}
  function selectCutsceneSyringe(phase){
    const data=injectionPhaseData(phase);if(!data||!scene)return;
    const refinement=!!REFINEMENT_INJECTION_PHASES[phase],id=`${refinement?'refinement':'lab'}-syringe-${data.supplyIndex+1}`;
    runtime.usedSyringeIds.add(id);
    scene.dataset.activeSyringeId=id;
    // A supply item leaves its slot when it is selected, not when its effect
    // completes. Each id refers to one physical syringe and one cleanup path.
    if(refinement)scene.dataset.refinementSyringesUsed=String(data.supplyIndex+1);
    else scene.dataset.syringesUsed=String(data.supplyIndex+1);
  }
  function refinementBatchForPhase(phase){if(['refinement-batch-one-prep','refinement-one-a','refinement-one-b','refinement-one-c'].includes(phase))return 1;if(['refinement-batch-two-prep','refinement-two-a','refinement-two-b','refinement-two-c'].includes(phase))return 2;if(['refinement-final-prep','refinement-final-a','refinement-final-b','refinement-final-c','fade-to-elephant-base'].includes(phase))return 3;return 0}
  // The final fade retains the last successful batch exactly as it was shown;
  // it must never fall back to the legacy all-chambers laboratory tableau.
  function isRefinementPhase(phase){return phase==='formula-refinement'||phase==='refinement-transition'||phase==='final-refinement'||refinementBatchForPhase(phase)>0}
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
  function injectionTargetPosition(rect,phase){const targetData=injectionPhaseData(phase);if(!targetData)return null;const refinement=REFINEMENT_INJECTION_PHASES[phase],refinementSubject=refinement&&REFINEMENT_SUBJECTS.find(subject=>subject.id===refinement.subject),survivor=(phase==='shield-create'?'survivor-ten':phase==='snow-create'?'survivor-nine':null),chamber=refinement?scene?.querySelector?.(`.ice-chambers .ice-chamber:nth-child(${refinementSubject.slot+1})`):survivor&&scene?.querySelector?.(`.${survivor}`),stand=chamber?.querySelector?.('i'),bounds=chamber?.getBoundingClientRect?.(),standBounds=stand?.getBoundingClientRect?.(),originalOrb=scene?.querySelector?.('.ice-chambers .chamber-orb')?.getBoundingClientRect?.(),orbDiameter=runtime.survivorMetrics?.orbDiameter||originalOrb?.width;if(bounds?.width&&standBounds?.top&&orbDiameter)return{x:bounds.left-rect.left+bounds.width/2,y:standBounds.top-rect.top-orbDiameter/2-2};return{x:rect.width*(targetData.x||.5),y:rect.height*(targetData.y||.48)}}
  function injectionProgress(phase){return injectionPhaseData(phase)?Math.max(0,runtime.elapsed):null}
  function injectionTablePosition(rect,phase){return isRefinementPhase(phase)?{x:rect.width*.195,y:rect.height*.605}:{x:rect.width*.49,y:rect.height*.57}}
  function refinementScientistMoveState(phase,elapsed){
    if(!REFINEMENT_INJECTION_PHASES[phase])return'idleAtCenter';
    if(elapsed<.45)return'movingToSyringes';
    if(elapsed<.65)return'collectingSyringe';
    if(elapsed<1.1)return'movingToChamber';
    if(elapsed<2.15)return'injecting';
    if(elapsed<2.85)return'observingResult';
    if(elapsed<3.4)return'returningToCenter';
    return'idleAtCenter';
  }
  function scientistPosition(rect,phase,elapsed){
    const idle={x:rect.width*.54,y:rect.height*.47},table=injectionTablePosition(rect,phase),targetData=injectionPhaseData(phase);
    if(!targetData){if(['formula-refinement','refinement-batch-one-prep','refinement-batch-two-prep','final-refinement','refinement-final-prep'].includes(phase)){const p=Math.min(1,elapsed/.7);return{x:idle.x+(table.x-idle.x)*easeInOut(p),y:idle.y+(table.y-idle.y)*easeInOut(p)};}return idle}
    const target=injectionTargetPosition(rect,phase),angle=Math.atan2(target.y-table.y,target.x-table.x),nearTarget={x:target.x-Math.cos(angle)*116,y:target.y-Math.sin(angle)*116},refinement=!!REFINEMENT_INJECTION_PHASES[phase];
    if(elapsed<.45){const p=easeInOut(elapsed/.45);return{x:idle.x+(table.x-idle.x)*p,y:idle.y+(table.y-idle.y)*p}}
    if(elapsed<.65)return table;
    if(elapsed<1.1){const p=easeInOut((elapsed-.65)/.45);return{x:table.x+(nearTarget.x-table.x)*p,y:table.y+(nearTarget.y-table.y)*p}}
    if(elapsed<2.85)return nearTarget;
    // A refined-serum test returns directly from its observed chamber result
    // to the center; it never revisits the syringe supply after injecting.
    if(refinement){if(elapsed<3.4){const p=easeInOut((elapsed-2.85)/.55);return{x:nearTarget.x+(idle.x-nearTarget.x)*p,y:nearTarget.y+(idle.y-nearTarget.y)*p}}return idle}
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
    const target=injectionTargetPosition(rect,phase),home=injectionTablePosition(rect,phase),refinement=!!REFINEMENT_INJECTION_PHASES[phase];
    const direction=Math.atan2(target.y-home.y,target.x-home.x),reach={x:target.x-Math.cos(direction)*46,y:target.y-Math.sin(direction)*46};
    let position=home,plunger=0,serum=0;
    if(elapsed<.65)position=home;
    else if(elapsed<1.35) {const p=easeInOut((elapsed-.65)/.7);position={x:home.x+(reach.x-home.x)*p,y:home.y+(reach.y-home.y)*p}}
    else if(elapsed<1.85){const p=easeInOut((elapsed-1.35)/.5);position={x:reach.x+Math.cos(direction)*10*p,y:reach.y+Math.sin(direction)*10*p};plunger=p;serum=p}
    else if(elapsed<2.15){position={x:reach.x+Math.cos(direction)*10,y:reach.y+Math.sin(direction)*10};plunger=1;serum=1}
    else if(elapsed<2.85){const p=easeInOut((elapsed-2.15)/.7);position=refinement?{x:reach.x+Math.cos(direction)*12*(1-p),y:reach.y+Math.sin(direction)*12*(1-p)}:{x:reach.x+(home.x-reach.x)*p,y:reach.y+(home.y-reach.y)*p};serum=Math.max(0,1-p)}
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
  function isOutdoorTestPhase(phase){return OUTDOOR_PHASE_IDS.includes(phase)}
  function isElephantBasePhase(phase){return ELEPHANT_BASE_PHASE_IDS.includes(phase)}
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
  function drawElephantBaseBlastDoor(out,rect,phase,elapsed){
    const x=rect.width*.735,y=rect.height*.145,w=rect.width*.205,h=rect.height*.405,frame=10,center=x+w/2;
    const isBreachPhase=phase==='base-orb-breach',remainsBroken=['base-snowcap-freeze','base-shield-defense','base-fire-order','base-fire-break','base-fire-immunity','base-ghost-rescue'].includes(phase),alert=phase==='base-north-motion'||isBreachPhase||remainsBroken,breach=remainsBroken?1:isBreachPhase?Math.max(0,Math.min(1,(elapsed-.35)/1.55)):0,frost=remainsBroken?1:isBreachPhase?Math.max(.35,breach):phase==='base-north-motion'?Math.max(0,Math.min(1,elapsed/1.2)):0,shake=phase==='base-north-motion'?Math.sin(elapsed*22)*(1+frost*2):isBreachPhase?(1-breach)*Math.sin(elapsed*25)*3:0;
    const panelY=y+frame+8,panelH=h-frame*2-16,gap=3+breach*w*.20,leftX=x+frame-shake-breach*w*.10,rightX=center+gap/2+shake+breach*w*.10,leftW=center-gap/2-leftX,rightW=x+w-frame-rightX;
    out.save();
    // Thick industrial frame, header track, and a cold-lit corridor behind any breach.
    out.fillStyle='#08151d';out.fillRect(x-7,y-7,w+14,h+14);out.fillStyle='#274652';out.fillRect(x,y,w,h);out.fillStyle='#0d1d26';out.fillRect(x+frame,y+frame,w-frame*2,h-frame*2);out.fillStyle='#3f6876';out.fillRect(x-4,y-10,w+8,13);out.fillStyle='#19313b';out.fillRect(x-1,y-5,w+2,7);out.fillStyle='#75c8d8';out.globalAlpha=.7;out.fillRect(x+18,y-5,w-36,2);out.globalAlpha=1;
    if(breach>0){const corridor=out.createLinearGradient(center-w*.12,y,center+w*.12,y);corridor.addColorStop(0,'#0a1820');corridor.addColorStop(.5,'#234653');corridor.addColorStop(1,'#0a1820');out.fillStyle=corridor;out.fillRect(center-w*.15,y+frame, w*.30,h-frame*2);out.fillStyle='#7ebdcb';out.globalAlpha=.23;for(let row=0;row<4;row++)out.fillRect(center-w*.13,y+h*.42+row*13,w*.26-row*10,2);out.globalAlpha=1}
    function panel(px,pw,side){if(pw<=2)return;const gradient=out.createLinearGradient(px,panelY,px+pw,panelY);gradient.addColorStop(0,side<0?'#172c36':'#365966');gradient.addColorStop(.5,'#294955');gradient.addColorStop(1,side<0?'#365966':'#172c36');out.fillStyle=gradient;out.fillRect(px,panelY,pw,panelH);out.fillStyle='#11232d';out.fillRect(px+5,panelY+6,pw-10,panelH-12);out.fillStyle='#2f5260';out.fillRect(px+8,panelY+10,pw-16,panelH-20);out.strokeStyle='#6a95a1';out.lineWidth=2;out.strokeRect(px+8,panelY+10,pw-16,panelH-20);out.strokeStyle='#183540';out.lineWidth=3;for(let row=1;row<4;row++){out.beginPath();out.moveTo(px+10,panelY+row*panelH/4);out.lineTo(px+pw-10,panelY+row*panelH/4);out.stroke()}out.fillStyle='#9bc1c9';for(let row=0;row<3;row++)for(const inset of [13,pw-17])out.fillRect(px+inset,panelY+18+row*panelH/4,4,4);if(breach>0){out.strokeStyle='#94dbe5';out.globalAlpha=.55*frost;out.lineWidth=3;out.beginPath();out.moveTo(side<0?px+pw-11:px+11,panelY+18);out.lineTo(side<0?px+pw-22:px+22,panelY+panelH*.44);out.lineTo(side<0?px+pw-14:px+14,panelY+panelH*.72);out.stroke();out.globalAlpha=1}}
    panel(leftX,leftW,-1);panel(rightX,rightW,1);
    if(breach>.22){
      // Bite marks turn the former clean center seam into torn metal, without
      // introducing a portal-like outline or a replacement background prop.
      out.fillStyle='#0d1d26';const leftEdge=leftX+leftW,rightEdge=rightX;
      for(const offset of [panelH*.22,panelH*.48,panelH*.73]){out.beginPath();out.moveTo(leftEdge,panelY+offset-11);out.lineTo(leftEdge-12,panelY+offset);out.lineTo(leftEdge,panelY+offset+10);out.closePath();out.fill();out.beginPath();out.moveTo(rightEdge,panelY+offset-9);out.lineTo(rightEdge+11,panelY+offset+2);out.lineTo(rightEdge,panelY+offset+12);out.closePath();out.fill()}
      out.fillStyle='#172b34';out.globalAlpha=.8;out.beginPath();out.moveTo(leftX+leftW*.30,panelY+panelH*.38);out.lineTo(leftX+leftW*.58,panelY+panelH*.34);out.lineTo(leftX+leftW*.54,panelY+panelH*.48);out.lineTo(leftX+leftW*.27,panelY+panelH*.52);out.closePath();out.fill();out.beginPath();out.moveTo(rightX+rightW*.43,panelY+panelH*.60);out.lineTo(rightX+rightW*.75,panelY+panelH*.54);out.lineTo(rightX+rightW*.71,panelY+panelH*.69);out.lineTo(rightX+rightW*.39,panelY+panelH*.73);out.closePath();out.fill();out.globalAlpha=1;
    }
    // The center seam is sealed first, then tears into a wide irregular gap.
    if(breach<.08){out.fillStyle='#08151d';out.fillRect(center-2,y+frame,4,h-frame*2);out.fillStyle='#7eb5c0';out.globalAlpha=.55;out.fillRect(center-1,y+frame+10,2,h-frame*2-20);out.globalAlpha=1}
    if(frost>0){out.strokeStyle='#9eeaf4';out.shadowColor='#6dddeb';out.shadowBlur=8*frost;out.globalAlpha=.7*frost;out.lineWidth=3;for(const [sx,sy,ex,ey] of [[x+frame,y+32,center-5,y+40],[x+w-frame,y+66,center+8,y+78],[center-4,y+28,center+4,y+h-30]]){out.beginPath();out.moveTo(sx,sy);out.lineTo(ex,ey);out.stroke()}out.globalAlpha=1;out.shadowBlur=0}
    if(breach>.22){out.fillStyle='#263f49';out.strokeStyle='#81aeb9';out.lineWidth=2;for(const [dx,dy,flip] of [[-w*.13,h*.84,-1],[w*.09,h*.89,1],[-w*.03,h*.93,-1]]){out.beginPath();out.moveTo(center+dx,y+dy);out.lineTo(center+dx+flip*13,y+dy+4);out.lineTo(center+dx+flip*5,y+dy+13);out.closePath();out.fill();out.stroke()}}
    // Compact side console: status changes from sealed amber to breach red.
    const consoleX=x-w*.055,consoleY=y+h*.46;out.fillStyle='#0a1921';out.fillRect(consoleX,consoleY,w*.045,h*.18);out.strokeStyle='#5d8a98';out.lineWidth=2;out.strokeRect(consoleX,consoleY,w*.045,h*.18);out.fillStyle=alert?(Math.sin(elapsed*12)>0?'#ff6545':'#7b2928'):'#e1b447';out.shadowColor=alert?'#ff4f3e':'#f2c85a';out.shadowBlur=alert?8:4;out.fillRect(consoleX+w*.014,consoleY+h*.035,w*.017,h*.026);out.shadowBlur=0;out.fillStyle='#42717d';out.fillRect(consoleX+w*.01,consoleY+h*.09,w*.025,3);out.restore();
  }
  function drawElephantBaseEnvironment(out,rect,phase,elapsed){
    const wall=out.createLinearGradient(0,0,0,rect.height*.66);wall.addColorStop(0,'#102933');wall.addColorStop(.56,'#173843');wall.addColorStop(1,'#0a1b24');out.fillStyle=wall;out.fillRect(0,0,rect.width,rect.height*.66);
    out.fillStyle='#07141b';out.fillRect(0,rect.height*.64,rect.width,rect.height*.36);out.fillStyle='#1d3b46';out.fillRect(0,rect.height*.66,rect.width,rect.height*.34);
    out.strokeStyle='#365866';out.lineWidth=2;for(let x=0;x<=rect.width;x+=rect.width*.125){out.beginPath();out.moveTo(x,0);out.lineTo(x,rect.height*.66);out.stroke()}for(let y=rect.height*.68;y<rect.height;y+=rect.height*.12){out.beginPath();out.moveTo(0,y);out.lineTo(rect.width,y);out.stroke()}
    out.fillStyle='#0b1d27';for(const x of [rect.width*.06,rect.width*.88]){out.fillRect(x,0,rect.width*.06,rect.height*.66);out.fillStyle='#477386';out.fillRect(x+rect.width*.012,0,rect.width*.012,rect.height*.66);out.fillStyle='#0b1d27'}
    // Small wall diagnostics replace the old oversized empty monitor card.
    out.fillStyle='#101f28';out.fillRect(rect.width*.13,rect.height*.22,rect.width*.09,rect.height*.075);out.strokeStyle='#6ea7b8';out.lineWidth=2;out.strokeRect(rect.width*.13,rect.height*.22,rect.width*.09,rect.height*.075);out.fillStyle='#54d9f0';for(let i=0;i<3;i++)out.fillRect(rect.width*(.142+i*.021),rect.height*.25,rect.width*.013,3);
    for(const x of [rect.width*.20,rect.width*.50,rect.width*.80]){out.fillStyle='#d8faff';out.shadowColor='#70e9ff';out.shadowBlur=13;out.fillRect(x-24,rect.height*.08,48,4);out.shadowBlur=0}
    out.strokeStyle='#6e96a1';out.lineWidth=5;for(const x of [rect.width*.31,rect.width*.73]){out.beginPath();out.moveTo(x,rect.height*.10);out.lineTo(x,rect.height*.29);out.quadraticCurveTo(x,rect.height*.34,x+28,rect.height*.34);out.lineTo(x+28,rect.height*.45);out.stroke()}
    out.fillStyle='#263f49';out.fillRect(rect.width*.30,rect.height*.70,rect.width*.40,12);out.fillStyle='#10242c';out.fillRect(rect.width*.33,rect.height*.72,12,rect.height*.13);out.fillRect(rect.width*.66,rect.height*.72,12,rect.height*.13);
    // The crew uses this reinforced service elevator.  Its animated doors make
    // each arrival legible instead of letting a new elephant pop into view.
    const serviceX=rect.width*.055,doorY=rect.height*.37,doorW=rect.width*.15,doorH=rect.height*.29;
    const entering=phase==='base-team-entry',openAmount=entering?Math.max(0,Math.min(1,elapsed/.7)):0;
    out.save();out.fillStyle='#08171e';out.fillRect(serviceX,doorY,doorW,doorH);out.strokeStyle='#648d9b';out.lineWidth=4;out.strokeRect(serviceX,doorY,doorW,doorH);out.fillStyle='#2b4d59';out.fillRect(serviceX-6,doorY-8,doorW+12,8);out.fillStyle='#a5dce6';out.fillRect(serviceX+doorW*.42,doorY-5,doorW*.16,3);
    const panelW=doorW*.5*(1-openAmount);out.fillStyle='#17333e';out.fillRect(serviceX+3,doorY+4,panelW,doorH-8);out.fillRect(serviceX+doorW-3-panelW,doorY+4,panelW,doorH-8);out.strokeStyle='#416c79';out.lineWidth=2;out.strokeRect(serviceX+3,doorY+4,panelW,doorH-8);out.strokeRect(serviceX+doorW-3-panelW,doorY+4,panelW,doorH-8);out.restore();
    drawElephantBaseBlastDoor(out,rect,phase,elapsed);
  }
  function drawCutsceneFireProjectile(out,start,target,elapsed,duration,showImpact=false){
    // This mirrors drawFlameStreams from flame-elephant.js: a compact, real
    // trunk flame stream, detached from gameplay targeting and damage state.
    const progress=Math.max(0,Math.min(1,elapsed/duration));if(progress<=0)return;
    if(progress<1){const alpha=1-progress,dx=target.x-start.x,dy=target.y-start.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;out.save();out.globalAlpha=alpha;out.lineCap='round';const flame=out.createLinearGradient(start.x,start.y,target.x,target.y);flame.addColorStop(0,'#fff5a1');flame.addColorStop(.3,'#ffbd32');flame.addColorStop(.75,'#f35a23');flame.addColorStop(1,'#d92f1622');out.strokeStyle=flame;out.shadowColor='#ff5a20';out.shadowBlur=14;out.lineWidth=7+alpha*4;out.beginPath();out.moveTo(start.x,start.y);out.quadraticCurveTo((start.x+target.x)/2+nx*7,(start.y+target.y)/2+ny*7,target.x,target.y);out.stroke();out.fillStyle='#ffd65a';for(let index=1;index<8;index++){const p=index/8,w=Math.sin(index*3.7)*7*(1-p),x=start.x+dx*p+nx*w,y=start.y+dy*p+ny*w;out.beginPath();out.arc(x,y,1.5+2*(1-p),0,Math.PI*2);out.fill()}out.restore();return}
    if(showImpact&&elapsed<duration+.45){const fade=1-(elapsed-duration)/.45;out.save();out.globalAlpha=fade;out.strokeStyle='#ffd56d';out.shadowColor='#ff5a20';out.shadowBlur=9;out.lineWidth=2;for(const [dx,dy] of [[-12,-8],[8,-10],[13,4],[-8,11]]){out.beginPath();out.moveTo(target.x,target.y);out.lineTo(target.x+dx*(1-fade),target.y+dy*(1-fade));out.stroke()}out.restore()}
  }
  function baseIceshieldCutsceneState(phase,elapsed){
    if(phase!=='base-fire-break')return phase==='base-fire-immunity'?'removed':'iceshieldIdle';
    if(elapsed<.55)return'iceshieldIdle';
    if(elapsed<.89)return'fireIncoming';
    if(elapsed<1.12)return'fireImpact';
    if(elapsed<1.72)return'shieldCracking';
    if(elapsed<2.72)return'shieldBreaking';
    return'removed';
  }
  function drawBaseIceshieldBreak(out,x,y,state,elapsed){
    if(state!=='shieldCracking'&&state!=='shieldBreaking')return;
    const crack=state==='shieldCracking'?Math.max(0,Math.min(1,(elapsed-1.12)/.6)):1;
    out.save();out.strokeStyle='#d9fbff';out.shadowColor='#83eaff';out.shadowBlur=9;out.lineWidth=2.5;out.globalAlpha=.45+.55*crack;
    for(const [x1,y1,x2,y2,x3,y3] of [[-17,-22,-5,-5,-14,12],[16,-18,5,-3,15,13],[-2,-26,7,-10,1,7]]){out.beginPath();out.moveTo(x+x1,y+y1);out.lineTo(x+x2,y+y2);out.lineTo(x+x3,y+y3);out.stroke()}
    if(state==='shieldBreaking'){const progress=Math.max(0,Math.min(1,(elapsed-1.72)/1));out.globalAlpha=(1-progress)*.8;out.strokeStyle='#efffff';out.lineWidth=4;out.beginPath();out.ellipse(x,y,31+progress*4,34+progress*4,0,0,Math.PI*2);out.stroke();const fragments=[[-1,-1],[-.7,-.45],[.62,-.72],[.9,.18],[.48,.75],[-.38,.84],[-.92,.35]];for(const [dx,dy] of fragments){const distance=22+progress*42,fx=x+dx*distance,fy=y+dy*distance;out.globalAlpha=(1-progress)*.9;out.fillStyle='#c9faff';out.beginPath();out.moveTo(fx,fy-6);out.lineTo(fx+7,fy+4);out.lineTo(fx-5,fy+7);out.closePath();out.fill()}}
    out.restore();
  }
  function drawElephantBaseFrozenActor(out,paint,actor,x,y,scale,progress=1){
    // Cutscene-only version of the gameplay freeze state.  It intentionally
    // contains no gameplay snow/dot emitter: only rising frost, angular ice,
    // and the existing rectangular casing are drawn.
    const freeze=Math.max(0,Math.min(1,progress)),frost=Math.max(0,Math.min(1,freeze/.62)),casing=Math.max(0,Math.min(1,(freeze-.62)/.38));
    paint(captureGameplaySprite(drawElephant,{...actor,freezeWarmingRemaining:0,freezeFrostLife:0,freezeThawLife:0},150),x,y,scale);
    out.save();out.translate(x,y);out.scale(scale,scale);
    if(frost>0){const top=31-64*frost;out.globalAlpha=.12+.15*frost;out.fillStyle='#a9edff';out.beginPath();out.moveTo(-34,31);out.lineTo(34,31);out.lineTo(28,top+8);out.lineTo(9,top);out.lineTo(-10,top+5);out.lineTo(-28,top+11);out.closePath();out.fill();out.globalAlpha=.2+.55*frost;out.strokeStyle='#d9faff';out.lineWidth=2;const streaks=[[-28,24,-17,13,-20,2],[-8,28,1,15,-3,4],[12,27,22,16,18,5],[29,21,20,10,25,0]];for(const [x1,y1,x2,y2,x3,y3] of streaks){out.beginPath();out.moveTo(x1,y1);out.lineTo(x2,y2);out.lineTo(x3,y3);out.stroke()}}
    if(casing>0){const growth=.72+.28*casing;out.save();out.scale(growth,growth);out.globalAlpha=.50*casing;out.fillStyle='#a9edff';out.strokeStyle='#e8fdff';out.shadowColor='#73e6ff';out.shadowBlur=14*casing;out.lineWidth=3;out.beginPath();out.roundRect(-37,-40,74,75,16);out.fill();out.stroke();out.restore()}
    if(casing>=1){out.globalAlpha=1;out.shadowBlur=0;out.fillStyle='#eaffff';out.strokeStyle='#12333e';out.lineWidth=4;out.font='900 13px Inter';out.textAlign='center';out.strokeText('FROZEN',0,-49);out.fillText('FROZEN',0,-49)}
    out.restore();
  }
  function baseSnowcapContainmentLayout(rect){
    const w=rect.width*.225,h=rect.height*.44,x=rect.width*.705,y=rect.height*.255;
    return {x,y,w,h,window:{x:x+w*.16,y:y+h*.205,w:w*.68,h:h*.47}};
  }
  function baseSnowcapCapturePosition(rect,elapsed,ghostPosition){
    const layout=baseSnowcapContainmentLayout(rect),window=layout.window;
    const carried={x:ghostPosition.x+rect.width*.062,y:ghostPosition.y-rect.height*.072},stored={x:window.x+window.w*.5,y:window.y+window.h*.54};
    const entry=Math.max(0,Math.min(1,(elapsed-1.54)/.48)),smooth=entry*entry*(3-2*entry);
    return {x:carried.x+(stored.x-carried.x)*smooth,y:carried.y+(stored.y-carried.y)*smooth};
  }
  function drawBaseSnowcapContainment(out,rect,elapsed,layer){
    const layout=baseSnowcapContainmentLayout(rect),{x,y,w,h,window}=layout;
    const open=Math.max(0,Math.min(1,(elapsed-1.08)/.46)),closed=Math.max(0,Math.min(1,(elapsed-2.02)/.43)),aperture=open*(1-closed);
    const lockProgress=[0,1,2].map(index=>Math.max(0,Math.min(1,(elapsed-(2.48+index*.16))/.15)));
    const secured=lockProgress.every(value=>value>=1),status=secured?'#7ff7ce':'#cf574e';
    out.save();
    if(layer==='back'){
      // Built-in floor plinth, cooling conduit, and a heavy structural shell
      // make this read as a base containment system rather than a loose pod.
      out.fillStyle='#091820';out.fillRect(x-w*.035,y+h*.91,w*1.07,h*.13);
      out.fillStyle='#294956';out.fillRect(x-w*.015,y+h*.87,w*1.03,h*.10);
      out.fillStyle='#142b35';out.fillRect(x+w*.07,y+h*.95,w*.76,h*.09);
      out.strokeStyle='#527886';out.lineWidth=4;out.beginPath();out.moveTo(x+w*.09,y+h*.98);out.lineTo(x+w*.09,y+h*1.10);out.lineTo(x-w*.08,y+h*1.10);out.stroke();out.strokeStyle='#77bdc9';out.lineWidth=2;out.beginPath();out.moveTo(x+w*.09,y+h*.98);out.lineTo(x+w*.09,y+h*1.10);out.lineTo(x-w*.08,y+h*1.10);out.stroke();
      out.fillStyle='#08151d';out.fillRect(x,y,w,h);out.fillStyle='#31525e';out.fillRect(x+5,y+5,w-10,h-10);out.fillStyle='#132832';out.fillRect(x+12,y+13,w-24,h-26);
      out.fillStyle='#476b76';out.fillRect(x-7,y-8,w+14,15);out.fillStyle='#1a3540';out.fillRect(x+12,y+18,w-24,13);out.fillStyle='#7bc8d6';out.globalAlpha=.55;out.fillRect(x+22,y+21,w-44,2);out.globalAlpha=1;
      // Angular side braces and inner cold-dark recess.
      out.fillStyle='#203f4a';for(const side of [0,1]){const bx=side?x+w-24:x+10;out.beginPath();out.moveTo(bx,y+h*.18);out.lineTo(bx+(side?-12:12),y+h*.29);out.lineTo(bx+(side?-12:12),y+h*.76);out.lineTo(bx,y+h*.87);out.closePath();out.fill()}
      out.fillStyle='#07161e';out.fillRect(window.x-6,window.y-6,window.w+12,window.h+12);
      out.fillStyle='#102a35';out.fillRect(window.x,window.y,window.w,window.h);
      out.fillStyle='#1b3a45';out.globalAlpha=.6;out.fillRect(window.x+5,window.y+5,window.w-10,window.h-10);out.globalAlpha=1;
    }else{
      // Glass, door seam, three separately engaging mechanical clamps, and a
      // small local control panel remain readable after the capture completes.
      out.globalAlpha=.20;out.fillStyle='#a8f4ff';out.fillRect(window.x+3,window.y+3,window.w-6,window.h-6);out.globalAlpha=1;out.strokeStyle='#b9faff';out.shadowColor='#71dbe8';out.shadowBlur=8;out.lineWidth=3;out.strokeRect(window.x,window.y,window.w,window.h);out.shadowBlur=0;
      const seamX=window.x+window.w*.5,doorOffset=aperture*window.w*.22;out.fillStyle='#0d222b';out.fillRect(seamX-3-doorOffset,window.y+3,3,window.h-6);out.fillRect(seamX+doorOffset,window.y+3,3,window.h-6);out.strokeStyle='#6e9eaa';out.lineWidth=1;out.strokeRect(window.x+5,window.y+5,window.w-10,window.h-10);
      for(let index=0;index<3;index++){const cy=window.y+window.h*(.24+index*.26),engage=lockProgress[index],cx=seamX;out.fillStyle='#101f28';out.fillRect(cx-18,cy-7,36,14);out.strokeStyle='#7ca4ae';out.lineWidth=2;out.strokeRect(cx-18,cy-7,36,14);out.fillStyle=engage>=1?'#87f5ce':'#a84b45';out.fillRect(cx-13+engage*5,cy-3,15,6);out.fillStyle='#d6fbff';out.fillRect(cx+4,cy-2,7,4)}
      out.fillStyle='#0b1a22';out.fillRect(x+w*.03,y+h*.58,w*.115,h*.25);out.strokeStyle='#638d9b';out.lineWidth=2;out.strokeRect(x+w*.03,y+h*.58,w*.115,h*.25);out.fillStyle=status;out.shadowColor=status;out.shadowBlur=secured?8:4;out.fillRect(x+w*.055,y+h*.625,w*.06,6);out.shadowBlur=0;out.fillStyle='#b9e5eb';out.font='700 7px Inter';out.textAlign='center';out.fillText(secured?'LOCKED':'SECURING',x+w*.087,y+h*.70);
      out.fillStyle='#263f49';out.fillRect(x+w*.22,y+h*.88,w*.57,10);for(let index=0;index<6;index++){out.fillStyle=index%2?'#d29f39':'#252d30';out.beginPath();out.moveTo(x+w*(.23+index*.09),y+h*.885);out.lineTo(x+w*(.27+index*.09),y+h*.885);out.lineTo(x+w*(.23+index*.09),y+h*.962);out.lineTo(x+w*(.19+index*.09),y+h*.962);out.closePath();out.fill()}
      out.fillStyle=secured?'#84f7d1':'#ef7965';out.font='800 8px Inter';out.textAlign='center';out.fillText(secured?'CONTAINMENT LOCKED':'CONTAINMENT SEALING',x+w*.52,y+h*.125);
      for(const [bx,by] of [[.055,.10],[.945,.10],[.055,.90],[.945,.90]]){out.fillStyle='#b7d4d9';out.fillRect(x+w*bx-2,y+h*by-2,4,4)}
    }
    out.restore();
  }
  function elephantBaseHeaterState(phase,elapsed){
    if(phase==='base-heater-success')return elapsed<.48?'arming':'running';
    const ignition=phase==='base-heater-one'?[.32,.72]:phase==='base-heater-two'?[.42,.88]:[.46,.94];
    return elapsed<ignition[0]?'idle':elapsed<ignition[1]?'sputtering':'failed';
  }
  function drawElephantBaseHeater(out,rect,phase,elapsed){
    const stateName=elephantBaseHeaterState(phase,elapsed),x=rect.width*.765,y=rect.height*.49,w=rect.width*.18,h=rect.height*.31,running=stateName==='running',sputtering=stateName==='sputtering',arming=stateName==='arming',warmth=running?1:sputtering?.55:arming?.28:0;
    out.save();
    // Dedicated cutscene heater: fixed on a floor plinth, rather than relying
    // on the small gameplay support sprite or a wall decoration.
    out.fillStyle='#08171e';out.fillRect(x-w*.08,y+h*.86,w*1.16,h*.18);out.fillStyle='#294955';out.fillRect(x-w*.04,y+h*.83,w*1.08,h*.10);out.fillStyle='#172f39';out.fillRect(x,y,w,h);out.strokeStyle='#5c8793';out.lineWidth=5;out.strokeRect(x,y,w,h);out.fillStyle='#0d2029';out.fillRect(x+w*.06,y+h*.12,w*.67,h*.68);out.strokeStyle='#345966';out.lineWidth=2;out.strokeRect(x+w*.06,y+h*.12,w*.67,h*.68);
    // Layered furnace housing and vent grate.
    out.fillStyle='#263f49';out.fillRect(x+w*.10,y+h*.19,w*.57,h*.44);out.fillStyle='#09161c';out.fillRect(x+w*.15,y+h*.28,w*.47,h*.25);out.strokeStyle=running?'#ffd36b':'#526d76';out.lineWidth=3;out.strokeRect(x+w*.15,y+h*.28,w*.47,h*.25);
    const furnace=out.createLinearGradient(x,y+h*.28,x,y+h*.53);furnace.addColorStop(0,running?'#fff0a1':'#17242a');furnace.addColorStop(.5,running?'#ff9b30':sputtering?'#8e5027':'#0b151a');furnace.addColorStop(1,running?'#d9481f':'#071116');out.globalAlpha=.25+.75*warmth;out.fillStyle=furnace;out.fillRect(x+w*.18,y+h*.31,w*.41,h*.19);out.globalAlpha=1;
    // Once it is truly running, the furnace window includes the real gameplay
    // heater core as a compact live component; failed attempts never show it.
    if(running&&typeof drawHeater==='function'){const heaterActor={kind:'support',towerType:'heater',towerId:0,radius:0,x:0,y:0,level:3},gameplayCore=captureGameplaySprite(drawHeater,heaterActor,150);if(gameplayCore){const coreW=w*.31;out.globalAlpha=.42;out.drawImage(gameplayCore,x+w*.23,y+h*.235,coreW,coreW);out.globalAlpha=1}}
    out.strokeStyle='#56727b';out.lineWidth=3;for(let index=0;index<4;index++){const gx=x+w*(.21+index*.105);out.beginPath();out.moveTo(gx,y+h*.31);out.lineTo(gx,y+h*.50);out.stroke()}
    // Heavy top pipe and small cooling return pipe connect the unit to the Base.
    out.strokeStyle='#415f68';out.lineWidth=8;out.beginPath();out.moveTo(x+w*.36,y+h*.12);out.lineTo(x+w*.36,y-h*.13);out.quadraticCurveTo(x+w*.36,y-h*.19,x+w*.45,y-h*.19);out.lineTo(x+w*.70,y-h*.19);out.stroke();out.strokeStyle='#83aab2';out.lineWidth=2;out.beginPath();out.moveTo(x+w*.36,y+h*.12);out.lineTo(x+w*.36,y-h*.13);out.quadraticCurveTo(x+w*.36,y-h*.19,x+w*.45,y-h*.19);out.lineTo(x+w*.70,y-h*.19);out.stroke();out.strokeStyle='#31545f';out.lineWidth=6;out.beginPath();out.moveTo(x+w*.72,y+h*.69);out.lineTo(x+w*.87,y+h*.69);out.lineTo(x+w*.87,y+h*.93);out.stroke();
    // Control panel, physical lever, gauge, and power light.
    out.fillStyle='#0a1920';out.fillRect(x+w*.76,y+h*.18,w*.18,h*.52);out.strokeStyle='#7496a0';out.lineWidth=2;out.strokeRect(x+w*.76,y+h*.18,w*.18,h*.52);out.fillStyle='#273f47';out.beginPath();out.arc(x+w*.85,y+h*.31,w*.055,0,Math.PI*2);out.fill();out.strokeStyle='#d8e7e7';out.lineWidth=1;out.beginPath();out.moveTo(x+w*.85,y+h*.31);out.lineTo(x+w*(.85+(running?.035:sputtering?.02:-.025)),y+h*.27);out.stroke();out.strokeStyle='#9fb6ba';out.lineWidth=3;out.beginPath();out.moveTo(x+w*.82,y+h*.51);out.lineTo(x+w*(.82+(sputtering?.06:running?.09:.02)),y+h*(sputtering?.44:running?.40:.43));out.stroke();
    out.fillStyle=running?'#82f5b7':sputtering||arming?'#efaa45':'#923e3a';out.shadowColor=out.fillStyle;out.shadowBlur=running?11:5;out.fillRect(x+w*.815,y+h*.59,w*.07,h*.035);out.shadowBlur=0;out.fillStyle='#c9e8eb';out.font='700 7px Inter';out.textAlign='center';out.fillText(running?'ACTIVE':'POWER',x+w*.85,y+h*.67);
    // Attempts make only angular sparks and a short, non-circular heat shimmer.
    if(sputtering){out.strokeStyle='#ffc166';out.shadowColor='#ff7830';out.shadowBlur=8;out.lineWidth=2;for(const [dx,dy] of [[.24,-.06],[.38,-.11],[.50,-.07]]){out.beginPath();out.moveTo(x+w*dx,y+h*.27);out.lineTo(x+w*(dx+.02),y+h*(dy+.10));out.lineTo(x+w*(dx+.045),y+h*dy);out.stroke()}out.shadowBlur=0}
    if(running){out.strokeStyle='#ffc86b';out.globalAlpha=.45+.20*Math.sin(elapsed*7);out.lineWidth=2;for(const offset of [-.06,0,.06]){out.beginPath();out.moveTo(x+w*(.38+offset),y+h*.25);out.quadraticCurveTo(x+w*(.40+offset),y-h*.02,x+w*(.37+offset),y-h*.15);out.stroke()}out.globalAlpha=1;out.fillStyle='#dffcff';out.globalAlpha=.15;out.fillRect(x-w*.14,y+h*.73,w*.13,h*.12);out.globalAlpha=1}
    out.fillStyle='#b2d2d6';for(const [bx,by] of [[.04,.06],[.96,.06],[.04,.94],[.96,.94]])out.fillRect(x+w*bx-2,y+h*by-2,4,4);out.restore();
  }
  function drawElephantBase(out,rect,phase,elapsed){
    const paint=(sprite,x,y,scale=1)=>{if(sprite){const size=sprite.width*scale;out.drawImage(sprite,x-size/2,y-size/2,size,size)}};
    const underAttack=['base-snowcap-freeze','base-shield-defense','base-fire-order','base-fire-break','base-fire-immunity'].includes(phase),frozen=['base-snowcap-freeze','base-shield-defense','base-fire-order','base-fire-break'].includes(phase),injectionRoute=phase==='base-serum-injection'?ghostScoutInjectionRoute(rect,elapsed):null;
    // The shot is staged once: the order beat only turns the Fire Elephant
    // toward its target, and the break beat owns the complete projectile.
    const fireAttacking=phase==='base-fire-order'||phase==='base-fire-break';
    const fireTestElephant={kind:'elephant',towerType:'flame',facing:1,angle:0,recoil:fireAttacking ? .9 : 0,attack:fireAttacking?1:0,walking:false};
    const scientist={kind:'elephant',towerType:'base',facing:1,angle:0,recoil:0,attack:0,walking:false};
    // The Ghost Scout is a permanent, independent cutscene actor.  It never
    // shares a failed/frozen cleanup path with the other Base elephants.
    const ghost={...GHOST_SCOUT_CUTSCENE_ACTOR,facing:1,angle:0,recoil:0,attack:0,walking:phase==='base-ghost-rescue'||!!injectionRoute?.walking};
    const normalTestElephant={kind:'elephant',towerType:'base',facing:1,angle:0,recoil:0,attack:0,walking:false};
    const fireTransformationStartsAt=injectionRoute?.transformationStartsAt??2.35,fireTransformationSwapAt=injectionRoute?.transformationSwapAt??2.75;
    // These are intentionally separate actor descriptors.  Until the syringe
    // has withdrawn and the transformation beat finishes, no flame renderer
    // is allowed to touch the normal test subject.
    const testSubject=phase==='base-serum-injection'&&elapsed<fireTransformationSwapAt?normalTestElephant:fireTestElephant;
    const snow={special:false,tier:9,roll:0,hp:100,maxHp:100,snowCovered:true};
    const iceshieldState=baseIceshieldCutsceneState(phase,elapsed),shieldHits=['shieldCracking','shieldBreaking'].includes(iceshieldState)?1:2,shieldImpact=iceshieldState==='fireImpact',shield={special:false,tier:10,roll:0,hp:100,maxHp:100,iceShieldHits:shieldHits,iceShieldMaxHits:2,iceShieldImpactLife:shieldImpact?.36:0,iceShieldCrackLife:['shieldCracking','shieldBreaking'].includes(iceshieldState)?.55:0};
    if(scene&&isElephantBasePhase(phase))scene.dataset.iceshieldState=iceshieldState;
    drawElephantBaseEnvironment(out,rect,phase,elapsed);
    if(phase==='base-ghost-rescue')drawBaseSnowcapContainment(out,rect,elapsed,'back');
    // Fixed injection anchor: this tray is distinct from every elephant.
    if(phase==='base-serum-injection'){out.save();out.fillStyle='#17313a';out.strokeStyle='#83aab3';out.lineWidth=2;out.fillRect(rect.width*.445,rect.height*.705,rect.width*.09,9);out.strokeRect(rect.width*.445,rect.height*.705,rect.width*.09,9);out.fillStyle='#d8f8ff';out.fillRect(rect.width*.462,rect.height*.695,rect.width*.028,3);out.restore()}
    if(phase.startsWith('base-heater'))drawElephantBaseHeater(out,rect,phase,elapsed);
    const entryProgress=Math.max(0,Math.min(1,(elapsed-.7)/1.6));
    // A single, ordered route: station -> syringe tray -> test subject ->
    // observation position.  The Ghost Scout never injects from empty space.
    const ghostPosition=elephantBaseGhostPosition(rect,phase,elapsed);
    const ghostSprite=captureGameplaySprite(drawElephant,ghost,150);
    // Stable, visible world-space layer: the gameplay renderer supplies the
    // actual Ghost Scout glasses on the elephant's face.
    paint(ghostSprite,ghostPosition.x,ghostPosition.y,.94);
    if(phase==='base-team-entry'){const x=rect.width*(.13+.18*entryProgress);paint(captureGameplaySprite(drawElephant,scientist,150),x,rect.height*.64,1.02);paint(captureGameplaySprite(drawElephant,normalTestElephant,150),x+rect.width*.13,rect.height*.66,1.0);paint(captureGameplaySprite(drawElephant,normalTestElephant,150),x+rect.width*.25,rect.height*.65,1.0)}
    if(!underAttack&&!phase.startsWith('base-heater')&&phase!=='base-team-entry'){
      if(phase==='base-serum-injection')paint(captureGameplaySprite(drawElephant,normalTestElephant,150),rect.width*.30,rect.height*.65,.92);
      else{paint(captureGameplaySprite(drawElephant,scientist,150),rect.width*.34,rect.height*.64,1.02);paint(captureGameplaySprite(drawElephant,normalTestElephant,150),rect.width*.52,rect.height*.64,1.0)}
      if(['base-serum-injection','base-fire-result','base-north-motion','base-orb-breach'].includes(phase))paint(captureGameplaySprite(drawElephant,phase==='base-serum-injection'?testSubject:fireTestElephant,150),rect.width*.66,rect.height*.65,1.05);
      // The syringe is picked up only after the tray pause, rides with the
      // visible Ghost Scout, then drains only during the local injection beat.
      if(phase==='base-serum-injection'&&injectionRoute?.syringeVisible){
        const p=injectionRoute.injectionProgress,travel=injectionRoute.injectionTravel,sx=ghostPosition.x+rect.width*(.045+.055*travel),sy=ghostPosition.y-rect.height*.04;
        out.save();out.translate(sx,sy);out.rotate(.22);out.fillStyle='#dffcff';out.strokeStyle='#203943';out.lineWidth=4;out.beginPath();out.roundRect(-31,-9,56,18,5);out.fill();out.stroke();const serum=out.createLinearGradient(-24,0,19,0);serum.addColorStop(0,'#ffd34b');serum.addColorStop(.55,'#ff7c2a');serum.addColorStop(1,'#e13722');out.strokeStyle=serum;out.lineWidth=9;out.beginPath();out.moveTo(-22,0);out.lineTo(17*(1-p),0);out.stroke();out.strokeStyle='#233b43';out.lineWidth=3;out.beginPath();out.moveTo(25,0);out.lineTo(41,0);out.stroke();out.strokeStyle='#dffcff';out.lineWidth=1;out.beginPath();out.moveTo(28,0);out.lineTo(43,0);out.stroke();out.strokeStyle='#203943';out.lineWidth=5;out.beginPath();out.moveTo(-31,0);out.lineTo(-43+11*p,0);out.stroke();out.strokeStyle='#d9f7ff';out.lineWidth=3;out.beginPath();out.moveTo(-43+11*p,-8);out.lineTo(-43+11*p,8);out.stroke();out.restore();
      }
      if(phase==='base-serum-injection'&&elapsed>=fireTransformationStartsAt&&elapsed<fireTransformationSwapAt){const t=(elapsed-fireTransformationStartsAt)/(fireTransformationSwapAt-fireTransformationStartsAt);out.save();out.globalAlpha=.7*(1-t);out.fillStyle='#ffb23d';out.shadowColor='#ff5926';out.shadowBlur=18;out.beginPath();out.arc(rect.width*.66,rect.height*.65,18+t*22,0,Math.PI*2);out.fill();out.restore()}
    }
    if(phase==='base-orb-breach'){const p=Math.max(0,Math.min(1,(elapsed-.55)/1.4)),snowEntry=[{x:.88-.17*p,y:.40+.15*p},{x:.93-.15*p,y:.49+.04*p},{x:.96-.12*p,y:.58-.01*p}];for(const position of snowEntry)paint(captureGameplaySprite(drawBall,snow,150),rect.width*position.x,rect.height*position.y,.72);paint(captureGameplaySprite(drawBall,shield,150),rect.width*(.98-.08*p),rect.height*(.47+.16*p),.82)}
    if(underAttack){const researchers=[.30,.42,.52];for(const [index,x] of researchers.entries()){const freezeProgress=phase==='base-snowcap-freeze'?Math.max(0,Math.min(1,(elapsed-index*.25)/1.2)):1;drawElephantBaseFrozenActor(out,paint,scientist,rect.width*x,rect.height*.67,.9,freezeProgress)}paint(captureGameplaySprite(drawElephant,fireTestElephant,150),rect.width*.62,rect.height*.67,1.14);const snowPositions=phase==='base-fire-immunity'&&elapsed>=2?[{x:.76,y:.56}]:[{x:.72,y:.52},{x:.79,y:.45},{x:.83,y:.61}];for(const position of snowPositions)paint(captureGameplaySprite(drawBall,snow,150),rect.width*position.x,rect.height*position.y,.68);if(phase!=='base-fire-immunity'&&iceshieldState!=='removed')paint(captureGameplaySprite(drawBall,shield,150),rect.width*.91,rect.height*.64,.82);
      // This is flameTrunkTip's gameplay pose for the staged Fire Elephant:
      // facing right, no rotation, attack pose, and its real recoil offset.
      const fireScale=1.14,fireShotStart={x:rect.width*.62+(43-.9*5)*fireScale,y:rect.height*.67+fireScale},fireShotTarget={x:rect.width*.91,y:rect.height*.64};
      if(phase==='base-fire-break')drawCutsceneFireProjectile(out,fireShotStart,fireShotTarget,elapsed-.8,.34,true);
      if(phase==='base-fire-break')drawBaseIceshieldBreak(out,fireShotTarget.x,fireShotTarget.y,iceshieldState,elapsed);
    }
    if(phase==='base-ghost-rescue'){for(const x of [.31,.59])paint(captureGameplaySprite(drawElephant,scientist,150),rect.width*x,rect.height*.68,.82);const capturedSnow=baseSnowcapCapturePosition(rect,elapsed,ghostPosition);paint(captureGameplaySprite(drawBall,snow,150),capturedSnow.x,capturedSnow.y,.62);drawBaseSnowcapContainment(out,rect,elapsed,'front')}
    if(phase.startsWith('base-heater')){for(const x of [.35,.47])paint(captureGameplaySprite(drawElephant,scientist,150),rect.width*x,rect.height*.69,.84);out.save();out.strokeStyle='#a9c5c9';out.lineWidth=3;out.beginPath();out.moveTo(ghostPosition.x+25,ghostPosition.y-4);out.lineTo(rect.width*.755,rect.height*.59);out.stroke();out.restore();}
  }
  function drawOpeningCharactersFrame(){
    if(!characterCanvas?.getContext||!scene)return;
    lockSurvivorTransforms();
    const rect=scene.getBoundingClientRect(),ratio=Math.max(1,root.devicePixelRatio||1),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(characterCanvas.width!==w||characterCanvas.height!==h){characterCanvas.width=w;characterCanvas.height=h}
    const out=characterCanvas.getContext('2d'),phase=scene.dataset.phase||'',outdoors=isOutdoorTestPhase(phase),elephantBase=isElephantBasePhase(phase),size=150;
    scene.dataset.scientistMoveState=refinementScientistMoveState(phase,runtime.elapsed);
    const scientist=outdoors?{x:rect.width*.83,y:rect.height*.36}:scientistPosition(rect,phase,runtime.elapsed);
    // The scientist is a dedicated entity, never a sample-orb wrapper.  Its
    // render path has no failure state or batch-cleanup branch.
    const scientistOrbEntity={...SCIENTIST_ORB_ENTITY,special:false,roll:0,hp:100,maxHp:100};
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
    if(elephantBase){drawElephantBase(out,rect,phase,runtime.elapsed);return}
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
    const paintRefinementSubjects=()=>{
      if(!isRefinementPhase(phase))return;
      const batch=refinementBatchForPhase(phase);
      if(!batch)return;
      for(const definition of REFINEMENT_SUBJECTS.filter(subject=>subject.batch===batch)){
        const subjectState=runtime.refinementSubjects[definition.id]||'untested';
        const chamber=scene.querySelector?.(`.ice-chambers .ice-chamber:nth-child(${definition.slot+1})`),stand=chamber?.querySelector?.('i'),bounds=chamber?.getBoundingClientRect?.(),standBounds=stand?.getBoundingClientRect?.();
        if(!bounds?.width||!standBounds?.top)continue;
        const x=bounds.left-rect.left+bounds.width/2,y=standBounds.top-rect.top-sharedChamber.orbDiameter/2-2;
        const mutation=subjectState==='survivedSnowCap'?{snowCovered:true}:subjectState==='survivedIceShield'?{iceShieldHits:2,iceShieldMaxHits:2}:{};
        const sampleOrbEntity={id:`sampleOrbEntity-${definition.id}`,special:false,tier:definition.tier,roll:0,hp:100,maxHp:100,...mutation};
        // This transform belongs to the canvas draw of this exact active
        // failed sample.  No chamber or sibling wrapper is ever scaled.
        const failurePhase=REFINEMENT_INJECTION_PHASES[phase],isActiveFailure=failurePhase?.subject===definition.id&&failurePhase.result==='failed'&&runtime.elapsed>=INJECTION_COMPLETE_AT;
        const failureProgress=isActiveFailure?Math.max(0,Math.min(1,(runtime.elapsed-INJECTION_COMPLETE_AT)/1.5)):0;
        const sprite=captureGameplaySprite(drawBall,sampleOrbEntity,size,1,0,runtime.cinematicTime);
        const failed=subjectState==='failed'||isActiveFailure,scale=isActiveFailure&&failureProgress<.72?1+Math.sin(Math.min(1,failureProgress/.55)*Math.PI)*.12:failed?.72:1;
        const entering=(phase==='refinement-batch-one-prep'||phase==='refinement-batch-two-prep'||phase==='refinement-final-prep')?Math.min(1,runtime.elapsed/.65):1;
        out.save();out.globalAlpha=(failed?.28:1)*entering;out.translate(x,y+(failed?sharedChamber.orbDiameter*.19:0));out.scale(scale,scale);paintChamberOrb(sprite,0,0);out.restore();
      }
    };
    const scientistVisible=phase!=='arrival';
    // Render the normal gameplay Platinum Ring Orb as one layer so its rings
    // retain their established front/back overlap around the metal body.
    if(scientistVisible){const ringTime=runtime.cinematicTime*SCIENTIST_RING_TIME_SCALE+Math.PI/4/1.8;paint(captureGameplaySprite(drawBall,scientistOrbEntity,size,PLATINUM_CUTSCENE_SCALE,Math.PI/4,ringTime),scientist.x,scientist.y)}
    if(!isRefinementPhase(phase)&&tierTenState!=='failed')paintTestOrb(captureGameplaySprite(drawBall,tierTenState==='survivedIceShield'?tierTen:tierTenBase,size,1,0,runtime.cinematicTime),tierTenTarget.x,tierTenTarget.y);
    if(!isRefinementPhase(phase)&&tierNineState!=='failed')paintTestOrb(captureGameplaySprite(drawBall,tierNineState==='survivedSnowCap'?tierNine:tierNineBase,size),tierNineTarget.x,tierNineTarget.y);
    paintRefinementSubjects();
    if(outdoors){
      paint(captureGameplaySprite(drawElephant,elephant,size),elephantPosition.x,elephantPosition.y,1.1);
      drawOutdoorRecorder(out,scientist,runtime.elapsed);
      drawOutdoorTestEffects(out,rect,phase,runtime.elapsed,outdoorSnow,outdoorShield,elephantPosition);
    }
    drawOpeningInjection(rect,ratio,phase);
  }
  function drawOpeningCharacters(){
    try{drawOpeningCharactersFrame()}catch(error){
      runtime.lastRenderError=error;
      if(!characterCanvas?.getContext||!scene)return;
      const rect=scene.getBoundingClientRect(),ratio=Math.max(1,root.devicePixelRatio||1),out=characterCanvas.getContext('2d');
      characterCanvas.width=Math.max(1,Math.round(rect.width*ratio));characterCanvas.height=Math.max(1,Math.round(rect.height*ratio));out.setTransform(ratio,0,0,ratio,0,0);
      const fallback=out.createLinearGradient(0,0,0,rect.height);fallback.addColorStop(0,'#244b59');fallback.addColorStop(1,'#091b25');out.fillStyle=fallback;out.fillRect(0,0,rect.width,rect.height);
      try{const elephant=captureGameplaySprite(drawElephant,{kind:'elephant',towerType:'base',facing:1,angle:0,recoil:0,attack:0,walking:false},150),orb=captureGameplaySprite(drawBall,{special:false,tier:3,roll:0,hp:100,maxHp:100},150);if(elephant)out.drawImage(elephant,rect.width*.25-elephant.width*.38,rect.height*.62-elephant.height*.38,elephant.width*.76,elephant.height*.76);if(orb)out.drawImage(orb,rect.width*.70-orb.width*.3,rect.height*.56-orb.height*.3,orb.width*.6,orb.height*.6)}catch{}
    }
    positionCutsceneDialogue();
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
    runtime.active=false;runtime.paused=false;runtime.cutsceneState=null;root.iceOpeningCutsceneState=null;runtime.playbackSpeed=1;root.cutscenePlaybackSpeed=1;setCutsceneMenuOpen(false);updateCutscenePauseUI();scene?.removeAttribute('data-cutscene-paused');clearPhaseDialogue();updateCutscenePlaybackSpeedUI();if(!runtime.replay)markViewed();modal?.classList.add('hidden');scene?.removeAttribute('data-replaying');
    restoreReturnState(returnState||{paused:runtime.previousPaused});runtime.returnState=null;
    updateUI?.();
  }
  function startIceMapOpeningCutscene({replay=false,returnState}={}){
    // Automatic campaign playback belongs only to an active Ice Map run.
    // Replays are intentionally available from the Ice Map card as well.
    if(runtime.active||(!replay&&root.GameContent?.activeMap?.id!==MAP_ID))return false;
    runtime.active=true;runtime.paused=false;runtime.replay=!!replay;runtime.returnState=returnState||captureReturnState();runtime.cutsceneState={mode:'cutscene',cutsceneId:'ice-map-opening',returnScreen:runtime.returnState.screen};root.iceOpeningCutsceneState=runtime.cutsceneState;runtime.previousPaused=!!state?.paused;runtime.lastError=null;runtime.cinematicTime=0;runtime.playbackSpeed=1;root.cutscenePlaybackSpeed=1;
    try{
      if(state)state.paused=true;
      // Reveal first: phase drawing reads the scene dimensions and must never
      // render against a display:none canvas.
      mapSelectionModal?.classList.add('hidden');difficultyModal?.classList.add('hidden');modal?.classList.remove('hidden');
      if(scene){scene.dataset.replaying=runtime.replay?'true':'false';scene.dataset.syringesUsed='0';scene.dataset.refinementSyringesUsed='0';scene.dataset.cutscenePaused='false';runtime.usedSyringeIds=new Set();resetTrialSubjects();resetRefinementSubjects();void scene.offsetWidth}updateCutscenePauseUI();setCutsceneMenuOpen(false);observeCutsceneAnimations();updateCutscenePlaybackSpeedUI();
      setPhase(0);skip?.focus?.();return true;
    }catch(error){
      runtime.active=false;runtime.cutsceneState=null;root.iceOpeningCutsceneState=null;runtime.lastError=error;modal?.classList.add('hidden');restoreReturnState(runtime.returnState);runtime.returnState=null;console.error('[Ice opening] Failed to start.',error);return false;
    }
  }
  function updateIceOpening(dt){
    if(!runtime.active||runtime.paused)return;
    const cutsceneDelta=Math.max(0,dt)/Math.max(1,state?.gameSpeed||1)*runtime.playbackSpeed;runtime.elapsed+=cutsceneDelta;runtime.cinematicTime+=cutsceneDelta;syncCutsceneAnimationPlaybackRate();
    const phase=ICE_OPENING_SCENES[runtime.index]?.id;
    const phaseData=ICE_OPENING_SCENES[runtime.index];
    if(phase&&injectionPhaseData(phase)&&runtime.elapsed>=INJECTION_COMPLETE_AT&&scene)scene.dataset.injectionComplete='true';
    updateTrialSubjectStates(phase);
    updateRefinementSubjectStates(phase);
    updatePhaseDialogue(phaseData);
    drawOpeningCharacters();
    while(runtime.active&&runtime.elapsed>=ICE_OPENING_SCENES[runtime.index].duration){
      if(!outdoorResultHoldComplete(ICE_OPENING_SCENES[runtime.index].id)||!updatePhaseDialogue(ICE_OPENING_SCENES[runtime.index])||(ICE_OPENING_SCENES[runtime.index].id==='base-serum-injection'&&!baseSerumInjectionComplete()))break;
      runtime.elapsed-=ICE_OPENING_SCENES[runtime.index].duration;
      if(runtime.index>=ICE_OPENING_SCENES.length-1){finishIceOpening();break}
      setPhase(runtime.index+1);
    }
  }
  root.startIceMapOpeningCutscene=startIceMapOpeningCutscene;
  root.playIceOpeningCutscene=startIceMapOpeningCutscene;
  root.finishIceOpeningCutscene=finishIceOpening;
  root.setIceOpeningCutscenePlaybackSpeed=setCutscenePlaybackSpeed;
  root.setIceOpeningCutscenePaused=setCutscenePaused;
  root.setIceOpeningCutsceneMenuOpen=setCutsceneMenuOpen;
  root.iceOpeningCutsceneRuntime=runtime;
  skip?.addEventListener('click',finishIceOpening);
  pauseButton?.addEventListener('click',()=>setCutscenePaused(!runtime.paused));
  cutsceneMenuToggle?.addEventListener('click',()=>setCutsceneMenuOpen(!cutsceneMenu?.classList.contains?.('open')));
  scene?.addEventListener('pointerdown',event=>{if(runtime.active&&cutsceneMenu?.classList.contains?.('open')&&!cutsceneMenu?.contains?.(event.target))setCutsceneMenuOpen(false)});
  cutsceneSpeedButtons.forEach(button=>button.addEventListener('click',()=>setCutscenePlaybackSpeed(button.dataset.cutsceneSpeed)));

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
  document.addEventListener?.('keydown',event=>{if(!runtime.active)return;if(event.key==='Escape')setCutsceneMenuOpen(false);event.preventDefault?.();event.stopImmediatePropagation?.()},true);
  window.addEventListener?.('pagehide',()=>{if(runtime.active){runtime.active=false;runtime.paused=false;runtime.cutsceneState=null;root.iceOpeningCutsceneState=null;runtime.playbackSpeed=1;root.cutscenePlaybackSpeed=1;setCutsceneMenuOpen(false);updateCutscenePauseUI();modal?.classList.add('hidden')}});
  window.addEventListener?.('resize',positionCutsceneDialogue);
})(globalThis);
