/* Organiza os elementos existentes sem duplicar KPIs nem cálculos. */
(function(){
  const order=[
    ['#monthControl',1],
    ['#monthly',9],['#models',12],['#hhi',14],['#structure',16],
    ['#growth',18],['#donut',20],['#insight',22],['#foot',23]
  ];
  document.addEventListener('DOMContentLoaded',()=>{
    const stage=document.getElementById('stage');
    const filterButton=document.createElement('button');
    filterButton.type='button';filterButton.className='mobile-filter-trigger';
    filterButton.setAttribute('aria-label','Abrir filtros da página');
    filterButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M9 19h6"/><circle cx="8" cy="5" r="2" fill="#fff"/><circle cx="16" cy="12" r="2" fill="#fff"/></svg><span>Filtros</span>';
    stage?.append(filterButton);

    const filterDialog=document.createElement('dialog');
    filterDialog.className='mobile-filter-dialog';
    filterDialog.setAttribute('aria-label','Filtros disponíveis nesta página');
    filterDialog.innerHTML='<div class="mobile-filter-header"><strong>Filtros da página</strong><button type="button" class="mobile-filter-close" aria-label="Fechar filtros">×</button></div><div class="mobile-filter-fields"></div><button type="button" class="mobile-filter-done">Aplicar e fechar</button>';
    document.body.append(filterDialog);
    filterDialog.querySelector('.mobile-filter-close').addEventListener('click',()=>filterDialog.close());
    filterDialog.querySelector('.mobile-filter-done').addEventListener('click',()=>filterDialog.close());
    filterDialog.addEventListener('click',event=>{if(event.target===filterDialog)filterDialog.close()});
    filterButton.addEventListener('click',()=>{
      const fields=filterDialog.querySelector('.mobile-filter-fields');
      fields.replaceChildren();
      document.querySelectorAll('#stage select').forEach(original=>{
        const container=document.createElement('div');container.className='mobile-filter-field';
        const label=document.createElement('label');label.textContent=original.closest('#monthControl,#segmentControl')?.querySelector('label')?.textContent?.trim()||original.getAttribute('aria-label')||'Filtro';
        const mirror=original.cloneNode(true);mirror.removeAttribute('id');
        mirror.value=original.value;
        mirror.addEventListener('change',()=>{
          original.value=mirror.value;
          original.dispatchEvent(new Event('change',{bubbles:true}));
        });
        container.append(label,mirror);fields.append(container);
      });
      filterDialog.showModal();
    });
    const updatePinnedNavigation=()=>{
      stage?.classList.toggle('mobile-nav-pinned',matchMedia('(max-width:767px), (pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)').matches&&window.scrollY>=74);
    };
    window.addEventListener('scroll',updatePinnedNavigation,{passive:true});
    window.addEventListener('resize',updatePinnedNavigation);
    updatePinnedNavigation();
    document.querySelectorAll('#stage > .kpi').forEach((element,index)=>{element.style.order=String(index+2)});
    document.querySelectorAll('#stage > .heading').forEach((element,index)=>{
      element.style.order=String([7,10,13,15,17,19,21][index]);
    });
    document.querySelectorAll('#stage > .subheading').forEach(element=>{element.style.order='8'});
    document.querySelectorAll('#stage > .tiny.abs').forEach(element=>{element.style.order='11'});
    order.forEach(([selector,index])=>{
      const element=document.querySelector('#stage > '+selector);
      if(element)element.style.order=String(index);
    });
  });
  window.addEventListener('load',()=>{
    if(matchMedia('(max-width:767px), (pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)').matches){
      requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
    }
  });
})();
