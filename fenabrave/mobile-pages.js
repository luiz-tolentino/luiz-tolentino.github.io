/* Reutiliza os indicadores do desktop em um fluxo mobile vertical. */
(function(){
  const mobilePhone=()=>matchMedia('(max-width:767px), (pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)').matches;
  const page=location.pathname.split('/').pop().replace(/\.html$/,'')||'index';
  const layouts={
    fabricantes:['#monthControl','.kpi','.insight','.heading:0','#ranking','.heading:1','#movement','.heading:2','.chart-note','#competitive','.heading:3','#shareTrend','.heading:4','.detail-scroll','.source'],
    segmentos:['#monthControl','.kpi','.insight','.heading:0','#composition','.heading:1','#movement','.heading:2','#regionalMap','.heading:3','#trend','.source'],
    modelos:['#monthControl','#segmentControl','.kpi','.insight','.heading:0','.rank-switch','#ranking','#rankingCards','.heading:1','#evolution','.heading:2','#movement','.source']
  };
  const titles={fabricantes:['Fabricantes','Liderança e disputa de mercado'],segmentos:['Segmentos & Regiões','Composição e distribuição regional'],modelos:['Modelos & Ranking','Desempenho dos principais modelos']};
  function init(){
    if(!layouts[page])return;
    document.body.classList.add('page-'+page);
    const stage=document.getElementById('stage');if(!stage)return;
    stage.dataset.mobileTitle=titles[page][0];stage.dataset.mobileSubtitle=titles[page][1];
    const art=document.createElement('div');art.className='mobile-hero-art';art.setAttribute('aria-hidden','true');stage.prepend(art);
    const navKeys=['geral','fabricantes','segmentos','modelos'];
    stage.querySelectorAll(':scope > .nav').forEach((node,index)=>node.dataset.mobileNav=navKeys[index]);
    const ordered=[];const seen=new Set();
    for(const token of layouts[page]){
      const headingMatch=token.match(/^(\.heading):(\d+)$/);
      const nodes=headingMatch?[stage.querySelectorAll(':scope > .heading')[Number(headingMatch[2])]].filter(Boolean):stage.querySelectorAll(':scope > '+token);
      for(const node of nodes){
        if(seen.has(node))continue;
        seen.add(node);node.style.order=String(ordered.length+1);ordered.push(node);
        if(node.matches('#ranking,#rankingCards,#movement,#shareTrend,#competitive,#composition,#trend,#regionalMap,#evolution,.ranktable,.detail-scroll'))node.classList.add('mobile-chart');
      }
    }
    const filterButton=document.createElement('button');filterButton.type='button';filterButton.className='mobile-filter-trigger';filterButton.setAttribute('aria-label','Abrir filtros da página');
    filterButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M9 19h6"/><circle cx="8" cy="5" r="2" fill="#fff"/><circle cx="16" cy="12" r="2" fill="#fff"/></svg><span>Filtros</span>';
    stage.append(filterButton);
    const dialog=document.createElement('dialog');dialog.className='mobile-filter-dialog';dialog.setAttribute('aria-label','Filtros disponíveis nesta página');
    dialog.innerHTML='<div class="mobile-filter-header"><strong>Filtros da página</strong><button type="button" class="mobile-filter-close" aria-label="Fechar filtros">×</button></div><div class="mobile-filter-fields"></div><button type="button" class="mobile-filter-done">Aplicar e fechar</button>';
    document.body.append(dialog);
    dialog.querySelector('.mobile-filter-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('.mobile-filter-done').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    filterButton.addEventListener('click',()=>{
      const fields=dialog.querySelector('.mobile-filter-fields');fields.replaceChildren();
      stage.querySelectorAll('select').forEach(original=>{
        const field=document.createElement('div');field.className='mobile-filter-field';
        const label=document.createElement('label');label.textContent=original.closest('#monthControl,#segmentControl')?.querySelector('label')?.textContent?.trim()||original.getAttribute('aria-label')||'Filtro';
        const mirror=original.cloneNode(true);mirror.removeAttribute('id');mirror.value=original.value;
        mirror.addEventListener('change',()=>{original.value=mirror.value;original.dispatchEvent(new Event('change',{bubbles:true}))});
        field.append(label,mirror);fields.append(field);
      });
      dialog.showModal();
    });
    if(page==='fabricantes'){
      const tipDialog=document.createElement('dialog');tipDialog.className='mobile-competitive-dialog';tipDialog.setAttribute('aria-label','Detalhes do fabricante');
      tipDialog.innerHTML='<button class="mobile-competitive-close" type="button" aria-label="Fechar detalhes">×</button><div class="mobile-competitive-content"></div>';
      document.body.append(tipDialog);
      tipDialog.querySelector('.mobile-competitive-close').addEventListener('click',()=>tipDialog.close());
      tipDialog.addEventListener('click',event=>{if(event.target===tipDialog)tipDialog.close()});
      stage.querySelector('#competitive')?.addEventListener('click',event=>{
        if(!mobilePhone())return;
        const point=event.target.closest('.pc-point');if(!point)return;
        const details=point.querySelector('.pc-tooltip');if(!details)return;
        const copy=details.cloneNode(true);copy.removeAttribute('style');copy.classList.add('mobile-tooltip-copy');
        tipDialog.querySelector('.mobile-competitive-content').replaceChildren(copy);
        tipDialog.showModal();
      });
    }
    const pin=()=>stage.classList.toggle('mobile-nav-pinned',mobilePhone()&&scrollY>=74);
    addEventListener('scroll',pin,{passive:true});addEventListener('resize',pin);pin();
    let chartResizeTimer;
    const resizeMobileCharts=()=>{
      if(!mobilePhone())return;
      clearTimeout(chartResizeTimer);
      const resize=()=>document.querySelectorAll('#stage .mobile-chart').forEach(node=>{
        const chart=window.echarts?.getInstanceByDom(node);
        // Sem dimensões explícitas: o ECharts mede a área interna, descontando
        // padding e borda do cartão. clientHeight incluía o padding e fazia
        // os rótulos dos eixos ultrapassarem a borda inferior em alguns aparelhos.
        if(chart)chart.resize();
      });
      requestAnimationFrame(()=>requestAnimationFrame(resize));
      chartResizeTimer=setTimeout(resize,280);
    };
    addEventListener('resize',resizeMobileCharts,{passive:true});
    addEventListener('orientationchange',resizeMobileCharts,{passive:true});
    addEventListener('load',resizeMobileCharts);
    if('ResizeObserver' in window){
      const observer=new ResizeObserver(()=>resizeMobileCharts());
      document.querySelectorAll('#stage .mobile-chart').forEach(node=>observer.observe(node));
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
