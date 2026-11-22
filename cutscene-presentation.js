(function(root){
  'use strict';
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function viewport(scene){return rect(0,0,scene.clientWidth||scene.offsetWidth||1100,scene.clientHeight||650)}
  function localBounds(node,container){
    const b=node?.getBoundingClientRect?.(),c=container?.getBoundingClientRect?.();
    if(!b?.width||!c?.width)return null;
    const sx=(container.offsetWidth||c.width)/c.width,sy=(container.offsetHeight||c.height)/c.height;
    return rect((b.left-c.left)*sx-(container.clientLeft||0),(b.top-c.top)*sy-(container.clientTop||0),b.width*sx,b.height*sy);
  }
  function visibleBounds(sprite){
    if(sprite.visibleBounds)return sprite.visibleBounds;
    const {width:w,height:h}=sprite,data=sprite.getContext('2d').getImageData(0,0,w,h).data;
    let l=w,t=h,r=0,b=0,radius=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>12){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x+1);b=Math.max(b,y+1);radius=Math.max(radius,Math.hypot(x-w/2,y-h/2))}
    return sprite.visibleBounds={...rect(l,t,Math.max(1,r-l),Math.max(1,b-t)),radius};
  }
  function paintedBounds(sprite,x,y,scale=1){const b=visibleBounds(sprite);return rect(x+(b.left-sprite.width/2)*scale,y+(b.top-sprite.height/2)*scale,b.width*scale,b.height*scale)}
  function fit(out,sprite,x,y,diameter){
    if(!sprite)return;
    const b=visibleBounds(sprite),scale=diameter/Math.max(b.width,b.height);
    out.drawImage(sprite,x-(b.left+b.width/2)*scale,y-(b.top+b.height/2)*scale,sprite.width*scale,sprite.height*scale);
  }
  function cameraLayer(scene,speech){
    const isBackdrop=child=>child.matches?.('.ice-base-exterior,.ice-lab-wall,.ice-lab-light,.ice-lab-frost,.ice-outdoor-test,.ice-opening-background');
    let layer=scene.querySelector?.(':scope > .cutscene-camera');
    if(!layer){layer=document.createElement('div');layer.className='cutscene-camera';
      for(const child of [...scene.children])if(child!==speech&&!isBackdrop(child)&&!child.matches('.cutscene-pause-button,.cutscene-menu,.finale-kicker,h2,.finale-caption'))layer.appendChild(child);
      scene.prepend(layer);
    }
    // Older replays may already have a camera wrapper. Backgrounds belong to
    // the viewport, so a dialogue reframe can never expose its empty edges.
    for(const child of [...(layer.children||[])])if(isBackdrop(child))scene.appendChild(child);
    return layer;
  }
  function place(scene,speech,actor,controls,lineKey){
    if(!actor?.bounds)throw new Error(`Missing cutscene actor for ${lineKey}`);
    const v=viewport(scene),margin=14,gap=24,layer=cameraLayer(scene,speech);
    // Measure in the untransformed camera's local coordinates on every frame.
    speech.style.width=`${Math.min(320,v.width-margin*2)}px`;
    const w=speech.offsetWidth,h=speech.offsetHeight;
    const zones=controls.map(node=>localBounds(node,scene)).filter(Boolean).map(b=>rect(b.left-10,b.top-10,b.width+20,b.height+20));
    // Reserve the open menu's footprint even before its width transition runs.
    const menu=controls.find(node=>node?.classList?.contains('cutscene-menu'));
    const menuBounds=localBounds(menu,scene);
    if(menuBounds)zones.push(rect(v.width-140,Math.max(0,menuBounds.top-10),140,198));
    const s=actor.bounds,cx=s.left+s.width/2;
    const make=(side,scale=1,tx=0,ty=0)=>{
      const a=rect(s.left*scale+tx,s.top*scale+ty,s.width*scale,s.height*scale),center=a.left+a.width/2;
      const left=center-w/2,top=side==='above'?a.top-gap-h:a.bottom+gap;
      const box=rect(left,top,w,h),tail=rect(center-10,side==='above'?box.bottom:box.top-12,20,12);
      const action=(actor.actionBounds||[]).map(b=>rect(b.left*scale+tx,b.top*scale+ty,b.width*scale,b.height*scale));
      const safe=box.left>=margin&&box.right<=v.width-margin&&box.top>=margin&&box.bottom<=v.height-margin&&a.top>=margin&&a.bottom<=v.height-margin&&a.left>=margin&&a.right<=v.width-margin&&!zones.concat(action).some(z=>overlap(box,z)||overlap(tail,z));
      return{side,left,top,center,safe,scale,tx,ty};
    };
    const previous=speech._cutscenePlacement;
    // Prefer above; retain a side throughout a line if it still fits.
    let options=[make('above'),make('below')],chosen;
    if(previous?.key===lineKey){const held=make(previous.side,previous.scale,previous.tx,previous.ty);if(held.safe)chosen=held}
    chosen=chosen||options.find(p=>p.safe);
    if(!chosen){
      // Reframe the story layer, never detach dialogue to a free screen corner.
      const maxScale=Math.min(1,(v.height-h-gap-margin*2)/s.height,(v.width-margin*2)/s.width);
      for(let step=0;step<20&&!chosen;step++){
        const scale=maxScale*(1-step*.05),halfWidth=Math.max(s.width*scale,w)/2;
        const centers=[clamp(cx*scale,margin+halfWidth,v.width-margin-halfWidth),v.width/2];
        const safeShots=[];
        for(const side of ['above','below'])for(const center of centers){
          const natural=side==='above'?s.top*scale-h-gap:s.bottom*scale+gap;
          const tops=[clamp(natural,margin,v.height-h-margin),margin,v.height-h-margin,...zones.flatMap(z=>[z.bottom,z.top-h])];
          for(const top of tops){
            const ty=(side==='above'?top+h+gap:top-gap-s.height*scale)-s.top*scale;
            const shot=make(side,scale,center-cx*scale,ty);
            if(shot.safe)safeShots.push(shot);
          }
        }
        safeShots.sort((a,b)=>(a.side==='below')-(b.side==='below')||Math.abs(a.ty)+Math.abs(a.tx)-Math.abs(b.ty)-Math.abs(b.tx));
        chosen=safeShots[0];
      }
      if(!chosen)throw new Error(`No safe cutscene framing for actor ${actor.id}`);
    }
    layer.style.transformOrigin='0 0';layer.style.transform=`translate(${chosen.tx}px,${chosen.ty}px) scale(${chosen.scale})`;
    speech.style.left=`${chosen.left}px`;speech.style.top=`${chosen.top}px`;
    speech.style.setProperty('--speech-tail-x',`${clamp(chosen.center-chosen.left,18,w-18)}px`);
    speech.dataset.speechPlacement=chosen.side;speech.dataset.speakerId=actor.id;
    speech._cutscenePlacement={key:lineKey,side:chosen.side,scale:chosen.scale,tx:chosen.tx,ty:chosen.ty};
    return chosen;
  }
  root.CutscenePresentation={rect,viewport,localBounds,visibleBounds,paintedBounds,fit,place};
})(globalThis);
