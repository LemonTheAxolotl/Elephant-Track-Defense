/* Engineer Orbs leave the track only long enough to burrow a tile, then resume at their saved path position. */
function engineerDigTarget(){
  const tiles=state.floorTiles||[],mines=tiles.filter(tile=>tile.level===2),normal=tiles.filter(tile=>tile.level===0),reinforced=tiles.filter(tile=>tile.level===1);
  let tile=mines[0]||normal[Math.floor(gameRandom()*Math.max(1,normal.length))]||reinforced[Math.floor(gameRandom()*Math.max(1,reinforced.length))];
  for(let tries=0;!tile&&tries<80;tries++)tile=floorTileAt({x:gameRandom()*CONFIG.WORLD_WIDTH,y:gameRandom()*CONFIG.WORLD_HEIGHT},true);
  return tile||null;
}
function engineerTrackSnapshot(orb){return{x:orb.x,y:orb.y,seg:orb.seg,roll:orb.roll||0}}
function engineerTrail(from,to,progress,reverse=false){
  const p=Math.max(0,Math.min(1,progress)),head=reverse?1-p:p;
  ctx.save();ctx.lineCap='round';ctx.setLineDash([3,8]);ctx.lineDashOffset=-(state.gameTime*55);ctx.strokeStyle='#8b6745';ctx.globalAlpha=.3+.35*Math.sin(p*Math.PI);ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.setLineDash([]);
  const x=from.x+(to.x-from.x)*head,y=from.y+(to.y-from.y)*head;
  ctx.fillStyle='#c29a65';ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(x,y,5+Math.sin(state.gameTime*16)*1.5,0,Math.PI*2);ctx.fill();ctx.restore();
}
const engineerDigCreateBase=createEngineerHole;
createEngineerHole=function(orb){
  if(orb?.specialType!=='engineer'||orb.digState||orb.engineerHole)return engineerDigCreateBase(orb);
  const tile=engineerDigTarget();if(!tile)return;
  orb.digOrigin=engineerTrackSnapshot(orb);
  orb.digTarget={x:tile.x,y:tile.y,key:tile.key};
  orb.digState='travel';orb.digElapsed=0;orb.digInvincible=false;orb.state='digging';orb.targetable=true;
};
function engineerMineExplosion(orb,tile){
  const level=tile.mineLevel||1;orb.digMineExplosion=true;consumeLandmine(tile);
  burst(tile.x,tile.y,'#fff4b0',64,265);burst(tile.x,tile.y,'#ff713e',42,205);burst(tile.x,tile.y,'#59646a',30,130);state.shake=Math.max(state.shake,9);
  if(level===2)for(const nearby of state.balls.filter(item=>item!==orb&&item.targetable&&dist(item,tile)<=CONFIG.landmineBlastRadius).sort((a,b)=>dist(a,tile)-dist(b,tile)).slice(0,2))damageOrbFromLevelTwoMine(nearby,tile);
  defeatSpecial(orb);unlockAchievement('engineer-mine');
}
function engineerFinishHole(orb){
  const target=orb.digTarget,tile=(state.floorTiles||[]).find(item=>item.key===target.key)||target;
  if(tile.level===2){engineerMineExplosion(orb,tile);return false}
  const hole={x:tile.x,y:tile.y,radius:CONFIG.engineerHoleRadius,orb,repairing:false,repairLife:0,fallingTower:null,square:true,tileKey:tile.key};
  (state.engineerHoles||(state.engineerHoles=[])).push(hole);orb.engineerHole=hole;tile.damage=0;burst(tile.x,tile.y,'#5c4636',25,125);return true;
}
// Kept as the explicit completion hook used by the owner test command and save-era scripts.
function engineerDigComplete(orb){return engineerFinishHole(orb)}
function engineerReturnToTrack(orb){
  const origin=orb.digOrigin;orb.x=origin.x;orb.y=origin.y;orb.seg=origin.seg;orb.roll=origin.roll;orb.digState=null;orb.digInvincible=false;orb.targetable=true;orb.state='active';
}
const engineerDigUpdateBase=update;
update=function(dt){
  engineerDigUpdateBase(dt);
  for(const orb of [...state.balls]){
    if(orb.specialType!=='engineer'||!orb.digState)continue;
    const target=orb.digTarget,origin=orb.digOrigin;
    if(orb.digState==='travel'){
      const dx=target.x-orb.x,dy=target.y-orb.y,d=Math.hypot(dx,dy),step=180*dt;
      if(d>step){orb.x+=dx/d*step;orb.y+=dy/d*step}else{orb.x=target.x;orb.y=target.y;orb.digState='dig';orb.digElapsed=0}
    }else if(orb.digState==='dig'){
      orb.digElapsed+=dt;
      if(orb.digElapsed>=.72){orb.digState='burrow';orb.digElapsed=0;orb.digInvincible=true;orb.targetable=false}
    }else if(orb.digState==='burrow'){
      orb.digElapsed+=dt;
      if(orb.digElapsed>=.62){orb.digState='emerge';orb.digElapsed=0;orb.x=target.x;orb.y=target.y}
    }else if(orb.digState==='emerge'){
      orb.digElapsed+=dt;
      if(orb.digElapsed>=.2&&!orb.digHoleCreated){orb.digHoleCreated=true;if(!engineerFinishHole(orb))continue}
      if(orb.digElapsed>=.48){orb.digState='returnBurrow';orb.digElapsed=0;orb.digInvincible=true;orb.targetable=false}
    }else if(orb.digState==='returnBurrow'){
      orb.digElapsed+=dt;
      if(orb.digElapsed>=.62){orb.digState='returnPop';orb.digElapsed=0;orb.x=origin.x;orb.y=origin.y}
    }else if(orb.digState==='returnPop'){
      orb.digElapsed+=dt;
      if(orb.digElapsed>=.32)engineerReturnToTrack(orb);
    }
  }
};
const engineerDigHitBase=hitOrb;
hitOrb=function(tower,target){if(target?.specialType==='engineer'&&target.digInvincible)return;return engineerDigHitBase(tower,target)};
const engineerDigDefeatBase=defeatSpecial;
defeatSpecial=function(orb,...args){if(orb?.specialType==='engineer'&&orb.digInvincible&&!orb.digMineExplosion)return;return engineerDigDefeatBase(orb,...args)};
const engineerDigDrawBase=drawSpecialBall;
drawSpecialBall=function(orb){
  if(orb?.specialType!=='engineer'||!orb.digState)return engineerDigDrawBase(orb);
  const target=orb.digTarget,origin=orb.digOrigin,phase=orb.digState;
  if(phase==='burrow'||phase==='returnBurrow'){engineerTrail(origin,target,orb.digElapsed/.62,phase==='returnBurrow');return}
  if(phase==='emerge'||phase==='returnPop'){ctx.save();ctx.globalAlpha=Math.min(1,orb.digElapsed/(phase==='emerge'? .22:.18));engineerDigDrawBase(orb);ctx.restore()}else engineerDigDrawBase(orb);
  if(phase==='dig'||phase==='emerge'){
    const crack=Math.min(1,(orb.digElapsed/.72));ctx.save();ctx.translate(target.x,target.y);ctx.strokeStyle='#d89d60';ctx.lineWidth=2+crack*2;ctx.beginPath();ctx.moveTo(-20,-17);ctx.lineTo(-4,-3);ctx.lineTo(11,15);ctx.moveTo(19,-15);ctx.lineTo(3,-2);ctx.lineTo(-12,16);ctx.stroke();ctx.fillStyle='#c8a270';for(let i=0;i<6;i++){const a=i*1.05+state.gameTime*10,r=11+crack*17;ctx.fillRect(Math.cos(a)*r-2,Math.sin(a)*r-2,4,4)}ctx.strokeStyle='#e4e9de';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(8,-15);ctx.lineTo(26,-29+Math.sin(state.gameTime*15)*7);ctx.stroke();ctx.restore();
  }
};
const engineerDigGroundBase=drawGround;
drawGround=function(){
  engineerDigGroundBase();
  for(const hole of state.engineerHoles||[]){if(!hole.square)continue;ctx.save();ctx.fillStyle='#21150e';ctx.fillRect(hole.x-24,hole.y-24,48,48);ctx.strokeStyle='#a97545';ctx.lineWidth=2;ctx.strokeRect(hole.x-24,hole.y-24,48,48);ctx.strokeStyle='#5c4636';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-20,-13);ctx.lineTo(-4,-20);ctx.lineTo(14,-15);ctx.moveTo(-18,18);ctx.lineTo(-5,10);ctx.lineTo(19,19);ctx.stroke();ctx.restore()}
};
