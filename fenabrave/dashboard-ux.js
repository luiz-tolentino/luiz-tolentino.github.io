/* Navegação entre páginas e modo de leitura em telas pequenas.
   O canvas desktop e suas coordenadas permanecem inalterados. */
(function(){
  const DESIGN_WIDTH=1450,DESIGN_HEIGHT=1086;
  let mobileMode='detail';
  let mobileButton;

  function preserveMonth(){
    const month=document.getElementById('month')?.value;
    if(!/^2026-(0[1-9]|1[0-2])$/.test(month||''))return;
    document.querySelectorAll('a.nav[href]').forEach(link=>{
      const target=new URL(link.getAttribute('href'),location.href);
      target.searchParams.set('month',month);
      link.setAttribute('href',target.pathname.split('/').pop()+target.search);
    });
  }

  window.dashboardScale=function(){
    const stage=document.getElementById('stage');
    if(!stage)return;
    const mobile=innerWidth<768;
    const fit=Math.min(innerWidth/DESIGN_WIDTH,innerHeight/DESIGN_HEIGHT);
    const scale=mobile&&mobileMode==='detail'?Math.max(fit,0.90):fit;
    stage.style.transform=`scale(${scale})`;
    stage.style.left=mobile?'0px':Math.max(0,(innerWidth-DESIGN_WIDTH*scale)/2)+'px';
    document.body.style.minHeight=DESIGN_HEIGHT*scale+'px';
    document.body.style.width=mobile&&mobileMode==='detail'?DESIGN_WIDTH*scale+'px':'';
    if(mobileButton){
      mobileButton.hidden=!mobile;
      mobileButton.textContent=mobileMode==='detail'?'Ver painel inteiro':'Ampliar para leitura';
      mobileButton.setAttribute('aria-pressed',String(mobileMode==='detail'));
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    document.addEventListener('change',event=>{if(event.target.id==='month')preserveMonth();});
    document.querySelectorAll('a.nav[href]').forEach(link=>{
      link.addEventListener('click',preserveMonth,{capture:true});
      link.addEventListener('keydown',event=>{if(event.key==='Enter')preserveMonth();});
    });
    mobileButton=document.createElement('button');
    mobileButton.type='button';
    mobileButton.className='mobile-view-toggle';
    mobileButton.setAttribute('aria-label','Alternar visualização no celular');
    mobileButton.addEventListener('click',()=>{
      mobileMode=mobileMode==='detail'?'fit':'detail';
      window.dashboardScale();
      window.scrollTo({left:0,top:0,behavior:'auto'});
    });
    document.body.append(mobileButton);
    window.dashboardScale();
  });
})();
