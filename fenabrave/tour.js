/* Apresentação guiada entre as quatro páginas, sem interferir nos indicadores. */
(function(){
  const mobilePhone=()=>matchMedia('(max-width:767px), (pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)').matches;
  const DONE='fenabrave-tour-session-done',ACTIVE='fenabrave-tour-v1-step';
  const desktopSteps=[
    {page:null,target:'.nav',title:'Navegue pelo mercado',body:'Use o menu lateral para explorar Visão Geral, Fabricantes, Segmentos e Modelos. Cada página apresenta uma perspectiva diferente do mercado de motocicletas.'},
    {page:'index.html',target:'#monthControl',title:'Escolha o período',body:'Selecione o mês para atualizar os indicadores. Ao mudar de página, o mês escolhido será mantido.'},
    {page:'index.html',target:'.kpi',title:'Entenda os indicadores',body:'Os cartões resumem volume, participação e variações do mercado. Setas e cores ajudam a identificar altas e quedas.'},
    {page:'fabricantes.html',target:'#competitive',title:'Analise a Performance Competitiva',body:'Neste gráfico, compare os fabricantes conforme a variação mensal do volume e da participação de mercado. Passe o cursor sobre os pontos para ver os detalhes de cada marca.'},
    {page:'segmentos.html',target:'#regionalMap',title:'Explore gráficos e regiões',body:'Passe o cursor pelos gráficos e pelo mapa para descobrir valores, participações e comparações. No celular, toque nas áreas para explorar.'},
    {page:'modelos.html',target:'#ranking:not([hidden]),#rankingCards:not([hidden])',title:'Conheça os modelos',body:'Explore os cards de motocicletas e seus detalhes. Role horizontalmente e use “Tabela detalhada” para alternar a visualização.'},
  ];
  const mobileSteps=[
    {page:null,target:'.nav',title:'Navegue pelo mercado',body:'A faixa vermelha reúne Visão Geral, Fabricantes, Segmentos e Modelos. Ela permanece visível no topo enquanto você rola a página.'},
    {page:'index.html',target:'#monthControl',title:'Escolha o período',body:'Use Mês/Ano para mudar os indicadores. Ao rolar a tela, toque em “Filtros”, à direita da faixa vermelha, para acessar as segmentações da página.'},
    {page:'index.html',target:'.kpi',title:'Leia os indicadores',body:'Os cards mostram os principais resultados e variações. Role verticalmente para ver os gráficos; cores e setas indicam a direção das mudanças.'},
    {page:'fabricantes.html',target:'#competitive',title:'Performance Competitiva',body:'Na página Fabricantes, o gráfico compara crescimento do volume e mudança de participação. Toque nos pontos para explorar as informações.'},
    {page:'segmentos.html',target:'#regionalMap',title:'Mapa e regiões',body:'A página Segmentos apresenta composição e distribuição regional. Toque nas regiões do mapa para consultar os dados disponíveis.'},
    {page:'modelos.html',target:'#ranking:not([hidden]),#rankingCards:not([hidden])',title:'Ranking de modelos',body:'Os cards mostram as motocicletas por posição. Deslize horizontalmente para ver mais modelos e alterne para a tabela detalhada quando quiser.'},
  ];
  const steps=mobilePhone()?mobileSteps:desktopSteps;
  const read=(storage,key)=>{try{return storage.getItem(key)}catch{return null}};
  const write=(storage,key,value)=>{try{storage.setItem(key,value)}catch{}};
  const remove=(storage,key)=>{try{storage.removeItem(key)}catch{}};
  let layer,outline,popover,shades=[],help,step=0,active=false,revision=0;
  // O servidor publica URLs limpas (/segmentos), enquanto os links locais usam
  // arquivos .html. Tratar ambas as formas como a mesma página evita um ciclo
  // de redirecionamentos a partir do quarto passo do tutorial.
  const canonicalPage=value=>(value.split('/').pop()||'index').replace(/\.html$/i,'')||'index';
  const pageName=()=>canonicalPage(location.pathname);
  const month=()=>document.getElementById('month')?.value||new URLSearchParams(location.search).get('month')||'2026-10';
  const targetPage=i=>steps[i].page;

  function rectFor(target){
    const nodes=[...document.querySelectorAll(target)];
    if(!nodes.length)return document.querySelector('#stage')?.getBoundingClientRect();
    const rects=nodes.map(node=>node.getBoundingClientRect());
    return {left:Math.min(...rects.map(r=>r.left)),top:Math.min(...rects.map(r=>r.top)),right:Math.max(...rects.map(r=>r.right)),bottom:Math.max(...rects.map(r=>r.bottom))};
  }

  function locate(){
    if(!active||!layer)return;
    const rect=rectFor(steps[step].target);
    if(!rect)return;
    const w=innerWidth,h=innerHeight,pad=7;
    const mobile=layer.tagName==='DIALOG';
    const visibleBottom=mobile?Math.max(60,popover.getBoundingClientRect().top-10):h;
    const left=Math.max(0,Math.min(w,rect.left-pad));
    const top=Math.max(0,Math.min(h,rect.top-pad));
    const right=Math.max(left,Math.min(w,rect.right+pad));
    const bottom=Math.max(top,Math.min(visibleBottom,rect.bottom+pad));
    const sizes=[[0,0,w,top],[0,bottom,w,h-bottom],[0,top,left,bottom-top],[right,top,w-right,bottom-top]];
    shades.forEach((shade,i)=>{
      const [x,y,width,height]=sizes[i];
      Object.assign(shade.style,{left:x+'px',top:y+'px',width:Math.max(0,width)+'px',height:Math.max(0,height)+'px'});
    });
    Object.assign(outline.style,{left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px'});
    if(!mobile){
      const bubbleWidth=Math.min(340,w-24),bubbleHeight=popover.offsetHeight||220;
      const x=Math.min(w-bubbleWidth-12,Math.max(12,left));
      const y=bottom+bubbleHeight+12<=h?bottom+12:Math.max(12,top-bubbleHeight-12);
      Object.assign(popover.style,{left:x+'px',top:y+'px'});
    }
  }

  function close(markDone){
    active=false;revision++;
    if(markDone)write(sessionStorage,DONE,'1');
    remove(sessionStorage,ACTIVE);
    if(layer?.tagName==='DIALOG'&&layer.open)layer.close();
    layer?.remove();layer=null;popover=null;outline=null;shades=[];
    // Ao encerrar em uma página ampliada, focar um botão fixo poderia provocar
    // rolagem automática do documento em alguns navegadores.
    if(markDone&&pageName()!=='index'){
      const home=new URL('index.html',location.href);
      home.searchParams.set('month',month());
      location.assign(home.href);
    }else if(markDone){window.scrollTo({top:0,behavior:'instant'});}
  }

  function show(i){
    step=i;write(sessionStorage,ACTIVE,String(i));
    const wanted=targetPage(i);
    if(wanted&&pageName()!==canonicalPage(wanted)){
      const dest=new URL(wanted,location.href);
      dest.searchParams.set('month',month());
      location.assign(dest.href);
      return;
    }
    active=true;
    if(mobilePhone()){
      const target=document.querySelector(steps[i].target);
      if(target){
        const bounds=target.getBoundingClientRect();
        const offset=bounds.top+scrollY-(i===0?12:84);
        window.scrollTo({top:Math.max(0,offset),behavior:'instant'});
      }
    }
    if(!layer){
      const mobile=mobilePhone();
      layer=document.createElement(mobile?'dialog':'div');
      layer.className='tour-layer'+(mobile?' tour-mobile-dialog':'');
      for(let j=0;j<4;j++){const shade=document.createElement('div');shade.className='tour-shade';layer.append(shade);shades.push(shade);}
      outline=document.createElement('div');outline.className='tour-outline';layer.append(outline);
      popover=document.createElement('section');popover.className='tour-popover';popover.setAttribute('role',mobile?'document':'dialog');
      if(!mobile)popover.setAttribute('aria-modal','true');
      popover.setAttribute('aria-labelledby','tourTitle');layer.append(popover);
      if(mobile)layer.setAttribute('aria-labelledby','tourTitle');
      document.body.append(layer);
      if(mobile){
        layer.addEventListener('cancel',event=>{event.preventDefault();close(true);});
        layer.showModal();
      }
    }
    const item=steps[i];
    popover.innerHTML=`<div class="tour-progress"><span>Passo ${i+1} de ${steps.length}</span><div class="tour-dots">${steps.map((_,n)=>`<span class="${i===n?'active':''}"></span>`).join('')}</div></div><h2 id="tourTitle">${item.title}</h2><p>${item.body}</p><div class="tour-actions"><button class="tour-skip" type="button">Pular</button><button class="tour-back" type="button" ${i===0?'disabled':''}>Voltar</button><button class="tour-next" type="button">${i===steps.length-1?'Concluir':'Próximo →'}</button></div>`;
    popover.querySelector('.tour-skip').addEventListener('click',()=>close(true));
    popover.querySelector('.tour-back').addEventListener('click',()=>advance(-1));
    popover.querySelector('.tour-next').addEventListener('click',()=>advance(1));
    const current=++revision;
    requestAnimationFrame(()=>{
      if(!active||current!==revision)return;
      // Não forçar foco: alguns navegadores movem horizontalmente o documento
      // para revelar o elemento, sobretudo com o dashboard escalado.
      locate();
      if(layer?.tagName==='DIALOG')setTimeout(()=>{if(active&&current===revision)locate()},90);
    });
  }

  function advance(direction){
    const next=step+direction;
    if(next>=steps.length){close(true);return;}
    if(next<0)return;
    show(next);
  }

  function start(){
    if(active)return;
    show(0);
  }

  document.addEventListener('DOMContentLoaded',()=>{
    help=document.createElement('button');help.type='button';help.className='tour-help';help.textContent='?';help.setAttribute('aria-label','Como navegar: abrir tutorial');help.title='Como navegar';help.addEventListener('click',start);document.body.append(help);
    document.addEventListener('keydown',event=>{
      if(!active)return;
      if(event.key==='Escape'){event.preventDefault();close(true);}
      if(event.key==='ArrowRight'){event.preventDefault();advance(1);}
      if(event.key==='ArrowLeft'){event.preventDefault();advance(-1);}
      if(event.key==='Tab'&&popover){
        const buttons=[...popover.querySelectorAll('button:not(:disabled)')];
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&(document.activeElement===first||!popover.contains(document.activeElement))){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||!popover.contains(document.activeElement))){event.preventDefault();first.focus();}
      }
    });
    window.addEventListener('resize',locate);
    window.addEventListener('scroll',locate,{passive:true});
    const pending=read(sessionStorage,ACTIVE);
    if(pending!==null){const index=Number(pending);show(Number.isInteger(index)&&index>=0&&index<steps.length?index:0);}
    else if(read(sessionStorage,DONE)!=='1')start();
  });
})();
