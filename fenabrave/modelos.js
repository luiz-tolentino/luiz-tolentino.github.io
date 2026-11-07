import {calculateModelos} from './modelos-core.mjs';
const $=id=>document.getElementById(id),names=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const one=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const int=new Intl.NumberFormat('pt-BR');
const pct=v=>v==null?'—':one.format(v*100)+'%';
const pp=v=>v==null?'—':(v>0?'+':'')+one.format(v)+' p.p.';
const signed=v=>v==null?'—':(v>0?'+':'')+one.format(v*100)+'%';
const monthLabel=m=>`${names[Number(m.slice(-2))-1]}/${m.slice(2,4)}`;
const colorClass=v=>v<0?'negative':'';
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brandLogo=brand=>`assets/logos/${encodeURIComponent(({'H.DAVIDSON':'H_DAVIDSON','ROYAL ENFIELD':'ROYAL_ENFIELD'}[brand]||brand))}.png`;
const resize=()=>window.dashboardScale();
addEventListener('resize',resize);resize();
let rows=[],images={},evolution,movement,rankingMode='visual';

function paintCards(m){
 const values={leader:m.leader.model,leaderQty:int.format(m.leader.qty),leaderShare:pct(m.leader.share),growth:m.growth?.model??'—',decline:m.decline?.model??'—'};
 for(const [id,val] of Object.entries(values)){$(id).textContent=val;$(id).title=val;}
 const growthLabel=document.getElementById('growthLabel');
 growthLabel.textContent=m.growth?.mom<0?'Menor Queda MoM':'Maior Crescimento MoM';
 for(const [id,value] of Object.entries({leaderShareDelta:m.leaderShareDelta,growthDelta:m.growth?.mom,declineDelta:m.decline?.mom})){
  $(id).textContent=id==='leaderShareDelta'?pp(value):signed(value);$(id).className='delta '+colorClass(value);
 }
}
function paintInsight(m){
 const leader=safe(m.leader.model),date=monthLabel(m.month);
 $('insightText').innerHTML=m.month.endsWith('-01')
  ?`Em <span class="accent">${date}</span>, <b>${leader}</b> lidera o subsegmento com <span class="accent">${int.format(m.leader.qty)}</span> emplacamentos e <span class="accent">${pct(m.leader.share)}</span> de participação. A movimentação mensal de share passa a ser exibida a partir de fev/26.`
  :`Em <span class="accent">${date}</span>, <b>${leader}</b> lidera o subsegmento com <span class="accent">${int.format(m.leader.qty)}</span> emplacamentos e <span class="accent">${pct(m.leader.share)}</span> de participação. <b>${safe(m.gain?.model??'—')}</b> registrou o maior ganho de espaço competitivo, com <span class="up">${pp(m.gain?.deltaPp)}</span>, enquanto <b>${safe(m.loss?.model??'—')}</b> apresentou a maior retração, com <span class="down">${pp(m.loss?.deltaPp)}</span>.`;
}
function paintRanking(m){
 $('rankingPeriod').textContent=`(${monthLabel(m.month)})`;
 const max=m.list[0].qty;
 const body=m.list.map(r=>{
  const rank=r.rankChange==null?'<span class="muted">—</span>':r.rankChange>0?`<span class="rank-up">▲ ${r.rankChange}</span>`:r.rankChange<0?`<span class="rank-down">▼ ${Math.abs(r.rankChange)}</span>`:'<span class="muted">—</span>';
  const logo=brandLogo(r.brand);
  return `<tr class="${r.rank<=5?'top5':''}"><td>${r.rank}</td><td class="name"><img src="${logo}" alt="" onerror="this.style.visibility='hidden'">${safe(r.model)}</td><td>${safe(r.brand)}</td><td>${rank}</td><td><div class="track"><div class="fill" style="width:${Math.max(1,r.qty/max*100).toFixed(2)}%"></div></div></td><td class="qty">${int.format(r.qty)}</td><td>${pct(r.share)}</td><td class="${colorClass(r.mom)}">${signed(r.mom)}</td></tr>`;
 }).join('');
 $('ranking').innerHTML=`<table><colgroup><col style="width:5%"><col style="width:22%"><col style="width:14%"><col style="width:9%"><col style="width:18%"><col style="width:11%"><col style="width:10%"><col style="width:11%"></colgroup><thead><tr><th>Pos.</th><th>Modelo</th><th>Marca</th><th>Δ Rank</th><th>Emplacamentos</th><th>Volume</th><th>Share</th><th>MoM</th></tr></thead><tbody>${body}</tbody></table>`;
}
function paintVisualRanking(m){
 const cards=m.list.map((r,i)=>{
  const src=images[`${r.brand}|${r.model}`];
  const image=src?`<img class="model-photo" src="${src}" alt="Motocicleta ${safe(r.model)}">`:'<div class="model-placeholder">Imagem indisponível</div>';
  const logo=brandLogo(r.brand);
  const movement=r.mom==null?'—':`${r.mom>0?'▲':r.mom<0?'▼':'●'} ${signed(r.mom)}`;
  const previous=r.rankChange==null?null:r.rank+r.rankChange;
  const rankMovement=r.rankChange==null?'Sem comparação':r.rankChange>0?`▲ ${r.rankChange} posição(ões)`:r.rankChange<0?`▼ ${Math.abs(r.rankChange)} posição(ões)`:'• Estável';
  const line=(icon,label,value,cls='')=>`<div class="tip-row"><span>${icon} &nbsp; ${label}</span><strong class="${cls}">${value}</strong></div>`;
  const detail=`<div class="card-detail"><div class="tip-title"><img src="${logo}" alt=""><div><b>${safe(r.model)}</b><small>${safe(r.brand)}</small></div></div>`+
   line('★','Posição atual',`${r.rank}º`)+line('◷','Posição anterior',previous==null?'—':`${previous}º`)+
   line('⇅','Movimento',rankMovement,r.rankChange>0?'up':r.rankChange<0?'down':'')+
   '<div class="tip-sep"></div>'+line('▣','Volume',int.format(r.qty))+line('◔','Share',pct(r.share))+
   line('↗','MoM',signed(r.mom),r.mom>0?'up':r.mom<0?'down':'')+line('∑','Acumulado YTD',int.format(r.ytd??0))+'</div>';
  return `<article class="model-card ${i===0?'first':''}" tabindex="0" aria-label="${r.rank}º modelo ${safe(r.model)}; passe o cursor ou foque para ver detalhes"><span class="model-rank-badge">${r.rank}º</span>${image}<div class="model-info"><div class="model-name" title="${safe(r.model)}">${safe(r.model)}</div><div class="model-brand"><img src="${logo}" alt="" onerror="this.style.visibility='hidden'">${safe(r.brand)}</div><div class="model-stat"><span>▧ &nbsp; Volume</span><strong>${int.format(r.qty)}</strong></div><div class="model-stat"><span>◇ &nbsp; Share</span><strong>${pct(r.share)}</strong></div><div class="model-stat"><span>↗ &nbsp; MoM</span><strong class="${r.mom>0?'positive':colorClass(r.mom)}">${movement}</strong></div></div>${detail}</article>`;
 }).join('');
 $('rankingCards').innerHTML=`<div class="visual-cards">${cards}</div>`;
}
function setRankingMode(mode){
 rankingMode=mode;
 $('ranking').hidden=mode!=='table';$('rankingCards').hidden=mode!=='visual';
 $('modeTable').setAttribute('aria-pressed',String(mode==='table'));
 $('modeVisual').setAttribute('aria-pressed',String(mode==='visual'));
}
function paintCharts(m){
 const series=m.list.slice(0,5),colors=['#b20e16','#d65763','#ef98a0','#8c7382','#ca9ca5'];
 evolution.setOption({animation:false,color:colors,grid:{left:47,right:16,top:39,bottom:(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches)?38:30},legend:{top:0,textStyle:{fontSize:9},itemWidth:12,itemHeight:7,data:series.map(r=>r.model)},tooltip:{trigger:'axis',formatter:items=>items.map(x=>`${x.marker} ${safe(x.seriesName)}: ${x.value==null?'—':one.format(x.value)+'%'}`).join('<br>')},xAxis:{type:'category',data:m.history.map(x=>monthLabel(x.month)),axisLabel:{fontSize:10},axisTick:{show:false}},yAxis:{type:'value',axisLabel:{fontSize:10,hideOverlap:true,formatter:x=>x+'%'},splitLine:{lineStyle:{color:'#e7e7eb'}}},series:series.map(s=>({name:s.model,type:'line',symbol:'circle',symbolSize:5,data:m.history.map(x=>{const v=x.shares.find(r=>r.key===s.key)?.value;return v==null?null:v*100})}))},true);
 if(m.month.endsWith('-01')){movement.clear();movement.setOption({graphic:[{type:'text',left:'center',top:'43%',style:{text:'Comparação mensal indisponível\nJan/26 é o primeiro período disponível.\nVariações a partir de Fev/26.',fontSize:13,lineHeight:23,align:'center',fill:'#777'}}]});return;}
 const data=m.list.filter(x=>x.deltaPp!=null).sort((a,b)=>b.deltaPp-a.deltaPp).slice(0,10);
 movement.setOption({animation:false,grid:{left:109,right:58,top:5,bottom:(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches)?32:20},tooltip:{trigger:'axis',formatter:items=>`${safe(items[0].name)}: ${pp(items[0].value)}`},xAxis:{type:'value',axisLabel:{fontSize:9,hideOverlap:true,formatter:v=>one.format(v)},splitLine:{lineStyle:{color:'#e7e7eb'}}},yAxis:{type:'category',inverse:true,data:data.map(x=>x.model),axisLabel:{fontSize:9},axisLine:{show:false},axisTick:{show:false}},series:[{type:'bar',barWidth:10,data:data.map(x=>({value:x.deltaPp,itemStyle:{color:x.deltaPp>=0?'#168a4a':'#c62828'}})),label:{show:true,position:'right',fontSize:9,formatter:p=>pp(p.value)}}]},true);
}
function paint(){const m=calculateModelos(rows,$('month').value,$('segment').value);paintCards(m);paintInsight(m);paintRanking(m);paintVisualRanking(m);paintCharts(m);}
async function initialize(){
 [rows,images]=await Promise.all([fetch('model-details.json').then(r=>{if(!r.ok)throw Error('Dados indisponíveis');return r.json();}),fetch('model-images.json').then(r=>r.json())]);
 const months=[...new Set(rows.map(x=>x.month))].sort(),segments=[...new Set(rows.map(x=>x.segment))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 $('month').innerHTML=months.map(x=>`<option value="${x}">${monthLabel(x)}</option>`).join('');
 $('segment').innerHTML=segments.map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join('');
 const query=new URLSearchParams(location.search);$('month').value=months.includes(query.get('month'))?query.get('month'):months.at(-1);$('segment').value=segments.includes(query.get('segment'))?query.get('segment'):'City';
 evolution=echarts.init($('evolution'));movement=echarts.init($('movement'));
 $('month').addEventListener('change',paint);$('segment').addEventListener('change',paint);
 $('modeTable').addEventListener('click',()=>setRankingMode('table'));
 $('modeVisual').addEventListener('click',()=>setRankingMode('visual'));
 let wheelTarget=0,wheelFrame=null;
 const animateWheel=()=>{
  const container=$('rankingCards');
  const distance=wheelTarget-container.scrollLeft;
  if(Math.abs(distance)<0.5){container.scrollLeft=wheelTarget;wheelFrame=null;return;}
  container.scrollLeft+=distance*0.18;
  wheelFrame=requestAnimationFrame(animateWheel);
 };
 $('rankingCards').addEventListener('wheel',event=>{
  const container=event.currentTarget;
  if(container.hidden||container.scrollWidth<=container.clientWidth)return;
  const movement=event.deltaY!==0?event.deltaY:event.deltaX;
  const pixels=movement*(event.deltaMode===1?16:event.deltaMode===2?container.clientWidth:1)*0.4;
  const limit=container.scrollWidth-container.clientWidth;
  if(wheelFrame===null)wheelTarget=container.scrollLeft;
  const next=Math.max(0,Math.min(limit,wheelTarget+pixels));
  if(next!==wheelTarget){event.preventDefault();wheelTarget=next;if(wheelFrame===null)wheelFrame=requestAnimationFrame(animateWheel);}
 },{passive:false});
 setRankingMode('visual');paint();
}
initialize().catch(e=>{console.error(e);$('insightText').textContent='Não foi possível carregar a página de modelos.';});
