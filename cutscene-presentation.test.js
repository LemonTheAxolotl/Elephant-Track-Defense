const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('cutscene-presentation.js','utf8'),sandbox);
const p=sandbox.CutscenePresentation;
function fixture(width,height,textHeight=84){
  const layer={style:{}},scene={clientWidth:width,clientHeight:height,offsetWidth:width,offsetHeight:height,querySelector:()=>layer,getBoundingClientRect:()=>p.rect(100,50,width,height)};
  const speech={offsetWidth:Math.min(320,width-28),offsetHeight:textHeight,style:{setProperty(k,v){this[k]=v}},dataset:{}};
  const control=(x,y,w,h,menu=false)=>({classList:{contains:n=>menu&&n==='cutscene-menu'},getBoundingClientRect:()=>p.rect(100+x,50+y,w,h)});
  return{scene,speech,layer,controls:[control(14,14,72,38),control(width-29,16,29,46,true)]};
}
for(const [width,height] of [[1100,650],[980,620],[390,780],[320,568],[844,390]]){
  for(const [x,y,r] of [[.54,.47,128],[.83,.36,128],[.2,.67,56],[.61,.66,56],[.66,.66,56]]){
    for(const textHeight of [60,100,132]){
      const f=fixture(width,height,textHeight),actor={id:'speaking-actor',bounds:p.rect(width*x-r,height*y-r,r*2,r*2)};
      const result=p.place(f.scene,f.speech,actor,f.controls,'line-1');
      assert.equal(result.safe,true,`Unsafe ${width}x${height}, actor ${x}, text ${textHeight}`);
      assert(['above','below'].includes(result.side));
      assert.equal(f.speech.dataset.speakerId,actor.id);
      const top=parseFloat(f.speech.style.top),left=parseFloat(f.speech.style.left);
      assert(top>=14&&top+textHeight<=height-14);
      assert(left>=14&&left+f.speech.offsetWidth<=width-14);
      const transformedTop=actor.bounds.top*result.scale+result.ty,transformedBottom=actor.bounds.bottom*result.scale+result.ty;
      assert(result.side==='above'?top+textHeight+24<=transformedTop+.001:top-24>=transformedBottom-.001);
    }
  }
}
const f=fixture(1100,650,80);let lastLeft;
for(let x=300;x<600;x+=2){
  const result=p.place(f.scene,f.speech,{id:'moving',bounds:p.rect(x,330,80,90)},f.controls,'same-line');
  assert.equal(result.side,'above');
  if(lastLeft!==undefined)assert(Math.abs(result.left-lastLeft)<=2.01);
  lastLeft=result.left;
}
// Screen-space measurements are converted back through parent scale/translation.
const transformed={offsetWidth:400,offsetHeight:300,clientLeft:2,clientTop:2,getBoundingClientRect:()=>p.rect(200,100,800,600)};
const local=p.localBounds({getBoundingClientRect:()=>p.rect(304,204,80,120)},transformed);
assert.equal(local.left,50);assert.equal(local.top,50);assert.equal(local.width,40);assert.equal(local.height,60);
// Full alpha bounds drive fit, including an asymmetric ring/accessory.
const data=new Uint8ClampedArray(20*20*4);for(let y=4;y<16;y++)for(let x=2;x<19;x++)data[(y*20+x)*4+3]=255;
const sprite={width:20,height:20,getContext:()=>({getImageData:()=>({data})})};
let draw;p.fit({drawImage:(...args)=>draw=args},sprite,100,100,68);
assert.equal(draw[3],80);assert.equal(draw[4],80);
assert.equal(draw[1]+(2+17/2)*4,100);assert.equal(draw[2]+(4+12/2)*4,100);
assert.throws(()=>p.place(f.scene,f.speech,null,[],'unmapped'),/Missing cutscene actor/);
// Backgrounds must never follow the dialogue camera into an uncovered corner.
function sceneNode(className){return{className,style:{},children:[],matches(selector){return selector.split(',').some(name=>'.'+this.className===name.trim())},appendChild(child){if(child.parent){child.parent.children=child.parent.children.filter(node=>node!==child)}this.children.push(child);child.parent=this},prepend(child){this.appendChild(child);this.children.unshift(this.children.pop())}}}
sandbox.document={createElement:()=>sceneNode('')};
const viewportScene=Object.assign(sceneNode('ice-opening-scene'),fixture(390,780).scene);
viewportScene.querySelector=()=>viewportScene.children.find(node=>node.className==='cutscene-camera');
const backdrops=['ice-lab-wall','ice-outdoor-test','ice-opening-background'].map(sceneNode),moving=sceneNode('ice-chambers'),bubbleNode=fixture(390,780).speech;
backdrops.forEach(node=>viewportScene.appendChild(node));viewportScene.appendChild(moving);
const reframe=p.place(viewportScene,bubbleNode,{id:'edge-speaker',bounds:p.rect(10,50,160,160)},[],'reframe');
assert.notEqual(reframe.tx,0);
backdrops.forEach(node=>assert.equal(node.parent,viewportScene,'The viewport background must not be translated or scaled by the speaking actor camera.'));
assert.equal(moving.parent.className,'cutscene-camera');
// Repair a wrapper retained by an older replay without removing any props.
moving.parent.appendChild(backdrops[0]);
p.place(viewportScene,bubbleNode,{id:'edge-speaker',bounds:p.rect(10,50,160,160)},[],'replay');
assert.equal(backdrops[0].parent,viewportScene);
// A neighboring action directly above the speaker must stay unobscured.
const actionShot=fixture(390,780,100),action=p.rect(110,260,170,90);
const framed=p.place(actionShot.scene,actionShot.speech,{id:'speaker-with-action',bounds:p.rect(150,390,80,80),actionBounds:[action]},actionShot.controls,'action-line');
assert(framed.safe);
const transformedAction=p.rect(action.left*framed.scale+framed.tx,action.top*framed.scale+framed.ty,action.width*framed.scale,action.height*framed.scale);
const bubble=p.rect(framed.left,framed.top,actionShot.speech.offsetWidth,actionShot.speech.offsetHeight);
assert(bubble.bottom<=transformedAction.top||bubble.top>=transformedAction.bottom||bubble.right<=transformedAction.left||bubble.left>=transformedAction.right);
console.log('Cutscene presentation tests passed: desktop/mobile bounds, controls, reframing, moving actors, transforms, artwork fit.');
