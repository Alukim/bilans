/* Pure calculation engine. PLN; annual economic comparison, not a payment calendar. */
(function (root) {
'use strict';
const round = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
const positive = v => Math.max(0, v);
const sum = (rows, key) => round(rows.reduce((a, r) => a + (r[key] || 0), 0));
const base = { threshold:120000, threshold2:120000, rate1:12, rate2:32, rate3:32, free:30000, minimum:4806, socialBase:5652, pensionCap:282600, copyrightCap:120000, kup:250, kupAway:300, healthScale:9, healthLinear:4.9, healthEmployee:9, healthMinimum:432.54, lumpHealth1:498.35, lumpHealth2:830.58, lumpHealth3:1495.04, lumpThreshold1:60000, lumpThreshold2:300000, linearRate:19, linearHealthCap:14100, ikzeEmployee:11304, ikzeBusiness:16956, vatLimit:240000, pensionEmployee:9.76, pensionEmployer:9.76, disabilityEmployee:1.5, disabilityEmployer:6.5, sickness:2.45, accident:1.67, fund:2.45, fgsp:.1, solidarityThreshold:1000000, solidarityRate:4, childFirst:92.67, childThird:166.67, childFourth:225, childCoupleLimit:112000, childSingleLimit:56000 };
const presets = {2026:{...base},2027:{...base,minimum:4950,socialBase:6019.8,pensionCap:300990,healthMinimum:445.5,ikzeEmployee:12039.6,ikzeBusiness:18059.4}};
const defaults = {contractEnabled:false,contractGross:9000,contractEmployer:'other',contractSickness:false,year:2026,gross:20000,revenue:24000,cost:1500,vat:23,costVat:23,vatDeduction:100,vatActive:true,copyright:80,kupAway:false,pit2:true,social:'full',sickness:true,customBase:3000,startMonths:6,spouseGross:6000,spouseCopyright:0,married:true,jointEligible:true,jointPayroll:false,jointPayrollFrom:1,childrenCount:0,childPeriods:Array.from({length:10},()=>({from:1,to:12})),childrenEligible:false,childDisability:false,childFullYearMarriage:true,childSingleParent:false,childShare:100,childOtherIncome:0,childSpouseOtherIncome:0,allocation:'saving',savingShare:50,ikze:0,spouseIkze:0,ppkEmployee:0,ppkEmployer:0,monthly:false,months:Array.from({length:12},()=>({gross:20000,revenue:24000,cost:1500}))};
function rawScale(income,p) { const x=positive(income); return Math.min(x,p.threshold)*p.rate1/100 + Math.min(positive(x-p.threshold),positive(p.threshold2-p.threshold))*p.rate2/100 + positive(x-Math.max(p.threshold,p.threshold2))*p.rate3/100; }
function scale(income,p) {return Math.round(positive(rawScale(Math.round(positive(income)),p)-p.free*p.rate1/100));}
function payroll(amounts,share,s,p,withContract=false) {
 let pensionUsed=0,authorUsed=0,incomeUsed=0;
 const contractRows=[];
 const rows=amounts.map((gross,i)=>{
  const zg=withContract&&s.contractEnabled?s.contractGross:0;
  const same=s.contractEmployer==='same',insured=zg>0&&(same||gross<p.minimum);
  const insuredGross=gross+(insured?zg:0),remaining=positive(p.pensionCap-pensionUsed);
  // In the cap month allocate the common remaining base proportionally.
  const totalCapped=Math.min(insuredGross,remaining);
  const capped=insuredGross?round(totalCapped*gross/insuredGross):0;
  const zcapped=round(totalCapped-capped);pensionUsed+=insuredGross;
  const pension=round(capped*p.pensionEmployee/100),disability=round(capped*p.disabilityEmployee/100),sickness=round(gross*p.sickness/100),social=round(pension+disability+sickness);
  const health=round((gross-social)*p.healthEmployee/100);
  const author=round(Math.min(positive(p.copyrightCap-authorUsed),(gross-social)*share/100*.5)); authorUsed+=author;
  const ordinary=share<100?Math.min((s.kupAway?p.kupAway:p.kup),positive((gross-social)*(1-share/100))):0;
  const ppk=round(gross*s.ppkEmployee/100),employerPpk=round(gross*s.ppkEmployer/100);
  const income=positive(round(gross+employerPpk-social-author-ordinary));
  const incremental=rawScale(incomeUsed+Math.round(income),p)-rawScale(incomeUsed,p);
  const pit=Math.round(positive(incremental-(s.pit2?p.free*p.rate1/100/12:0))); incomeUsed+=Math.round(income);
  const employerPension=round(capped*p.pensionEmployer/100),employerDisability=round(capped*p.disabilityEmployer/100),accident=round(gross*p.accident/100),fund= gross+(same?zg:0)>=p.minimum?round(gross*p.fund/100):0,fgsp=round(gross*p.fgsp/100);
  const employerSocial=round(employerPension+employerDisability+accident+fund+fgsp);
  const zpension=round(zcapped*p.pensionEmployee/100),zdisability=round(zcapped*p.disabilityEmployee/100);
  const zsickness=insured&&(same||s.contractSickness)?round((same?zg:Math.min(zg,p.pensionCap/12))*p.sickness/100):0;
  const zsocial=round(zpension+zdisability+zsickness),zhealth=round((zg-zsocial)*p.healthEmployee/100);
  const zppk=same?round(zg*s.ppkEmployee/100):0,zEmployerPpk=same?round(zg*s.ppkEmployer/100):0;
  const zkup=round((zg+zEmployerPpk-zsocial)*.2),zincome=round(zg+zEmployerPpk-zsocial-zkup);
  // Article 41: separate first-rate advance; PIT-2 stays on the employment contract.
  const zpit=Math.round(Math.round(zincome)*p.rate1/100);
  const zePension=round(zcapped*p.pensionEmployer/100),zeDisability=round(zcapped*p.disabilityEmployer/100);
  const zaccident=insured?round(zg*p.accident/100):0,zfund=insured&&gross+zg>=p.minimum?round(zg*p.fund/100):0,zfgsp=insured?round(zg*p.fgsp/100):0;
  const zeSocial=round(zePension+zeDisability+zaccident+zfund+zfgsp);
  contractRows.push({month:i,gross:zg,revenue:zg,cost:0,pension:zpension,disability:zdisability,sickness:zsickness,social:zsocial,fund:0,health:zhealth,pit:zpit,author:0,kup:zkup,income:zincome,ppk:zppk,employerPpk:zEmployerPpk,employerPension:zePension,employerDisability:zeDisability,accident:zaccident,employerFund:zfund,fgsp:zfgsp,employerSocial:zeSocial,employerCost:round(zg+zeSocial+zEmployerPpk),net:round(zg-zsocial-zhealth-zpit-zppk),vatOut:0,vatIn:0,vat:0,invoice:zg});
  return {month:i,gross,revenue:gross,cost:0,pension,disability,sickness,social,fund:0,health,pit,author,kup:round(author+ordinary),income,ppk,employerPpk,employerPension,employerDisability,accident,employerFund:fund,fgsp,employerSocial,employerCost:round(gross+employerSocial+employerPpk),net:round(gross-social-health-pit-ppk),vatOut:0,vatIn:0,vat:0,invoice:gross};
 });
 return {rows,contractRows,base:round(sum(rows,'income')+sum(contractRows,'income'))};
}
function business(type,s,p) {
 let cumIncome=0,cumTax=0,cumHealth=0,pensionUsed=0;
 const rows=Array.from({length:12},(_,i)=>{
  const m=s.monthly?s.months[i]:s, revenue=m.revenue,costNet=m.cost;
  const sb=s.social==='start'&&i<s.startMonths?0:s.social==='preferential'||s.social==='start'?p.minimum*.3:s.social==='custom'?s.customBase:p.socialBase;
  const capped=Math.min(sb,positive(p.pensionCap-pensionUsed)); pensionUsed+=sb;
  const pension=round(capped*(p.pensionEmployee+p.pensionEmployer)/100),disability=round(capped*(p.disabilityEmployee+p.disabilityEmployer)/100),sickness=s.sickness?round(Math.min(sb,p.pensionCap/12)*p.sickness/100):0,accident=round(sb*p.accident/100);
  const social=round(pension+disability+sickness+accident),fund=sb>=p.minimum?round(sb*p.fund/100):0;
  const vatOut=s.vatActive?round(revenue*s.vat/100):0,vatPurchase=round(costNet*s.costVat/100),vatIn=s.vatActive?round(vatPurchase*s.vatDeduction/100):0;
  const cost=round(costNet+vatPurchase-vatIn),income=round(revenue-cost-social-fund);
  return {month:i,revenue,gross:0,cost,pension,disability,sickness,accident,social,fund,income,vatOut,vatIn,vat:round(vatOut-vatIn),invoice:round(revenue+vatOut),kup:type==='lump'?0:round(cost+fund),author:0,ppk:0,employerPpk:0,employerSocial:0,employerCost:revenue};
 });
 const annualIncome=positive(sum(rows,'income')),lumpRevenue=positive(sum(rows,'revenue')-sum(rows,'social'));
 const lumpHealth=lumpRevenue<=p.lumpThreshold1?p.lumpHealth1:lumpRevenue<=p.lumpThreshold2?p.lumpHealth2:p.lumpHealth3;
 // Allocate final annual health cost evenly for lump tax, and by income for other methods.
 const annualHealth=type==='lump'?round(lumpHealth*12):Math.max(round(annualIncome*(type==='linear'?p.healthLinear:p.healthScale)/100),round(p.healthMinimum*12));
 let allocated=0;
 rows.forEach((r,i)=>{
  r.health=i===11?round(annualHealth-allocated):round(annualHealth/12); allocated+=r.health;
  const healthDeduction=type==='linear'?Math.min(r.health,positive(p.linearHealthCap-cumHealth)):type==='lump'?r.health*.5:0;
  cumHealth+=r.health;
  r.taxIncome=round(type==='lump'?r.revenue-r.social-healthDeduction:r.income-healthDeduction);
  cumIncome+=r.taxIncome;
  const total=type==='scale'?scale(cumIncome,p):Math.round(positive(Math.round(cumIncome))*(type==='linear'?p.linearRate:s.lumpRate)/100);
  r.pit=positive(total-cumTax);cumTax+=r.pit;
  r.net=round(r.revenue-r.cost-r.social-r.fund-r.health-r.pit);
 });
 return {rows,base:positive(sum(rows,'taxIncome')),solidarityBase:annualIncome};
}
function monthlyTakeHome(r){
 const you=round(sum(r.rows,'net')/12),spouse=round(sum(r.spouseRows,'net')/12);
 return {you,spouse,total:round((sum(r.rows,'net')+sum(r.spouseRows,'net'))/12)};
}
function familyComparison(r,method='saving',share=50){
 const separate=[r.pit,r.spouseTax],extra=[r.childOwnExtra||0,r.childSpouseExtra||0];
 const effective=[round(separate[0]-extra[0]),round(separate[1]-extra[1])];
 const jointCost=round(r.jointTax-(r.childJointExtra||0));
 let assigned=effective[0];
 if(r.jointAllowed){
  if(method==='half')assigned=round(jointCost/2);
  else if(method==='income'){
   const own=positive(r.base-r.deduction),wife=positive(r.spouseBase-r.spouseDeduction);
   assigned=round(jointCost*(own+wife?own/(own+wife):.5));
  }else assigned=round(effective[0]-r.saving*Math.min(100,Math.max(0,share))/100);
 }
 const taxes=[assigned,round(jointCost-assigned)];
 const people=[{id:'you',net:r.net,contribution:r.contribution,advances:r.annual.pit},{id:'spouse',net:r.spouseNet,contribution:r.spouseContribution,advances:r.spouseAdvances}].map((v,i)=>{
  const gain=round(effective[i]-taxes[i]),available=round(v.net-v.contribution);
  return {...v,childExtra:extra[i],separatePit:separate[i],jointPit:r.jointAllowed?taxes[i]:null,separateAvailable:available,jointAvailable:r.jointAllowed?round(available+gain):null,gain:r.jointAllowed?gain:null,separateRefund:round(v.advances-effective[i]),jointRefund:r.jointAllowed?round(v.advances-taxes[i]):null};
 });
 const total={id:'total'};
 for(const key of ['net','contribution','advances','childExtra','separatePit','separateAvailable','separateRefund'])total[key]=round(people.reduce((n,v)=>n+v[key],0));
 for(const key of ['jointPit','jointAvailable','gain','jointRefund'])total[key]=r.jointAllowed?round(people.reduce((n,v)=>n+v[key],0)):null;
 return [...people,total];
}
function annualTakeHome(r,method='saving',share=50){
 const family=familyComparison(r,method,share);
 const you=round(r.net+(family[0].gain??0)),spouse=round(r.spouseNet+(family[1].gain??0));
 return {you,spouse,total:round(you+spouse)};
}
function childEntitlement(s,p,ownIncome,spouseIncome){
 const count=s.childrenCount||0,periods=(s.childPeriods||[]).slice(0,count);
 const counts=Array.from({length:12},(_,i)=>periods.filter(c=>c.from<=i+1&&c.to>=i+1).length);
 const potential=round(counts.reduce((n,c)=>n+Math.min(c,2)*p.childFirst+(c>=3?p.childThird:0)+Math.max(0,c-3)*p.childFourth,0));
 const limitApplies=Math.max(0,...counts)<2&&!s.childDisability;
 const combined=s.married&&s.childFullYearMarriage;
 const ownTest=ownIncome+(s.childOtherIncome||0),spouseTest=spouseIncome+(s.childSpouseOtherIncome||0);
 const ownLimit=combined||s.childSingleParent?p.childCoupleLimit:p.childSingleLimit;
 const ownAllowed=!limitApplies||(combined?ownTest+spouseTest:ownTest)<=ownLimit;
 const spouseAllowed=s.married&&(!limitApplies||(combined?ownTest+spouseTest:spouseTest)<=(combined?p.childCoupleLimit:p.childSingleLimit));
 return {potential,ownAllowed:!!s.childrenEligible&&ownAllowed,spouseAllowed:!!s.childrenEligible&&spouseAllowed,limitApplies,income:combined?ownTest+spouseTest:ownTest,limit:ownLimit};
}
function childSettlement(ownTax,spouseTax,jointTax,ent,s,ownScale,jointAllowed,ownCap,spouseCap){
 const share=s.married?(ownScale?(s.childShare??100)/100:0):1;
 const ownEnt=ownScale&&ent.ownAllowed?round(ent.potential*share):0;
 const spouseEnt=ent.spouseAllowed?round(ent.potential*(1-share)):0;
 const ownDed=Math.min(ownTax,ownEnt),spouseDed=Math.min(spouseTax,spouseEnt);
 const ownUnused=positive(ownEnt-ownDed),spouseUnused=positive(spouseEnt-spouseDed);
 let ownExtra,spouseExtra;
 if(s.married&&s.childFullYearMarriage){
  const unused=ownUnused+spouseUnused,total=Math.min(unused,ownCap+spouseCap);
  ownExtra=round(unused?total*ownUnused/unused:0);spouseExtra=round(total-ownExtra);
 }else{ownExtra=round(Math.min(ownUnused,ownCap));spouseExtra=round(Math.min(spouseUnused,spouseCap));}
 const jointEnt=jointAllowed?(ent.ownAllowed||ent.spouseAllowed?ent.potential:0):0;
 const jointDed=Math.min(jointTax,jointEnt),jointExtra=jointAllowed?round(Math.min(positive(jointEnt-jointDed),ownCap+spouseCap)):round(ownExtra+spouseExtra);
 const ownFinal=Math.round(positive(ownTax-ownDed)),spouseFinal=Math.round(positive(spouseTax-spouseDed));
 return {ownFinal,spouseFinal,jointFinal:jointAllowed?Math.round(positive(jointTax-jointDed)):ownFinal+spouseFinal,ownExtra,spouseExtra,jointExtra,ownDed:round(ownDed),spouseDed:round(spouseDed),jointDed:round(jointAllowed?jointDed:ownDed+spouseDed)};
}
function calculate(s,p) {
 const spouse=payroll(Array(12).fill(s.married?s.spouseGross:0),s.spouseCopyright,{...s,ppkEmployee:0,ppkEmployer:0},p);
 const spouseContribution=s.married?Math.min(s.spouseIkze,p.ikzeEmployee):0;
 const spouseDeduction=Math.min(spouseContribution,spouse.base);
 const scaleRaw=x=>positive(rawScale(Math.round(positive(x)),p)-p.free*p.rate1/100);
 const spouseSolidarity=Math.round(positive(spouse.base-p.solidarityThreshold)*p.solidarityRate/100);
 return ['uop','author','scale','linear','lump'].map(id=>{
  const employee=id==='uop'||id==='author',ownScale=employee||id==='scale';
  const result=employee?payroll(s.monthly?s.months.map(m=>m.gross):Array(12).fill(s.gross),id==='author'?s.copyright:0,s,p,true):business(id,s,p);
  const rows=result.rows,b=result.base,contribution=Math.min(s.ikze,employee?p.ikzeEmployee:p.ikzeBusiness),deduction=Math.min(contribution,b);
  const jointAllowed=s.married&&s.jointEligible&&ownScale;
  // Article 32(3): declared forecast, flat first-rate advances; NOT a doubled payroll threshold.
  const payrollRules=p.threshold===120000&&p.threshold2===120000&&p.rate1===12&&p.rate3===32;
  const payrollEligible=employee&&jointAllowed&&payrollRules&&((b<=120000&&spouse.base===0)||(b>120000&&spouse.base<=120000));
  const payrollApplied=!!s.jointPayroll&&payrollEligible;
  if(payrollApplied)for(const row of rows)if(row.month+1>=(s.jointPayrollFrom||1)){
   const reduction=(s.pit2?p.free*p.rate1/100/12:0)+(b<=120000?p.free*p.rate1/100/12:0);
   row.pit=Math.round(positive(Math.round(row.income)*p.rate1/100-reduction));
   row.net=round(row.revenue-row.social-row.health-row.pit-row.ppk);
  }
  // Apply employment declarations before adding the independently withheld contract advance.
  const employmentRows=employee?rows.map(r=>({...r})):[];
  if(employee)rows.forEach((row,i)=>{for(const key of Object.keys(row))if(key!=='month')row[key]=round(row[key]+(result.contractRows[i][key]||0));});
  const taxFn=x=>ownScale?scaleRaw(x):Math.round(positive(x))*(id==='linear'?p.linearRate:s.lumpRate)/100;
  const jointRaw=(own,wife)=>2*positive(rawScale(Math.round((positive(own)+positive(wife))/2),p)-p.free*p.rate1/100);
  const ent=childEntitlement(s,p,id==='lump'?0:b,spouse.base);
  const ownCap=ownScale?sum(rows,'social')+sum(rows,'health'):0,spouseCap=sum(spouse.rows,'social')+sum(spouse.rows,'health');
  const settlement=childSettlement(taxFn(b-deduction),scaleRaw(spouse.base-spouseDeduction),jointRaw(b-deduction,spouse.base-spouseDeduction),ent,s,ownScale,jointAllowed,ownCap,spouseCap);
  const without=childSettlement(taxFn(b),scaleRaw(spouse.base),jointRaw(b,spouse.base),ent,s,ownScale,jointAllowed,ownCap,spouseCap);
  const pit=settlement.ownFinal,spouseTax=settlement.spouseFinal,jointTax=settlement.jointFinal;
  const saving=jointAllowed?round(pit+spouseTax-jointTax+settlement.jointExtra-settlement.ownExtra-settlement.spouseExtra):0;
  const solidarity=id==='lump'?0:Math.round(positive((result.solidarityBase??b)-p.solidarityThreshold)*p.solidarityRate/100);
  const ownBeforeTax=sum(rows,'revenue')-sum(rows,'cost')-sum(rows,'social')-sum(rows,'fund')-sum(rows,'health')-sum(rows,'ppk');
  const net=round(ownBeforeTax-pit-solidarity+settlement.ownExtra);
  const spouseNet=round(sum(spouse.rows,'revenue')-sum(spouse.rows,'social')-sum(spouse.rows,'health')-spouseTax-spouseSolidarity+settlement.spouseExtra);
  const household=round(net+spouseNet+saving);
  return {id,rows,employmentRows,contractRows:employee?result.contractRows:[],spouseRows:spouse.rows,spouseBase:spouse.base,base:b,pit,solidarity,net,household,available:round(household-contribution-spouseContribution),contribution,deduction,spouseContribution,spouseDeduction,spouseTax,spouseNet,spouseSolidarity,jointAllowed,jointTax,saving,
   payrollEligible,payrollApplied,childPotential:ent.potential,childEntitlement:ent,childDeduction:settlement.jointDed,childOwnDeduction:settlement.ownDed,childSpouseDeduction:settlement.spouseDed,childOwnExtra:settlement.ownExtra,childSpouseExtra:settlement.spouseExtra,childJointExtra:settlement.jointExtra,
   ikzeSaving:round(without.jointFinal-without.jointExtra-jointTax+settlement.jointExtra),refund:round(sum(rows,'pit')+sum(spouse.rows,'pit')-jointTax+settlement.jointExtra),ownRefund:round(sum(rows,'pit')-pit+settlement.ownExtra),spouseAdvances:sum(spouse.rows,'pit'),annual: Object.fromEntries(['revenue','cost','social','pension','disability','sickness','accident','fund','health','pit','kup','author','ppk','employerPpk','employerCost','employerSocial','employerPension','employerDisability','employerFund','fgsp','vat','vatOut','vatIn','invoice','net'].map(k=>[k,sum(rows,k)]))};
 });
}
const api={round,sum,scale,rawScale,presets,defaults:{...defaults,lumpRate:12},payroll,business,calculate,familyComparison,monthlyTakeHome,childEntitlement,childSettlement,annualTakeHome};
if(typeof module!=='undefined')module.exports=api; else root.TaxEngine=api;
})(typeof window!=='undefined'?window:globalThis);
