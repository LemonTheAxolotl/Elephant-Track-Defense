// Cutscene-only actors and action clock. No gameplay targets, damage, or rewards.
(function(root){
  'use strict';
  const SHIELD=Object.freeze({fireAt:.8,flight:.34,impactAt:1.14,crackAt:1.37,breakAt:1.97,shieldGoneAt:2.97,defeatEnd:3.55});
  const SNOW=Object.freeze({fireAt:.65,flight:.34,impactAt:.99,defeatEnd:2.1});
  function createActors(){return[
    {id:'base-snowcap-one',type:'snowcap',tier:9,x:.72,y:.52,scale:.68,state:'waiting'},
    {id:'base-snowcap-two',type:'snowcap',tier:9,x:.79,y:.45,scale:.68,state:'waiting'},
    {id:'base-snowcap-survivor',type:'snowcap',tier:9,x:.83,y:.61,scale:.68,state:'waiting'},
    {id:'base-iceshield',type:'iceshield',tier:10,x:.91,y:.64,scale:.82,state:'waiting'}
  ]}
  function shieldState(t){return t<SHIELD.fireAt?'iceshieldIdle':t<SHIELD.impactAt?'fireIncoming':t<SHIELD.crackAt?'fireImpact':t<SHIELD.breakAt?'shieldCracking':t<SHIELD.shieldGoneAt?'shieldBreaking':t<SHIELD.defeatEnd?'defeating':'removed'}
  function fireCue(phase,t){
    const targetId=phase==='base-fire-break'?'base-iceshield':phase==='base-snowcap-defeat-one'?'base-snowcap-one':phase==='base-snowcap-defeat-two'?'base-snowcap-two':null;
    if(!targetId)return null;
    const timing=phase==='base-fire-break'?SHIELD:SNOW;
    const ready=Math.max(0,Math.min(1,(t-.3)/(timing.fireAt-.3)));
    const attacking=t>=.3&&t<timing.impactAt+.2;
    return{targetId,...timing,turn:Math.min(1,t/.3),ready,recoil:attacking?.9*ready:0,attack:attacking?1:0};
  }
  function advance(actors,phase,t){
    const get=id=>actors.find(actor=>actor.id===id);
    if(phase==='base-orb-breach'){
      const p=Math.max(0,Math.min(1,(t-.55)/1.4));
      const starts=[[.88,.40],[.93,.49],[.96,.58],[.98,.47]],ends=[[.72,.52],[.79,.45],[.83,.61],[.91,.64]];
      actors.forEach((actor,i)=>{actor.x=starts[i][0]+(ends[i][0]-starts[i][0])*p;actor.y=starts[i][1]+(ends[i][1]-starts[i][1])*p;actor.state='active'});
    }
    if(phase==='base-fire-break')get('base-iceshield').state=t>=SHIELD.defeatEnd?'defeated':t>=SHIELD.shieldGoneAt?'dying':'active';
    const cue=fireCue(phase,t);
    if(cue&&phase!=='base-fire-break')get(cue.targetId).state=t>=cue.defeatEnd?'defeated':t>=cue.impactAt?'dying':'active';
    if(phase==='base-ghost-rescue'){
      // Capture cannot consume, reset, or hide either defeated actor.
      const survivor=get('base-snowcap-survivor');
      survivor.state=t>=3?'captured':t>=1.2?'capturing':'active';
    }
    return actors;
  }
  function complete(actors,phase,t){
    const cue=fireCue(phase,t);
    if(cue)return t>=cue.defeatEnd&&actors.find(a=>a.id===cue.targetId)?.state==='defeated';
    if(phase==='base-ghost-rescue')return actors.slice(0,2).every(a=>a.state==='defeated')&&actors[2].state==='captured';
    return true;
  }
  root.IceBaseAction=Object.freeze({SHIELD,SNOW,createActors,shieldState,fireCue,advance,complete});
})(globalThis);
