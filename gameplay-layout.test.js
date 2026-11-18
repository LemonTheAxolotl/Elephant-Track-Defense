const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(width){
  const prefs=new Map(),queue=[],queries=[];
  function node(w,h){return{dataset:{},style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},listeners:{},scrollTop:15,attrs:{},getBoundingClientRect:()=>({width:w,height:h}),querySelector:()=>null,addEventListener(k,fn){this.listeners[k]=fn},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},setPointerCapture(id){this.captured=id},releasePointerCapture(){this.captured=null}}}
  const shell=node(width,900),header=node(width,54),play=node(width,846),aside=node(310,700),reset=node(0,0),height=node(0,0),handle=node(0,0);
  shell.querySelector=s=>s==='.top-hud'?header:play;play.querySelector=()=>aside;
  const doc={documentElement:{dataset:{}},querySelector:s=>({'.game-shell':shell,'#resetGameplayLayout':reset,'#hudHeightHandle':height,'#sidebarWidthHandle':handle}[s]),addEventListener(){}};
  const context={document:doc,window:{addEventListener(){}},matchMedia:q=>{const m={matches:width>=(q.includes('1181')?1181:761),addEventListener(){}};queries.push(m);return m},localStorage:{getItem:k=>prefs.get(k),setItem:(k,v)=>prefs.set(k,v),removeItem:k=>prefs.delete(k)},requestAnimationFrame:fn=>(queue.push(fn),queue.length)};
  vm.runInNewContext(fs.readFileSync('gameplay-layout.js','utf8'),context);
  const flush=()=>{while(queue.length)queue.shift()()};
  const event=(id,x,extra={})=>({pointerId:id,pointerType:'touch',isPrimary:true,button:0,clientX:x,preventDefault(){},stopImmediatePropagation(){},...extra});
  return{shell,doc,reset,handle,height,flush,event,prefs,queries};
}
for(const width of [768,820,1024,1180,1366]){
  const f=fixture(width),h=f.handle;
  assert(Number(h.attrs['aria-valuemax'])>Number(h.attrs['aria-valuemin']));
  for(let repeat=0;repeat<5;repeat++){
    h.listeners.pointerdown(f.event(1,500));assert.equal(h.captured,1);
    h.listeners.pointerdown(f.event(2,490,{isPrimary:false}));
    h.listeners.pointermove(f.event(2,350));f.flush();assert.equal(f.shell.style['--gameplay-sidebar-width'],undefined);
    h.listeners.pointermove(f.event(1,480));f.flush();assert.equal(f.shell.style['--gameplay-sidebar-width'],'330px');
    h.listeners.pointermove(f.event(1,520));f.flush();assert.equal(f.shell.style['--gameplay-sidebar-width'],'290px');
    h.listeners.pointercancel(f.event(1,520));assert.equal(h.captured,null);assert.equal(h.dataset.active,undefined);
    f.reset.listeners.click();f.flush();assert.equal(f.shell.style['--gameplay-sidebar-width'],undefined);
  }
  h.listeners.pointerdown(f.event(3,500,{pointerType:'mouse'}));assert.equal(h.captured,3);
  h.listeners.pointermove(f.event(3,490,{pointerType:'mouse'}));f.flush();assert.equal(f.shell.style['--gameplay-sidebar-width'],'320px');
  h.listeners.pointerup(f.event(3,490));assert.equal(h.captured,null);
}
const phone=fixture(390);phone.handle.listeners.pointerdown(phone.event(1,200));assert.equal(phone.handle.captured,undefined,'Phone drawer must not start horizontal resizing.');
console.log('Sidebar resize pointer simulations passed: tablet portrait/landscape, desktop, cancellation, repeat grabs, multitouch isolation and reset.');
