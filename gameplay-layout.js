// Gameplay-only preferences. Responsive defaults are always derived with overrides removed.
(function(root){
  'use strict';
  const shell=document.querySelector('.game-shell'),header=shell?.querySelector('.top-hud'),play=shell?.querySelector('.play-area'),sidebar=play?.querySelector('aside'),reset=document.querySelector('#resetGameplayLayout'),heightHandle=document.querySelector('#hudHeightHandle'),widthHandle=document.querySelector('#sidebarWidthHandle');
  if(!shell||!header||!play||!sidebar||!reset||!heightHandle||!widthHandle)return;
  const key='elephant-track-gameplay-layout-v1',desktop=matchMedia('(min-width:1181px)');
  let preferred={},drag=null,pending=0,limits={},referenceHeight=54;
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const field of ['height','width'])if(Number.isFinite(saved?.[field])&&saved[field]>0)preferred[field]=saved[field]}catch{}
  function store(){try{if(Object.keys(preferred).length)localStorage.setItem(key,JSON.stringify(preferred));else localStorage.removeItem(key)}catch{}}
  function syncMap(){root.resizeGameViewport?.({preserveCamera:true})}
  function clearHeaderSizing(){delete header.dataset.contentSized;delete header.dataset.hudRows;header.style.removeProperty('--hud-unit')}
  function sizeHeaderContents(){
    if(!desktop.matches||!Number.isFinite(preferred.height)){clearHeaderSizing();return}
    const rect=header.getBoundingClientRect();
    header.dataset.contentSized='true';
    // Use real CSS lengths, so artwork, layout boxes and hit targets agree.
    // Probe the desired size, then reflow or cap it using this container's
    // actual width/height. Never shrink neighbors to force a row to fit.
    let scale=Math.max(.8,Math.min(1.65,rect.height/referenceHeight));
    const left=header.querySelector('.hud-left'),center=header.querySelector('.hud-center'),right=header.querySelector('.hud-right');
    if(!left||!center||!right)return;
    for(let attempt=0;attempt<90;attempt++){
      header.style.setProperty('--hud-unit',`${scale}px`);
      header.dataset.hudRows='one';
      const widths=[left,center,right].map(node=>Math.max(node.scrollWidth,node.getBoundingClientRect().width));
      const available=rect.width-28*scale;
      const two=widths.reduce((sum,width)=>sum+width,0)+24*scale>available;
      header.dataset.hudRows=two?'two':'one';
      const fitsWidth=two?Math.max(widths[0],widths[1]+widths[2]+12*scale)<=available:true;
      const rowHeight=Math.max(...[left,center,right].map(node=>node.getBoundingClientRect().height));
      const needed=two?left.getBoundingClientRect().height+Math.max(center.getBoundingClientRect().height,right.getBoundingClientRect().height)+18*scale:rowHeight+12*scale;
      if((fitsWidth&&needed<=rect.height)||scale<=.8)break;
      scale=Math.max(.8,scale-.01);
    }
  }
  function apply(){
    pending=0;
    // Measure the original CSS at the current viewport, never the player's last sizes.
    const scrollTop=sidebar.scrollTop;
    clearHeaderSizing();
    shell.style.removeProperty('--gameplay-hud-height');shell.style.removeProperty('--gameplay-sidebar-width');
    if(!desktop.matches){syncMap();return}
    const defaultHeight=header.getBoundingClientRect().height,defaultWidth=sidebar.getBoundingClientRect().width,shellRect=shell.getBoundingClientRect();
    referenceHeight=defaultHeight;
    limits={height:{min:Math.max(48,defaultHeight*.85),max:Math.max(defaultHeight,Math.min(defaultHeight*2.6,170,shellRect.height*.24,shellRect.height-260))},width:{min:Math.min(defaultWidth,280),max:Math.max(defaultWidth,Math.min(560,shellRect.width*.45,shellRect.width-480))}};
    for(const [field,property,handle] of [['height','--gameplay-hud-height',heightHandle],['width','--gameplay-sidebar-width',widthHandle]]){
      const range=limits[field],value=Number.isFinite(preferred[field])?Math.max(range.min,Math.min(range.max,preferred[field])):field==='height'?defaultHeight:defaultWidth;
      if(Number.isFinite(preferred[field]))shell.style.setProperty(property,`${value}px`);
      handle.setAttribute('aria-valuemin',String(Math.round(range.min)));handle.setAttribute('aria-valuemax',String(Math.round(range.max)));handle.setAttribute('aria-valuenow',String(Math.round(value)));
    }
    sizeHeaderContents();sidebar.scrollTop=scrollTop;syncMap();
  }
  function schedule(){if(!pending)pending=requestAnimationFrame(apply)}
  function finish(event){if(!drag||event&&event.pointerId!==undefined&&event.pointerId!==drag.id)return;const previous=drag;drag=null;delete document.documentElement.dataset.layoutResizing;try{previous.handle.releasePointerCapture(previous.id)}catch{}store()}
  function wire(handle,field){
    handle.addEventListener('pointerdown',event=>{if(!desktop.matches||drag||event.button!==0)return;event.preventDefault();event.stopImmediatePropagation();const rect=(field==='height'?header:sidebar).getBoundingClientRect();drag={id:event.pointerId,field,handle,start:field==='height'?event.clientY:event.clientX,value:field==='height'?rect.height:rect.width};document.documentElement.dataset.layoutResizing=field;handle.setPointerCapture(event.pointerId)});
    handle.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;event.preventDefault();event.stopImmediatePropagation();const delta=(field==='height'?event.clientY:event.clientX)-drag.start;preferred[field]=Math.max(limits[field].min,Math.min(limits[field].max,drag.value+delta*(field==='height'?1:-1)));schedule()});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(type,finish);
    // Suppress the compatibility click even when releasing over the map.
    handle.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation()});
    handle.addEventListener('keydown',event=>{if(!desktop.matches)return;const direction=field==='height'?{ArrowUp:-1,ArrowDown:1}:{ArrowLeft:1,ArrowRight:-1};if(!(event.key in direction))return;event.preventDefault();const current=Number(handle.getAttribute('aria-valuenow'));preferred[field]=Math.max(limits[field].min,Math.min(limits[field].max,current+direction[event.key]*(event.shiftKey?30:10)));apply();store()});
  }
  wire(heightHandle,'height');wire(widthHandle,'width');
  reset.addEventListener('click',()=>{finish();preferred={};store();apply()});
  window.addEventListener('blur',()=>finish());
  for(const event of ['resize','orientationchange'])window.addEventListener(event,()=>{finish();schedule()});
  document.addEventListener('fullscreenchange',()=>{finish();schedule()});
  window.visualViewport?.addEventListener('resize',schedule);
  desktop.addEventListener('change',()=>{finish();schedule()});
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>sizeHeaderContents()).observe(header);
  apply();
})(globalThis);
