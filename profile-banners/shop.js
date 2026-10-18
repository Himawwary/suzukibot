(()=>{'use strict';
const status=document.getElementById('banner-operation'),account=document.getElementById('banner-account')?.dataset.account;
if(!status||!account)return;
const key='suzukiBannerPending:'+account,buttons=[...document.querySelectorAll('[data-banner]')];let busy=false;
function lock(){for(const button of buttons)button.disabled=true;}
function finish(message){status.replaceChildren(document.createTextNode(message+' '));const link=document.createElement('a');link.href='/banco/banners';link.textContent='Atualizar meus banners';status.append(link);}
async function monitor(id){
 for(let i=0;i<45;i++){
  const response=await fetch('/banco/api/result/'+encodeURIComponent(id),{cache:'no-store'}),value=await response.json();
  if(!response.ok)throw Error(value.error||'Não consegui consultar o pedido.');
  if(['done','failed','uncertain'].includes(value.status)){sessionStorage.removeItem(key);finish(value.result?.message||'Pedido registrado.');return;}
  status.textContent='A Suzuki está confirmando seu pedido…';await new Promise(resolve=>setTimeout(resolve,2000));
 }
 status.textContent='Pedido guardado. Aguarde a Suzuki; não precisa comprar novamente.';
}
async function submit(operation){
 lock();sessionStorage.setItem(key,JSON.stringify(operation));
 try{
  const response=await fetch('/banco/api/banners',{method:'POST',headers:{'content-type':'application/json','x-suzuki-bank-request':operation.id},body:JSON.stringify({kind:operation.kind,sku:operation.sku})}),value=await response.json();
  if(!response.ok){if(response.status<500||response.status===503)sessionStorage.removeItem(key);finish(value.error||'Não foi possível registrar o pedido.');return;}
  await monitor(value.id);
 }catch(error){status.textContent=error.message+' Seu pedido foi preservado; atualize para consultar.';}
}
for(const button of buttons)button.addEventListener('click',()=>{
 if(busy)return;const sku=button.dataset.banner,kind=button.dataset.action;
 if(kind==='banner_buy'&&!confirm('Comprar o banner por '+button.dataset.price+' sorvetes?'))return;
 busy=true;submit({id:crypto.randomUUID(),kind,sku});
});
try{
 const operation=JSON.parse(sessionStorage.getItem(key)||'null');
 if(operation&&/^[0-9a-f-]{36}$/.test(operation.id)&&['banner_buy','banner_equip'].includes(operation.kind)&&/^[a-z]+$/.test(operation.sku)){busy=true;submit(operation);}
}catch{sessionStorage.removeItem(key);}
})();
