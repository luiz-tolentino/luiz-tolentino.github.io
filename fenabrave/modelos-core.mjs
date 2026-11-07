/* Medidas da página Modelos & Ranking, agregadas no mesmo contexto do PBIX. */
const alpha=(a,b)=>a.localeCompare(b,'pt-BR');
export function calculateModelos(rows,month,segment){
 const current=rows.filter(x=>x.month===month&&x.segment===segment&&x.qty>0);
 if(!current.length)throw new Error('Nenhum modelo disponível neste período');
 const previous=`2026-${String(Number(month.slice(-2))-1).padStart(2,'0')}`;
 const older=rows.filter(x=>x.month===previous&&x.segment===segment&&x.qty>0);
 const last=new Map(older.map(r=>[r.key,r]));
 const total=current.reduce((v,r)=>v+r.qty,0),priorTotal=older.reduce((v,r)=>v+r.qty,0);
 const sort=(a,b)=>b.qty-a.qty||alpha(a.model,b.model);
 const ordered=[...current].sort(sort),priorOrdered=[...older].sort(sort);
 function withRank(list){let rank=0,lastQty=null;return list.map(x=>{if(x.qty!==lastQty){rank++;lastQty=x.qty;}return {...x,rank};});}
 const ranked=withRank(ordered),priorRanks=new Map(withRank(priorOrdered).map(r=>[r.key,r.rank]));
 const list=ranked.map(r=>{
  const prior=last.get(r.key),prev=prior?.qty??null;
  const share=r.qty/total,previousShare=prev!=null&&priorTotal?prev/priorTotal:null;
  return {...r,share,previousQty:prev,mom:prev>0?(r.qty-prev)/prev:null,
   deltaPp:month.endsWith('-01')||previousShare==null?null:(share-previousShare)*100,
   rankChange:month.endsWith('-01')||!priorRanks.has(r.key)?null:priorRanks.get(r.key)-r.rank};
 });
 const leader=list[0],gain=[...list].filter(x=>x.deltaPp!=null).sort((a,b)=>b.deltaPp-a.deltaPp||b.qty-a.qty||alpha(a.model,b.model))[0]??null;
 const leaderShareDelta=month.endsWith('-01')||!priorOrdered.length?null:(leader.share-priorOrdered[0].qty/priorTotal)*100;
 const loss=[...list].filter(x=>x.deltaPp!=null).sort((a,b)=>a.deltaPp-b.deltaPp||b.qty-a.qty||alpha(a.model,b.model))[0]??null;
 const growth=[...list].filter(x=>x.mom!=null).sort((a,b)=>b.mom-a.mom||alpha(a.model,b.model))[0]??null;
 const decline=[...list].filter(x=>x.mom!=null).sort((a,b)=>a.mom-b.mom||alpha(a.model,b.model))[0]??null;
 const months=[...new Set(rows.map(x=>x.month))].sort();
 const history=months.map(m=>{
  const all=rows.filter(x=>x.month===m&&x.segment===segment),sum=all.reduce((v,r)=>v+r.qty,0);
  return {month:m,shares:list.slice(0,5).map(x=>({key:x.key,model:x.model,value:all.find(y=>y.key===x.key)?.qty/sum??null}))};
 });
 return {month,segment,total,list,leader,leaderShareDelta,gain,loss,growth,decline,history};
}
