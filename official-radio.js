(() => {
  'use strict';
  if (window.SuzukiOfficialRadio) return;
  // The main site already supplies audio when World is embedded in its page.
  try { if (window.parent !== window && window.parent.SuzukiOfficialRadio) return; } catch {}
  window.SuzukiOfficialRadio = true;
  const activity=window.parent!==window&&new URLSearchParams(location.search).has('frame_id');
  const api=activity?'/suzuki-api':'https://suzuki-store.alexmarqueslogin.workers.dev';
  const boot=()=>{
    const box=document.createElement('aside');
    box.id='suzuki-official-radio';box.hidden=true;
    box.setAttribute('aria-label','Rádio do servidor da Suzuki');
    if(location.pathname.includes('/world/'))box.classList.add('sor-world');
    box.innerHTML=`<div class="sor-station"><span class="sor-live"></span> AO VIVO NA SUZUKI <span class="sor-note" aria-hidden="true">♪</span></div>
      <div class="sor-main"><div class="sor-speaker" aria-hidden="true"><span>✿</span></div><div class="sor-song"><strong></strong><small></small></div></div>
      <div class="sor-controls"><button type="button" aria-label="Ativar som da rádio">Ativar som</button><label>Volume <input type="range" min="0" max="100" value="60" aria-label="Volume da rádio"></label><div class="sor-waves" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>`;
    document.body.append(box);
    const audio=document.createElement('audio');audio.preload='none';audio.autoplay=true;audio.volume=.6;
    const button=box.querySelector('button'),title=box.querySelector('strong'),artist=box.querySelector('small');
    let state={playing:false},session='',muted=false,blocked=false,connecting=false,lastSuccess=0,retryTimer;
    try{muted=localStorage.getItem('suzuki-radio-muted')==='yes';}catch{}
    function paint(){
      button.textContent=muted?'Ouvir rádio':blocked?'Ativar som':'Pausar rádio';
      button.setAttribute('aria-label',muted||blocked?'Ouvir rádio neste dispositivo':'Pausar rádio neste dispositivo');
      button.title='Controla apenas o seu som. A música da call continua.';
      box.classList.toggle('sor-silent',muted||blocked||audio.paused);
    }
    function stop(){audio.pause();audio.removeAttribute('src');audio.load();session='';connecting=false;clearTimeout(retryTimer);}
    async function start(){
      if(!state.playing||muted||connecting)return;
      connecting=true;
      if(session!==state.session||!audio.src||audio.ended){
        session=state.session;
        audio.src=api+'/api/official-radio/stream?session='+encodeURIComponent(session)+'&t='+Date.now();
      }
      try{await audio.play();blocked=false;}catch(error){
        blocked=error.name==='NotAllowedError';
        if(!blocked)retryTimer=setTimeout(()=>{session='';start();},3000);
      }finally{connecting=false;paint();}
    }
    button.addEventListener('click',()=>{
      if(muted||blocked||audio.paused){muted=false;blocked=false;start();}
      else{muted=true;stop();}
      try{localStorage.setItem('suzuki-radio-muted',muted?'yes':'no');}catch{}
      paint();
    });
    box.querySelector('input').addEventListener('input',event=>{audio.volume=Number(event.target.value)/100;});
    // A user's first gesture can unlock autoplay, without forcing sound after mute.
    function unlock(event){if(box.contains(event.target))return;if(state.playing&&!muted&&(blocked||audio.paused))start();}
    document.addEventListener('pointerdown',unlock,{passive:true});
    document.addEventListener('keydown',unlock);
    audio.addEventListener('playing',paint);
    audio.addEventListener('ended',()=>{session='';start();});
    audio.addEventListener('error',()=>{if(state.playing&&!muted){clearTimeout(retryTimer);retryTimer=setTimeout(()=>{session='';start();},2500);}});
    async function poll(){
      try{
        const response=await fetch(api+'/api/official-radio/state',{cache:'no-store',signal:AbortSignal.timeout(5000)});
        if(!response.ok)throw new Error('Radio unavailable');
        const next=await response.json();lastSuccess=Date.now();
        state=next.playing&&/^[a-f0-9]{32}$/.test(next.session)?next:{playing:false};
        box.hidden=!state.playing;
        if(!state.playing)stop();
        else{
          title.textContent=state.title||'Uma música para você';
          title.title=title.textContent;artist.textContent=state.artist||'Direto da call do servidor';
          if(session!==state.session){stop();blocked=false;}
          if(!muted&&!blocked&&(audio.paused||session!==state.session))start();
        }
        paint();
      }catch{
        if(Date.now()-lastSuccess>7000){state={playing:false};box.hidden=true;stop();}
      }finally{setTimeout(poll,3000);}
    }
    poll();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
