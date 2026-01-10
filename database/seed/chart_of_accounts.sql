-- ============================================================================
-- FinGuard - Chart of Accounts Seed Data
-- Planul de Conturi General conform legislației românești
-- Version: 1.0
-- Date: 2026-01-10
-- ============================================================================

-- Descriere:
-- Acest fișier conține Planul de Conturi General pentru România conform cu
-- OMFP 1802/2014. Aceste conturi sunt sistem (is_system = true) și vor fi
-- disponibile pentru toate companiile ca referință.

-- ============================================================================
-- CLASA 1: CONTURI DE CAPITALURI (EQUITY)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

-- Nivel 1
('10', 'Capital și rezerve', 'equity', NULL, 1, true),
('11', 'Rezultatul reportat', 'equity', NULL, 1, true),
('12', 'Rezultatul exercițiului', 'equity', NULL, 1, true),
('13', 'Subvenții pentru investiții', 'equity', NULL, 1, true),
('14', 'Provizioane reglementate', 'equity', NULL, 1, true),
('15', 'Datorii care trebuie înregistrate în conturi de capitaluri proprii', 'equity', NULL, 1, true),

-- Nivel 2 - Capital social
('101', 'Capital subscris vărsat', 'equity', '10', 2, true),
('1011', 'Capital subscris nevărsat', 'equity', '101', 3, true),
('1012', 'Capital subscris vărsat', 'equity', '101', 3, true),

-- Rezerve
('105', 'Rezerve', 'equity', '10', 2, true),
('1051', 'Rezerve legale', 'equity', '105', 3, true),
('1052', 'Rezerve statutare', 'equity', '105', 3, true),
('1053', 'Rezerve pentru acțiuni proprii', 'equity', '105', 3, true),

-- Prime legate de capital
('104', 'Prime legate de capital', 'equity', '10', 2, true),
('1041', 'Prime de capital', 'equity', '104', 3, true),
('1042', 'Prime de fuziune', 'equity', '104', 3, true),
('1043', 'Prime de aport', 'equity', '104', 3, true),

-- Rezultat reportat
('117', 'Rezultat reportat provenit din corectarea erorilor contabile', 'equity', '11', 2, true),
('118', 'Rezultat reportat din aplicarea IAS 29', 'equity', '11', 2, true),

-- Rezultatul exercițiului
('121', 'Profit sau pierdere', 'equity', '12', 2, true),
('129', 'Repartizarea profitului', 'equity', '12', 2, true);

-- ============================================================================
-- CLASA 2: CONTURI DE ACTIVE IMOBILIZATE (NON-CURRENT ASSETS)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

-- Imobilizări necorporale
('20', 'Imobilizări necorporale', 'asset', NULL, 1, true),
('201', 'Cheltuieli de constituire', 'asset', '20', 2, true),
('203', 'Cheltuieli de dezvoltare', 'asset', '20', 2, true),
('205', 'Concesiuni, brevete, licențe, mărci comerciale', 'asset', '20', 2, true),
('207', 'Fond comercial', 'asset', '20', 2, true),
('208', 'Alte imobilizări necorporale', 'asset', '20', 2, true),

-- Imobilizări corporale
('21', 'Imobilizări corporale', 'asset', NULL, 1, true),
('211', 'Terenuri și amenajări de terenuri', 'asset', '21', 2, true),
('2111', 'Terenuri', 'asset', '211', 3, true),
('2112', 'Amenajări de terenuri', 'asset', '211', 3, true),
('212', 'Construcții', 'asset', '21', 2, true),
('213', 'Instalații tehnice și mașini', 'asset', '21', 2, true),
('214', 'Aparate și instalații de măsurare, control și reglare', 'asset', '21', 2, true),
('215', 'Mijloace de transport', 'asset', '21', 2, true),
('216', 'Animale și plantații', 'asset', '21', 2, true),
('217', 'Mobilier, aparatură birotică, echipamente de protecție', 'asset', '21', 2, true),
('218', 'Alte imobilizări corporale', 'asset', '21', 2, true),

-- Imobilizări financiare
('26', 'Imobilizări financiare', 'asset', NULL, 1, true),
('261', 'Acțiuni deținute la entitățile afiliate', 'asset', '26', 2, true),
('263', 'Împrumuturi acordate entităților afiliate', 'asset', '26', 2, true),
('265', 'Titluri de participare', 'asset', '26', 2, true),
('267', 'Creanțe imobilizate', 'asset', '26', 2, true),
('268', 'Alte imobilizări financiare', 'asset', '26', 2, true),

-- Amortizări
('28', 'Amortizări privind imobilizările', 'asset', NULL, 1, true),
('280', 'Amortizări privind imobilizările necorporale', 'asset', '28', 2, true),
('281', 'Amortizări privind imobilizările corporale', 'asset', '28', 2, true),
('2811', 'Amortizarea amenajărilor de terenuri', 'asset', '281', 3, true),
('2812', 'Amortizarea construcțiilor', 'asset', '281', 3, true),
('2813', 'Amortizarea instalațiilor tehnice și mașinilor', 'asset', '281', 3, true),
('2814', 'Amortizarea aparatelor și instalațiilor de măsurare', 'asset', '281', 3, true),
('2815', 'Amortizarea mijloacelor de transport', 'asset', '281', 3, true),

-- Provizioane pentru deprecierea imobilizărilor
('29', 'Ajustări pentru deprecierea imobilizărilor', 'asset', NULL, 1, true),
('290', 'Ajustări pentru deprecierea imobilizărilor necorporale', 'asset', '29', 2, true),
('291', 'Ajustări pentru deprecierea imobilizărilor corporale', 'asset', '29', 2, true),
('296', 'Ajustări pentru deprecierea imobilizărilor financiare', 'asset', '29', 2, true);

-- ============================================================================
-- CLASA 3: CONTURI DE STOCURI ȘI PRODUCȚIE ÎN CURS (INVENTORY)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

('30', 'Stocuri de materii prime', 'asset', NULL, 1, true),
('301', 'Materii prime', 'asset', '30', 2, true),
('302', 'Materiale consumabile', 'asset', '30', 2, true),
('303', 'Materiale de natura obiectelor de inventar', 'asset', '30', 2, true),

('32', 'Stocuri de materii și materiale aflate la terți', 'asset', NULL, 1, true),

('33', 'Producție în curs de execuție', 'asset', NULL, 1, true),
('331', 'Produse în curs de execuție', 'asset', '33', 2, true),
('332', 'Lucrări și servicii în curs de execuție', 'asset', '33', 2, true),

('34', 'Produse', 'asset', NULL, 1, true),
('341', 'Produse finite', 'asset', '34', 2, true),
('345', 'Produse reziduale', 'asset', '34', 2, true),

('35', 'Stocuri aflate la terți', 'asset', NULL, 1, true),

('36', 'Animale', 'asset', NULL, 1, true),
('361', 'Animale și păsări', 'asset', '36', 2, true),

('37', 'Mărfuri', 'asset', NULL, 1, true),
('371', 'Mărfuri', 'asset', '37', 2, true),

('38', 'Diferențe de preț la stocuri', 'asset', NULL, 1, true),

('39', 'Ajustări pentru deprecierea stocurilor', 'asset', NULL, 1, true),
('391', 'Ajustări pentru deprecierea materiilor prime', 'asset', '39', 2, true),
('394', 'Ajustări pentru deprecierea produselor', 'asset', '39', 2, true),
('397', 'Ajustări pentru deprecierea mărfurilor', 'asset', '39', 2, true);

-- ============================================================================
-- CLASA 4: CONTURI DE TERȚI (RECEIVABLES & PAYABLES)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

-- Furnizori
('40', 'Furnizori și conturi asimilate', 'liability', NULL, 1, true),
('401', 'Furnizori', 'liability', '40', 2, true),
('403', 'Efecte de plătit', 'liability', '40', 2, true),
('404', 'Furnizori de imobilizări', 'liability', '40', 2, true),
('405', 'Efecte de plătit pentru imobilizări', 'liability', '40', 2, true),
('408', 'Furnizori - facturi nesosite', 'liability', '40', 2, true),
('409', 'Furnizori - debitori', 'liability', '40', 2, true),

-- Clienți
('41', 'Clienți și conturi asimilate', 'asset', NULL, 1, true),
('411', 'Clienți', 'asset', '41', 2, true),
('413', 'Efecte de primit de la clienți', 'asset', '41', 2, true),
('418', 'Clienți - facturi de întocmit', 'asset', '41', 2, true),
('419', 'Clienți - creditori', 'asset', '41', 2, true),

-- Personal și conturi asimilate
('42', 'Personal și conturi asimilate', 'liability', NULL, 1, true),
('421', 'Personal - salarii datorate', 'liability', '42', 2, true),
('423', 'Personal - ajutoare materiale datorate', 'liability', '42', 2, true),
('424', 'Prime reprezentând participarea personalului la profit', 'liability', '42', 2, true),
('425', 'Avansuri acordate personalului', 'asset', '42', 2, true),
('426', 'Drepturi de personal neridicate', 'liability', '42', 2, true),
('427', 'Rețineri din salarii datorate terților', 'liability', '42', 2, true),
('428', 'Alte datorii și creanțe în legătură cu personalul', 'liability', '42', 2, true),

-- Asigurări sociale și protecția socială
('43', 'Asigurări sociale, protecția socială și conturi asimilate', 'liability', NULL, 1, true),
('431', 'Asigurări sociale', 'liability', '43', 2, true),
('4311', 'Contribuția angajatorului pentru asigurări sociale', 'liability', '431', 3, true),
('4312', 'Contribuția personalului pentru asigurări sociale', 'liability', '431', 3, true),
('436', 'Alte datorii sociale', 'liability', '43', 2, true),
('437', 'Protecția socială', 'liability', '43', 2, true),

-- Buget
('44', 'Buget', 'liability', NULL, 1, true),
('441', 'TVA de plată', 'liability', '44', 2, true),
('4423', 'TVA de recuperat', 'asset', '44', 2, true),
('4424', 'TVA decontată', 'asset', '44', 2, true),
('4426', 'TVA deductibilă', 'asset', '44', 2, true),
('4427', 'TVA colectată', 'liability', '44', 2, true),
('444', 'Impozitul pe profit', 'liability', '44', 2, true),
('446', 'Alte impozite, taxe și vărsăminte asimilate', 'liability', '44', 2, true),
('447', 'Fonduri speciale - taxe și vărsăminte asimilate', 'liability', '44', 2, true),
('448', 'Alte datorii și creanțe cu bugetul statului', 'liability', '44', 2, true),

-- Acționari/Asociați
('45', 'Grup și asociați', 'liability', NULL, 1, true),
('451', 'Operațiuni în cadrul grupului', 'liability', '45', 2, true),
('455', 'Sume datorate de asociați', 'asset', '45', 2, true),
('456', 'Asociați - conturi curente', 'liability', '45', 2, true),
('457', 'Dividende de plată', 'liability', '45', 2, true),
('458', 'Asociați - operațiuni în comun și în participație', 'liability', '45', 2, true),

-- Debitori și creditori diverși
('46', 'Debitori și creditori diverși', 'liability', NULL, 1, true),
('461', 'Debitori diverși', 'asset', '46', 2, true),
('462', 'Creditori diverși', 'liability', '46', 2, true),
('465', 'Conturi curente asociați', 'liability', '46', 2, true),
('471', 'Cheltuieli înregistrate în avans', 'asset', '47', 2, true),
('472', 'Venituri înregistrate în avans', 'liability', '47', 2, true),

-- Conturi de regularizare
('47', 'Conturi de regularizare', 'asset', NULL, 1, true),

-- Ajustări pentru deprecierea creanțelor
('49', 'Ajustări pentru deprecierea creanțelor', 'asset', NULL, 1, true),
('491', 'Ajustări pentru deprecierea clienților', 'asset', '49', 2, true),
('495', 'Ajustări pentru deprecierea conturilor de asociați', 'asset', '49', 2, true),
('496', 'Ajustări pentru deprecierea debitorilor diverși', 'asset', '49', 2, true);

-- ============================================================================
-- CLASA 5: CONTURI DE TREZORERIE (CASH & BANK)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

-- Conturi la bănci
('51', 'Conturi la bănci în lei', 'asset', NULL, 1, true),
('5112', 'Conturi curente la bănci', 'asset', '51', 2, true),
('5121', 'Conturi la bănci în valută', 'asset', '51', 2, true),

-- Casa
('53', 'Casa', 'asset', NULL, 1, true),
('531', 'Casa în lei', 'asset', '53', 2, true),
('532', 'Casa în valută', 'asset', '53', 2, true),

-- Acreditive
('54', 'Acreditive', 'asset', NULL, 1, true),
('541', 'Acreditive în lei', 'asset', '54', 2, true),
('542', 'Acreditive în valută', 'asset', '54', 2, true),

-- Viramente interne
('58', 'Viramente interne', 'asset', NULL, 1, true),
('581', 'Viramente interne', 'asset', '58', 2, true);

-- ============================================================================
-- CLASA 6: CONTURI DE CHELTUIELI (EXPENSES)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

-- Cheltuieli cu materiile prime
('60', 'Cheltuieli cu materiile prime', 'expense', NULL, 1, true),
('601', 'Cheltuieli cu materiile prime', 'expense', '60', 2, true),
('602', 'Cheltuieli cu materialele consumabile', 'expense', '60', 2, true),

-- Cheltuieli cu alte stocuri
('61', 'Cheltuieli privind stocurile', 'expense', NULL, 1, true),

-- Cheltuieli cu servicii executate de terți
('62', 'Cheltuieli cu servicii executate de terți', 'expense', NULL, 1, true),
('621', 'Cheltuieli cu întreținerea și reparațiile', 'expense', '62', 2, true),
('622', 'Cheltuieli privind redevențele, locațiile de gestiune', 'expense', '62', 2, true),
('623', 'Cheltuieli de protocol, reclamă și publicitate', 'expense', '62', 2, true),
('624', 'Cheltuieli cu transportul de bunuri și de personal', 'expense', '62', 2, true),
('625', 'Cheltuieli cu deplasări, detașări și transferări', 'expense', '62', 2, true),
('626', 'Cheltuieli poștale și taxe de telecomunicații', 'expense', '62', 2, true),
('627', 'Cheltuieli cu serviciile bancare', 'expense', '62', 2, true),
('628', 'Alte cheltuieli cu serviciile executate de terți', 'expense', '62', 2, true),

-- Alte cheltuieli cu serviciile
('63', 'Cheltuieli cu alte servicii executate de terți', 'expense', NULL, 1, true),

-- Cheltuieli cu personalul
('64', 'Cheltuieli cu personalul', 'expense', NULL, 1, true),
('641', 'Cheltuieli cu salariile personalului', 'expense', '64', 2, true),
('642', 'Cheltuieli cu avantajele în natură', 'expense', '64', 2, true),
('643', 'Cheltuieli cu primele personalului', 'expense', '64', 2, true),
('644', 'Cheltuieli cu indemnizațiile personalului', 'expense', '64', 2, true),
('645', 'Cheltuieli cu contribuțiile angajatorului', 'expense', '64', 2, true),
('646', 'Cheltuieli sociale', 'expense', '64', 2, true),

-- Alte cheltuieli de exploatare
('65', 'Alte cheltuieli de exploatare', 'expense', NULL, 1, true),
('651', 'Cheltuieli cu impozite, taxe și vărsăminte asimilate', 'expense', '65', 2, true),
('652', 'Cheltuieli cu TVA nerecuperabilă', 'expense', '65', 2, true),
('654', 'Pierderi din creanțe și debitori diverși', 'expense', '65', 2, true),
('658', 'Alte cheltuieli de exploatare', 'expense', '65', 2, true),

-- Cheltuieli financiare
('66', 'Cheltuieli financiare', 'expense', NULL, 1, true),
('663', 'Cheltuieli privind investițiile financiare cedate', 'expense', '66', 2, true),
('664', 'Cheltuieli privind investițiile financiare', 'expense', '66', 2, true),
('665', 'Cheltuieli din diferențe de curs valutar', 'expense', '66', 2, true),
('666', 'Cheltuieli privind dobânzile', 'expense', '66', 2, true),
('667', 'Cheltuieli privind sconturile acordate', 'expense', '66', 2, true),
('668', 'Alte cheltuieli financiare', 'expense', '66', 2, true),

-- Cheltuieli extraordinare
('67', 'Cheltuieli extraordinare', 'expense', NULL, 1, true),
('671', 'Cheltuieli extraordinare', 'expense', '67', 2, true),

-- Cheltuieli de exploatare privind amortizările
('68', 'Cheltuieli de exploatare privind amortizările, provizioanele și ajustările', 'expense', NULL, 1, true),
('681', 'Cheltuieli de exploatare privind amortizările și provizioanele', 'expense', '68', 2, true),
('6811', 'Cheltuieli cu amortizarea imobilizărilor necorporale', 'expense', '681', 3, true),
('6812', 'Cheltuieli cu amortizarea imobilizărilor corporale', 'expense', '681', 3, true),
('686', 'Cheltuieli privind ajustările pentru deprecierea activelor circulante', 'expense', '68', 2, true);

-- ============================================================================
-- CLASA 7: CONTURI DE VENITURI (REVENUES)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

-- Venituri din vânzarea mărfurilor
('70', 'Venituri din vânzarea mărfurilor', 'revenue', NULL, 1, true),
('707', 'Venituri din vânzarea mărfurilor', 'revenue', '70', 2, true),

-- Venituri din producția vândută
('71', 'Venituri aferente costurilor stocurilor de produse', 'revenue', NULL, 1, true),

-- Venituri din producția de imobilizări
('72', 'Venituri din producția de imobilizări', 'revenue', NULL, 1, true),

-- Venituri din activități diverse
('74', 'Venituri din lucrări executate și servicii prestate', 'revenue', NULL, 1, true),
('741', 'Venituri din lucrări executate', 'revenue', '74', 2, true),
('742', 'Venituri din prestări de servicii', 'revenue', '74', 2, true),

-- Alte venituri din exploatare
('75', 'Alte venituri din exploatare', 'revenue', NULL, 1, true),
('754', 'Venituri din creanțe reactivate și debitori diverși', 'revenue', '75', 2, true),
('758', 'Alte venituri din exploatare', 'revenue', '75', 2, true),

-- Venituri financiare
('76', 'Venituri financiare', 'revenue', NULL, 1, true),
('761', 'Venituri din investiții financiare', 'revenue', '76', 2, true),
('762', 'Venituri din dobânzi', 'revenue', '76', 2, true),
('763', 'Venituri din investiții financiare cedate', 'revenue', '76', 2, true),
('765', 'Venituri din diferențe de curs valutar', 'revenue', '76', 2, true),
('766', 'Venituri din dobânzi', 'revenue', '76', 2, true),
('767', 'Venituri din sconturi obținute', 'revenue', '76', 2, true),
('768', 'Alte venituri financiare', 'revenue', '76', 2, true),

-- Venituri extraordinare
('77', 'Venituri extraordinare', 'revenue', NULL, 1, true),
('771', 'Venituri extraordinare', 'revenue', '77', 2, true),

-- Venituri din ajustări și provizioane
('78', 'Venituri din ajustări pentru deprecierea activelor și provizioane', 'revenue', NULL, 1, true),
('781', 'Venituri din provizioane privind imobilizările', 'revenue', '78', 2, true),
('786', 'Venituri din ajustări privind activele circulante', 'revenue', '78', 2, true);

-- ============================================================================
-- CLASA 8: CONTURI SPECIALE (SPECIAL ACCOUNTS)
-- ============================================================================

INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, level, is_system) VALUES

('80', 'Conturi speciale', 'other', NULL, 1, true);

-- ============================================================================
-- VERIFICARE ȘI STATISTICI
-- ============================================================================

-- Query pentru verificare distribuție conturi pe tipuri
SELECT 
    account_type,
    COUNT(*) as total_accounts,
    COUNT(CASE WHEN level = 1 THEN 1 END) as level_1,
    COUNT(CASE WHEN level = 2 THEN 1 END) as level_2,
    COUNT(CASE WHEN level = 3 THEN 1 END) as level_3
FROM chart_of_accounts
WHERE is_system = true
GROUP BY account_type
ORDER BY account_type;

-- Query pentru listare ierarhică
SELECT 
    CASE 
        WHEN level = 1 THEN account_code
        WHEN level = 2 THEN '  ' || account_code
        WHEN level = 3 THEN '    ' || account_code
    END as code,
    account_name,
    account_type
FROM chart_of_accounts
WHERE is_system = true
ORDER BY account_code;

-- ============================================================================
-- COMENTARII
-- ============================================================================

COMMENT ON TABLE chart_of_accounts IS 
'Plan de conturi conform OMFP 1802/2014. Conturile sistem (is_system=true) sunt disponibile pentru toate companiile.';

-- Note:
-- 1. Clasa 1: Capitaluri și rezerve
-- 2. Clasa 2: Imobilizări (active fixe)
-- 3. Clasa 3: Stocuri și producție
-- 4. Clasa 4: Terți (clienți, furnizori, personal, stat)
-- 5. Clasa 5: Trezorerie (bănci, casa)
-- 6. Clasa 6: Cheltuieli
-- 7. Clasa 7: Venituri
-- 8. Clasa 8: Conturi speciale

-- ============================================================================
-- END OF CHART OF ACCOUNTS SEED DATA
-- ============================================================================
