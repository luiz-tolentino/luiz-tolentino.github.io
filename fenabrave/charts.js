/* Séries históricas obtidas do PBIX atualizado (até o último mês importado).
   Os dois gráficos não recebem a seleção de Mês/Ano, como no relatório original. */
(function(){
  const allMonthNames=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  let labels=[],volume2026=[],volume2025=[],monthlyMoM=[],monthlyYoY=[];
  const colorRed='#b20e16',colorGray='#92969c';
  const volume=n=>Math.round(n).toLocaleString('pt-BR');
  const percent=n=>(n>=0?'+':'')+n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
  const axisFont={fontFamily:'Segoe UI, Arial, sans-serif',fontSize:11,color:'#505050'};
  const gridLines={lineStyle:{color:'#d8d9df',width:1,type:'solid'}};
  const instances=[];
  function common(){return{
    animation:false,
    textStyle:{fontFamily:'Segoe UI, Arial, sans-serif',color:'#333'},
    grid:{left:48,right:20,top:28,bottom:32,containLabel:false},
    legend:{top:0,right:10,itemGap:12,itemWidth:13,itemHeight:9,icon:'circle',textStyle:{fontSize:11,color:'#555'}},
    xAxis:{type:'category',data:labels,boundaryGap:true,axisLabel:{...axisFont,interval:0},axisTick:{show:false},axisLine:{show:false}},
    tooltip:{trigger:'axis',axisPointer:{type:'line',lineStyle:{color:'#a5a5a5',type:'dashed'}},backgroundColor:'#fff',borderColor:'#dbdbe0',borderWidth:1,textStyle:{fontSize:12,color:'#333'}},
  };}
  function get(id){const node=document.getElementById(id);const chart=echarts.getInstanceByDom(node)||echarts.init(node,null,{renderer:'canvas'});if(!instances.includes(chart))instances.push(chart);return chart;}
  window.renderHistoryCharts=function({years,previousYear,mom,yoy}){
    volume2026=years;
    volume2025=previousYear;
    monthlyMoM=mom;
    monthlyYoY=yoy;
    labels=years.map((_,i)=>`${allMonthNames[i]}/26`);
    const mobile=window.innerWidth<768||matchMedia('(pointer:coarse) and (orientation:landscape) and (max-height:600px) and (max-width:1024px)').matches;
    const month=get('monthly');
    month.setOption({
      ...common(),
      legend:{...common().legend,data:['2026','2025'],selectedMode:false,icon:'rect'},
      grid:{left:24,right:16,top:25,bottom:29},
      xAxis:{...common().xAxis,axisLabel:{...axisFont,interval:0,fontSize:mobile?10:11,formatter:value=>mobile?value.slice(0,3):value}},
      yAxis:{type:'value',min:0,max:250000,interval:50000,axisLabel:{show:false},axisTick:{show:false},axisLine:{show:false},splitLine:{show:false}},
      tooltip:{...common().tooltip,valueFormatter:v=>volume(v)+' emplacamentos'},
      series:[
        {name:'2026',type:'bar',data:volume2026,barWidth:mobile?22:29,itemStyle:{color:colorRed},label:{show:true,position:'top',color:'#232323',fontSize:mobile?9:10,formatter:p=>mobile?(p.dataIndex%2===0?Math.round(p.value/1000)+' mil':''):volume(p.value)},z:3},
        {name:'2025',type:'line',data:volume2025,symbol:'circle',symbolSize:6,lineStyle:{color:colorGray,width:2.4},itemStyle:{color:'#fff',borderColor:colorGray,borderWidth:2},connectNulls:false,z:5},
      ],
    },true);

    const growth=get('growth');
    growth.setOption({
      ...common(),
      legend:{...common().legend,data:['MoM','YoY'],selectedMode:false},
      grid:{left:47,right:16,top:29,bottom:31},
      yAxis:{type:'value',min:-10,max:35,interval:10,axisLabel:{...axisFont,formatter:value=>value<0?'':value+'%'},axisTick:{show:false},axisLine:{show:false},splitLine:gridLines},
      xAxis:{...common().xAxis,boundaryGap:false,axisLabel:{...axisFont,interval:0,formatter:value=>value.split('/')[0]}},
      tooltip:{...common().tooltip,valueFormatter:v=>percent(v)},
      series:[
        {name:'MoM',type:'line',data:monthlyMoM,symbol:'circle',symbolSize:6,lineStyle:{color:colorRed,width:2.3},itemStyle:{color:'#fff',borderColor:colorRed,borderWidth:2},areaStyle:{color:'rgba(178,14,22,.09)',origin:'auto'},z:4},
        {name:'YoY',type:'line',data:monthlyYoY,symbol:'circle',symbolSize:6,lineStyle:{color:'#858585',width:2.2},itemStyle:{color:'#fff',borderColor:'#858585',borderWidth:2},areaStyle:{color:'rgba(90,95,102,.10)',origin:'auto'},z:3},
      ],
    },true);
  };
  window.addEventListener('resize',()=>instances.forEach(c=>c.resize()));
})();
