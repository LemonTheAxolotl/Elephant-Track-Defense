(function(root){
  'use strict';
  const FILES=['maps','orbs','towers','achievements','tutorial','waves','difficulties'];
  const VERSION='20260905-base-choreography-69';
  const SCRIPTS=['orb-progression.js','game.js','difficulty.js','currency.js','recovery.js','engineer-dig.js','content-runtime.js','map-system.js','snow-mutation.js','heater.js','flame-elephant.js','ice-opening-cutscene.js'].map(path=>new URL(`${path}?v=${VERSION}`,document.baseURI).href);
  function showMessage(title,message,detail=''){
    console.error(`[Elephant Track Defense content] ${title}: ${message}`,detail);
    let panel=document.querySelector('#contentLoadError');
    if(!panel){
      panel=document.createElement('section');panel.id='contentLoadError';panel.setAttribute('role','alert');
      panel.style.cssText='position:fixed;z-index:99999;left:50%;top:50%;width:min(560px,calc(100vw - 32px));max-height:min(360px,calc(100dvh - 32px));overflow:auto;transform:translate(-50%,-50%);padding:24px;border:2px solid #ff667a;background:#220d12f2;color:#ffd9df;box-shadow:0 20px 60px #000c;font:14px/1.5 ui-monospace,Consolas,monospace';document.body.appendChild(panel);
    }
    panel.replaceChildren();const heading=document.createElement('strong'),body=document.createElement('p'),extra=document.createElement('small');heading.textContent=title;body.textContent=message;extra.textContent=detail;heading.style.cssText='display:block;margin-bottom:18px;font-size:16px';body.style.margin='0 0 14px';extra.style.color='#ffbdc5';panel.append(heading,body,extra);
  }
  function showError(error){showMessage('GAME CONTENT COULD NOT LOAD',error.message,'Check the named JSON file and reload.')}
  function showLocalServerMessage(){showMessage('GAME CONTENT NEEDS A LOCAL SERVER','The standalone content bundle could not be loaded.','Run the game through a local HTTP server or publish it to GitHub Pages.')}
  function contentUrl(name){return new URL(`./data/${name}.json`,document.baseURI).href}
  function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load ${new URL(url).pathname.split('/').pop()}`));document.head.appendChild(script)})}
  async function loadJson(name){
    const filename=`data/${name}.json`,response=await fetch(contentUrl(name),{cache:'no-cache'});
    if(!response.ok)throw new Error(`${filename} returned HTTP ${response.status} ${response.statusText||''}`.trim());
    try{return await response.json()}catch(error){throw new Error(`${filename} contains invalid JSON: ${error.message}`)}
  }
  function selectedMap(raw){try{const profile=JSON.parse(localStorage.getItem('elephant-track-profile-v1')||'null'),id=profile?.selectedMapId;return raw.maps.maps.some(map=>map.id===id)?id:raw.maps.defaultMapId}catch{return raw.maps.defaultMapId}}
  async function start(raw){
    if(!root.GameContentSchema)throw new Error('content-schema.js did not load');raw.maps.defaultMapId=selectedMap(raw);root.GameContent=root.GameContentSchema.build(raw);for(const script of SCRIPTS)await loadScript(script);
  }
  async function boot(){
    try{
      if(location.protocol==='file:'){
        await loadScript(new URL(`./content-local.js?v=${VERSION}`,document.baseURI).href);
        if(!root.ElephantTrackDefenseLocalContent)throw new Error('content-local.js did not provide bundled game content');
        await start(root.ElephantTrackDefenseLocalContent);return;
      }
      const entries=await Promise.all(FILES.map(async name=>[name,await loadJson(name)]));await start(Object.fromEntries(entries));
    }catch(error){if(location.protocol==='file:')showLocalServerMessage();else showError(error)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
