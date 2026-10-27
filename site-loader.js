/* Suzuki's original heart loader: no remote images, timers fail open. */
(()=>{'use strict';
 if(window.SuzukiLoader)return;
 const captions={
  'pt-BR':'Carregando seu cantinho…',en:'Loading your little corner…',es:'Cargando tu rinconcito…',
  ja:'あなたの居場所を読み込み中…',de:'Dein kleiner Lieblingsplatz lädt…',fr:'Chargement de ton petit coin…',
  ko:'나만의 공간을 불러오는 중…',tr:'Küçük köşen yükleniyor…',id:'Memuat sudut kecilmu…',hi:'आपका प्यारा कोना लोड हो रहा है…'
 };
 let overlay=null,started=0,closing=false,failsafe=null,finishTimer=null,removeTimer=null,chosenLanguage=null;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function language(){
  try{
   const query=new URL(location.href).searchParams.get('lang');
   const cookie=location.origin==='https://suzuki-store.alexmarqueslogin.workers.dev'?document.cookie.match(/(?:^|;\s*)SuzukiUILanguage=([^;]+)/)?.[1]:null;
   const code=query||cookie||localStorage.getItem('suzukiLanguage')||document.documentElement.lang;
   return code in captions?code:'pt-BR';
  }catch{return 'pt-BR'}
 }
 const style=document.createElement('style');style.id='suzuki-heart-loader-style';
 style.textContent=`
 #suzuki-heart-loader{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(ellipse at 20% 15%,#f1ffd7 0,transparent 46%),radial-gradient(ellipse at 82% 82%,#ead9ff 0,transparent 45%),#fff2f8;color:#8d275f;isolation:isolate;opacity:1;transition:opacity .22s ease;overscroll-behavior:contain;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
 #suzuki-heart-loader.is-finishing{opacity:0;pointer-events:none}
 #suzuki-heart-loader .sz-heart-content{text-align:center;padding:24px;max-width:90vw}
 #suzuki-heart-loader .sz-heart-stage{position:relative;width:176px;height:162px;margin:0 auto 20px;display:grid;place-items:center}
 #suzuki-heart-loader svg{display:block;width:148px;height:136px;overflow:visible;filter:drop-shadow(0 10px 14px #ee4f9c25);animation:sz-heart-beat 1.15s ease-in-out infinite}
 #suzuki-heart-loader .sz-heart-spark{position:absolute;font-size:25px;color:#a1df6c;line-height:1;animation:sz-heart-twinkle 1.6s ease-in-out infinite}
 #suzuki-heart-loader .sz-heart-spark:nth-of-type(1){top:1px;left:0;color:#ba8bea;font-size:29px}
 #suzuki-heart-loader .sz-heart-spark:nth-of-type(2){top:18px;right:0;animation-delay:.4s}
 #suzuki-heart-loader .sz-heart-spark:nth-of-type(3){bottom:4px;left:12px;animation-delay:.8s}
 #suzuki-heart-loader .sz-heart-brand{margin:0;font-size:clamp(27px,5vw,34px);font-weight:850;letter-spacing:1px;color:#eb2990}
 #suzuki-heart-loader .sz-heart-caption{margin:10px 0 0;font-size:clamp(14px,3vw,16px);font-weight:600;color:#79547d;line-height:1.5}
 #suzuki-heart-loader .sz-heart-dots{display:flex;justify-content:center;gap:7px;margin-top:18px}
 #suzuki-heart-loader .sz-heart-dots i{width:7px;height:7px;border-radius:50%;background:#ff65ad;animation:sz-heart-dot 1.2s ease-in-out infinite}
 #suzuki-heart-loader .sz-heart-dots i:nth-child(2){background:#a7e276;animation-delay:.15s}
 #suzuki-heart-loader .sz-heart-dots i:nth-child(3){background:#b78ce6;animation-delay:.3s}
 @keyframes sz-heart-beat{0%,100%{transform:scale(.94)}20%{transform:scale(1.04)}35%{transform:scale(.98)}50%{transform:scale(1.02)}}
 @keyframes sz-heart-twinkle{0%,100%{transform:scale(.8) rotate(-8deg);opacity:.55}50%{transform:scale(1.08) rotate(8deg);opacity:1}}
 @keyframes sz-heart-dot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
 @media(prefers-reduced-motion:reduce){#suzuki-heart-loader,#suzuki-heart-loader *{animation:none!important;transition:none!important}}
 `;
 (document.head||document.documentElement).append(style);
 function caption(event){if(captions[event?.detail?.language])chosenLanguage=event.detail.language;if(overlay){const lang=chosenLanguage||language();overlay.lang=lang;overlay.querySelector('.sz-heart-caption').textContent=captions[lang]}}
 function build(){
  overlay=document.createElement('div');overlay.id='suzuki-heart-loader';overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');overlay.setAttribute('aria-atomic','true');overlay.setAttribute('translate','no');overlay.dataset.noTranslate='';
  // Static, authored SVG markup. No fetched or user-provided HTML is inserted.
  overlay.innerHTML='<div class="sz-heart-content"><div class="sz-heart-stage" aria-hidden="true"><span class="sz-heart-spark">✦</span><span class="sz-heart-spark">✧</span><span class="sz-heart-spark">♡</span><svg viewBox="0 0 120 110" focusable="false"><defs><linearGradient id="sz-heart-pink" x1="0" x2="0.9" y1="0" y2="1"><stop stop-color="#ff99ce"/><stop offset=".48" stop-color="#ff2899"/><stop offset="1" stop-color="#df0878"/></linearGradient></defs><path d="M60 99C48 88 8 62 8 34C8 7 43 0 60 24C77 0 112 7 112 34C112 62 72 88 60 99Z" fill="url(#sz-heart-pink)" stroke="#a8e774" stroke-width="8" stroke-linejoin="round"/><path d="M22 32C22 19 40 16 46 25" fill="none" stroke="#fff0f9" stroke-width="7" stroke-linecap="round" opacity=".92"/><path d="M91 66L78 79" fill="none" stroke="#ffb4da" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg></div><p class="sz-heart-brand" aria-hidden="true">Suzuki</p><p class="sz-heart-caption"></p><div class="sz-heart-dots" aria-hidden="true"><i></i><i></i><i></i></div></div>';
  (document.body||document.documentElement).append(overlay);caption();
 }
 function remove(){if(overlay){overlay.remove();overlay=null}closing=false}
 function hide(immediate=false){
  clearTimeout(failsafe);clearTimeout(finishTimer);
  if(!overlay||closing)return;
  const delay=immediate||reduced?0:Math.max(0,320-(performance.now()-started));
  finishTimer=setTimeout(()=>{if(!overlay)return;closing=true;overlay.classList.add('is-finishing');removeTimer=setTimeout(remove,reduced||immediate?0:230)},delay);
 }
 function show(){
  clearTimeout(removeTimer);clearTimeout(finishTimer);clearTimeout(failsafe);
  if(!overlay)build();closing=false;overlay.classList.remove('is-finishing');started=performance.now();
  failsafe=setTimeout(()=>hide(true),8000);
 }
 window.SuzukiLoader=Object.freeze({show,hide});
 window.addEventListener('load',()=>hide(),{once:true});
 window.addEventListener('pageshow',event=>{if(event.persisted)hide(true)});
 window.addEventListener('keydown',event=>{if(event.key==='Escape')hide(true)});
 window.addEventListener('suzuki-i18n-ready',caption);
 if(document.readyState!=='complete')show();
})();
