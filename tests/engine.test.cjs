const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js'),p=E.presets[2026];
const state=over=>({...structuredClone(E.defaults),...over});
const near=(a,b,t=.011)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const calc=(over={},params=p)=>E.calculate(state(over),params);
test('PIT: kwota wolna, próg 120 tys. i stawka krańcowa',()=>{
 assert.equal(E.scale(0,p),0);assert.equal(E.scale(30000,p),0);assert.equal(E.scale(120000,p),10800);assert.equal(E.scale(150000,p),20400);
});
test('Lista płac 6000 brutto: niezależny przykład kontrolny',()=>{
 const r=calc({gross:6000,married:false})[0].rows[0];
 assert.equal(r.social,822.6);assert.equal(r.health,465.97);assert.equal(r.pit,291);assert.equal(r.net,4420.43);assert.equal(r.employerCost,7228.8);
});
test('Pełny ZUS 2026 i dobrowolne chorobowe',()=>{
 const r=calc()[2].rows[0];near(r.social+r.fund,1926.76);near(r.pension,1103.27);near(r.disability,452.16);
 const no=calc({sickness:false})[2].rows[0];near(no.social+no.fund,1788.29);
});
test('Preferencyjny ZUS oraz przejście z ulgi na start',()=>{
 const pref=calc({social:'preferential'})[2].rows[0];near(pref.social,456.18);assert.equal(pref.fund,0);
 const start=calc({social:'start',startMonths:6})[2];assert.equal(start.rows[5].social,0);near(start.rows[6].social,456.18);assert.ok(start.rows[0].health>0);
});
test('Limit 30-krotności ogranicza obie strony etatu, nie chorobowe',()=>{
 const r=calc({gross:30000})[0];near(r.annual.pension,282600*.0976);near(r.annual.disability,282600*.015);near(r.annual.employerPension,282600*.0976);assert.equal(r.rows[11].pension,0);assert.equal(r.rows[11].sickness,735);
});
test('Koszty autorskie: najpierw składki, potem 50%; roczny limit',()=>{
 const r=calc({gross:10000,copyright:80})[1].rows[0];near(r.author,3451.6);near(r.kup,3701.6);
 const high=calc({gross:100000,copyright:100})[1];near(high.annual.author,120000);assert.equal(high.rows[11].author,0);
 const zero=calc({copyright:0});near(zero[0].net,zero[1].net);
});
test('IKZE: roczne odliczenie nie zmienia zaliczek ani zdrowotnej',()=>{
 const no=calc({married:false}),yes=calc({married:false,ikze:10000});
 for(let i=0;i<5;i++){near(no[i].annual.pit,yes[i].annual.pit);near(no[i].annual.health,yes[i].annual.health);assert.ok(yes[i].pit<no[i].pit);near(yes[i].available,no[i].available+yes[i].ikzeSaving-10000)}
 near(no[3].pit-yes[3].pit,1900);near(no[4].pit-yes[4].pit,1200);
});
test('IKZE ograniczone limitem, własnym dochodem; brak transferu do małżonka',()=>{
 const r=calc({ikze:100000,spouseGross:0,spouseIkze:10000});
 assert.equal(r[0].contribution,11304);assert.equal(r[3].contribution,16956);assert.equal(r[0].spouseDeduction,0);
 const zero=calc({gross:0,ikze:10000})[0];assert.equal(zero.deduction,0);assert.equal(zero.pit,0);
});
test('Wspólne rozliczenie: 2 × podatek połowy dochodu; wyłączenie liniowego i ryczałtu',()=>{
 const r=calc({spouseGross:0});assert.ok(r[0].saving>0);assert.equal(r[0].jointTax,E.scale(r[0].base/2,p)*2);assert.equal(r[3].jointAllowed,false);assert.equal(r[4].saving,0);
 const off=calc({jointEligible:false});assert.equal(off[0].saving,0);
});
test('VAT nie pomniejsza drugi raz kwoty netto; nieodliczony VAT zwiększa koszt',()=>{
 const full=calc({vat:23,cost:1000})[3],zero=calc({vat:0,cost:1000})[3];near(full.net,zero.net);assert.equal(full.rows[0].vatIn,230);
 const half=calc({cost:1000,vatDeduction:50})[3];assert.equal(half.rows[0].cost,1115);assert.equal(half.rows[0].vatIn,115);
 const exempt=calc({vatActive:false,cost:1000})[3];assert.equal(exempt.rows[0].cost,1230);assert.equal(exempt.annual.vat,0);
});
test('Ryczałt: progi zdrowotnej uwzględniają ZUS, lecz nie IKZE; cały rok w końcowym progu',()=>{
 const s={social:'start',startMonths:6,sickness:false,cost:0};
 const low=calc({...s,revenue:4000})[4],mid=calc({...s,revenue:10000})[4],high=calc({...s,revenue:30000})[4];
 assert.equal(low.rows[0].health,498.35);assert.equal(mid.rows[0].health,830.58);assert.equal(high.rows[0].health,1495.04);
 assert.equal(high.rows[0].health,high.rows[11].health);
});
test('Zdrowotna minimalna i brak podatku przy stracie; liniowy limit odliczenia',()=>{
 const low=calc({revenue:0,cost:1000})[3];near(low.annual.health,5190.48);assert.equal(low.pit,0);assert.ok(low.net<0);
 const high=calc({revenue:100000,cost:0,ikze:0})[3];near(high.base,high.annual.revenue-high.annual.social-high.annual.fund-14100);
});
test('Danina liczona osobno; IKZE nie obniża jej podstawy',()=>{
 const no=calc({gross:200000,revenue:200000,ikze:0}),yes=calc({gross:200000,revenue:200000,ikze:10000});
 assert.ok(no[0].solidarity>0);assert.equal(no[0].solidarity,yes[0].solidarity);assert.equal(no[4].solidarity,0);
});
test('Roczne tożsamości budżetowe dla różnych kwot, VAT, kosztów i rodziny',()=>{
 for(const gross of [0,4806,15000,50000])for(const married of [true,false])for(const vatActive of [true,false]){
  const rs=calc({gross,revenue:gross*1.2,married,vatActive,ikze:9000,spouseIkze:4000});
  for(const r of rs){const a=r.annual;near(r.net,a.revenue-a.cost-a.social-a.fund-a.health-a.ppk-r.pit-r.solidarity);near(r.available,r.net+r.spouseNet+r.saving-r.contribution-r.spouseContribution);near(r.refund,a.pit+r.spouseAdvances-r.jointTax);assert.ok(Number.isFinite(r.available));}
 }
});
test('Plan miesięczny i przejście progu PIT',()=>{
 const r=calc({monthly:true,months:Array.from({length:12},(_,i)=>({gross:i===11?100000:10000,revenue:10000,cost:1000}))})[0];assert.equal(r.annual.revenue,210000);assert.ok(r.rows[11].pit>20000);
});
test('2027: edytowalna skala z trzema przedziałami',()=>{
 const proposed={...E.presets[2027],threshold:130000,threshold2:150000,rate2:24};
 assert.equal(E.scale(130000,proposed),12000);assert.equal(E.scale(150000,proposed),16800);assert.equal(E.scale(160000,proposed),20000);
 const rs=calc({},proposed);assert.ok(rs.every(r=>Number.isFinite(r.available)));
});
test('Koszty na ryczałcie pomniejszają budżet, lecz nie podstawę PIT ani KUP',()=>{
 const no=calc({cost:0})[4],yes=calc({cost:1000})[4];assert.equal(no.pit,yes.pit);assert.equal(yes.annual.kup,0);near(no.net-yes.net,12000);
});
test('Własna wysoka podstawa ZUS zachowuje limit roczny i limit chorobowego',()=>{
 const r=calc({social:'custom',customBase:50000})[3];near(r.annual.pension,282600*.1952);near(r.annual.disability,282600*.08);assert.equal(r.rows[11].pension,0);near(r.rows[0].sickness,576.98);
});
test('Rodzina: podział oszczędności, wspólnego PIT i budżetu sumuje się do rodziny',()=>{
 for(const spouseGross of [0,6000,20000,50000])for(const id of [0,1,2])for(const method of ['saving','half','income'])for(const share of [0,50,100]){
  const r=calc({spouseGross,ikze:11304,spouseIkze:5000})[id],f=E.familyComparison(r,method,share);
  near(f[0].jointPit+f[1].jointPit,r.jointTax);near(f[2].jointAvailable,r.available);
  near(f[0].gain+f[1].gain,r.saving);near(f[2].jointRefund,r.refund);
  near(f[2].separateAvailable,r.net+r.spouseNet-r.contribution-r.spouseContribution);
  for(const person of f)near(person.jointAvailable-person.separateAvailable,person.gain);
 }
});
test('Rodzina: połowa podatku może obciążyć żonę mimo zysku gospodarstwa',()=>{
 const r=calc()[0],f=E.familyComparison(r,'half');
 assert.ok(f[0].gain>0);assert.ok(f[1].gain<0);assert.ok(f[2].gain>0);
 near(f[0].jointPit,r.jointTax/2);
});
test('Rodzina: cały zysk przypisany jednej osobie oraz zerowe dochody',()=>{
 const r=calc({spouseGross:0})[0],f=E.familyComparison(r,'saving',0);
 assert.equal(f[0].gain,0);assert.equal(f[1].gain,r.saving);assert.ok(f[1].jointPit<0);
 const zero=calc({gross:0,spouseGross:0})[0];
 for(const method of ['saving','half','income'])for(const v of E.familyComparison(zero,method))assert.equal(v.jointPit,0);
});
test('Rodzina: brak wspólnego PIT oznacza niedostępne porównanie, a nie zero korzyści',()=>{
 for(const r of [...calc().slice(3),calc({jointEligible:false})[0],calc({married:false})[0]]){
  const f=E.familyComparison(r);assert.equal(f[2].jointPit,null);assert.equal(f[2].gain,null);assert.equal(f[2].jointAvailable,null);
  near(f[2].separatePit,r.pit+r.spouseTax);
 }
});
test('Rozpiska żony zgadza się z jej rocznym PIT i środkami netto',()=>{
 const r=calc({spouseGross:12500,spouseCopyright:70,spouseIkze:11304})[0];
 assert.equal(r.spouseRows.length,12);near(E.sum(r.spouseRows,'income'),r.spouseBase);
 near(E.sum(r.spouseRows,'net')+r.spouseAdvances-r.spouseTax-r.spouseSolidarity,r.spouseNet);
});
test('Średnia na rękę pochodzi z wypłat po zaliczkach; IKZE i wspólny PIT jej nie zmieniają',()=>{
 const no=calc({ikze:0,spouseIkze:0,jointEligible:false}),yes=calc({ikze:11304,spouseIkze:5000,jointEligible:true});
 for(let i=0;i<no.length;i++){
  const cash=E.monthlyTakeHome(no[i]);
  assert.deepEqual(cash,E.monthlyTakeHome(yes[i]));
  near(cash.you,E.sum(no[i].rows,'net')/12);
  near(cash.spouse,E.sum(no[i].spouseRows,'net')/12);
  near(cash.total,(E.sum(no[i].rows,'net')+E.sum(no[i].spouseRows,'net'))/12);
  assert.ok(yes[i].refund>no[i].refund);
 }
});
test('Żona bez dochodu: 20 tys. brutto UoP daje 17 292 zł wspólnego PIT zamiast 37 711 zł',()=>{
 const r=calc({gross:20000,spouseGross:0,ikze:0,spouseIkze:0})[0];
 assert.equal(r.pit,37711);assert.equal(r.spouseTax,0);assert.equal(r.jointTax,17292);assert.equal(r.saving,20419);
 const separate=calc({gross:20000,spouseGross:0,jointEligible:false})[0];
 assert.equal(separate.jointTax,37711);near(r.annual.pit,separate.annual.pit);
});
test('Oświadczenie UoP: większe wypłaty, mniejszy zwrot, ten sam PIT roczny',()=>{
 const off=calc({spouseGross:0})[0],on=calc({spouseGross:0,jointPayroll:true})[0];
 assert.equal(on.payrollApplied,true);assert.ok(E.monthlyTakeHome(on).you>E.monthlyTakeHome(off).you);
 assert.equal(on.jointTax,off.jointTax);near(on.available,off.available);
 near(on.annual.net-off.annual.net,off.refund-on.refund);
 assert.ok(off.rows[11].pit>on.rows[11].pit);
 assert.equal(on.rows[0].pit,on.rows[11].pit);
});
test('Oświadczenie: termin, niski dochód, odmowa i możliwość dopłaty przy wysokim dochodzie',()=>{
 const off=calc({spouseGross:0})[0],late=calc({spouseGross:0,jointPayroll:true,jointPayrollFrom:8})[0];
 near(late.rows[6].pit,off.rows[6].pit);assert.ok(late.rows[7].pit<off.rows[7].pit);
 const low=calc({gross:6000,spouseGross:0,jointPayroll:true})[0];assert.equal(low.rows[0].pit,0);
 assert.equal(calc({gross:6000,spouseGross:1000,jointPayroll:true})[0].payrollApplied,false);
 assert.equal(calc({spouseGross:20000,jointPayroll:true})[0].payrollApplied,false);
 assert.equal(calc({spouseGross:0,jointPayroll:true})[2].payrollApplied,false);
 assert.equal(calc({spouseGross:0,jointPayroll:true},{...p,threshold:130000,threshold2:150000,rate2:24})[0].payrollApplied,false);
 assert.ok(calc({gross:50000,spouseGross:0,jointPayroll:true})[0].refund<0);
});
test('Próg wspólnej podstawy: 240 tys. i nadwyżka opodatkowana 32%',()=>{
 assert.equal(E.scale(240000/2,p)*2,21600);
 assert.equal(E.scale(250000/2,p)*2,24800);
});
test('Ulga na dzieci: roczne kwoty, uprawnienia i brak wpływu na wypłatę miesięczną',()=>{
 const options={childrenEligible:true};
 for(const [childrenCount,amount] of [[1,1112.04],[2,2224.08],[3,4224.12],[4,6924.12]]){
  const r=calc({...options,childrenCount,gross:6000,spouseGross:0})[0];near(r.childPotential,amount);near(r.childDeduction+r.childJointExtra,amount);
  near(E.monthlyTakeHome(r).you,E.monthlyTakeHome(calc({gross:6000,spouseGross:0})[0]).you);
 }
 assert.equal(calc({childrenCount:2,childrenEligible:false})[0].childDeduction,0);
});
test('Ulga: limit jednego dziecka przed IKZE, wyjątek niepełnosprawności, ryczałt nie wchodzi do limitu',()=>{
 const ent=over=>E.childEntitlement(state({childrenCount:1,childrenEligible:true,...over}),p,112000,0);
 assert.equal(ent({}).ownAllowed,true);
 assert.equal(E.childEntitlement(state({childrenCount:1,childrenEligible:true}),p,112000.01,0).ownAllowed,false);
 const high=calc({childrenCount:1,childrenEligible:true,ikze:11304})[0];assert.equal(high.childDeduction,0);assert.equal(high.childJointExtra,0);
 assert.ok(calc({childrenCount:1,childrenEligible:true,childDisability:true})[0].childDeduction>0);
 assert.ok(calc({childrenCount:1,childrenEligible:true})[4].childSpouseDeduction>0);
 assert.equal(calc({childrenCount:1,childrenEligible:true})[3].childSpouseDeduction,0);
});
test('Ulga: liczba dzieci w danym miesiącu, brak nakładania okresów i limit',()=>{
 const periods=structuredClone(E.defaults.childPeriods);periods[2]={from:1,to:6};
 near(calc({childrenCount:3,childrenEligible:true,childPeriods:periods})[0].childPotential,3224.10);
 periods[0]={from:1,to:8};periods[1]={from:11,to:12};
 const r=calc({childrenCount:2,childrenEligible:true,childPeriods:periods})[0];assert.equal(r.childEntitlement.limitApplies,true);assert.equal(r.childDeduction,0);
});
test('Dodatkowy zwrot dzieci ograniczony składkami, nie obniża podatku poniżej zera',()=>{
 const r=calc({gross:100,spouseGross:0,childrenCount:4,childrenEligible:true})[0];
 assert.equal(r.jointTax,0);near(r.childJointExtra,r.annual.social+r.annual.health);
 assert.ok(r.childJointExtra<r.childPotential);
 const zero=calc({gross:0,spouseGross:0,childrenCount:4,childrenEligible:true})[0];assert.equal(zero.refund,0);
});
test('Rodzina po uldze dzieci: osobne i wspólne salda oraz brak podwójnego zwrotu',()=>{
 for(const gross of [100,3000,20000])for(const childShare of [0,50,100])for(const r of calc({gross,spouseGross:3000,childrenCount:3,childrenEligible:true,childShare,ikze:10000,spouseIkze:3000})){
  near(r.net,r.annual.revenue-r.annual.cost-r.annual.social-r.annual.fund-r.annual.health-r.annual.ppk-r.pit-r.solidarity+r.childOwnExtra);
  near(r.refund,r.annual.pit+r.spouseAdvances-r.jointTax+r.childJointExtra);
  near(r.available,r.annual.net+E.sum(r.spouseRows,'net')+r.refund-r.solidarity-r.spouseSolidarity-r.contribution-r.spouseContribution);
  if(r.jointAllowed)for(const method of ['saving','half','income']){
   const f=E.familyComparison(r,method);near(f[2].jointAvailable,r.available);near(f[2].jointRefund,r.refund);near(f[2].gain,r.saving);
  }
 }
});
test('Roczne netto w porównaniu uwzględnia wspólny próg; zaliczki nie zmieniają końcowego wyniku',()=>{
 const joint=calc({spouseGross:0})[0],solo=calc({spouseGross:0,jointEligible:false})[0];
 near(E.annualTakeHome(joint).total-E.annualTakeHome(solo).total,20419);
 for(const r of calc({childrenCount:3,childrenEligible:true,ikze:10000,spouseIkze:3000}))for(const method of ['saving','half','income']){
  const a=E.annualTakeHome(r,method);near(a.you+a.spouse,r.household);
  near(a.total-r.contribution-r.spouseContribution,r.available);
 }
 const on=calc({spouseGross:0,jointPayroll:true})[0];
 assert.deepEqual(E.annualTakeHome(joint),E.annualTakeHome(on));
});
