/* Uses the existing scoped Discord session; all prices and ownership are verified again by the bot. */
(()=>{'use strict';
const endpoint='https://suzuki-store.alexmarqueslogin.workers.dev/banco/api/community';
const buttons=[...document.querySelectorAll('[data-decor-buy]')],notes=[...document.querySelectorAll('[data-decor-shop-status]')];if(!buttons.length)return;
let state=null,busy=false,owner=null;const t=s=>window.suzukiTranslate?window.suzukiTranslate(s):s;
function access(){try{const a=JSON.parse(window.suzukiReadAccess?.()||'null');return a&&a.expires>Date.now()/1000&&/^[A-Za-z0-9_-]{32,128}$/.test(a.token)&&/^\d+$/.test(a.id)?a:null;}catch{return null;}}
function status(s){notes.forEach(note=>note.textContent=t(s));}
async function call(body){const a=access();if(!a)throw Error('Entre com Discord para continuar.');const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},credentials:'omit',cache:'no-store',body:JSON.stringify({...body,token:a.token})});const v=await r.json();if(!r.ok){const e=Error(v.error||'Não foi possível concluir. Tente novamente.');e.status=r.status;throw e;}return v;}
function key(a){return 'suzukiDecorPending:'+a.id;}
function render(){
 const a=access();document.querySelectorAll('[data-decor-wallet]').forEach(el=>el.textContent=state?String(state.wallet):'—');document.querySelectorAll('[data-decor-hearts]').forEach(el=>el.textContent=state?String(state.hearts):'—');for(const button of buttons){const category=button.dataset.decorCategory,sku=button.dataset.decorBuy,group=category==='icon'?'icons':category==='xp'?'xp':'effects',selected=category==='icon'?'icon_selected':category==='xp'?'xp_selected':'effect_selected';
 const booster=button.dataset.decorBooster==='true',has=sku==='none'||state?.decor?.[group]?.includes(sku)||booster&&state?.booster,active=!!(state&&state.decor[selected]===sku),amount=Number(button.dataset.decorPrice||0);
 button.disabled=busy||active||!!(a&&state&&!state.ready)||!!(a&&booster&&state&&!state.booster)||!!(a&&category==='xp'&&state&&!state.xp_eligible);
 button.dataset.decorAction=has?'decor_equip':'decor_buy';button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
 const label=document.createElement('span');label.textContent=t(active?'Ativada':has?'Ativar':'Comprar');button.replaceChildren(label);
 if(!has&&amount){const amountBox=document.createElement('span');amountBox.className='decor-buy-price';const icon=document.createElement('img');icon.src=category==='icon'?'docinho-suzuki.webp':'coracoes-suzuki.webp';icon.alt='';icon.width=23;icon.height=23;const number=document.createElement('strong');number.textContent=String(amount);amountBox.append(icon,number);button.append(amountBox);}
 }
}
async function refresh(){const a=access();if(!a){state=null;owner=null;render();return;}const requested=a.id;owner=requested;try{const value=await call({action:'profile_decor_state'});if(access()?.id!==requested||owner!==requested)return;state=value;if(!state.ready)status('Aguarde a Suzuki carregar a atualização.');else status('Escolha uma moldura para ativar no seu perfil.');}catch(e){status(e.message);}render();}
async function monitor(id,expected){for(let i=0;i<45;i++){if(access()?.id!==expected)return;const value=await call({action:'profile_decor_result',key:id});if(access()?.id!==expected)return;if(['done','failed','uncertain'].includes(value.status)){const a=access();if(a)sessionStorage.removeItem(key(a));if(value.status==='done'&&value.result?.decor)state={...(state||{}),ready:true,decor:value.result.decor,hearts:value.result.hearts,wallet:value.result.wallet};status(value.result?.message||'Pedido concluído.');return;}status('A Suzuki está confirmando seu pedido…');await new Promise(r=>setTimeout(r,2000));}status('Pedido guardado. Aguarde a Suzuki; não precisa comprar novamente.');}
async function submit(operation){busy=true;render();const a=access();if(!a){busy=false;render();return;}
 try{sessionStorage.setItem(key(a),JSON.stringify(operation));const result=await call({action:'profile_decor_request',...operation});if(access()?.id===a.id)await monitor(result.id,a.id);}catch(e){if(e.status&&e.status<500)sessionStorage.removeItem(key(a));if(access()?.id===a.id)status(e.message);}finally{busy=false;render();}
}
buttons.forEach(button=>button.addEventListener('click',()=>{if(busy)return;const a=access();if(!a){sessionStorage.setItem('suzukiLoginReturn',location.hash||'#enfeites');location.href='https://suzuki-store.alexmarqueslogin.workers.dev/auth/start?produto=bank_site';return;}
 if(!state?.ready){refresh();return;}submit({key:crypto.randomUUID(),kind:button.dataset.decorAction,category:button.dataset.decorCategory,sku:button.dataset.decorBuy});}));
async function resume(){await refresh();const a=access();if(!a)return;try{const op=JSON.parse(sessionStorage.getItem(key(a))||'null');if(op&&/^[0-9a-f-]{36}$/.test(op.key)&&['decor_buy','decor_equip'].includes(op.kind)&&['icon','card','xp'].includes(op.category)&&/^[a-z0-9-]{1,64}$/.test(op.sku)){await submit(op);}}catch{status('Não foi possível consultar o pedido. Tente novamente.');}}
window.addEventListener('suzuki-account',resume);window.addEventListener('suzuki-i18n-ready',render);window.addEventListener('suzuki-language',render);resume();
})();

