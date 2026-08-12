/* Three-wave recovery after a Level 2 landmine injury. */
const RECOVERY_WAVES=3;
const recoveryMineInjuryBase=injureElephantWithMine;
injureElephantWithMine=function(tower,tile){const wasRecovering=!!tower.recoveringWaves;const injured=recoveryMineInjuryBase(tower,tile);if(!injured&&!wasRecovering)return false;tower.injured=false;tower.injuryVisual=true;tower.recoveringWaves=RECOVERY_WAVES;tower.recoveryHealLife=0;showEncyclopediaNotice(`${tower.name||'Elephant'} recovering — 3 waves left.`);updateStats();return true};
const recoveryDamageBase=damageAgainst;
damageAgainst=function(tower,target){return recoveryDamageBase(tower,target)*((tower?.recoveringWaves||0)>0 ? .1 : 1)};
const recoveryCooldownBase=attackCooldownFor;
attackCooldownFor=function(tower,target){return recoveryCooldownBase(tower,target)/((tower?.recoveringWaves||0)>0 ? .7 : 1)};
const recoverySplashHitBase=applySplashPulseHit;
applySplashPulseHit=function(tower){const result=recoverySplashHitBase(tower);if((tower?.recoveringWaves||0)>0&&tower.splashPulseState==='coolingDown')tower.splashPulseCooldown/=.7;return result};
function completeRecoveryWave(job){if(!job||job.recoveryHandled||job.wave<1||job.wave>CONFIG.TOTAL_WAVES||job.spawned!==job.total||job.resolved!==job.total)return;job.recoveryHandled=true;for(const tower of state.towers){if(!(tower.recoveringWaves>0))continue;tower.recoveringWaves--;if(tower.recoveringWaves===0){tower.injuryVisual=false;tower.recoveryHealLife=1.2;showEncyclopediaNotice(`${tower.name||'Elephant'} Recovered!`)} }updateStats()}
const recoveryResolveBase=resolveBall;
resolveBall=function(ball,destroyed=false){const job=state.waveJobs.find(item=>item.wave===ball.wave);const result=recoveryResolveBase(ball,destroyed);completeRecoveryWave(job);return result};
const recoveryDrawBase=drawElephant;
drawElephant=function(tower,ghost=false,valid=true,selected=false){recoveryDrawBase(tower,ghost,valid,selected);if(ghost||(!tower?.injuryVisual&&(tower?.recoveryHealLife||0)<=0))return;ctx.save();ctx.translate(tower.x,tower.y);const healing=tower.recoveryHealLife||0;ctx.globalAlpha=healing?Math.min(1,healing/.45):1;if(tower.injuryVisual){ctx.strokeStyle='#f2e5c5';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-15,-12);ctx.lineTo(7,-4);ctx.moveTo(-12,-5);ctx.lineTo(9,3);ctx.stroke();ctx.fillStyle='#6c3c55aa';ctx.beginPath();ctx.arc(-20,8,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eaf8e8';ctx.font='800 9px Inter';ctx.textAlign='center';ctx.fillText(`♥ RECOVERING — ${tower.recoveringWaves} wave${tower.recoveringWaves===1?'':'s'} left`,0,-43)}else{ctx.fillStyle='#a9ffbd';ctx.font='800 12px Inter';ctx.textAlign='center';ctx.fillText('Recovered!',0,-43)}ctx.restore()};
const recoveryUpdateBase=update;
update=function(dt){recoveryUpdateBase(dt);for(const tower of state.towers)if(tower.recoveryHealLife>0)tower.recoveryHealLife=Math.max(0,tower.recoveryHealLife-dt)};
const recoveryStatsBase=updateStats;
updateStats=function(){recoveryStatsBase();const tower=state?.selectedTower;if(!tower?.recoveringWaves)return;ui.selectedTypeLabel.textContent='RECOVERING ELEPHANT';ui.towerDamage.textContent=tower.towerType==='robot'?'Does not attack':`${(tower.damage*.1).toFixed(1)} (10%)`;ui.towerAttackSpeed.textContent=tower.towerType==='splash'?'Recovery: pulses delayed 30%':'30% slower';ui.upgradePreview.textContent=`RECOVERING — ${tower.recoveringWaves} wave${tower.recoveringWaves===1?'':'s'} left • Damage 10% • Attacks 30% slower`};
const recoveryTowerSnapshotBase=finaleTowerSnapshot;
finaleTowerSnapshot=function(tower){const snapshot=recoveryTowerSnapshotBase(tower);if(tower?.injuryVisual||tower?.recoveringWaves)Object.assign(snapshot,{injuryVisual:!!tower.injuryVisual,recoveringWaves:tower.recoveringWaves||0,recoveryHealLife:tower.recoveryHealLife||0});return snapshot};
