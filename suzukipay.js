(()=>{
 'use strict';
 const base='https://himawwary.github.io/suzukibot/';
 const main=document.querySelector('main.card');if(!main||main.dataset.suzukipay)return;
 main.dataset.suzukipay='1';document.body.classList.add('pay-digital');
 const image=(name,alt='')=>{const img=document.createElement('img');img.src=base+'suzukipay/'+name+'.webp';img.alt=alt;return img};
 const header=document.createElement('header');header.className='pay-top';
 const logo=document.createElement('a');logo.className='pay-wordmark';logo.href='/banco';logo.innerHTML='<span>Suzuki</span>Pay';
 const pill=document.createElement('span');pill.className='pay-pill';pill.textContent='Seu banco de docinhos';header.append(logo,pill);
 const hero=image('banner','SuzukiPay — Sua carteira de docinhos');hero.className='pay-hero';
 main.prepend(header,hero);
 const heading=main.querySelector(':scope > h1');if(heading)heading.classList.add('pay-page-heading');
 const title=main.querySelector(':scope > h2');if(title&&/Meu Banco|Banco da Suzuki/.test(title.textContent))title.classList.add('pay-page-heading');
 const history=main.querySelector('a[href="/minhas-compras"]');if(history)history.classList.add('pay-history');
 const home=location.pathname==='/banco'||location.pathname==='/suzukipay';
 if(home){
  document.title='SuzukiPay · Seu banco de docinhos';
  const account=[...main.querySelectorAll(':scope > p')].find(p=>p.textContent.trim().startsWith('Conta:'));
  if(account){account.classList.add('pay-account');const strong=account.querySelector('strong');if(strong){const name=strong.textContent;const id=account.textContent.split('· ID ')[1];account.replaceChildren(document.createTextNode('Oi, '+name+'!'));if(id){const small=document.createElement('small');small.textContent='Sua chave de docinhos · '+id.trim();account.append(small)}}}
  const grid=[...main.querySelectorAll(':scope > .grid')].find(g=>!g.querySelector('form')&&g.querySelector('h2'));
  if(grid){grid.classList.add('pay-balances');const first=grid.querySelector('.item');if(first?.firstChild?.nodeType===Node.TEXT_NODE)first.firstChild.textContent='Saldo disponível';const total=grid.nextElementSibling;if(total?.tagName==='P')total.classList.add('pay-total');}
  const form=main.querySelector('form[data-bank-kind="transfer"]');
  if(form){form.id='pay-pix';const h=form.querySelector('h3');if(h)h.textContent='Pix de docinhos';const label=form.querySelector('label');if(label?.firstChild?.nodeType===Node.TEXT_NODE)label.firstChild.textContent='Chave do destinatário · ID do Discord';const button=form.querySelector('button');if(button)button.textContent='Conferir Pix';}
  const deposit=main.querySelector('form[data-bank-kind="deposit"]');if(deposit)deposit.parentElement.id='pay-bank';
  const extract=[...main.querySelectorAll(':scope > h3')].find(h=>h.textContent.trim()==='Seu extrato');
  if(extract){const section=document.createElement('section');section.className='pay-statement';section.id='pay-statement';extract.before(section);let node=extract;while(node){const next=node.nextSibling;section.append(node);if(!next||(next.nodeType===1&&next.tagName==='H3'))break;node=next;}}
  if(grid){const actions=document.createElement('nav');actions.className='pay-actions';actions.setAttribute('aria-label','Ações da SuzukiPay');for(const [file,label,help,target] of [['carteira','Pix','Enviar docinhos',form?'#pay-pix':'#bank-note'],['banco','Banco','Guardar e retirar',deposit?'#pay-bank':'#bank-note'],['extrato','Extrato','Suas movimentações','#pay-statement']]){const a=document.createElement('a');a.href=target;a.append(image(file));const text=document.createElement('span');const strong=document.createElement('strong');strong.textContent=label;const small=document.createElement('small');small.textContent=help;text.append(strong,small);a.append(text);actions.append(a)}const total=grid.nextElementSibling;total.after(actions);}
  if(!account){const intro=document.createElement('div');intro.className='pay-intro';intro.append(image('carteira'));const p=document.createElement('p');p.textContent='Sua conta, seus docinhos. Entre com Discord para abrir a carteira, usar o Pix de docinhos e acompanhar o banco.';intro.append(p);const login=main.querySelector('a[href*="/auth/start"]');if(login)login.before(intro);}
 }
 const nav=main.querySelector('nav[aria-label="Sua conta Suzuki"]');if(nav){const bank=nav.querySelector('a[href="/banco"]');if(bank){for(const text of bank.childNodes)if(text.nodeType===Node.TEXT_NODE)text.textContent=text.textContent.replace('Banco','Início')}}
 const footer=document.createElement('p');footer.className='pay-footer';footer.textContent='SuzukiPay · Os mesmos docinhos da sua Suzuki.';main.append(footer);
})();
