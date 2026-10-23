(()=>{'use strict';
const dialog=document.querySelector('[data-frame-dialog]');if(!dialog)return;
const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),loading=dialog.querySelector('[data-frame-loading]'),error=dialog.querySelector('[data-frame-failure]');
let opener=null,version=0;const cache=new Map();
function picture(src){if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{cache.delete(src);reject(Error('image'));};im.src=src;}));return cache.get(src);}
function cover(c,im,x,y,w,h){const scale=Math.max(w/im.width,h/im.height),sw=w/scale,sh=h/scale;c.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,x,y,w,h);}
const openings=new Map();
function opening(frame){
 if(openings.has(frame.src))return openings.get(frame.src);
 const w=frame.width,h=frame.height,c=document.createElement('canvas');c.width=w;c.height=h;const pen=c.getContext('2d',{willReadFrequently:true});pen.drawImage(frame,0,0);
 const pixels=pen.getImageData(0,0,w,h).data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h),center=Math.floor(h/2)*w+Math.floor(w/2);let head=0,tail=0,left=w,right=0,top=h,bottom=0;
 if(pixels[center*4+3]>8)throw Error('opening');queue[tail++]=center;seen[center]=1;
 function visit(p){if(!seen[p]&&pixels[p*4+3]<=8){seen[p]=1;queue[tail++]=p;}}
 while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);if(x)visit(p-1);if(x<w-1)visit(p+1);if(y)visit(p-w);if(y<h-1)visit(p+w);}
 if(!left||!top||right===w-1||bottom===h-1)throw Error('open frame');
 const mask=pen.createImageData(w,h);for(let i=0;i<tail;i++)mask.data[queue[i]*4+3]=255;pen.clearRect(0,0,w,h);pen.putImageData(mask,0,0);
 const value={mask:c,left,top,width:right-left+1,height:bottom-top+1};openings.set(frame.src,value);return value;
}
async function preview(card){
 const ticket=++version;loading.hidden=false;error.hidden=true;canvas.hidden=true;
 dialog.querySelector('[data-frame-name]').textContent=card.querySelector('h4').textContent;
 const price=card.querySelector('[data-frame-price]'),slot=dialog.querySelector('[data-frame-dialog-price]');slot.replaceChildren();if(price)slot.append(price.cloneNode(true));
 try{
 const [base,frame,photo]=await Promise.all([picture('assets/icon-decorations/profile-preview-base.webp'),picture(card.querySelector('.icon-decor-frame').src),picture(card.querySelector('.icon-decor-photo').src)]);
 if(ticket!==version||!dialog.open)return;
 const hole=opening(frame),layer=document.createElement('canvas');layer.width=frame.width;layer.height=frame.height;const pen=layer.getContext('2d');cover(pen,photo,hole.left,hole.top,hole.width,hole.height);pen.globalCompositeOperation='destination-in';pen.drawImage(hole.mask,0,0);pen.globalCompositeOperation='source-over';pen.drawImage(frame,0,0);
 ctx.clearRect(0,0,1080,795);ctx.drawImage(base,0,0,1080,795);ctx.drawImage(layer,36.5,205,321.2,321.2);
 ctx.save();ctx.beginPath();ctx.arc(1014.5,494,38.5,0,Math.PI*2);ctx.clip();ctx.fillStyle='#fffbea';ctx.fillRect(976,455.5,77,77);cover(ctx,photo,976,455.5,77,77);ctx.restore();
 canvas.hidden=false;loading.hidden=true;
 }catch{if(ticket===version){loading.hidden=true;error.hidden=false;}}
}
document.querySelectorAll('[data-frame-preview]').forEach(button=>button.addEventListener('click',()=>{opener=button;dialog.showModal();preview(button.closest('.icon-decor-card'));}));
dialog.querySelector('[data-frame-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{version++;opener?.focus();});
})();

