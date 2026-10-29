(()=>{'use strict';
 const supported={'pt-BR':'PT-BR',en:'English',es:'Español',ja:'日本語',de:'Deutsch',fr:'Français',ko:'한국어',tr:'Türkçe',id:'Bahasa Indonesia',hi:'हिन्दी'};
 const script=document.currentScript,base=new URL('.',script?.src||location.href);
 if(!window.SuzukiLoader&&!document.querySelector('script[data-suzuki-loader]')){const loader=document.createElement('script');loader.dataset.suzukiLoader='';loader.src=new URL('site-loader.js?v=heart-1',base).href;(document.head||document.documentElement).append(loader)}
 let language='pt-BR',catalog={},ready=false,scheduled=false,observer;const saved=new WeakMap(),pending=new Set();
 try{const cookie=location.origin==='https://suzuki-store.alexmarqueslogin.workers.dev'?document.cookie.match(/(?:^|;\s*)SuzukiUILanguage=([^;]+)/)?.[1]:null;const preferred=new URL(location.href).searchParams.get('lang')||cookie||localStorage.getItem('suzukiLanguage');if(preferred in supported)language=preferred}catch{}
 let select=document.getElementById('site-language');
 if(!select){select=document.createElement('select');select.id='site-language';select.className='suzuki-language-switch';select.setAttribute('aria-label','Idioma / Language');const header=document.querySelector('header')||document.body;header.append(select);const style=document.createElement('style');style.textContent='.suzuki-language-switch{font:700 14px system-ui,sans-serif;color:#315b40;background:#fffbe8;border:2px dashed #b1d78c;border-radius:16px;padding:10px 12px;max-width:160px;margin:6px;flex:0 1 auto}';document.head.append(style)}
 select.replaceChildren(...Object.entries(supported).map(([value,label])=>new Option(label,value)));select.value=language;
 const privateAreas='script,style,textarea,input,code,pre,#site-language,#guild-name,#guild option,#bank-real-ranking,#bank-global-feed,#suzuki-track option,.site-account-name,.community-message,.bank-message span,.user-directory-card strong,.user-directory-card h3,.server-directory-card strong,.server-directory-card h3,.staff-person strong,.record,#chat-log,[translate="no"],[data-no-translate]';
 let fragments=null;
 function escape(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
 function translate(source){
  if(typeof source!=='string'||language==='pt-BR'||!ready)return source;
  const key=source.trim();if(/^(?:Suzuki(?: Bot)?|SuzukiPay|Miyu(?: Suzuki)?|suzu|suzukinha|Tani|Taira|Azuna|Azuma|Yamada|Nishi|Watanabe|Sato|Satou|Honda|Rihito)[.!?\s]*$/i.test(key))return source;if(!key||!/[A-Za-zÀ-ÿ]/.test(key)||/^(?:R\$|\$|€)\s*[\d.,\s]+$/.test(key))return source;
  const map=catalog[language]||{},exact=map[key];
  const protectedTokens=source.match(/https?:\/\/[^\s<>]+|(?:\/|==)[\p{L}_][\p{L}\p{N}_-]*/giu)||[];
  if(exact&&protectedTokens.every(token=>exact.includes(token)))return source.replace(key,exact);
  const parts=source.split(/(https?:\/\/[^\s<>]+|(?:\/|==)[\p{L}_][\p{L}\p{N}_-]*(?:[ \t]+(?:canal|voz))?)/giu);
  if(parts.length>1)return parts.map((part,index)=>index%2?part:translate(part)).join('');

  // Preserve dynamic numbers and account data while translating known UI fragments.
  if(!fragments){const keys=Object.keys(map).filter(k=>k.length>=3&&k.length<120&&!/[<>\n]/.test(k)&&map[k]!==k).sort((a,b)=>b.length-a.length);fragments=keys.length?new RegExp('(?<![\\p{L}\\p{N}_])(?:'+keys.map(escape).join('|')+')(?![\\p{L}\\p{N}_])','gu'):false}
  return fragments?source.replace(fragments,key=>map[key]||key):source;
 }
 function nodeText(node,attribute){
  const value=attribute?node.getAttribute(attribute):node.nodeValue;if(!value)return;
  let data=saved.get(node);if(!data){data={};saved.set(node,data)}const key=attribute||'text';let entry=data[key];
  if(!entry||entry.output!==value)entry={source:value,output:value};const output=translate(entry.source);
  if(value!==output){if(attribute)node.setAttribute(attribute,output);else node.nodeValue=output}entry.output=output;data[key]=entry;
 }
 function informChildren(){for(const iframe of document.querySelectorAll('iframe[src]')){try{const url=new URL(iframe.src,location.href);if(['https://himawwary.github.io','https://suzuki-store.alexmarqueslogin.workers.dev',location.origin].includes(url.origin))iframe.contentWindow?.postMessage({type:'suzuki-language',language},url.origin)}catch{}}}
 function text(node){if(node.parentElement&&!node.parentElement.closest(privateAreas)&&!(document.getElementById('server-console')&&node.parentElement.closest('header span')))nodeText(node)}
 function attributes(element){
  if(element.tagName==='A'&&element.hasAttribute('href'))try{const url=new URL(element.getAttribute('href'),location.href);if(url.origin!==location.origin&&['https://himawwary.github.io','https://suzuki-store.alexmarqueslogin.workers.dev'].includes(url.origin)&&url.searchParams.get('lang')!==language){url.searchParams.set('lang',language);element.href=url.href}}catch{}
  if(element.closest('#site-language,[translate="no"],[data-no-translate]'))return;for(const key of ['aria-label','placeholder','alt','title'])if(element.hasAttribute(key))nodeText(element,key);
 }
 function apply(full=true){
  scheduled=false;observer?.disconnect();if(full){document.documentElement.lang=language;select.value=language}
  const roots=full?[document.body]:[...pending];pending.clear();
  for(const root of roots){if(!root.isConnected)continue;if(root.nodeType===Node.TEXT_NODE){text(root);continue}if(root.nodeType!==Node.ELEMENT_NODE)continue;
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode())text(node);
   attributes(root);for(const element of root.querySelectorAll('[aria-label],[placeholder],[alt],[title],a[href]'))attributes(element);
  }
  if(full&&document.title){const original=document.head.querySelector('title');if(original?.firstChild)nodeText(original.firstChild)}
  observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt','placeholder','href']});if(full)informChildren();
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(()=>apply(false))}}
 observer=new MutationObserver(records=>{for(const record of records){if(record.type==='childList'){for(const node of record.addedNodes)pending.add(node)}else pending.add(record.target)}schedule()});
 function choose(value,remember=true){if(!(value in supported))return;language=value;fragments=null;if(remember)try{localStorage.setItem('suzukiLanguage',value);if(location.origin==='https://suzuki-store.alexmarqueslogin.workers.dev')document.cookie='SuzukiUILanguage='+value+'; Path=/; Max-Age=31536000; SameSite=Lax; Secure'}catch{}apply();window.dispatchEvent(new CustomEvent('suzuki-language',{detail:{language:value}}));loadCatalog(value)}
 select.addEventListener('change',()=>choose(select.value));
 window.addEventListener('message',event=>{if(event.data?.type!=='suzuki-language'||!['https://himawwary.github.io','https://suzuki-store.alexmarqueslogin.workers.dev',location.origin].includes(event.origin))return;choose(event.data.language)});
 window.addEventListener('storage',event=>{if(event.key==='suzukiLanguage'&&event.newValue in supported)choose(event.newValue,false)});
 document.addEventListener('load',event=>{if(event.target?.tagName==='IFRAME')informChildren()},true);
 window.suzukiTranslate=translate;
 window.suzukiRawText=text=>({suzukiRawText:String(text)});
 if(window.CanvasRenderingContext2D){for(const method of ['fillText','strokeText']){const original=CanvasRenderingContext2D.prototype[method];CanvasRenderingContext2D.prototype[method]=function(text,...args){const value=text&&typeof text==='object'&&typeof text.suzukiRawText==='string'?text.suzukiRawText:translate(String(text));return Reflect.apply(original,this,[value,...args])}}}
 apply();
 const loading=new Map();
 function loadCatalog(code){
  if(code==='pt-BR'||catalog[code])return;
  if(loading.has(code))return loading.get(code);
  const read=path=>fetch(new URL(path,base),{credentials:'omit',cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Catálogo indisponível');return response.json()});
  const sources=[read('languages/'+code+'.json?v=20261021-complete')];if(document.getElementById('server-console'))sources.push(read('server-languages/'+code+'.json?v=welcomer-1').catch(()=>({})),read('server-welcomer-languages/'+code+'.json?v=welcomer-1').catch(()=>({})),read('community-panel-languages/'+code+'.json?v=1').catch(()=>({})),read('xp-languages/'+code+'.json?v=xp-1').catch(()=>({})));
  if(document.getElementById('suzuki-home-proof'))sources.push(read('entrance-languages/'+code+'.json?v=1').catch(()=>({})));
  const job=Promise.all(sources).then(values=>Object.assign({},...values)).then(value=>{catalog[code]=value;ready=true;fragments=null;apply();window.dispatchEvent(new CustomEvent('suzuki-i18n-ready',{detail:{language:code}}))}).catch(()=>{apply()}).finally(()=>loading.delete(code));loading.set(code,job);return job;
 }
 loadCatalog(language);
})();

