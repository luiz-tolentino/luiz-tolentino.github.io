import {calculateSegmentos} from './segmentos-core.mjs';

const $=id=>document.getElementById(id);
const names=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const one=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const two=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=v=>v==null?'—':one.format(v*100)+'%';
const pp=v=>v==null?'—':(v>0?'+':'')+one.format(v)+' p.p.';
const monthLabel=m=>`${names[Number(m.slice(-2))-1]}/${m.slice(2,4)}`;
const deltaClass=v=>v<0?'negative':v>0?'':'';
let subs=[],regions=[],svgTemplate='',composition,movement,trend;

function scaled(){window.dashboardScale();}
window.addEventListener('resize',scaled);scaled();

function paintCards(m){
 $('segmentLeader').textContent=m.leader.name;
 $('segmentShare').textContent=pct(m.leader.share);
 $('shareDelta').textContent=pp(m.leader.deltaPp);$('shareDelta').className='delta '+deltaClass(m.leader.deltaPp);
 $('top3Share').textContent=pct(m.top3Concentration);
 $('regionLeader').textContent=m.regionLeader.name;
 $('regionLeaderShare').textContent=pct(m.regionLeader.share)+' de share';
 $('regionGain').textContent=m.regionGain?.name??'—';
 $('regionGainDelta').textContent=m.regionGain?`▲ ${pp(m.regionGain.deltaPp)}`:'';
}

function paintInsight(m){
 if(m.month.endsWith('-01')){
  $('insightText').innerHTML=`<span class="accent">${m.leader.name}</span> inicia o ano como principal subsegmento do mercado, concentrando <span class="accent">${pct(m.leader.share)}</span> dos emplacamentos. <span style="color:#777">Jan/26 é o primeiro período disponível; as comparações mensais passam a ser exibidas a partir de Fev/26.</span>`;
 }else{
  $('insightText').innerHTML=`<span class="accent">${m.leader.name}</span> mantém a liderança com <span class="accent">${pct(m.leader.share)}</span> do mercado. <span class="up">${m.gain.name}</span> apresentou o maior avanço de participação (<span class="up">${pp(m.gain.deltaPp)}</span>), enquanto <span class="down">${m.loss.name}</span> registrou a maior retração (<span class="down">${pp(m.loss.deltaPp)}</span>). Regionalmente, <span class="up">${m.regionGain.name}</span> foi o principal destaque, avançando <span class="up">${pp(m.regionGain.deltaPp)}</span>.`;
 }
}

function paintComposition(m){
 const data=m.ranked;
 composition.setOption({animation:false,grid:{left:112,right:56,top:6,bottom:(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches)?30:12},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:items=>`${items[0].name}: ${pct(items[0].value/100)}`},xAxis:{type:'value',axisLabel:{fontSize:9,hideOverlap:true,formatter:v=>`${v}%`},splitLine:{lineStyle:{color:'#e6e6e9'}}},yAxis:{type:'category',inverse:true,data:data.map(x=>x.name),axisLabel:{fontSize:10,fontWeight:'bold',color:'#444'},axisLine:{show:false},axisTick:{show:false}},series:[{type:'bar',barWidth:11,data:data.map(r=>({value:r.share*100,itemStyle:{color:'#c41322',borderRadius:2}})),label:{show:true,position:'right',formatter:params=>pct(params.value/100),fontSize:10,color:'#333'}}]});
}

function paintMovement(m){
 const data=m.ranked;
 movement.setOption({animation:false,grid:{left:112,right:58,top:8,bottom:(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches)?30:15},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:items=>items[0]?.value==null?'':`${items[0].name}: ${pp(items[0].value)}`},xAxis:{type:'value',axisLabel:{fontSize:9,hideOverlap:true,formatter:v=>one.format(v)},splitLine:{lineStyle:{color:'#e6e6e9'}}},yAxis:{type:'category',inverse:true,data:data.map(x=>x.name),axisLabel:{fontSize:10,fontWeight:'bold',color:'#444'},axisTick:{show:false},axisLine:{show:false}},series:[{type:'bar',barWidth:10,data:data.map(r=>({value:r.deltaPp,itemStyle:{color:r.deltaPp<0?'#c62828':'#168a4a',borderRadius:2}})),label:{show:true,position:'right',formatter:p=>p.value==null?'':pp(p.value),fontSize:9,color:'#444'}}]});
}

function paintTrend(m){
 const majors=m.ranked.filter(r=>r.rank<5).map(r=>r.name),palette=['#b20e16','#d65763','#ef98a0','#8c7382','#ca9ca5'];
 trend.setOption({animation:false,color:palette,grid:{left:56,right:26,top:27,bottom:(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches)?36:26},legend:{data:majors,top:0,textStyle:{fontSize:10},itemWidth:16,itemHeight:7},tooltip:{trigger:'axis',formatter:items=>items.map(p=>`${p.marker} ${p.seriesName}: ${one.format(p.value)}%`).join('<br>')},xAxis:{type:'category',boundaryGap:false,data:m.trend.map(r=>monthLabel(r.month)),axisTick:{show:false},axisLabel:{fontSize:11},axisLine:{lineStyle:{color:'#aaa'}}},yAxis:{type:'value',min:0,max:50,interval:10,axisLabel:{fontSize:10,hideOverlap:true,formatter:v=>v+'%'},splitLine:{lineStyle:{color:'#e5e5e8'}}},series:majors.map(name=>({name,type:'line',smooth:false,symbol:'circle',symbolSize:6,lineStyle:{width:2},data:m.trend.map(row=>row.shares.find(s=>s.name===name)?.share*100??null)}))});
}

function paintMap(m){
 const ranks=['#b20e16','#c7444a','#d97176','#e99fa3','#f2cbce'];
 const mapColors=new Map(m.regional.map(r=>[r.name,ranks[Math.min(r.rank-1,4)]]));
 const keyNames={'Norte':'Norte','Nordeste':'Nordeste','Centro-Oeste':'CentroOeste','Sudeste':'Sudeste','Sul':'Sul'};
 let svg=svgTemplate.replace(/<title>[^<]*<\/title>/g,'');
 for(const row of m.regional){
  const key=keyNames[row.name];
  svg=svg.replace(`<g fill='__COLOR_${key}__'>`,`<g data-region='${row.name}' fill='__COLOR_${key}__'>`);
  svg=svg.replaceAll(`__COLOR_${key}__`,mapColors.get(row.name)).replaceAll(`__SHARE_${key}__`,pct(row.share));
 }
 const regionalOrder=['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'];
 const parts=regionalOrder.map((name,index)=>{
  const row=m.regional.find(r=>r.name===name),shade=mapColors.get(name);
  const arrow=row.deltaPp>0?'▲':row.deltaPp<0?'▼':'●';
  const delta=row.deltaPp==null?'Sem base anterior':`${arrow} ${pp(row.deltaPp)}`;
  return `<div class="map-row"><span class="map-dot" style="background:${shade}"></span><div><div class="map-label">${name}</div><div class="map-delta ${deltaClass(row.deltaPp)}">${delta}</div></div><strong class="map-share">${pct(row.share)}</strong></div>${index<4?'<div class="map-divider"></div>':''}`;
 }).join('');
 $('regionalMap').innerHTML=`<div class="map-art">${svg}</div><div class="map-side"><div class="map-side-title">Share e variação mensal</div>${parts}<div class="map-legend">Menor participação<div class="map-gradient">${[...ranks].reverse().map(color=>`<span style="background:${color}"></span>`).join('')}</div><div class="map-range"><span>Menor</span><span>Maior participação</span></div></div></div><div id="regionalTooltip" class="regional-tooltip" role="tooltip" hidden></div>`;
 const art=$('regionalMap').querySelector('.map-art'),tooltip=$('regionalTooltip');
 const priorMonth=`2026-${String(Number(m.month.slice(-2))-1).padStart(2,'0')}`;
 const earlier=regions.filter(r=>r.month===priorMonth).sort((a,b)=>b.share-a.share||a.region.localeCompare(b.region,'pt-BR'));
 const priorRank=new Map();let rank=0,lastShare=null;
 earlier.forEach(row=>{if(row.share!==lastShare){rank++;lastShare=row.share;}priorRank.set(row.region,rank);});
 const byName=new Map(m.regional.map(row=>[row.name,row]));
 let active=null;
 const populateRegionTooltip=name=>{
  const row=byName.get(name);if(!row)return false;
  if(active!==name){
   const previousShare=row.deltaPp==null?null:row.share-row.deltaPp/100;
   const oldRank=priorRank.get(name),movement=oldRank==null?null:oldRank-row.rank;
   const rankLabel=movement==null?'—':movement>0?`▲ ${movement} ${movement===1?'posição':'posições'}`:movement<0?`▼ ${Math.abs(movement)} ${Math.abs(movement)===1?'posição':'posições'}`:'● Estável';
   const moveColor=movement>0?'up':movement<0?'down':'';
   const deltaColor=row.deltaPp>0?'up':row.deltaPp<0?'down':'';
   tooltip.innerHTML=`<div class="regional-tip-head"><strong>${name}</strong><small>${monthLabel(m.month)}</small></div><div class="regional-tip-row"><span>Participação nacional</span><strong>${pct(row.share)}</strong></div><div class="regional-tip-row"><span>Ranking regional</span><strong>${row.rank}º de 5</strong></div><div class="regional-tip-sep"></div><div class="regional-tip-row"><span>Share mês anterior</span><strong>${pct(previousShare)}</strong></div><div class="regional-tip-row"><span>Variação mensal</span><strong class="${deltaColor}">${pp(row.deltaPp)}</strong></div><div class="regional-tip-row"><span>Mudança no ranking</span><strong class="${moveColor}">${rankLabel}</strong></div>`;
   tooltip.hidden=false;active=name;
  }
  return true;
 };
 art.addEventListener('pointermove',event=>{
  const group=event.target.closest?.('[data-region]'),name=group?.getAttribute('data-region');
  if(!populateRegionTooltip(name)){tooltip.hidden=true;active=null;return;}
  const container=$('regionalMap'),bounds=container.getBoundingClientRect(),scale=bounds.width/container.offsetWidth;
  const x=(event.clientX-bounds.left)/scale,y=(event.clientY-bounds.top)/scale;
  tooltip.style.left=`${Math.max(4,Math.min(container.clientWidth-tooltip.offsetWidth-4,x+15))}px`;
  tooltip.style.top=`${Math.max(4,Math.min(container.clientHeight-tooltip.offsetHeight-4,y+12))}px`;
 });
 art.addEventListener('pointerleave',()=>{tooltip.hidden=true;active=null;});
 if((innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches)){
  let dialog=document.querySelector('dialog.mobile-region-dialog');
  if(!dialog){
   dialog=document.createElement('dialog');dialog.className='mobile-region-dialog';dialog.setAttribute('aria-label','Indicadores da região');
   dialog.innerHTML='<button class="mobile-competitive-close" type="button" aria-label="Fechar detalhes">×</button><div class="mobile-region-content"></div>';
   document.body.append(dialog);
   dialog.querySelector('.mobile-competitive-close').addEventListener('click',()=>dialog.close());
   dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  }
  art.addEventListener('click',event=>{
   const name=event.target.closest?.('[data-region]')?.getAttribute('data-region');
   if(!populateRegionTooltip(name))return;
   const copy=tooltip.cloneNode(true);copy.hidden=false;copy.removeAttribute('id');
   dialog.querySelector('.mobile-region-content').replaceChildren(copy);
   dialog.showModal();
  });
 }
}

function paint(){
 const state=calculateSegmentos(subs,regions,$('month').value);
 paintCards(state);paintInsight(state);paintComposition(state);paintMovement(state);paintTrend(state);paintMap(state);
}

async function initialize(){
 const [a,b,svg]=await Promise.all([fetch('subsegments.json').then(r=>r.json()),fetch('regions.json').then(r=>r.json()),fetch('assets/mapa-regional-original.svg').then(r=>r.text())]);
 subs=a;regions=b;svgTemplate=svg;
 const months=[...new Set(subs.map(r=>r.month))].sort();
 $('month').innerHTML=months.map(key=>`<option value="${key}">${monthLabel(key)}</option>`).join('');
 const requested=new URLSearchParams(location.search).get('month');
 $('month').value=months.includes(requested)?requested:months.at(-1);
 composition=echarts.init($('composition'));movement=echarts.init($('movement'));trend=echarts.init($('trend'));
 $('month').addEventListener('change',paint);paint();
}
initialize().catch(err=>{console.error(err);$('insightText').textContent='Não foi possível carregar a página de segmentos.';});
