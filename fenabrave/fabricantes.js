import {calculateFabricantes,brandModelLeaders} from './fabricantes-core.mjs';

const $=id=>document.getElementById(id);
const names=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const integer=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
const one=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
const two=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=value=>value==null?'—':`${one.format(value*100)}%`;
const pp=value=>value==null?'—':`${value>0?'+':''}${two.format(value)} p.p.`;
const signed=value=>value==null?'—':`${value>0?'+':''}${one.format(value)}%`;
const rankText=value=>value==null||value===0?'—':`${value>0?'▲':'▼'} ${Math.abs(value)}`;
const color=value=>value>0?'positive':value<0?'negative':'';
const monthLabel=value=>`${names[Number(value.slice(-2))-1]}/${value.slice(2,4)}`;
const logo=brand=>`assets/logos/${({'ROYAL ENFIELD':'ROYAL_ENFIELD','HARLEY-DAVIDSON':'H_DAVIDSON','HARLEY DAVIDSON':'H_DAVIDSON','H.DAVIDSON':'H_DAVIDSON'}[brand]||brand.replaceAll(' ','_'))}.png`;
let market=[],brands=[],models=[],movementChart,trendChart;

function scaled(){window.dashboardScale();}
window.addEventListener('resize',scaled);scaled();

function paintCards(model){
 const {leader,greatestGain:gain,greatestLoss:loss,largestRankMove:move}=model;
 $('leader').textContent=leader?.brand||'—';
 $('leaderShare').textContent=pct(leader?.share);
 $('leaderDelta').textContent=pp(leader?.deltaSharePp);
 $('leaderDelta').className=`delta ${leader?.deltaSharePp<0?'negative':''}`;
 $('gainBrand').textContent=gain?.brand||'—';$('gainValue').textContent=pp(gain?.deltaSharePp);
 $('lossBrand').textContent=loss?.brand||'—';$('lossValue').textContent=pp(loss?.deltaSharePp);$('lossValue').className='delta negative';
 $('rankBrand').textContent=move?.brand||'—';$('rankValue').textContent=move?.rankChange==null?'—':`${move.rankChange>0?'▲':'▼'} ${Math.abs(move.rankChange)} posições`;
 $('rankValue').className=`delta ${move?.rankChange<0?'negative':''}`;
}

function paintInsight(model){
 const {leader,greatestGain:gain,greatestLoss:loss,largestRankMove:move}=model;
 const period=monthLabel(model.month);
 if(!gain||!loss){const second=model.top5[1];$('insightText').innerHTML=`Em <b>${period}</b>, a <span class="accent">${leader.brand}</span> liderou o mercado com <span class="accent">${pct(leader.share)}</span> de participação. A <b>${second.brand}</b> ocupou a segunda posição, com <b>${pct(second.share)}</b>. Como este é o primeiro período disponível, as comparações mensais de share e ranking passam a ser exibidas a partir de <span class="accent">Fev/26</span>.`;return;}
 const rankSummary=move?`No ranking, <span class="up">${move.brand}</span> foi o principal destaque, ${move.rankChange>0?'subindo':'recuando'} <span class="${color(move.rankChange)}">${Math.abs(move.rankChange)} posições</span>.`:'';
 $('insightText').innerHTML=`Em <b>${period}</b>, a <span class="accent">${leader.brand}</span> liderou o mercado com <span class="accent">${pct(leader.share)}</span> de participação. <span class="up">${gain.brand}</span> apresentou o maior ganho de share, avançando <span class="up">${pp(gain.deltaSharePp)}</span>. Já <span class="down">${loss.brand}</span> registrou a maior perda, com <span class="down">${pp(loss.deltaSharePp)}</span>. ${rankSummary}`;
}

function paintRank(model){
 const header='<div class="row head"><span>#</span><span>FABRICANTE</span><span>SHARE</span><span>Δ P.P.</span><span>Δ R.</span></div>';
 $('ranking').innerHTML=header+model.top5.map(row=>`<div class="row"><span>${row.rank}</span><span class="brand">${row.brand}</span><span>${pct(row.share)}</span><span class="${color(row.deltaSharePp)}">${pp(row.deltaSharePp).replace(' p.p.','')}</span><span class="rankdelta ${color(row.rankChange)}">${rankText(row.rankChange)}</span></div>`).join('');
}

function paintMovement(model){
 const data=model.top5;
 const mobile=(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches);
 movementChart.setOption({animation:false,grid:{left:mobile?69:95,right:mobile?24:38,top:5,bottom:mobile?32:18},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},formatter:items=>items[0]?.value==null?'':`${items[0].name}: ${pp(items[0].value)}`},xAxis:{type:'value',axisLabel:{fontSize:9,hideOverlap:true,formatter:v=>`${one.format(v)}`},splitLine:{lineStyle:{color:'#e6e6e9'}}},yAxis:{type:'category',inverse:true,data:data.map(r=>r.brand),axisLabel:{fontSize:mobile?9:11,fontWeight:'bold',color:'#444'},axisTick:{show:false},axisLine:{show:false}},series:[{type:'bar',barWidth:12,data:data.map(r=>({value:r.deltaSharePp,itemStyle:{color:r.deltaSharePp<0?'#d85b65':'#168a4a',borderRadius:2}})),label:{show:true,position:'right',formatter:p=>p.value==null?'':two.format(p.value),fontSize:9,color:'#444'}}]});
}

function paintTrend(model){
 const rows=model.shareTrend,brands=model.top5.map(r=>r.brand);
 const palette=['#b70e1c','#d65c63','#f39ba3','#777d89','#9f5868'];
 const mobile=(innerWidth<768||matchMedia("(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)").matches);
 trendChart.setOption({animation:false,color:palette,grid:{left:mobile?35:50,right:mobile?4:12,top:mobile?32:25,bottom:mobile?36:20},legend:{data:brands,top:0,type:mobile?'scroll':'plain',left:mobile?0:'center',right:mobile?0:undefined,itemGap:mobile?5:10,textStyle:{fontSize:mobile?8:10,color:'#555'},itemWidth:mobile?8:13,itemHeight:mobile?6:7},tooltip:{trigger:'axis',formatter:items=>items.map(a=>`${a.marker}${a.seriesName}: ${one.format(a.value)}%`).join('<br>')},xAxis:{type:'category',boundaryGap:false,data:rows.map(r=>monthLabel(r.month)),axisLine:{lineStyle:{color:'#aaa'}},axisLabel:{fontSize:mobile?8:10,hideOverlap:true,color:'#555'},axisTick:{show:false}},yAxis:{type:'value',min:0,max:80,interval:20,axisLabel:{fontSize:mobile?9:10,formatter:v=>`${integer.format(v)}%`},splitLine:{lineStyle:{color:'#e5e5e8'}}},series:brands.map((brand,i)=>({name:brand,type:'line',symbol:'circle',symbolSize:5,smooth:false,lineStyle:{width:2},data:rows.map(r=>r.series.find(s=>s.brand===brand)?.share==null?null:r.series.find(s=>s.brand===brand).share*100)}))});
}

function paintDetail(model){
 const leaders=brandModelLeaders(models,model.month);
 $('detailTable').querySelector('tbody').innerHTML=model.ranked.map(row=>{
  const above=model.ranked.find(other=>other.rank===row.rank-1);
  const gap=above?100*(above.share-row.share):null;
  const leadingModel=leaders.get(row.brand.trim().toUpperCase())||'—';
  return `<tr><td>${row.rank}</td><td>${row.brand}</td><td>${integer.format(row.qty)}</td><td>${pct(row.share)}</td><td>${row.priorRank??'—'}</td><td class="${color(row.rankChange)}">${rankText(row.rankChange)}</td><td class="${color(row.momPct)}">${signed(row.momPct)}</td><td class="${color(row.deltaSharePp)}">${pp(row.deltaSharePp)}</td><td>${gap==null?'—':two.format(gap)}</td><td>${leadingModel}</td></tr>`;
 }).join('');
}

function paintCompetitive(model){
 const {points,axisX,axisY}=model.scatter;
 if(!points.length){$('competitive').innerHTML='<div class="pc-empty">Comparação mensal indisponível para janeiro.</div>';return;}
 const palette={'EXPANSÃO':'#168a4a','RECUPERAÇÃO':'#6f9b79','PRESSÃO':'#c62828','CRESCIMENTO SEM SHARE':'#d97a22'};
 const descriptions={'EXPANSÃO':'Volume ↑ | Share ↑','RECUPERAÇÃO':'Volume ↓ | Share ↑','PRESSÃO':'Volume ↓ | Share ↓','CRESCIMENTO SEM SHARE':'Volume ↑ | Share ↓'};
 const logoTransforms={'EXPANSÃO':'translate(12px,-30px)','RECUPERAÇÃO':'translate(calc(-100% - 12px),-30px)','PRESSÃO':'translate(calc(-100% - 12px),10px)','CRESCIMENTO SEM SHARE':'translate(12px,10px)'};
 const pointHtml=points.map(row=>{
  const top=row.showLogo,quadrant=row.quadrant,shade=palette[quadrant];
  const vertical=row.deltaSharePp>=0?'top:18px;':'top:50%;transform:translateY(-50%);';
  const horizontal=row.xPct>=50?'right:18px;':'left:18px;';
  const brandLogo=`<img src="${logo(row.brand)}" alt="" onerror="this.style.display='none'">`;
  const tooltip=`<div class="pc-tooltip" style="${horizontal}${vertical}"><div class="pc-tiphead"><div><small>FABRICANTE</small><strong>${row.brand}</strong></div>${brandLogo}</div><div class="pc-tiprank"><span>POSIÇÃO NO RANKING</span><strong>#${row.rank}</strong></div><div class="pc-tipgrid"><div class="pc-tipmetric"><small>MARKET SHARE</small><strong>${pct(row.share)}</strong></div><div class="pc-tipmetric"><small>VARIAÇÃO MENSAL</small><strong style="color:${row.momPct>=0?'#168a4a':'#c62828'}">${signed(row.momPct)}</strong></div></div><div class="pc-tipshare"><span>VARIAÇÃO DE SHARE</span><strong style="color:${row.deltaSharePp>=0?'#168a4a':'#c62828'}">${pp(row.deltaSharePp)}</strong></div><div class="pc-tipstatus" style="border-left:3px solid ${shade}"><strong style="color:${shade}">${quadrant}</strong><small>${descriptions[quadrant]}</small></div></div>`;
  const badge=top?`<div class="pc-logo" style="left:50%;top:50%;transform:${logoTransforms[quadrant]}">${brandLogo}</div>`:'';
  return `<div class="pc-point ${top?'':'others'}" tabindex="0" role="img" aria-label="${row.brand}: variação mensal ${signed(row.momPct)}, variação de share ${pp(row.deltaSharePp)}" style="left:${row.xPct}%;top:${row.yPct}%;width:${top?12:9}px;height:${top?12:9}px;background:${top?shade:'#a7abb0'}">${badge}${tooltip}</div>`;
 }).join('');
 $('competitive').innerHTML=`<div class="pc-plot">
  <div class="pc-quadrant recovery"></div><div class="pc-quadrant expansion"></div><div class="pc-quadrant pressure"></div><div class="pc-quadrant growth"></div>
  <div class="pc-axis-v"></div><div class="pc-axis-h"></div>
  <div class="pc-title recovery">RECUPERAÇÃO<small>↓ Volume · ↑ Share</small></div>
  <div class="pc-title expansion">EXPANSÃO<small>↑ Volume · ↑ Share</small></div>
  <div class="pc-title pressure">PRESSÃO<small>↓ Volume · ↓ Share</small></div>
  <div class="pc-title growth">CRESCIMENTO SEM SHARE<small>↑ Volume · ↓ Share</small></div>
  ${pointHtml}
  <span class="pc-axis-label x-min">−${integer.format(axisX*100)}%</span><span class="pc-axis-label x-max">${integer.format(axisX*100)}%</span><span class="pc-axis-label x-zero">0%</span>
  <span class="pc-axis-label y-max">+${one.format(axisY)} p.p.</span><span class="pc-axis-label y-min">−${one.format(axisY)} p.p.</span>
  </div><div class="pc-footer"><div class="pc-legend"><span><i style="color:#168a4a">●</i> Expansão</span><span><i style="color:#6f9b79">●</i> Recuperação</span><span><i style="color:#c62828">●</i> Pressão</span><span><i style="color:#d97a22">●</i> Cresc. sem ganho de share</span></div><div class="pc-note">Logos = Top 5 em market share · Pontos cinza = demais marcas do Top 10<br>Passe o cursor para ver os detalhes</div></div>`;
}

function paint(){
 const model=calculateFabricantes(market,brands,$('month').value);
 paintCards(model);paintInsight(model);paintRank(model);paintMovement(model);paintTrend(model);paintDetail(model);paintCompetitive(model);
}

async function initialize(){
 const response=await Promise.all(['market.json','brands.json','models.json'].map(path=>fetch(path).then(r=>{if(!r.ok)throw new Error(`Falha ao obter ${path}`);return r.json();})));
 [market,brands,models]=response;
 const options=[...new Set(market.filter(x=>x.month.startsWith('2026-')).map(x=>x.month))].sort();
 $('month').innerHTML=options.map(value=>`<option value="${value}">${monthLabel(value)}</option>`).join('');
 const requested=new URLSearchParams(location.search).get('month');
 $('month').value=options.includes(requested)?requested:options.at(-1);
 movementChart=echarts.init($('movement'));trendChart=echarts.init($('shareTrend'));
 $('month').addEventListener('change',paint);paint();
}
initialize().catch(error=>{console.error(error);$('insightText').textContent='Não foi possível carregar os dados do painel.';});
