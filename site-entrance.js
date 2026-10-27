/* Home-page community count uses the same real snapshot as the directory. */
(()=>{'use strict';
 const count=document.getElementById('suzuki-home-count'),note=document.getElementById('suzuki-home-count-note'),avatars=document.getElementById('suzuki-home-avatars');
 if(!count||!note||!avatars)return;
 let snapshot=null;
 const translated=text=>window.suzukiTranslate?window.suzukiTranslate(text):text;
 const text=(node,value)=>{if(node.textContent!==value)node.textContent=value};
 function render(){
  if(!snapshot)return;
  const available=snapshot.available===true&&Array.isArray(snapshot.servers);
  if(!available){text(count,'—');text(note,translated('A contagem será atualizada quando a Suzuki estiver online.'));avatars.replaceChildren();return}
  const servers=snapshot.servers;
  const locale=document.documentElement.lang||'pt-BR';
  const number=new Intl.NumberFormat(locale,{notation:servers.length>=10000?'compact':'standard',maximumFractionDigits:1}).format(servers.length);
  text(count,number);text(note,translated('Comunidades diferentes, o mesmo carinho.'));
  avatars.replaceChildren();
  for(const server of servers.slice(0,5)){
   const name=String(server.name||'Suzuki');let item=null;
   if(typeof server.icon==='string'){
    try{const url=new URL(server.icon);if(url.protocol==='https:'&&url.hostname==='cdn.discordapp.com'&&url.pathname.startsWith('/icons/')){item=document.createElement('img');item.src=url.href;item.alt='';item.loading='lazy';item.referrerPolicy='no-referrer'}}catch{}
   }
   if(!item){item=document.createElement('span');item.textContent=Array.from(name)[0]||'♡'}
   item.title=name;avatars.append(item);
  }
 }
 window.addEventListener('suzuki-servers-updated',event=>{snapshot=event.detail;render()});
 window.addEventListener('suzuki-i18n-ready',render);
 if(window.suzukiServerDirectorySnapshot){snapshot=window.suzukiServerDirectorySnapshot;render()}
})();
