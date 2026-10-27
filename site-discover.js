/* Reveal the complete Suzuki experience without navigating away or clearing forms. */
(()=>{'use strict';
 const content=document.getElementById('suzuki-complete-content');
 if(!content)return;
 const footer=document.querySelector('footer[data-suzuki-complete-footer]');
 const triggers=[...document.querySelectorAll('[data-suzuki-discover]')];
 const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 function reveal(target){
  content.hidden=false;if(footer)footer.hidden=false;
  for(const button of triggers)button.setAttribute('aria-expanded','true');
  const destination=target||document.getElementById('world')||content;
  if(!destination.hasAttribute('tabindex'))destination.setAttribute('tabindex','-1');
  destination.focus({preventScroll:true});
  destination.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});
 }
 for(const button of triggers)button.addEventListener('click',()=>reveal());
 document.addEventListener('click',event=>{
  const anchor=event.target.closest?.('a[href]');
  if(!anchor||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const url=new URL(anchor.href,location.href);
  if(url.origin!==location.origin||url.pathname!==location.pathname||!url.hash)return;
  let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)))}catch{return}
  if(target&&content.contains(target)&&content.hidden){event.preventDefault();reveal(target)}
 });
 // Existing links can open their section after an explicit hash navigation.
 window.addEventListener('hashchange',()=>{
  let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)))}catch{return}
  if(target&&content.contains(target)&&content.hidden)reveal(target);
 });
})();
