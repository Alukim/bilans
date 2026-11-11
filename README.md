# Bilans — symulator podatków 2026 / 2027

Samodzielna aplikacja po polsku: UoP, UoP z 50% kosztami autorskimi, JDG na skali, liniowym i ryczałcie. PIT, ZUS, zdrowotna, VAT, koszt pracodawcy, PPK, wspólny PIT oraz IKZE obojga małżonków. Porównanie roczne, wykres miesięczny, własny plan 12 miesięcy, eksport CSV, zapis i import JSON, druk do PDF.

## Uruchomienie

Otwórz `index.html` w przeglądarce. Nie trzeba instalować żadnych zależności. Alternatywnie:

```sh
cd podatki-lab
python3 -m http.server 4173 --bind 127.0.0.1
```

Następnie otwórz `http://127.0.0.1:4173`.

Dane zapisują się w localStorage tej przeglądarki, osobno dla adresu strony. Nie są wysyłane na serwer. W trybie pliku dostępność localStorage zależy od przeglądarki; eksport JSON umożliwia przenoszenie scenariuszy. Zmiana domeny nie przenosi danych automatycznie. Aplikacja nie używa zewnętrznych fontów, skryptów, analityki ani API.

## FTP / hosting statyczny

Wgraj **zawartość** katalogu `dist/` do katalogu strony, np. `public_html/bilans/`. Albo rozpakuj gotowy `bilans-hosting.zip`. Pliki odwołują się do siebie względnymi ścieżkami: aplikacja działa także w podkatalogu, bez reguł przepisywania adresów.

Po zmianach w źródłach odśwież wersję hostingową:

```sh
npm run build
```

Budowanie wymaga tylko Node.js, nie wymaga `npm install`.

## GitHub Pages — automatycznie przez Actions

Gotowy workflow: `.github/workflows/pages.yml`.

1. Rozpakuj `bilans-github.zip` i umieść jego **zawartość w głównym katalogu repozytorium**, łącznie z ukrytym folderem `.github`. Na Macu ukryte pliki pokazuje skrót `Cmd+Shift+.`. Do tego wariantu potrzebujesz źródeł (w tym `package.json`, `scripts/` i `tests/`), a nie samej paczki hostingowej `dist/`.
2. Ustaw **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Wypchnij zmiany do gałęzi `main`. Możesz też wybrać **Actions → Test and deploy Bilans → Run workflow**, na gałęzi `main`.

Każdy push do `main` sprawdza składnię JavaScript, uruchamia testy obliczeń, generuje `dist/` i publikuje wyłącznie ten katalog. Pull requesty do `main` uruchamiają testy i budowanie bez publikacji. Nieudane testy blokują deployment. Adres strony jest widoczny w wyniku zadania `Publish GitHub Pages` oraz w Settings → Pages.

Nie trzeba dodawać własnego tokenu ani sekretów: workflow używa automatycznego tokenu GitHub i OIDC. Testy obliczeń i budowanie nie potrzebują zależności npm; testy przeglądarkowe pozostają lokalne (`npm run test:browser`). Workflow zakłada gałąź `main`; przy innej nazwie zmień oba filtry `branches` i oba warunki `refs/heads/main` w pliku YAML. Plik workflow musi być w `.github/workflows/` głównego katalogu repozytorium, nie wewnątrz dodatkowego folderu `podatki-lab`.

Jeżeli wcześniej publikowałeś przez „Deploy from a branch”, przełącz źródło na „GitHub Actions”. Nie trzeba ręcznie aktualizować `dist/` w repozytorium — workflow tworzy go ze źródeł przy każdym uruchomieniu. Sam plik YAML został przygotowany lokalnie; publikacja nastąpi dopiero po dodaniu do Twojego repozytorium i włączeniu Pages.

Dokumentacja: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Alternatywa ręczna: wgraj zawartość `dist/` do głównego katalogu repozytorium i ustaw Pages na „Deploy from a branch”, `main`, `/(root)`.

## Lata i stawki

- **2026:** bazowe wartości zweryfikowane w źródłach MF / ZUS / MRPiPS 7.11.2026.
- **2027:** jawnie oznaczona symulacja. Płaca minimalna 4 950 zł. Dla podstawy ZUS, limitu składek i IKZE użyto założenia prognozowanego wynagrodzenia 10 033 zł; kwot tych nie udało się w tym przeglądzie potwierdzić w treści pierwotnych obwieszczeń, mimo odnalezienia ich wpisów. Zdrowotna ryczałtu i limit odliczenia zdrowotnej liniowego pozostają wartościami 2026. Skala domyślnie 2026. Osobny przycisk wczytuje projekt UD458: progi 130 / 150 tys. zł i stawki 12 / 24 / 32%. Nie przedstawiamy projektu jako obowiązującej ustawy. Pozostałych projektowanych zmian UD458 (ryczałt, danina) przycisk nie wprowadza.
- Każdy parametr jest widoczny i edytowalny. Własne stawki zapisują się osobno dla każdego roku. Kwoty pochodne są niezależnymi polami — zmieniając płacę minimalną, zaktualizuj też minimum zdrowotnej, jeżeli tak zakłada Twój scenariusz.

Odnośniki do źródeł znajdują się w aplikacji, sekcja „Jak czytać te wyniki?” → „Źródła i status danych”.

## Oświadczenie u pracodawcy i ulga na dzieci

W sekcji etatu można włączyć „UoP: oświadczenie o wspólnym PIT u pracodawcy” i wybrać miesiąc, od którego pracodawca je stosuje. To symulacja art. 32 ust. 3 PIT: gdy spełniona jest prognoza dochodów, zmienia zaliczki i kwotę na rękę, ale nie końcowy podatek roczny. Nie zastępuje progu 120 tys. zł progiem 240 tys. zł w naliczaniu pensji. Mechanizm działa dla bazowej dwustopniowej skali; przy zmianie parametrów skali (np. projekt 2027) jest wyłączony. Model nie symuluje oświadczenia u pracodawcy żony. Źródło: objaśnienia MF z 29.08.2023, str. 25 (link w aplikacji).

Moduł dzieci obsługuje do 10 dzieci i ciągły okres uprawnienia (od–do miesiąca) dla każdego. Prawo do ulgi wymaga zaznaczenia potwierdzenia — wiek, naukę, dochody dorosłych dzieci i warunki wykonywania pieczy sprawdza użytkownik. Wysokość ulgi zależy od liczby dzieci w każdym miesiącu. Przy jednym dziecku model sprawdza limit dochodu przed IKZE (na liniowym po odliczeniu zdrowotnej); dostępny jest wyjątek niepełnosprawności. Nie uwzględnia przychodów z ryczałtu w tym limicie. Gdy dwoje dzieci nie ma ani jednego wspólnego miesiąca uprawnienia, limit jednego dziecka nadal obowiązuje. Pozostałe dochody można dopisać wyłącznie do testu limitu.

Ulga pomniejsza PIT w rozliczeniu rocznym. Dodatkowy zwrot jest pokazany osobno i zawarty w saldzie zwrotu / dopłaty. Limit zwrotu oparty jest na modelowych składkach społecznych i zdrowotnych ze skali, bez FP oraz składek odliczonych na liniowym / ryczałcie. Przy małżeństwie przez cały rok stosowana jest wspólna pula składek. Rzeczywisty limit wymaga sprawdzenia zapłaconych składek i pozostałych zeznań. Przy osobnym PIT udział rodziców jest edytowalny; na liniowym / ryczałcie ulgę przypisujemy żonie na skali. Wspólny podatek pomniejszony o dodatkowy zwrot stanowi koszt dzielony umownie między osoby w tabeli rodzinnej.

Nie obsługujemy dziennego podziału pieczy, wielu rozłącznych okresów, zwolnienia przychodów PIT-0 dla rodzin 4+, ani preferencyjnego PIT samotnego rodzica (checkbox samotnego rodzica dotyczy wyłącznie limitu ulgi na dzieci). Stawki dzieci 2027 są założeniem kontynuacji 2026 i podlegają edycji.

## Rozpiska rodziny

Sekcja „Osobno czy wspólnie?” dotyczy wariantu wybranego w szczegółach. Pokazuje trzy perspektywy: Ty, żona i rodzina. Porównuje PIT oraz budżet po PIT, daninie i IKZE przy rozliczeniu osobnym i wspólnym; pokazuje różnicę roczną. Średnie miesięczne to kwoty na rękę po zaliczkach, przed rocznym PIT i wpłatami IKZE. Zwrot / dopłata PIT i korzyść IKZE są prezentowane wyłącznie rocznie; korzyść IKZE jest już uwzględniona w saldzie PIT, więc nie sumujemy ich ponownie. Niżej znajdują się pełne roczne dane każdej osoby oraz miesięczne wypłaty po zaliczkach. Eksport CSV rodziny zawiera oba zestawienia.

Wspólny podatek jest jednym zobowiązaniem. Jego podział na osoby to wyłącznie założenie budżetowe. Domyślnie dzielona jest oszczędność po połowie (udział można zmienić). Można też podzielić wspólny podatek po połowie lub proporcjonalnie do podstaw po IKZE. Indywidualna strata przy takim podziale nie oznacza, że wspólny PIT zwiększa całkowity podatek rodziny. Ujemny przypisany PIT oznacza wewnętrzną korzyść / transfer, nie ujemny podatek należny urzędowi. Salda wspólnego rozliczenia przypisane osobom również nie oznaczają odrębnych zwrotów z urzędu. Podział nie wpływa na sumę rodziny ani miesięczne zaliczki.

Dla wariantu wykluczającego wspólny PIT wyświetlane są rozliczenia osobne i ich suma, a pola wspólne są niedostępne. Żona nadal jest modelowana jako osoba na jednym etacie (lub bez dochodów).

## Model i ograniczenia

To kalkulator porównawczy, a nie program kadrowo-księgowy. Obsługuje jeden etat **albo** JDG przez pełny rok. Małżonek: jeden etat lub brak dochodów. Nie sumuje etatu z JDG; nie ocenia prawa do 50% KUP, ulg ZUS, stawki ryczałtu ani zwolnienia VAT. Pomija m.in. ulgę dla młodych, IP Box, choroby, wakacje składkowe, straty z wcześniejszych lat i szczególne zwolnienia z funduszy.

W JDG model przypisuje roczny ekonomiczny koszt zdrowotnej do analizowanego dochodu, rozkłada go równo na 12 miesięcy i zakłada odliczenie przypisanych składek. To **nie kalendarz płatności i odliczeń faktycznie zapłaconych składek**. Na skali i liniowym minimum zdrowotnej dotyczy roku składkowego luty–styczeń. Na ryczałcie od razu stosowany jest końcowy próg do całego roku; możliwe groszowe różnice z rozliczeniem ZUS wynikającym z zaokrągleń podstaw. Ujemny VAT to docelowa nadwyżka do rozliczenia, nie obietnica zwrotu w danym miesiącu.

IKZE: wpłata ograniczona limitem wariantu; odliczenie ograniczone własnym dochodem. Ulga dopiero w rocznym PIT. Budżet po IKZE odejmuje wpłaty; pieniądze na IKZE pozostają oszczędnościami. Danina solidarnościowa liczona osobno dla małżonków, bez odliczenia IKZE. Wspólne rozliczenie tylko dla skali i etatu przy zaznaczeniu spełnienia warunków. Aktywna działalność liniowa / ryczałt wyklucza je w modelu.

Pełniejsze objaśnienia dostępne są przy wynikach w aplikacji.

## Rozwój i testy

```sh
npm test
npm run build
npm install
npm run test:browser
```

Testy obliczeń korzystają wyłącznie z Node.js. Testy interfejsu używają Playwright i zainstalowanego Google Chrome. Otwierają gotową wersję `dist/index.html` bez serwera, testują wersję desktop i mobilną, import / eksport, dane miesięczne, oba lata i brak zewnętrznych żądań. Zrzuty zapisują do `artifacts/`.

Pliki: `engine.js` — czyste funkcje obliczeń i bazowe parametry; `app.js` — interfejs i zapis; `index.html` / `style.css` — widok; `tests/` — testy; `dist/` — gotowe pliki do publikacji.

## Dodatkowe zlecenie przy UoP

Włącz „Dolicz moje zlecenie do wariantów UoP”, wpisz brutto miesięczne (podpowiedź: 9000 zł) i wybierz własnego pracodawcę / pracę na jego rzecz albo inną firmę. Zlecenie jest wyłączone domyślnie, także przy wczytywaniu wcześniejszych scenariuszy. JDG nadal używa łącznego przychodu faktur: nie dolicza tej kwoty ponownie.

Model obejmuje stałą wypłatę zlecenia przez 12 miesięcy. Przy innym zleceniodawcy i etacie co najmniej minimalnym nalicza tylko zdrowotną. Poniżej minimum nalicza społeczne, a chorobowe według wyboru. Przy własnym pracodawcy społeczne i chorobowe są obowiązkowe. W miesiącu przekroczenia wspólnego limitu emerytalno-rentowego pozostała podstawa jest dzielona proporcjonalnie; zakładamy wypłaty w tym samym miesiącu i prawidłową informację płatników o limicie. Wysokość miesięcznego etatu jest używana jako wynagrodzenie do oceny zbiegu; model nie obejmuje absencji ani szczególnych przypadków przeliczania do pełnego miesiąca.

KUP zlecenia wynoszą 20% po składkach społecznych, bez autorskich KUP. Zaliczka jest pobierana według pierwszej stawki (12% bazowo) przez cały rok, PIT-2 pozostaje na etacie. Końcowy PIT sumuje dochody, uwzględnia wspólne rozliczenie, IKZE i ulgę na dzieci. Oświadczenie o wspólnym PIT zmienia wyłącznie zaliczki etatu. Średnie miesięczne i wykres zawierają faktyczne modelowe wypłaty obu umów; dopłata/zwrot pozostaje w rocznym rozliczeniu. Tabela miesięczna i CSV rozdzielają wypłaty etatu i zlecenia.

PPK u własnego pracodawcy korzysta z ustawień etatu; u innej firmy zakładamy brak PPK i brak dobrowolnych emerytalno-rentowych. Model nie obejmuje studentów do 26 lat, PIT-0, małych umów opodatkowanych ryczałtowo do 200 zł, wniosku o wyższą zaliczkę ani zlecenia wykonywanego w ramach JDG. Założenia zlecenia dla 2027 kontynuują model 2026.

Źródła: [MF – zlecenie](https://podatki.gov.pl/podatki-osobiste/pit/informacje-podstawowe/co-jest-opodatkowane/dochody-z-umowy-zlecenia-lub-o-dzielo), [Biznes.gov.pl – zbieg etatu i zlecenia](https://biznes.gov.pl/pl/portal/001785).
