// Data-driven first section of the Frozen Expanse opening cinematic.
(function(root){
  'use strict';
  const MAP_ID='frozen_expanse',VIEW_KEY='elephant-track-ice-opening-viewed-v1';
  const ICE_OPENING_SCENES=Object.freeze([
    {id:'arrival',duration:4.5,dialogue:'The elephants are getting stronger. We need an answer.'},
    {id:'lab-reveal',duration:3.4,dialogue:'Begin the cold-serum trials.'},
    {id:'failed-one',duration:4.1,dialogue:'Another failure...'},
    {id:'failed-two',duration:3.7},
    {id:'failed-three',duration:4.2,dialogue:'The weak ones cannot survive the cold.'},
    {id:'shield-create',duration:4.3,dialogue:'Excellent. A shield of living ice.'},
    {id:'snow-create',duration:4.3,dialogue:'And this one can freeze them in place.'},
    {id:'freeze-test',duration:4.2,dialogue:'Let us see what the elephants can do against them.'},
    {id:'freeze-result',duration:3.1,dialogue:'Frozen. Just as planned.'},
    {id:'shield-hit-one',duration:2.7},
    {id:'shield-hit-two',duration:3.4,dialogue:'The shield can break... but it buys us time.'},
    {id:'success',duration:2.8},
    {id:'fade',duration:1.5}
  ]);
  root.ICE_OPENING_SCENES=ICE_OPENING_SCENES;
  const modal=document.querySelector('#iceOpeningCutscene'),scene=document.querySelector('#iceOpeningScene'),speech=document.querySelector('.ice-scientist-speech'),characterCanvas=document.querySelector('#iceOpeningCharacters'),injectionCanvas=document.querySelector('#iceOpeningInjection'),skip=document.querySelector('#skipIceOpeningCutscene'),mapSelectionModal=document.querySelector('#mapSelectionModal'),difficultyModal=document.querySelector('#difficultyModal'),replayNotice=document.querySelector('#iceOpeningReplayNotice');
  // Render the existing gameplay orb at this resolution, then composite it
  // one-to-one into the laboratory close-up.  This keeps the large scientist
  // crisp rather than enlarging a small raster capture.
  const PLATINUM_CUTSCENE_SCALE=5.984;
  const runtime={active:false,replay:false,index:0,elapsed:0,previousPaused:false,returnState:null,lastError:null};
  function hasViewed(){try{return localStorage.getItem(VIEW_KEY)==='viewed'}catch{return false}}
  function markViewed(){try{localStorage.setItem(VIEW_KEY,'viewed')}catch{}}
  function setPhase(index){runtime.index=index;runtime.elapsed=0;if(scene){const phase=ICE_OPENING_SCENES[index]||{};scene.dataset.phase=phase.id||'fade';scene.dataset.dialogue=phase.dialogue||'';delete scene.dataset.injectionComplete;if(speech)speech.dataset.dialogue=phase.dialogue||''}drawOpeningCharacters()}
  // These cutscene frames call the active gameplay renderers directly.  They
  // are captured from the game canvas, then composited into the cinematic;
  // no cutscene-specific approximation of the elephant or orb exists here.
  function captureGameplaySprite(drawSprite,subject,size=150,renderScale=1){if(typeof ctx==='undefined'||!ctx?.getImageData||!canvas)return null;const scale=Math.max(1,renderScale),frameSize=Math.max(1,Math.min(Math.ceil(size*scale),canvas.width,canvas.height)),cx=frameSize/(2*scale),cy=frameSize/(2*scale),saved=ctx.getImageData(0,0,frameSize,frameSize);try{ctx.save();ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,frameSize/scale,frameSize/scale);drawSprite({...subject,x:cx,y:cy});const frame=ctx.getImageData(0,0,frameSize,frameSize),sprite=document.createElement('canvas');sprite.width=frameSize;sprite.height=frameSize;sprite.getContext('2d').putImageData(frame,0,0);return sprite}finally{ctx.putImageData(saved,0,0);ctx.restore()}}
  const INJECTION_PHASES=Object.freeze({
    'failed-one':{x:.742,y:.43},'failed-two':{x:.83,y:.43},'failed-three':{x:.918,y:.43},
    'shield-create':{x:.31,y:.49},'snow-create':{x:.68,y:.65}
  });
  const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  function injectionProgress(phase){return INJECTION_PHASES[phase]?Math.max(0,runtime.elapsed):null}
  function drawOpeningInjection(rect,ratio,phase){
    if(!injectionCanvas?.getContext)return;
    const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(injectionCanvas.width!==w||injectionCanvas.height!==h){injectionCanvas.width=w;injectionCanvas.height=h}
    const out=injectionCanvas.getContext('2d'),elapsed=injectionProgress(phase);out.setTransform(ratio,0,0,ratio,0,0);out.clearRect(0,0,rect.width,rect.height);
    if(elapsed===null){injectionCanvas.style.zIndex='21';characterCanvas.style.zIndex='18';return}
    const target={x:rect.width*INJECTION_PHASES[phase].x,y:rect.height*INJECTION_PHASES[phase].y},home={x:rect.width*.49,y:rect.height*.57};
    const direction=Math.atan2(target.y-home.y,target.x-home.x),reach={x:target.x-Math.cos(direction)*46,y:target.y-Math.sin(direction)*46};
    let position=home,plunger=0,serum=0;
    if(elapsed<.2)position=home;
    else if(elapsed<1) {const p=easeInOut((elapsed-.2)/.8);position={x:home.x+(reach.x-home.x)*p,y:home.y+(reach.y-home.y)*p}}
    else if(elapsed<1.5){const p=easeInOut((elapsed-1)/.5);position={x:reach.x+Math.cos(direction)*10*p,y:reach.y+Math.sin(direction)*10*p};plunger=p;serum=p}
    else if(elapsed<1.8){position={x:reach.x+Math.cos(direction)*10,y:reach.y+Math.sin(direction)*10};plunger=1;serum=1}
    else if(elapsed<2.5){const p=easeInOut((elapsed-1.8)/.7);position={x:reach.x+(home.x-reach.x)*p,y:reach.y+(home.y-reach.y)*p};serum=Math.max(0,1-p)}
    else return;
    const inserting=elapsed>=1&&elapsed<=1.5;injectionCanvas.style.zIndex=inserting?'19':'21';characterCanvas.style.zIndex=inserting?'20':'18';
    out.save();out.translate(position.x,position.y);out.rotate(direction);out.lineCap='round';
    out.strokeStyle='#d9f7ff';out.lineWidth=2;out.beginPath();out.moveTo(27,0);out.lineTo(51,0);out.stroke();out.strokeStyle='#7f9aa4';out.lineWidth=1;out.beginPath();out.moveTo(27,2);out.lineTo(51,2);out.stroke();
    out.fillStyle='#dffcff';out.strokeStyle='#58808d';out.lineWidth=2;out.beginPath();out.roundRect(-35,-11,62,22,6);out.fill();out.stroke();
    out.fillStyle='#69e7ff';out.globalAlpha=.28+.62*serum;out.fillRect(-29,-6,48*serum,12);out.globalAlpha=1;
    out.strokeStyle='#f7ffff';out.lineWidth=1;for(const x of [-20,-5,10,22]){out.beginPath();out.moveTo(x,-7);out.lineTo(x,-2);out.stroke()}
    const handle=-39-13*(1-plunger);out.strokeStyle='#a9c6ce';out.lineWidth=4;out.beginPath();out.moveTo(-35,0);out.lineTo(handle,0);out.stroke();out.strokeStyle='#e7fbff';out.lineWidth=3;out.beginPath();out.moveTo(handle,-10);out.lineTo(handle,10);out.stroke();
    out.restore();
    if(serum>.04){out.save();out.globalAlpha=.16+.35*serum;out.fillStyle='#8beeff';out.shadowColor='#66eaff';out.shadowBlur=16;out.beginPath();out.arc(target.x,target.y,13+serum*9,0,Math.PI*2);out.fill();out.restore()}
  }
  function drawOpeningCharacters(){if(!characterCanvas?.getContext||!scene)return;const rect=scene.getBoundingClientRect(),ratio=Math.max(1,root.devicePixelRatio||1),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));if(characterCanvas.width!==w||characterCanvas.height!==h){characterCanvas.width=w;characterCanvas.height=h}const out=characterCanvas.getContext('2d'),phase=scene.dataset.phase||'',injectionComplete=scene.dataset.injectionComplete==='true',size=150,orb={special:false,tier:8,roll:0,hp:100,maxHp:100},tierTen={special:false,tier:10,roll:0,hp:100,maxHp:100,iceShieldHits:2,iceShieldMaxHits:2},tierTenBase={special:false,tier:10,roll:0,hp:100,maxHp:100},tierNine={special:false,tier:9,roll:0,hp:100,maxHp:100,snowCovered:true},tierNineBase={special:false,tier:9,roll:0,hp:100,maxHp:100},elephant={kind:'elephant',towerType:'base',sold:false,facing:1,angle:0,recoil:0,walking:false,attack:0,behavior:'home'};out.setTransform(ratio,0,0,ratio,0,0);out.clearRect(0,0,rect.width,rect.height);const paint=(sprite,x,y,displayScale=1)=>{if(sprite){const drawSize=sprite.width*displayScale;out.drawImage(sprite,x-drawSize/2,y-drawSize/2,drawSize,drawSize)}};paint(captureGameplaySprite(drawBall,orb,size,PLATINUM_CUTSCENE_SCALE),rect.width*.54,rect.height*.47);if(['shield-create','shield-hit-one','shield-hit-two','success'].includes(phase))paint(captureGameplaySprite(drawBall,injectionComplete?tierTen:tierTenBase,size),rect.width*.31,rect.height*.49,.78);if(['snow-create','freeze-test','freeze-result','success'].includes(phase))paint(captureGameplaySprite(drawBall,injectionComplete?tierNine:tierNineBase,size),rect.width*.68,rect.height*.65,.78);if(['freeze-test','freeze-result','shield-hit-one','shield-hit-two'].includes(phase)){const frozen=phase==='freeze-result';if(frozen){elephant.freezeWarmingRemaining=1;elephant.freezeFrostLife=1}paint(captureGameplaySprite(drawElephant,elephant,size),rect.width*.22,rect.height*.67,1.1)}drawOpeningInjection(rect,ratio,phase)}
  function captureReturnState(){return{mapSelectionOpen:!!mapSelectionModal&&!mapSelectionModal.classList.contains('hidden'),difficultyOpen:!!difficultyModal&&!difficultyModal.classList.contains('hidden'),paused:!!state?.paused}}
  function restoreReturnState(returnState){
    if(state)state.paused=!!returnState?.paused;
    if(returnState?.mapSelectionOpen)mapSelectionModal?.classList.remove('hidden');
    if(returnState?.difficultyOpen)difficultyModal?.classList.remove('hidden');
  }
  function finishIceOpening(){
    if(!runtime.active)return;
    const returnState=runtime.returnState;
    runtime.active=false;if(!runtime.replay)markViewed();modal?.classList.add('hidden');scene?.removeAttribute('data-replaying');
    restoreReturnState(returnState||{paused:runtime.previousPaused});runtime.returnState=null;
    updateUI?.();
  }
  function startIceMapOpeningCutscene({replay=false,returnState}={}){
    // Automatic campaign playback belongs only to an active Ice Map run.
    // Replays are intentionally available from the Ice Map card as well.
    if(runtime.active||(!replay&&root.GameContent?.activeMap?.id!==MAP_ID))return false;
    runtime.active=true;runtime.replay=!!replay;runtime.returnState=returnState||captureReturnState();runtime.previousPaused=!!state?.paused;runtime.lastError=null;
    try{
      if(state)state.paused=true;
      // Reveal first: phase drawing reads the scene dimensions and must never
      // render against a display:none canvas.
      mapSelectionModal?.classList.add('hidden');difficultyModal?.classList.add('hidden');modal?.classList.remove('hidden');
      if(scene){scene.dataset.replaying=runtime.replay?'true':'false';void scene.offsetWidth}
      setPhase(0);skip?.focus?.();return true;
    }catch(error){
      runtime.active=false;runtime.lastError=error;modal?.classList.add('hidden');restoreReturnState(runtime.returnState);runtime.returnState=null;console.error('[Ice opening] Failed to start.',error);return false;
    }
  }
  function updateIceOpening(dt){
    if(!runtime.active)return;
    runtime.elapsed+=Math.max(0,dt)/Math.max(1,state?.gameSpeed||1);
    const phase=ICE_OPENING_SCENES[runtime.index]?.id;
    if(phase&&INJECTION_PHASES[phase]&&runtime.elapsed>=1.8&&scene)scene.dataset.injectionComplete='true';
    drawOpeningCharacters();
    while(runtime.active&&runtime.elapsed>=ICE_OPENING_SCENES[runtime.index].duration){
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
  window.addEventListener?.('pagehide',()=>{if(runtime.active){runtime.active=false;modal?.classList.add('hidden')}});
})(globalThis);
