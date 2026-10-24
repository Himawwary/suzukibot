(()=>{'use strict';
// Derive the avatar mask from each transparent frame, just like the bot.
for(const card of document.querySelectorAll('[data-decor-new]')){
 const photo=card.querySelector('.icon-decor-photo'),frame=card.querySelector('.icon-decor-frame'),stage=card.querySelector('.icon-decor-stage');
 const canvas=document.createElement('canvas');canvas.className='new-decor-portrait';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
 let ticket=0;
 async function draw(){const id=++ticket;if(!photo.complete||!frame.complete||!photo.naturalWidth||!frame.naturalWidth)return;
 try{const w=frame.naturalWidth,h=frame.naturalHeight;canvas.width=w;canvas.height=h;const p=canvas.getContext('2d',{willReadFrequently:true});p.drawImage(frame,0,0,w,h);const pixels=p.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),q=new Int32Array(w*h);let head=0,tail=0,l=w,r=0,t=h,b=0;const center=Math.floor(h/2)*w+Math.floor(w/2);if(pixels[center*4+3]>8)throw Error('opening');q[tail++]=center;seen[center]=1;
 function visit(v){if(!seen[v]&&pixels[v*4+3]<=8){seen[v]=1;q[tail++]=v;}}
 while(head<tail){const v=q[head++],x=v%w,y=Math.floor(v/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(x)visit(v-1);if(x<w-1)visit(v+1);if(y)visit(v-w);if(y<h-1)visit(v+w);}
 if(!l||!t||r===w-1||b===h-1)throw Error('open');const mask=document.createElement('canvas');mask.width=w;mask.height=h;const mp=mask.getContext('2d'),data=mp.createImageData(w,h);for(let i=0;i<tail;i++)data.data[q[i]*4+3]=255;mp.putImageData(data,0,0);
 p.clearRect(0,0,w,h);const dw=r-l+1,dh=b-t+1,scale=Math.max(dw/photo.naturalWidth,dh/photo.naturalHeight),sw=dw/scale,sh=dh/scale;p.drawImage(photo,(photo.naturalWidth-sw)/2,(photo.naturalHeight-sh)/2,sw,sh,l,t,dw,dh);p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);p.globalCompositeOperation='source-over';if(id===ticket)photo.style.opacity='0';
 }catch{canvas.hidden=true;photo.style.opacity='';}}
 photo.addEventListener('load',draw);frame.addEventListener('load',draw);draw();
}
const dialog=document.createElement('dialog');dialog.className='xp-image-dialog';const close=document.createElement('button');close.type='button';close.textContent=window.suzukiTranslate?.('Fechar')||'Fechar';const image=document.createElement('img');image.alt='';dialog.append(close,image);document.body.append(dialog);let opener=null;
close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener?.focus());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
for(const button of document.querySelectorAll('[data-xp-preview]'))button.addEventListener('click',()=>{opener=button;image.src=button.dataset.xpPreview;close.textContent=window.suzukiTranslate?.('Fechar')||'Fechar';dialog.showModal();});
})();
