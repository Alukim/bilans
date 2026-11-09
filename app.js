'use strict';
const E=TaxEngine,$=id=>document.getElementById(id),money=v=>new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v),pln=v=>money(v)+' zł';
const months=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const names={uop:'UoP · standard',author:'UoP · 50% KUP',scale:'JDG · skala',linear:'JDG · liniowy',lump:'JDG · ryczałt'};
const colors={uop:'#7e9290',author:'#5884b0',scale:'#bb824b',linear:'#9679b3',lump:'#246448'};
const clone=x=>JSON.parse(JSON.stringify(x));
let state=clone(E.defaults),rates=clone(E.presets),results=[],selected='lump',visible=new Set(Object.keys(names));
const storageKey='bilans-scenario-v1';
const groups=[['Ulga na dzieci', [['childFirst','Pierwsze / drugie dziecko · zł / mies.'],['childThird','Trzecie dziecko · zł / mies.'],['childFourth','Czwarte i kolejne · zł / mies.'],['childCoupleLimit','Limit małżonków / samotnego rodzica · zł'],['childSingleLimit','Limit indywidualny · zł']]],['PIT i koszty autorskie',[
 ['threshold','Pierwszy próg PIT · zł'],['threshold2','Drugi próg PIT · zł'],['rate1','Pierwsza stawka · %'],['rate2','Środkowa stawka · %'],['rate3','Najwyższa stawka · %'],['free','Kwota wolna · zł'],['linearRate','Podatek liniowy · %'],['copyrightCap','Limit 50% KUP · zł / rok'],['kup','KUP zwykłe · zł / miesiąc'],['kupAway','KUP podwyższone · zł / miesiąc'],['solidarityThreshold','Próg daniny solidarnościowej · zł'],['solidarityRate','Danina solidarnościowa · %']]],
 ['ZUS i składka zdrowotna',[
 ['minimum','Płaca minimalna · zł'],['socialBase','Podstawa pełnego ZUS · zł'],['pensionCap','Limit emerytalno-rentowy · zł / rok'],['healthScale','Zdrowotna skala · %'],['healthLinear','Zdrowotna liniowy · %'],['healthEmployee','Zdrowotna etat · %'],['healthMinimum','Min. zdrowotna JDG · zł / miesiąc'],['linearHealthCap','Odliczenie zdrowotnej liniowy · zł / rok'],['lumpHealth1','Zdrowotna ryczałt · I próg · zł'],['lumpHealth2','Zdrowotna ryczałt · II próg · zł'],['lumpHealth3','Zdrowotna ryczałt · III próg · zł'],['lumpThreshold1','Przychód ryczałt · I próg · zł'],['lumpThreshold2','Przychód ryczałt · II próg · zł']]],
 ['IKZE i VAT', [['ikzeEmployee','Limit IKZE etat · zł / rok'],['ikzeBusiness','Limit IKZE JDG · zł / rok'],['vatLimit','Limit zwolnienia z VAT · zł / rok']]],
 ['Stawki składek społecznych i pracodawcy',[
 ['pensionEmployee','Emerytalna pracownik · %'],['pensionEmployer','Emerytalna pracodawca · %'],['disabilityEmployee','Rentowa pracownik · %'],['disabilityEmployer','Rentowa pracodawca · %'],['sickness','Chorobowa · %'],['accident','Wypadkowa · %'],['fund','FP i FS · %'],['fgsp','FGŚP · %']]]];
const sourceLinks=[['MF: ulga na dzieci i dodatkowy zwrot','https://podatki.gov.pl/ulgi-i-odliczenia/ulga-na-dziecko-pit'],['MF: oświadczenie a pobór zaliczek (s. 25)','https://www.gov.pl/attachment/18124db9-87c8-47eb-b763-3a0674bc417d'],
 ['ZUS: składki społeczne i limit podstawy 2026','https://www.zus.pl/pl/baza-wiedzy/skladki-wskazniki-odsetki/skladki/wysokosc-skladek-na-ubezpieczenia-spoleczne'],
 ['ZUS: zdrowotna 2026 i odrębne minimum stycznia','https://www.zus.pl/firmy/przedsiebiorco-przeczytaj-wazne/kalkulator-skladki-zdrowotnej'],
 ['Biznes.gov.pl: roczna składka zdrowotna','https://biznes.gov.pl/pl/portal/001052'],
 ['MF: skala PIT i koszty autorskie','https://podatki.gov.pl/podatki-osobiste/pit/informacje-podstawowe/co-jest-opodatkowane/dochody-z-pracy'],
 ['MF: odliczenie składki zdrowotnej','https://podatki.gov.pl/ulgi-i-odliczenia/odliczenie-skladek-na-ubezpieczenie-zdrowotne-pit'],
 ['MF: wspólne rozliczenie małżonków','https://podatki.gov.pl/poradniki-i-informatory/wspolne-rozliczenie-malzonkow'],
 ['MRPiPS: limity wpłat IKZE 2026','https://www.gov.pl/web/rodzina/ikze-limit-wplat'],
 ['MF: zasady odliczania IKZE','https://podatki.gov.pl/ulgi-i-odliczenia/ulga-na-ikze-pit'],
 ['MF: zwolnienie podmiotowe z VAT','https://podatki.gov.pl/podatki-firmowe/vat/poradniki-i-informatory/zwolnienie-podmiotowe-od-podatku-vat'],
 ['PIP: minimalne wynagrodzenie 2027','https://www.pip.gov.pl/aktualnosci/inspekcja-pilnuje-minimalnych-wyplat'],
 ['Monitor Polski: obwieszczenie o podstawie ZUS 2027','https://monitorpolski.gov.pl/MP/2026/1098'],
 ['Monitor Polski: obwieszczenie o IKZE 2027 (wpis aktu; kwoty do weryfikacji)','https://monitorpolski.gov.pl/MP/2026/1062'],
 ['KPRM: projekt UD458 — zmiany PIT 2027 (projekt, nie przyjęty tu stan prawny)','https://www.gov.pl/web/premier/projekt-ustawy-o-zmianie-ustawy-o-podatku-dochodowym-od-osob-fizycznych-ustawy-o-podatku-dochodowym-od-osob-prawnych-oraz-ustawy-o-zryczaltowanym-podatku-dochodowym-od-niektorych-przychodow-osiaganych-przez-osoby-fizyczne5']
];
function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3500)}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,state,rates,selected}))}catch{toast('Nie można zapisać w przeglądarce. Możesz pobrać scenariusz JSON.')}}
function normalized(data){
 if(!data||data.version!==1||!data.state||!data.rates)throw Error('Nieprawidłowy format scenariusza.');
 const s=clone(E.defaults),r=clone(E.presets);
 for(const key of Object.keys(s)){
  if(key==='months'||key==='childPeriods')continue;
  const v=data.state[key];if(v===undefined)continue;
  if(typeof s[key]==='boolean'){if(typeof v!=='boolean')throw Error('Błędna wartość: '+key);s[key]=v}
  else if(typeof s[key]==='number'){if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e8)throw Error('Błędna liczba: '+key);s[key]=v}
  else if(key==='allocation'){if(!['saving','half','income'].includes(v))throw Error('Błędny podział podatku');s[key]=v}
  else if(key==='social'){if(!['full','preferential','start','custom'].includes(v))throw Error('Błędny wariant ZUS');s[key]=v}
 }
 if(![2026,2027].includes(s.year))throw Error('Obsługiwane lata: 2026 i 2027.');
 for(const key of ['copyright','spouseCopyright','vatDeduction','vat','costVat','lumpRate','savingShare','childShare'])if(s[key]>100)throw Error('Wartość procentowa ponad 100%.');
 if(s.startMonths>6||!Number.isInteger(s.startMonths))throw Error('Ulga na start: 0–6 pełnych miesięcy.');
 if(!Number.isInteger(s.childrenCount)||s.childrenCount>10||!Number.isInteger(s.jointPayrollFrom)||s.jointPayrollFrom<1||s.jointPayrollFrom>12)throw Error('Błędna liczba dzieci / miesiąc oświadczenia');
 if(data.state.childPeriods){if(!Array.isArray(data.state.childPeriods)||data.state.childPeriods.length!==10)throw Error('Błędny plan ulgi');s.childPeriods=data.state.childPeriods.map(c=>{if(!Number.isInteger(c.from)||!Number.isInteger(c.to)||c.from<1||c.to>12||c.from>c.to)throw Error('Błędne miesiące ulgi');return {from:c.from,to:c.to}})}
 if(s.ppkEmployee>4||s.ppkEmployer>4)throw Error('PPK: maksymalnie 4%.');
 if(data.state.months){if(!Array.isArray(data.state.months)||data.state.months.length!==12)throw Error('Potrzebne jest 12 miesięcy.');s.months=data.state.months.map(m=>Object.fromEntries(['gross','revenue','cost'].map(k=>{if(typeof m[k]!=='number'||!Number.isFinite(m[k])||m[k]<0||m[k]>1e8)throw Error('Błędna kwota miesięczna');return[k,m[k]]})));}
 for(const y of [2026,2027])for(const k of Object.keys(r[y]))if(data.rates[y]?.[k]!==undefined){const v=data.rates[y][k];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e8)throw Error('Błędna stawka '+k);const field=groups.flatMap(g=>g[1]).find(f=>f[0]===k);if(field?.[1].endsWith('%')&&v>100)throw Error('Stawka ponad 100%');r[y][k]=v}
 for(const y of [2026,2027])if(r[y].threshold2<r[y].threshold||r[y].lumpThreshold2<r[y].lumpThreshold1)throw Error('Progi muszą być uporządkowane.');
 return {state:s,rates:r,selected:Object.hasOwn(names,data.selected)?data.selected:'lump'};
}
try{const saved=localStorage.getItem(storageKey);if(saved){const d=normalized(JSON.parse(saved));state=d.state;rates=d.rates;selected=d.selected}}catch{ /* Ignore obsolete or invalid local state. */ }
function syncInputs(){for(const el of document.querySelectorAll('[aria-invalid="true"]'))showFieldError(el,'');for(const k of Object.keys(state)){const el=$(k);if(!el||k==='months')continue;if(el.type==='checkbox')el.checked=state[k];else el.value=state[k]}$('selected').value=selected;renderParameters();renderChildInputs();}
function renderParameters(){
 const p=rates[state.year];$('parameterYear').textContent=state.year;
 $('parameters').innerHTML=groups.map(([name,fields])=>`<div class="parameter-group"><h3>${name}</h3><div class="parameter-grid">${fields.map(([k,label])=>`<div><label for="p-${k}">${label}</label><input id="p-${k}" data-parameter="${k}" type="number" min="0" max="${label.endsWith('%')?100:100000000}" step="0.01" value="${p[k]}"><small>${state.year===2027&&['lumpHealth1','lumpHealth2','lumpHealth3','linearHealthCap'].includes(k)?'Założenie: wartość z 2026':state.year===2027&&['socialBase','pensionCap','ikzeEmployee','ikzeBusiness'].includes(k)?'Założenie: wynagrodzenie 10 033 zł':'Wartość edytowalna'}</small></div>`).join('')}</div></div>`).join('');
 $('proposed2027').hidden=state.year!==2027;
}
function showFieldError(el,message){
 const id=el.id+'-error';let hint=$(id);
 if(message){
  if(!hint){hint=document.createElement('p');hint.id=id;hint.className='hint field-error';hint.setAttribute('role','status');(el.closest('.unit-input')||el).after(hint)}
  hint.textContent=message;el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',id);
 }else{if(hint)hint.remove();el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby')}
}
function validField(el){
 const valid=el.value!==''&&el.validity.valid;
 showFieldError(el,valid?'':`Wpisz poprawną liczbę${el.min!==''?' od '+el.min:''}${el.max!==''?' do '+el.max:''}. Wyniki używają ostatniej poprawnej wartości tego pola.`);
 return valid;
}
function updateInput(e){
 const el=e.target,k=el.id;
 if(!Object.hasOwn(state,k)||k==='months'||k==='year')return;
 if(el.type==='checkbox')state[k]=el.checked;
 else if(typeof state[k]==='number'){if(!validField(el))return;state[k]=Number(el.value)}
 else state[k]=el.value;
 if(k==='childrenCount')renderChildInputs();
 render();
}

function renderChildInputs(){
 $('childPeriodInputs').innerHTML=state.childPeriods.slice(0,state.childrenCount).map((c,i)=>`<div class="child-period"><h3>Dziecko ${i+1}</h3><div class="two">${['from','to'].map(k=>`<div><label for="child-${i}-${k}">${k==='from'?'Od miesiąca':'Do miesiąca'}</label><select id="child-${i}-${k}" data-child="${i}" data-period="${k}">${months.map((m,j)=>`<option value="${j+1}" ${c[k]===j+1?'selected':''}>${m}</option>`).join('')}</select></div>`).join('')}</div></div>`).join('');
}
const stat=(title,value)=>`<div class="detail-metric"><span>${title}</span><strong>${pln(value)}</strong></div>`;
function render(){
 const p=rates[state.year];results=E.calculate(state,p);const chosen=results.find(r=>r.id===selected),best=[...results].sort((a,b)=>E.monthlyTakeHome(b).total-E.monthlyTakeHome(a).total)[0];
 const modified=JSON.stringify(p)!==JSON.stringify(E.presets[state.year]);
 $('scenarioBadge').textContent=state.year+(modified?' · własne stawki':state.year===2027?' · symulacja':' · model bazowy');
 $('yearNotice').hidden=state.year!==2027;$('yearNotice').textContent='2027 — scenariusz planistyczny. Skala PIT domyślnie jak w 2026. Zdrowotna ryczałtu i limit odliczenia liniowego pozostają założeniami z 2026. Wszystkie wartości znajdziesz i zmienisz w panelu stawek.';
 $('rateStatus').textContent=state.year===2027?'2027: płaca minimalna 4 950 zł; ZUS i IKZE oparte na przyjętym wynagrodzeniu 10 033 zł (wartości do weryfikacji). Brak stawki zdrowotnej ryczałtu zależnej od IV kw. 2026 — użyto 2026. Projekt nowej skali możesz załadować osobno; przycisk nie zmienia ryczałtu ani daniny.':modified?'Własny scenariusz 2026. Zmienione parametry mogą różnić się od przepisów.':'Bazowe parametry 2026 ze źródeł MF i ZUS. Dwa progi o tej samej wartości oznaczają skalę dwustopniową. Składka minimalna dotyczy roku składkowego luty–styczeń.';
 $('copyrightValue').textContent=state.copyright+'%';$('ikzeLimits').textContent=`Limit ${state.year}: etat ${pln(p.ikzeEmployee)}, JDG ${pln(p.ikzeBusiness)}. Wpłatę ograniczamy osobno dla każdego wariantu.`;
 $('customBaseWrap').hidden=state.social!=='custom';$('startWrap').hidden=state.social!=='start';$('editMonths').hidden=!state.monthly;$('spouseFields').hidden=!state.married;$('spouseIkze').disabled=!state.married;
 $('jointPayrollFields').hidden=!state.jointPayroll;
 $('payrollStatus').textContent=chosen.payrollApplied?'Oświadczenie aktywne w tym wariancie: 12% zaliczki od wskazanego miesiąca. Więcej na rękę, mniejszy zwrot albo dopłata roczna.':state.jointPayroll?'Oświadczenie nie działa w wybranym wariancie: wymagany etat, wspólny PIT i spełniona prognoza dochodów; zmieniona skala 2027 nie jest obsługiwana.':'Bez oświadczenia pracodawca stosuje Twój indywidualny próg. Wspólne rozliczenie zmienia dopiero roczny PIT.';
 $('childFields').hidden=state.childrenCount===0;
 const child=chosen.childEntitlement;
 $('childStatus').textContent=!state.childrenEligible?'Potwierdź warunki ulgi — do tego czasu nie obniżamy podatku.':`W tym wariancie: potencjalna ulga ${pln(chosen.childPotential)} / rok. Odliczono od PIT ${pln(chosen.childDeduction)}, dodatkowy zwrot ${pln(chosen.childJointExtra)}.${child.limitApplies?' Dochód do limitu (przed IKZE): '+pln(child.income)+'; limit: '+pln(child.limit)+'.':''}`;
 const warnings=[];
 if(!state.vatActive&&results[2].annual.revenue>p.vatLimit)warnings.push('Przychód przekracza limit zwolnienia z VAT. Włącz VAT lub zweryfikuj zwolnienie przedmiotowe. Ten scenariusz nie modeluje utraty zwolnienia w trakcie roku.');
 if(state.ikze>p.ikzeEmployee)warnings.push('Wpłata IKZE jest wyższa od limitu etatu — dla UoP przyjęto limit. Warianty JDG mają odrębny, wyższy limit.');
 if(state.ikze>p.ikzeBusiness||state.married&&state.spouseIkze>p.ikzeEmployee)warnings.push('Wpłatę IKZE ponad właściwy limit pominięto w odliczeniu i budżecie.');
 if(state.monthly)warnings.push('Aktywny plan miesięczny: kwoty UoP, JDG i kosztów pobieramy z tabeli miesięcznej.');
 if(results[2].annual.revenue>1000000)warnings.push('Wysoki przychód: sprawdź limit uprawniający do ryczałtu. Symulator nie ocenia przychodów poprzedniego roku ani projektowanych ograniczeń ryczałtu 2027.');
 $('warnings').innerHTML=warnings.map(w=>`<div class="notice">${w}</div>`).join('');
 $('summary').innerHTML=`<div class="metric featured"><small>NAJWIĘCEJ NA RĘKĘ · RODZINA / MIES.</small><strong>${money(E.monthlyTakeHome(best).total)} <em>zł</em></strong><p>${names[best.id]} · średnio po zaliczkach, przed rocznym PIT</p></div><div class="metric"><small>ROCZNY ZWROT (+) / DOPŁATA (−) · RODZINA</small><strong>${money(chosen.refund)} <em>zł</em></strong><p>${names[chosen.id]} · całe rozliczenie PIT</p></div><div class="metric"><small>IKZE · KORZYŚĆ W ROCZNYM PIT</small><strong>${money(chosen.ikzeSaving)} <em>zł</em></strong><p>Zmniejsza podatek; uwzględnione już w saldzie obok</p></div>`;
 $('overviewSelected').value=selected;
 $('jointOverviewValues').innerHTML=stat('PIT przy rozliczeniu osobnym · Ty + żona',chosen.pit+chosen.spouseTax)+stat(chosen.jointAllowed?'PIT przy rozliczeniu wspólnym':'PIT rodziny · rozliczenie osobne',chosen.jointTax)+stat('Oszczędność dzięki wspólnemu PIT · rocznie',chosen.saving);
 const why=!state.married?'Włącz uwzględnienie małżonki, aby porównać wspólne rozliczenie.':!state.jointEligible?'Nie zaznaczono spełnienia warunków wspólnego PIT.':!chosen.jointAllowed?'Aktywna JDG na liniowym lub ryczałcie wyklucza wspólny PIT w tym modelu. Wybierz UoP albo skalę, aby sprawdzić korzyść.':`Wspólny PIT liczymy od połowy sumy Waszych podstaw, a wynik mnożymy przez dwa.${state.spouseGross===0?' Dochód żony wynosi 0 zł — nadal uwzględniamy ją we wspólnym rozliczeniu.':''} Wiersz „Twój PIT roczny · gdyby osobno” jest punktem odniesienia, a nie podatkiem wspólnego zeznania. Miesięczne zaliczki i Twoja kwota na rękę nie zmieniają się automatycznie; korzyść pokaże roczny zwrot / dopłata.`;
 $('jointThreshold').textContent=chosen.jointAllowed?`Pierwszy próg wspólnej podstawy: ${pln(2*p.threshold)} rocznie (2 × ${pln(p.threshold)}). Wasza podstawa po IKZE: ${pln(Math.max(0,chosen.base-chosen.deduction)+Math.max(0,chosen.spouseBase-chosen.spouseDeduction))}. To dochód po odliczeniach, nie brutto ani suma faktur.`:'Próg wspólnej podstawy dotyczy wyłącznie dostępnego wspólnego PIT.';
 $('jointExplanation').textContent=chosen.payrollApplied?'Stosujemy oświadczenie u pracodawcy od miesiąca '+state.jointPayrollFrom+'. Zaliczki 12% są już widoczne w wypłacie i średniej miesięcznej. Końcowy PIT obliczamy wspólnie; różnicę pokaże roczny zwrot / dopłata.':why;
 const comparisonRows=[['Przychód brutto / netto faktur',r=>r.annual.revenue],['Koszt pracodawcy / klienta bez VAT',r=>r.annual.employerCost],['Wydatki firmy (z nieodliczonym VAT)',r=>r.annual.cost],['ZUS społeczny + FP (Twój)',r=>r.annual.social+r.annual.fund],['Zdrowotna (Twoja)',r=>r.annual.health],['KUP w tym wariancie',r=>r.annual.kup],['Twój PIT roczny · gdyby osobno',r=>r.pit],['PIT rodziny · gdyby osobno',r=>r.pit+r.spouseTax],['PIT rodziny · po wybranym rozliczeniu',r=>r.jointTax],['Twoja danina solidarnościowa',r=>r.solidarity],['VAT saldo roczne',r=>r.annual.vat],['Twoje netto · gdyby osobno (punkt odniesienia)',r=>r.net],['Netto żony · gdyby osobno (punkt odniesienia)',r=>r.spouseNet],['Oszczędność wspólnego PIT',r=>r.saving],['Rocznie na rękę po rozliczeniu · Ty¹',r=>E.annualTakeHome(r,state.allocation,state.savingShare).you],['Rocznie na rękę po rozliczeniu · żona¹',r=>E.annualTakeHome(r,state.allocation,state.savingShare).spouse],['Rocznie na rękę po rozliczeniu · razem',r=>E.annualTakeHome(r,state.allocation,state.savingShare).total],['Wpłaty IKZE · razem',r=>r.contribution+r.spouseContribution],['Rodzina po PIT i wpłatach IKZE',r=>r.available],['Zwrot (+) / dopłata (−) PIT rodziny · rocznie',r=>r.refund],['Korzyść IKZE w PIT rodziny · rocznie',r=>r.ikzeSaving],['Ulga na dzieci odliczona od PIT · rocznie',r=>r.childDeduction],['Dodatkowy zwrot ulgi na dzieci · rocznie',r=>r.childJointExtra],['Średnio miesięcznie na rękę · Ty',r=>E.monthlyTakeHome(r).you],['Średnio miesięcznie na rękę · żona',r=>E.monthlyTakeHome(r).spouse],['Średnio miesięcznie na rękę · razem',r=>E.monthlyTakeHome(r).total]];
 $('comparisonTable').innerHTML=`<thead><tr><th>Rocznie · PLN</th>${results.map(r=>`<th class="${r.id===selected?'selected-col':''}"><button data-select="${r.id}" aria-pressed="${r.id===selected}"><span class="column-dot" style="background:${colors[r.id]}"></span>${names[r.id]}</button></th>`).join('')}</tr></thead><tbody>${comparisonRows.map(([label,fn])=>`<tr class="${label.startsWith('Rocznie na rękę')?'annual-net':''}"><td>${label}</td>${results.map(r=>`<td class="${r.id===selected?'selected-col':''}">${money(fn(r))}</td>`).join('')}</tr>`).join('')}</tbody>`;
 window.comparisonExport=[['Roczne netto po końcowym PIT uwzględnia wspólne rozliczenie, IKZE i ulgę na dzieci; przed odjęciem wpłat IKZE. Podział na osoby umowny. Miesięczne netto dotyczy wypłat po zaliczkach.'],['Pozycja',...results.map(r=>names[r.id])],...comparisonRows.map(([l,f])=>[l,...results.map(r=>f(r))])];
 renderChart();renderDetail(chosen);renderFamily(chosen);persist();
}
function renderChart(){
 $('legend').innerHTML=results.map(r=>`<button data-chart="${r.id}" aria-pressed="${visible.has(r.id)}"><i style="background:${colors[r.id]}"></i>${names[r.id]}</button>`).join('');
 const series=results.filter(r=>visible.has(r.id));const vals=series.flatMap(r=>r.rows.map(m=>m.net));const min=Math.min(0,...vals),max=Math.max(1,...vals)*1.1,range=max-min||1;
 const x=i=>62+i*61.5,y=v=>230-(v-min)/range*196;
 let svg=`<svg viewBox="0 0 780 270" role="img" aria-label="Miesięczne środki netto dla porównywanych wariantów. Szczegóły liczbowe są w tabeli miesięcznej.">`;
 for(let i=0;i<5;i++){const v=min+range*i/4;svg+=`<line x1="62" x2="739" y1="${y(v)}" y2="${y(v)}" stroke="#e9ede5" stroke-dasharray="3 4"/><text x="52" y="${y(v)+4}" text-anchor="end">${new Intl.NumberFormat('pl-PL',{maximumFractionDigits:0}).format(v)}</text>`}
 months.forEach((m,i)=>svg+=`<text x="${x(i)}" y="255" text-anchor="middle">${m.slice(0,3)}</text>`);
 for(const r of series){svg+=`<polyline fill="none" stroke="${colors[r.id]}" stroke-width="${r.id===selected?3:2}" stroke-linejoin="round" points="${r.rows.map((m,i)=>`${x(i)},${y(m.net)}`).join(' ')}"/>`;r.rows.forEach((m,i)=>svg+=`<circle tabindex="0" cx="${x(i)}" cy="${y(m.net)}" r="3.5" fill="${colors[r.id]}"><title>${names[r.id]} · ${months[i]}: ${pln(m.net)}</title></circle>`)}
 $('chart').innerHTML=svg+'</svg>';
}
function renderDetail(r){
 const emp=['uop','author'].includes(r.id),a=r.annual;
 $('breakdown').innerHTML=[stat('Twoja emerytalna / rok',a.pension),stat('Twoja rentowa / rok',a.disability),stat('Chorobowa / rok',a.sickness),stat('Zdrowotna / rok',a.health),stat('Twój PIT po IKZE · gdyby osobno',r.pit),stat(r.jointAllowed?'Wspólny PIT rodziny · po IKZE':'PIT rodziny · rozliczenie osobne',r.jointTax),stat('Oszczędność wspólnego PIT / rok',r.saving),stat('Odliczenie IKZE · Twoje',r.deduction),stat('Autorskie KUP / rok',a.author),stat(emp?'PPK pracownika / rok':'FP i FS / rok',emp?a.ppk:a.fund),...(emp?[stat('ZUS pracodawcy / rok',a.employerSocial),stat('PPK pracodawcy / rok',a.employerPpk),stat('Pełny koszt pracodawcy / rok',a.employerCost),stat('Emerytalna pracodawcy',a.employerPension),stat('Rentowa pracodawcy',a.employerDisability),stat('Wypadkowa pracodawcy',a.accident),stat('FP / FS pracodawcy',a.employerFund),stat('FGŚP pracodawcy',a.fgsp)]:[stat('Faktury brutto / rok',a.invoice),stat('VAT należny / rok',a.vatOut),stat('VAT do odliczenia / rok',a.vatIn),stat('Saldo VAT / rok',a.vat),stat('Wypadkowa JDG / rok',a.accident)])].join('');
 $('annualSettlement').innerHTML=`<h3>Rozliczenie roczne · ${r.jointAllowed?'wspólnie':'osobno'}</h3><div class="settlement-grid">${stat('PIT rodziny po rozliczeniu',r.jointTax)+stat('Ulga na dzieci · odliczenie',r.childDeduction)+stat('Ulga na dzieci · dodatkowy zwrot',r.childJointExtra)}${stat('Zwrot (+) / dopłata (−) PIT rodziny',r.refund)}${stat('Budżet rodziny po PIT i IKZE',r.available)}</div><p class="hint">Zaliczki PIT: Ty ${pln(a.pit)}, małżonek ${pln(r.spouseAdvances)}. Danina solidarnościowa poza saldem PIT: ${pln(r.solidarity+r.spouseSolidarity)}. IKZE odliczone: Ty ${pln(r.deduction)}, małżonek ${pln(r.spouseDeduction)}. Zwrot jest już uwzględniony w budżecie rocznym.</p>`;
 const columns=emp?[['revenue','Brutto'],['social','ZUS prac.'],['health','Zdrowotna'],['kup','KUP razem'],['author','w tym 50% KUP'],['pit','Zaliczka PIT'],['ppk','PPK prac.'],['net','Na rękę'],['employerCost','Koszt pracodawcy']]:[['revenue','Faktura netto'],['invoice','Faktura brutto'],['cost','Koszty'],['social','ZUS społ.'],['fund','FP / FS'],['health','Zdrowotna¹'],['pit','PIT model¹'],['vat','VAT saldo'],['net','Zostaje¹']];
 $('monthlyTable').innerHTML=`<thead><tr><th>Miesiąc</th>${columns.map(([,l])=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${r.rows.map((m,i)=>`<tr><td>${months[i]}</td>${columns.map(([k])=>`<td>${money(m[k])}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr><td>Razem · przed rozliczeniem</td>${columns.map(([k])=>`<td>${money(a[k])}</td>`).join('')}</tr></tfoot>`;
 window.monthExport=[['Miesiąc',...columns.map(c=>c[1])],...r.rows.map((m,i)=>[months[i],...columns.map(([k])=>m[k])]),['Razem',...columns.map(([k])=>a[k])],['Ulga na dzieci · odliczenie',r.childDeduction],['Ulga na dzieci · dodatkowy zwrot',r.childJointExtra],['Zwrot PIT rodziny (z ulgą na dzieci)',r.refund],['Danina rodziny',r.solidarity+r.spouseSolidarity],['Budżet rodziny po PIT i IKZE',r.available]];
}

function renderFamily(r){
 $('familyPanel').hidden=!state.married;
 const family=E.familyComparison(r,state.allocation,state.savingShare),titles=['Ty','Żona','Razem'],cash=E.monthlyTakeHome(r),monthlyCash=[cash.you,cash.spouse,cash.total];
 $('familyVariant').textContent=names[r.id]+' u Ciebie · UoP żony · '+state.year+' · kwoty roczne';
 $('allocation').value=state.allocation;if(document.activeElement!==$('savingShare'))$('savingShare').value=state.savingShare;
 $('familySelected').value=selected;
 $('savingShareWrap').hidden=state.allocation!=='saving';
 $('allocation').disabled=false;$('savingShare').disabled=false;
 $('familyUnavailable').hidden=r.jointAllowed;
 $('familyUnavailable').textContent='W wybranym wariancie wspólny PIT jest niedostępny, więc podział nie zmienia jego wyniku. Ustawienia pozostają edytowalne i działają dla uprawnionych wariantów UoP / skali w tabeli porównawczej. Wybierz taki wariant poniżej lub w nagłówku tej sekcji, aby zobaczyć podział szczegółowo.';
 const description=state.allocation==='half'?'Dzielimy wspólny PIT po 50%. Osoba z niższym podatkiem osobnym może wtedy ponieść większy przypisany koszt.':state.allocation==='income'?'Dzielimy wspólny PIT proporcjonalnie do dodatnich podstaw po IKZE. Przy obu podstawach zerowych dzielimy po połowie.':`Oszczędność rodziny dzielimy: Ty ${state.savingShare}%, żona ${100-state.savingShare}%. Przypisany PIT może być ujemny — oznacza to wewnętrzną korzyść / transfer, nie ujemny podatek urzędowy.`;
 $('allocationNote').textContent='Te ustawienia dotyczą wszystkich wariantów z dostępnym wspólnym PIT w porównaniu rocznym. Wspólne zeznanie ma jeden PIT dla obojga. Podział na osoby jest Waszym założeniem budżetowym, a nie odrębnym zobowiązaniem wobec urzędu. '+description+' Kwoty przypisane przy wspólnym PIT obejmują także dodatkowy zwrot ulgi na dzieci (pomniejsza koszt). Zmiana podziału nie zmienia wyniku rodziny. Wspólne salda per osoba są również podziałem budżetowym, nie osobnymi zwrotami z urzędu.';
 const show=v=>v===null?'—':money(v),delta=v=>v===null?'Niedostępne':(v>0?'+':'')+pln(v),tone=v=>v===null||v===0?'neutral':v>0?'gain':'loss';
 $('familyCards').innerHTML=family.map((v,i)=>`<article class="family-card"><h3>${titles[i]}</h3><span>Średnio miesięcznie na rękę</span><strong class="take-home">${pln(monthlyCash[i])}</strong><p>Po zaliczkach, przed rocznym PIT i wpłatami IKZE.</p><span>Roczny zysk / strata ze wspólnego PIT</span><strong class="${tone(v.gain)}">${delta(v.gain)}</strong><p>${v.gain===null?'Brak wspólnego PIT':v.gain>0?'Zyskuje':v.gain<0?'Traci według przyjętego podziału':'Bez zmiany'}</p></article>`).join('');
 const headers=['Osoba','Na rękę / mies.','PIT osobno','PIT minus dodatkowy zwrot¹','Budżet osobno²','Budżet wspólnie¹ ²','Zysk / strata'];
 const rows=family.map((v,i)=>[titles[i],monthlyCash[i],v.separatePit,v.jointPit,v.separateAvailable,v.jointAvailable,v.gain]);
 $('familyComparisonTable').innerHTML='<thead><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((v,i)=>`<td class="${i===6?tone(v):''}">${i===0?v:i===6?delta(v):show(v)}</td>`).join('')+'</tr>').join('')+'</tbody>';
 const wife=Object.fromEntries(['revenue','social','health','kup','author','ppk','employerCost','net'].map(k=>[k,E.sum(r.spouseRows,k)]));
 const pair=(label,a,b)=>[label,E.round(a),E.round(b),E.round(a+b)];
 const details=[pair('Przychód brutto / netto faktur',r.annual.revenue,wife.revenue),pair('Koszt pracodawcy / klienta bez VAT',r.annual.employerCost,wife.employerCost),pair('Wydatki firmy',r.annual.cost,0),pair('ZUS społeczny + FP (własny)',r.annual.social+r.annual.fund,wife.social),pair('Zdrowotna',r.annual.health,wife.health),pair('KUP',r.annual.kup,wife.kup),pair('w tym autorskie KUP',r.annual.author,wife.author),pair('Podstawa przed IKZE',r.base,r.spouseBase),pair('Wpłaty IKZE',r.contribution,r.spouseContribution),pair('Odliczenie IKZE',r.deduction,r.spouseDeduction),pair('Podstawa po IKZE',Math.max(0,r.base-r.deduction),Math.max(0,r.spouseBase-r.spouseDeduction)),pair('PPK pracownika',r.annual.ppk,0),pair('Danina solidarnościowa',r.solidarity,r.spouseSolidarity),pair('Zaliczki PIT',r.annual.pit,r.spouseAdvances),pair('Ulga na dzieci odliczona · osobno',r.childOwnDeduction,r.childSpouseDeduction)];
 for(const [label,key] of [['PIT roczny · osobno','separatePit'],['PIT minus dodatkowy zwrot · wspólnie¹','jointPit'],['Dodatkowy zwrot na dzieci · osobno','childExtra'],['Zwrot (+) / dopłata (−) · osobno','separateRefund'],['Saldo rozliczenia wspólnego · przypisane¹','jointRefund'],['Budżet po PIT i wpłatach IKZE · osobno²','separateAvailable'],['Budżet po PIT i wpłatach IKZE · wspólnie¹ ²','jointAvailable'],['Zysk (+) / strata (−) rocznie','gain']])details.push([label,...family.map(v=>v[key])]);
 $('familyDetailsTable').innerHTML='<thead><tr><th>Rocznie · PLN</th>'+titles.map(t=>`<th>${t}</th>`).join('')+'</tr></thead><tbody>'+details.map(row=>'<tr>'+row.map((v,i)=>`<td>${i===0?v:show(v)}</td>`).join('')+'</tr>').join('')+'</tbody>';
 const monthHeaders=['Miesiąc','ZUS + FP · Ty','ZUS · żona','Zdrowotna · Ty','Zdrowotna · żona','PIT zaliczki · Ty','PIT zaliczki · żona','Netto · Ty','Netto · żona','Netto · razem'];
 const monthRows=r.rows.map((v,i)=>{const w=r.spouseRows[i];return[months[i],E.round(v.social+v.fund),w.social,v.health,w.health,v.pit,w.pit,v.net,w.net,E.round(v.net+w.net)]});
 const totalRow=['Razem',...monthHeaders.slice(1).map((_,i)=>E.round(monthRows.reduce((a,row)=>a+row[i+1],0)))];
 $('familyMonthlyTable').innerHTML='<thead><tr>'+monthHeaders.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+monthRows.map(row=>'<tr>'+row.map((v,i)=>`<td>${i===0?v:money(v)}</td>`).join('')+'</tr>').join('')+'</tbody><tfoot><tr>'+totalRow.map((v,i)=>`<td>${i===0?v:money(v)}</td>`).join('')+'</tr></tfoot>';
 window.familyExport=[['Średnie miesięczne to wypłaty po zaliczkach. Zwrot PIT i IKZE pokazujemy rocznie, bez dzielenia przez 12.'],['Wariant',names[r.id],state.year],['Podział budżetowy',state.allocation,state.savingShare],['¹ Wspólny PIT i salda przypisane osobom umownie; nie odrębne zobowiązania ani zwroty.'],['² Budżet po PIT, daninie i wpłatach IKZE.'],headers,...rows,[],['Rozpiska roczna',...titles],...details,[],monthHeaders,...monthRows,totalRow].map(row=>row.map(v=>v===null?'Niedostępne':v));
}

function download(filename,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csv(rows){return '\ufeff'+rows.map(r=>r.map(v=>typeof v==='number'?v.toFixed(2).replace('.',','):'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n')}
$('childPeriodInputs').addEventListener('change',e=>{const el=e.target;if(el.dataset.child===undefined)return;const i=Number(el.dataset.child),k=el.dataset.period,c={...state.childPeriods[i],[k]:Number(el.value)};if(c.from>c.to){showFieldError(el,'Koniec okresu nie może być przed początkiem.');return}showFieldError(el,'');state.childPeriods[i]=c;render()});
$('familySelected').innerHTML=Object.entries(names).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
$('familySelected').addEventListener('change',()=>{selected=$('familySelected').value;$('selected').value=selected;render()});
$('allSavingToYou').onclick=()=>{state.allocation='saving';state.savingShare=100;$('savingShare').value=100;showFieldError($('savingShare'),'');render();toast('Cała oszczędność wspólnego PIT przypisana Tobie. Suma rodziny bez zmian.');};
$('allocation').addEventListener('change',updateInput);
$('savingShare').addEventListener('input',updateInput);
$('savingShare').addEventListener('change',updateInput);
$('csvFamily').onclick=()=>download('bilans-rodzina-'+selected+'-'+state.year+'.csv',csv(window.familyExport),'text/csv;charset=utf-8');
$('inputs').addEventListener('input',updateInput);
$('inputs').addEventListener('change',updateInput);
$('inputs').addEventListener('submit',e=>e.preventDefault());
$('year').addEventListener('change',()=>{state.year=Number($('year').value);renderParameters();render()});
$('overviewSelected').addEventListener('change',()=>{selected=$('overviewSelected').value;$('selected').value=selected;render()});
$('selected').addEventListener('change',()=>{selected=$('selected').value;render()});
$('comparisonTable').addEventListener('click',e=>{const b=e.target.closest('[data-select]');if(b){selected=b.dataset.select;$('selected').value=selected;render()}});
$('legend').addEventListener('click',e=>{const b=e.target.closest('[data-chart]');if(b){const k=b.dataset.chart;visible.has(k)?visible.delete(k):visible.add(k);renderChart()}});
function updateParameter(e){
 const el=e.target,k=el.dataset.parameter;if(!k||!validField(el))return;
 const p=rates[state.year],value=Number(el.value);
 if((k==='threshold'&&value>p.threshold2)||(k==='threshold2'&&value<p.threshold)||(k==='lumpThreshold1'&&value>p.lumpThreshold2)||(k==='lumpThreshold2'&&value<p.lumpThreshold1)){
  showFieldError(el,'Drugi próg nie może być niższy od pierwszego. Wyniki używają ostatniej poprawnej wartości tego pola.');return;
 }
 p[k]=value;render();
}
$('parameters').addEventListener('input',updateParameter);
$('parameters').addEventListener('change',updateParameter);
$('resetRates').onclick=()=>{rates[state.year]=clone(E.presets[state.year]);renderParameters();render();toast('Przywrócono bazowe stawki '+state.year)};
$('proposed2027').onclick=()=>{Object.assign(rates[2027],{threshold:130000,threshold2:150000,rate1:12,rate2:24,rate3:32});renderParameters();render();toast('Wczytano projekt skali PIT. Pozostałe parametry bez zmian.');};
$('equalBudget').onclick=()=>{const uop=results[0];if(state.monthly)state.months.forEach((m,i)=>m.revenue=uop.rows[i].employerCost);state.revenue=E.round(uop.annual.employerCost/12);$('revenue').value=state.revenue;showFieldError($('revenue'),'');render();toast('JDG ustawione na koszt pracodawcy bez VAT.');};
$('exportConfig').onclick=()=>download('bilans-'+state.year+'.json',JSON.stringify({version:1,state,rates,selected},null,2),'application/json');
$('importConfig').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw Error('Plik jest za duży.');const d=normalized(JSON.parse(await f.text()));state=d.state;rates=d.rates;selected=d.selected;syncInputs();render();toast('Wczytano scenariusz.')}catch(err){toast('Nie wczytano: '+err.message)}e.target.value=''};
$('csvComparison').onclick=()=>download('bilans-porownanie-'+state.year+'.csv',csv(window.comparisonExport),'text/csv;charset=utf-8');
$('csvMonths').onclick=()=>download('bilans-'+selected+'-'+state.year+'.csv',csv(window.monthExport),'text/csv;charset=utf-8');
$('reset').onclick=()=>{state=clone(E.defaults);syncInputs();render();toast('Przywrócono przykładowe kwoty. Stawki pozostają bez zmian.');};
function renderMonthInputs(){$('monthInputs').innerHTML=state.months.map((m,i)=>`<tr><td>${months[i]}</td>${['gross','revenue','cost'].map(k=>`<td><input type="number" min="0" max="10000000" step="0.01" value="${m[k]}" data-month="${i}" data-field="${k}" aria-label="${months[i]} ${k==='gross'?'UoP brutto':k==='revenue'?'JDG netto':'koszty netto'}"></td>`).join('')}</tr>`).join('')}
$('editMonths').onclick=()=>{renderMonthInputs();$('monthsDialog').showModal()};
$('fillMonths').onclick=()=>{for(const el of $('monthInputs').querySelectorAll('input'))el.value=state[el.dataset.field]};
$('closeMonths').onclick=()=>$('monthsDialog').close();
$('saveMonths').onclick=()=>{const els=[...$('monthInputs').querySelectorAll('input')];if(els.some(el=>!el.reportValidity()||el.value===''))return;for(const el of els)state.months[Number(el.dataset.month)][el.dataset.field]=Number(el.value);render();$('monthsDialog').close()};
$('print').onclick=()=>window.print();
$('sources').innerHTML='<ul>'+sourceLinks.map(([label,href])=>`<li><a href="${href}" target="_blank" rel="noopener noreferrer">${label} ↗</a></li>`).join('')+'</ul>';
syncInputs();render();
