/* Segmentos & Regiões — regras transcritas das medidas DAX do PBIX original. */
const rankBy=(a,b,key)=>b[key]-a[key]||a.name.localeCompare(b.name,'pt-BR');
const keyOf=(month)=>/^2026-(0[1-9]|1[0-2])$/.test(month)?month:null;

export function calculateSegmentos(subsegments,regions,month){
  if(!keyOf(month))throw new Error('Competência inválida');
  const previous=`2026-${String(Number(month.slice(-2))-1).padStart(2,'0')}`;
  const segmentRows=subsegments.filter(x=>x.month===month&&x.qty>0);
  const priorSegments=new Map(subsegments.filter(x=>x.month===previous).map(x=>[x.segment,x]));
  const total=segmentRows.reduce((sum,x)=>sum+x.qty,0);
  if(!total)throw new Error('Sem volume de subsegmentos');
  const priorTotal=subsegments.filter(x=>x.month===previous).reduce((sum,x)=>sum+x.qty,0);
  const ranked=segmentRows.map(x=>{
    const previousQty=priorSegments.get(x.segment)?.qty;
    const share=x.qty/total;
    const previousShare=previousQty!=null&&priorTotal>0?previousQty/priorTotal:null;
    return {name:x.segment,qty:x.qty,share,previousShare,
      deltaPp:month.endsWith('-01')||previousShare===null?null:(share-previousShare)*100};
  }).sort((a,b)=>rankBy(a,b,'qty'));
  let rank=0,lastQty;
  ranked.forEach(row=>{if(row.qty!==lastQty){rank++;lastQty=row.qty;}row.rank=rank;});
  const leader=ranked[0],top3=ranked.slice(0,3);
  const gain=[...ranked].filter(r=>r.deltaPp!=null).sort((a,b)=>b.deltaPp-a.deltaPp||a.name.localeCompare(b.name,'pt-BR'))[0]??null;
  const loss=[...ranked].filter(r=>r.deltaPp!=null).sort((a,b)=>a.deltaPp-b.deltaPp||a.name.localeCompare(b.name,'pt-BR'))[0]??null;

  const previousRegions=new Map(regions.filter(r=>r.month===previous).map(r=>[r.region,r.share]));
  const regional=regions.filter(r=>r.month===month).map(x=>({name:x.region,share:x.share,
    deltaPp:month.endsWith('-01')||!previousRegions.has(x.region)?null:(x.share-previousRegions.get(x.region))*100}));
  regional.sort((a,b)=>rankBy(a,b,'share'));
  let regionalRank=0,lastShare;
  regional.forEach(r=>{if(r.share!==lastShare){regionalRank++;lastShare=r.share;}r.rank=regionalRank;});
  const regionLeader=regional[0];
  const regionGain=[...regional].filter(x=>x.deltaPp!==null).sort((a,b)=>b.deltaPp-a.deltaPp||a.name.localeCompare(b.name,'pt-BR'))[0]??null;
  const periodMonths=[...new Set(subsegments.map(x=>x.month))].filter(x=>x.startsWith('2026-')).sort();
  const trend=periodMonths.map(key=>{
    const rows=subsegments.filter(x=>x.month===key),sum=rows.reduce((a,b)=>a+b.qty,0);
    // O filtro PBIR do visual histórico é Ranking Subsegmento < 5 (Top 4).
    return {month:key,shares:ranked.filter(row=>row.rank<5).map(row=>({name:row.name,share:sum>0?(rows.find(x=>x.segment===row.name)?.qty??0)/sum:null}))};
  });
  return {month,total,ranked,leader,top3Concentration:top3.reduce((sum,r)=>sum+r.qty,0)/total,
    gain,loss,regional,regionLeader,regionGain,trend};
}
