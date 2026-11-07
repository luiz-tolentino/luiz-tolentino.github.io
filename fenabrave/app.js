/* Página Geral: prova de conceito. Dados locais extraídos do PBIX; sem backend. */
const MONTHS=['jan','fev','mar','abr','mai','jun','jul','ago','set','out'];
const fmt=n=>Math.round(n||0).toLocaleString('pt-BR');
const pct=n=>(100*n).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
const signed=n=>(n>=0?'+':'')+n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
let market=[],brands=[],models=[],electric=[];
let annualComparisonVolumes=new Map();
const $=id=>document.getElementById(id);
function scaled(){window.dashboardScale();}
window.addEventListener('resize',scaled);scaled();
function tooltipHandlers(){document.querySelectorAll('[data-tip]').forEach(e=>{
  e.addEventListener('mousemove',ev=>{const tip=$('tooltip');tip.textContent=e.dataset.tip;tip.style.display='block';tip.style.left=(ev.clientX+12)+'px';tip.style.top=(ev.clientY+12)+'px';});
  e.addEventListener('mouseleave',()=>{$('tooltip').style.display='none';});
 });}
let historyRendered=false;
function render(){
 const month=$('month').value, i=+month.slice(-2)-1, cur=market.find(r=>r.month===month);
 const previousYearMonth=`${Number(month.slice(0,4))-1}-${month.slice(5)}`;
 const previousYearVolume=annualComparisonVolumes.get(previousYearMonth);
 const prevMonth=market.find(r=>r.month===`2026-${String(i).padStart(2,'0')}`)||market.find(r=>r.month==='2025-12');
 const b=brands.filter(r=>r.month===month).sort((a,c)=>c.qty-a.qty), total=cur?.qty||1;
 const share=b.length?b[0].qty/total:0, s3=b.slice(0,3).reduce((s,r)=>s+r.qty,0)/total,s5=b.slice(0,5).reduce((s,r)=>s+r.qty,0)/total;
 const priorB=brands.filter(r=>r.month===`2026-${String(i).padStart(2,'0')}`).sort((a,c)=>c.qty-a.qty);
 const priorS3=prevMonth?priorB.slice(0,3).reduce((s,r)=>s+r.qty,0)/prevMonth.qty:0;
 const moM=prevMonth?(cur.qty/prevMonth.qty-1)*100:0;
 const yoy=previousYearVolume>0?(cur.qty/previousYearVolume-1)*100:null;
 $('kpiMonth').textContent=fmt(cur?.qty);$('kpiMoM').textContent=`${moM>=0?'▲':'▼'} ${signed(moM)}% vs. ${i===0?'dez/25':MONTHS[i-1]+'/26'}`;
 const top3DeltaPp=(s3-priorS3)*100;
 $('kpiTop3').textContent=pct(s3);$('kpiShareDelta').textContent=priorB.length?`${top3DeltaPp>0?'▲':top3DeltaPp<0?'▼':'—'} ${signed(top3DeltaPp)} p.p.`:' ';
 $('kpiYoY').textContent=yoy===null?'—':pct(yoy/100);$('kpiYoYDetail').textContent=`vs. ${MONTHS[i]}/25`;
 const electr=electric.filter(r=>r.month===month).reduce((s,r)=>s+r.qty,0);
 const electrShare=electr/total;
 $('kpiElectric').textContent=(electrShare*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
 const priorElectric=electric.filter(r=>r.month===prevMonth?.month).reduce((s,r)=>s+r.qty,0);
 const hasPriorElectric=electric.some(r=>r.month===prevMonth?.month);
 const electricDelta=hasPriorElectric&&prevMonth?.qty?(electrShare-priorElectric/prevMonth.qty)*100:null;
 const electricDeltaNode=$('kpiElectricDelta');
 electricDeltaNode.classList.toggle('good',electricDelta!==null&&electricDelta>0);
 electricDeltaNode.textContent=electricDelta===null?'':`${electricDelta>0?'▲':electricDelta<0?'▼':'—'} ${electricDelta>0?'+':electricDelta<0?'−':''}${Math.abs(electricDelta).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.`;
 if(!historyRendered){
  // Histórico de janeiro ao último mês importado; o filtro de competência não o altera.
  const years=MONTHS.map((m,j)=>market.find(r=>r.month===`2026-${String(j+1).padStart(2,'0')}`)?.qty||null);
  const last=MONTHS.map((m,j)=>market.find(r=>r.month===`2025-${String(j+1).padStart(2,'0')}`)?.qty||null);
  const moms=years.map((v,j)=>j===0?((v/(market.find(r=>r.month==='2025-12')?.qty||v)-1)*100):(v/years[j-1]-1)*100);
  const yoys=years.map((v,j)=>last[j]?(v/last[j]-1)*100:null);
  window.renderHistoryCharts({years,previousYear:last,mom:moms,yoy:yoys});
  historyRendered=true;
 }
 const m=models.filter(r=>r.month===month).reduce((acc,r)=>{const k=r.model;if(!acc[k])acc[k]={qty:0,brand:r.brand};acc[k].qty+=r.qty;return acc;},{});
 const ranked=Object.entries(m).sort((a,c)=>c[1].qty-a[1].qty).slice(0,5),maximum=ranked[0]?.[1].qty||1;
 const priorModelMonth=i===0?'2025-12':`2026-${String(i).padStart(2,'0')}`;
 const previousModelVolumes=models.filter(r=>r.month===priorModelMonth).reduce((acc,r)=>{acc.set(r.model,(acc.get(r.model)||0)+r.qty);return acc;},new Map());
 const previousModelRanks=new Map([...previousModelVolumes.entries()].sort((a,c)=>c[1]-a[1]).map(([name],j)=>[name,j+1]));
 $('modelTitle').textContent=`(${MONTHS[i].charAt(0).toUpperCase()+MONTHS[i].slice(1)}/26)`;
 $('models').innerHTML=ranked.map(([name,record],j)=>{const qty=record.qty;const logo=`assets/logos/${record.brand.replaceAll(/[^a-zA-Z0-9_-]/g,'_')}.png`;const previousRank=previousModelRanks.get(name);const delta=previousRank==null?null:previousRank-(j+1);const rankLabel=i===0?'':delta===null?'NOVO':delta>0?`▲ ${delta}`:delta<0?`▼ ${Math.abs(delta)}`:'—';const rankClass=i===0?'':delta===null?'new':delta>0?'up':delta<0?'down':'';return `<div class="modelrow" title="${name}: ${fmt(qty)}"><img class="brandlogo" src="${logo}" alt="${record.brand}" onerror="this.style.visibility='hidden'"><span class="name">${name}</span><span class="rank ${rankClass}">${rankLabel}</span><div class="bartrack"><div class="bar" style="width:${qty/maximum*100}%"></div></div><span class="qty">${(qty/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})} mil</span></div>`;}).join('');
 const hhi=month==='2026-05'?4695:Math.round(b.reduce((sum,r)=>sum+Math.pow(r.qty/total*100,2),0));
 $('hhiValue').textContent=fmt(hhi);$('gap').textContent=((b[0]?.qty||0)-(b[1]?.qty||0))/total*100>0?pct(((b[0]?.qty||0)-(b[1]?.qty||0))/total).replace('%',' p.p.'):'—';$('top5').textContent=pct(s5);
 const colors=['#bc0e1b','#dc5260','#f2adb6','#d5d6dd'],parts=[b[0]?.qty||0,b[1]?.qty||0,b[2]?.qty||0,total-b.slice(0,3).reduce((s,r)=>s+r.qty,0)];let accum=0;
 $('ring').style.background=`conic-gradient(${parts.map((v,j)=>{const s=accum/total*100;accum+=v;return `${colors[j]} ${s}% ${accum/total*100}%`;}).join(',')})`;
 $('leader').textContent=b[0]?.brand||'—';$('leaderShare').textContent=pct(share);
 const previousShares=new Map(priorB.map(r=>[r.brand,r.qty/(prevMonth?.qty||1)]));
 const featured=b.slice(0,3).map(r=>({name:r.brand,share:r.qty/total,delta:previousShares.has(r.brand)?(r.qty/total-previousShares.get(r.brand))*100:null}));
 const othersShare=parts[3]/total;
 const featuredPrevious=featured.reduce((sum,r)=>sum+(previousShares.get(r.name)||0),0);
 const othersDelta=priorB.length?(othersShare-(1-featuredPrevious))*100:null;
 const legendItems=[...featured,{name:'Outros',share:othersShare,delta:othersDelta}];
 const ppLabel=d=>d==null?'—':`${signed(d)} p.p.`;
 $('legend').innerHTML=`<div class="legend-head"><span></span><span>MARCA</span><span>SHARE</span><span>VAR. P.P.</span></div>`+legendItems.map((r,j)=>`<div class="row"><span style="color:${colors[j]}">●</span><span>${r.name}</span><b>${pct(r.share)}</b><b class="pp ${r.delta==null?'':r.delta>=0?'positive':'negative'}">${ppLabel(r.delta)}</b></div>`).join('');
 // Texto reconstruído a partir da medida DAX “Insight Executivo Mercado Geral HTML”.
 const priorMap=previousShares;
 const variations=b.map(r=>({brand:r.brand,delta:(r.qty/total-(priorMap.get(r.brand)||0))*100})).filter(r=>priorMap.has(r.brand)).sort((a,c)=>a.delta-c.delta);
 const loss=variations[0],gain=variations[variations.length-1];
 const cls=(hhi>=2500&&((b[0].qty-b[1].qty)/total*100)>=30)?'liderança elevada':'concentração moderada';
 const movement=(i===0||!gain||!loss)?'':`<br><br>No mês, <span class="up">${gain.brand}</span> apresentou o maior ganho de participação, <span class="up">▲ ${signed(gain.delta)} p.p.</span>, enquanto <span class="down">${loss.brand}</span> registrou a maior perda, <span class="down">▼ ${Math.abs(loss.delta).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})} p.p.</span>.`;
 $('insight').innerHTML=`Em <span class="period">${MONTHS[i][0].toUpperCase()+MONTHS[i].slice(1)}/26</span>, <b>${b[0]?.brand||'—'}</b> lidera o mercado com <span class="accent">${pct(share)}</span> de participação. O mercado apresenta HHI de <b>${fmt(hhi)}</b>, com gap de <span class="accent">${$('gap').textContent}</span> entre o 1º e o 2º colocado. As cinco maiores marcas concentram <span class="accent">${pct(s5)}</span> dos emplacamentos, caracterizando <b>${cls}</b>.${movement}`;
 tooltipHandlers();
}
async function init(){
 try{[market,brands,models,electric]=await Promise.all(['market','brands','models','electric'].map(n=>fetch(n+'.json').then(r=>{if(!r.ok)throw Error(n);return r.json();})));
  annualComparisonVolumes=new Map(market.filter(row=>row.month.startsWith('2025-')).map(row=>[row.month,row.qty]));
  const requested=new URLSearchParams(location.search).get('month');
  const available=[...new Set(market.filter(r=>r.month.startsWith('2026-')).map(r=>r.month))].sort();
  $('month').innerHTML=available.map(value=>`<option value="${value}">${MONTHS[Number(value.slice(-2))-1]}/26</option>`).join('');$('month').value=available.includes(requested)?requested:available.at(-1);$('month').addEventListener('change',render);render();
 }catch(e){console.error('Não foi possível carregar os dados locais',e);}
}
init();
