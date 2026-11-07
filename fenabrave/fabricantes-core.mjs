/* Cálculos da página Fabricantes. Fonte: f_MarcaMensal e f_MercadoMensal
   extraídas do PBIX original. Não altera a página Geral. */

const monthKey=(year,month)=>`${year}-${String(month).padStart(2,'0')}`;
const sorted=(a,b)=>b.qty-a.qty||a.brand.localeCompare(b.brand,'pt-BR');
const ascending=(a,b)=>a.brand.localeCompare(b.brand,'pt-BR');
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function denseRanks(rows){
  const rankByBrand=new Map();
  let rank=0,lastQty;
  for(const row of [...rows].sort(sorted)){
    if(row.qty!==lastQty){rank++;lastQty=row.qty;}
    rankByBrand.set(row.brand,rank);
  }
  return rankByBrand;
}

function quadrant(mom,deltaShare){
  if(mom>=0&&deltaShare>=0)return 'EXPANSÃO';
  if(mom<0&&deltaShare>=0)return 'RECUPERAÇÃO';
  if(mom<0&&deltaShare<0)return 'PRESSÃO';
  return 'CRESCIMENTO SEM SHARE';
}

/** Equivalente à medida Modelo Líder Fabricante (TOPN por volume e nome). */
export function brandModelLeaders(modelRows,month){
  const byBrand=new Map();
  for(const row of modelRows){
    if(row.month!==month||!(row.qty>0)||!row.model?.trim())continue;
    const brand=row.brand.trim().toUpperCase(),model=row.model.trim();
    if(!byBrand.has(brand))byBrand.set(brand,new Map());
    const volumes=byBrand.get(brand);
    volumes.set(model,(volumes.get(model)||0)+row.qty);
  }
  return new Map([...byBrand].map(([brand,volumes])=>[
    brand,[...volumes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'))[0][0],
  ]));
}

/**
 * Retorna as medidas necessárias para os cartões, gráficos, ranking e scatter.
 * Ratios são frações; `deltaSharePp` é em pontos percentuais; `momPct` em %.
 * Falta de dado anterior permanece `null`, equivalente a BLANK() no DAX.
 */
export function calculateFabricantes(marketRows,brandRows,month){
  const match=/^(\d{4})-(\d{2})$/.exec(month);
  if(!match)throw new Error(`Competência inválida: ${month}`);
  const year=Number(match[1]),number=Number(match[2]);
  if(number<1||number>12)throw new Error(`Mês inválido: ${month}`);
  const previousMonth=number===1?monthKey(year-1,12):monthKey(year,number-1);
  const market=new Map(marketRows.map(row=>[row.month,row.qty]));
  const total=market.get(month);
  if(!(total>0))throw new Error(`Volume de mercado ausente em ${month}`);
  const previousTotal=market.get(previousMonth);

  const current=brandRows.filter(row=>row.month===month&&row.qty>0).map(row=>({...row}));
  const previous=brandRows.filter(row=>row.month===previousMonth&&row.qty>0);
  const previousMap=new Map(previous.map(row=>[row.brand,row]));
  const rankCurrent=denseRanks(current),rankPrevious=denseRanks(previous);
  const ranked=current.map(row=>{
    const previousQty=previousMap.get(row.brand)?.qty;
    const share=row.qty/total;
    const previousShare=previousQty!=null&&previousTotal>0?previousQty/previousTotal:null;
    const rank=rankCurrent.get(row.brand),priorRank=rankPrevious.get(row.brand)??null;
    return {
      brand:row.brand,qty:row.qty,share,rank,priorRank,
      previousQty:previousQty??null,
      priorShare:previousShare,
      momPct:previousQty>0?100*(row.qty/previousQty-1):null,
      deltaSharePp:previousShare===null?null:100*(share-previousShare),
      rankChange:priorRank===null?null:priorRank-rank,
    };
  }).sort((a,b)=>sorted(a,b));

  const top5=ranked.slice(0,5),leader=ranked[0]??null;
  const validDeltas=ranked.filter(row=>row.deltaSharePp!==null);
  const greatestGain=[...validDeltas].filter(row=>row.deltaSharePp>0)
    .sort((a,b)=>b.deltaSharePp-a.deltaSharePp||ascending(a,b))[0]??null;
  const greatestLoss=[...validDeltas]
    .sort((a,b)=>a.deltaSharePp-b.deltaSharePp||ascending(a,b))[0]??null;
  const largestRankMove=ranked.filter(row=>row.rankChange!==null)
    .sort((a,b)=>Math.abs(b.rankChange)-Math.abs(a.rankChange)||ascending(a,b))[0]??null;

  // Os visuais de variação (Ranking Marca <= 5) não inventam valores em janeiro.
  const movementTop5=top5.filter(row=>row.deltaSharePp!==null);

  // O filtro TopN do visual de evolução é baseado no share do mês de referência.
  const trendMonths=[...market.keys()].filter(key=>key.startsWith(`${year}-`)&&key<=monthKey(year,12)).sort();
  const shareTrend=trendMonths.map(key=>({
    month:key,
    series:top5.map(row=>{
      const monthly=brandRows.find(value=>value.month===key&&value.brand===row.brand);
      const denominator=market.get(key);
      return {brand:row.brand,share:monthly&&denominator>0?monthly.qty/denominator:null};
    }),
  }));

  // Transcrição das medidas @MoM, @DeltaShare, Top10, LimiteX/Y, PosX/Y
  // e dos quadrantes da medida "Performance Competitiva HTML".
  const scatterBase=ranked.filter(row=>row.momPct!==null&&row.deltaSharePp!==null)
    .slice(0,10);
  const limitX=Math.max(...scatterBase.map(row=>Math.abs(row.momPct/100)),0)*1.2;
  const limitY=Math.max(...scatterBase.map(row=>Math.abs(row.deltaSharePp)),0)*1.25;
  const axisX=Math.max(limitX,0.10),axisY=Math.max(limitY,0.10);
  const scatter=scatterBase.map(row=>({
    ...row,
    xPct:clamp(50+(row.momPct/100)/axisX*43,6,94),
    yPct:clamp(50-row.deltaSharePp/axisY*44,6,94),
    quadrant:quadrant(row.momPct,row.deltaSharePp),
    showLogo:row.rank<=5,
  }));

  return {
    month,previousMonth,total,previousTotal:previousTotal??null,
    ranked,top5,leader,shareLeader:leader?.share??null,
    greatestGain: number===1?null:greatestGain,
    greatestLoss: number===1?null:greatestLoss,
    largestRankMove:number===1?null:largestRankMove,
    movementTop5,shareTrend,
    scatter:{points:scatter,axisX,axisY},
  };
}
