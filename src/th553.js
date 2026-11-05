/* P3 · Therapeutics III (PHAR 553 Fall 2026): disease-state questions by syllabus topic */
const T5 = (t, d, q, a, w, e) => Q("T553", d, q, a, w, e, t);

/* ---------- Asthma ---------- */
T5("Asthma",2,"For adults and adolescents with asthma, which reliever approach is preferred by GINA?","Low-dose ICS-formoterol taken as needed",["Albuterol alone as needed","Daily montelukast with albuterol as needed","Oral prednisone at the first sign of symptoms"],"Treating symptoms with an inhaled corticosteroid plus formoterol lowers exacerbation risk compared with a SABA alone.");
T5("Asthma",1,"Which drug class is the most effective controller for persistent asthma?","Inhaled corticosteroids",["Long-acting beta agonist monotherapy","Cromolyn","Theophylline"],"ICS reduce airway inflammation, symptoms and exacerbations more than any other single controller.");
T5("Asthma",2,"Why is LABA monotherapy avoided in asthma?","It raises the risk of asthma-related death",["It causes tolerance to inhaled steroids","It has no bronchodilating effect","It causes adrenal suppression"],"A LABA must always be paired with an ICS in asthma (for example budesonide-formoterol).");
T5("Asthma",1,"Which counseling point lowers the risk of oral thrush with an inhaled corticosteroid?","Rinse the mouth with water and spit after each dose",["Take the dose with milk","Use the inhaler only at night","Hold the breath for 60 seconds"],"Rinsing removes drug from the mouth and throat. A spacer also reduces deposition.");
T5("Asthma",2,"Which asthma biologic targets IgE?","Omalizumab",["Mepolizumab","Dupilumab","Tezepelumab"],"Omalizumab binds IgE in allergic asthma. Mepolizumab targets IL-5, dupilumab IL-4 receptor alpha and tezepelumab TSLP.");

/* ---------- COPD ---------- */
T5("COPD",2,"What is the initial pharmacotherapy for GOLD group E COPD (high exacerbation risk)?","LABA + LAMA",["SABA alone as needed","ICS alone","Theophylline"],"Dual bronchodilation is preferred. Add an ICS if blood eosinophils are 300 cells/uL or more.");
T5("COPD",2,"Which blood eosinophil count favors adding an ICS in COPD?","300 cells/uL or higher",["Below 50 cells/uL","Below 100 cells/uL","Any count"],"High eosinophils predict benefit from ICS. Counts below 100 cells/uL predict little benefit and more pneumonia risk.");
T5("COPD",3,"Which drug is a selective PDE-4 inhibitor used for COPD with chronic bronchitis and exacerbations?","Roflumilast",["Tiotropium","Azithromycin","Formoterol"],"Roflumilast can cause weight loss, diarrhea, insomnia and psychiatric effects.");
T5("COPD",3,"Long-term azithromycin to prevent COPD exacerbations requires monitoring for:","QT prolongation and hearing loss",["Pulmonary fibrosis and thyroid dysfunction","Hypoglycemia and weight gain","Tendon rupture and cough"],"Check an ECG for QT prolongation and screen hearing. It is used mainly in former smokers.");
T5("COPD",2,"Long-term oxygen therapy is indicated when resting PaO2 is at or below:","55 mmHg (or SpO2 88% or lower)",["70 mmHg","80 mmHg","SpO2 94% or lower"],"Survival benefit is shown for at least 15 hours a day of oxygen in severe resting hypoxemia.");

/* ---------- Renal and acid-base ---------- */
T5("Renal and acid-base",2,"An eGFR of 30 to 44 mL/min/1.73 m2 is CKD stage:","G3b",["G2","G3a","G4"],"G3a is 45 to 59 and G4 is 15 to 29.");
T5("Renal and acid-base",2,"Which class is first line for hypertension in CKD with albuminuria?","ACE inhibitor or ARB",["Dihydropyridine calcium channel blocker","Beta blocker","Loop diuretic"],"ACEi and ARBs reduce albuminuria and slow progression. Monitor creatinine and potassium after starting.");
T5("Renal and acid-base",2,"How is the serum anion gap calculated?","Na - (Cl + HCO3)",["Na + K - Cl","(Na + Cl) - HCO3","Cl - (Na + HCO3)"],"A normal gap is about 8 to 12. A high gap suggests MUDPILES-type causes.");
T5("Renal and acid-base",3,"Which cause produces a normal anion gap metabolic acidosis?","Severe diarrhea",["Diabetic ketoacidosis","Lactic acidosis","Methanol ingestion"],"Bicarbonate loss from the gut raises chloride, so the gap stays normal.");
T5("Renal and acid-base",2,"Which therapy is given first to stabilize the heart in hyperkalemia with ECG changes?","IV calcium gluconate",["Insulin with dextrose","Sodium polystyrene sulfonate","Furosemide"],"Calcium protects the cardiac membrane within minutes. Insulin and dextrose then shift potassium into cells.");

/* ---------- Type 2 diabetes ---------- */
T5("Type 2 diabetes",2,"Which add-on is preferred for type 2 diabetes with heart failure with reduced ejection fraction?","An SGLT2 inhibitor",["Pioglitazone","Glipizide","Saxagliptin"],"SGLT2 inhibitors reduce heart failure hospitalization. Pioglitazone causes fluid retention.");
T5("Type 2 diabetes",2,"Metformin is contraindicated when the eGFR falls below:","30 mL/min/1.73 m2",["60 mL/min/1.73 m2","45 mL/min/1.73 m2","15 mL/min/1.73 m2"],"The risk is lactic acidosis. Do not start it at an eGFR of 30 to 45 and reassess the dose.");
T5("Type 2 diabetes",2,"Which boxed warning applies to semaglutide?","Risk of thyroid C-cell tumors",["Hepatotoxicity","Lactic acidosis","Bladder cancer"],"Avoid GLP-1 receptor agonists with a personal or family history of medullary thyroid carcinoma or MEN2.");
T5("Type 2 diabetes",3,"Which rare serious adverse effect of SGLT2 inhibitors can occur with near-normal glucose?","Euglycemic diabetic ketoacidosis",["Severe hypoglycemia","Lactic acidosis","Acute pancreatitis"],"Hold the drug during acute illness, fasting or before surgery. Genital mycotic infections are the common effect.");
T5("Type 2 diabetes",1,"Which oral drug class carries the highest hypoglycemia risk?","Sulfonylureas",["Metformin","DPP-4 inhibitors","SGLT2 inhibitors"],"Sulfonylureas force insulin release regardless of glucose and also cause weight gain.");
T5("Type 2 diabetes",2,"Pioglitazone should be avoided in patients with:","Symptomatic heart failure",["Gout","Asthma","Hypothyroidism"],"Thiazolidinediones cause edema and heart failure. They also raise fracture risk.");
T5("Type 2 diabetes",3,"Which combination gives no added benefit because of overlapping mechanisms?","A DPP-4 inhibitor with a GLP-1 receptor agonist",["Metformin with an SGLT2 inhibitor","A GLP-1 receptor agonist with basal insulin","Metformin with a GLP-1 receptor agonist"],"Both raise incretin signaling, so do not combine them.");
T5("Type 2 diabetes",1,"What is the general A1c goal for most nonpregnant adults with diabetes?","Below 7%",["Below 6%","Below 8.5%","Below 9%"],"Individualize the goal. Less stringent goals suit older or frail patients.");

/* ---------- Type 1 diabetes and insulin ---------- */
T5("Type 1 diabetes and insulin",2,"Which insulin has no pronounced peak and lasts about 24 hours?","Insulin glargine",["NPH insulin","Insulin aspart","Regular insulin"],"Glargine is a basal analog. NPH peaks and aspart is a mealtime analog.");
T5("Type 1 diabetes and insulin",2,"When does NPH insulin peak?","4 to 12 hours",["30 to 90 minutes","1 to 3 hours","It has no peak"],"The peak explains nocturnal hypoglycemia with an evening dose.");
T5("Type 1 diabetes and insulin",1,"When should rapid-acting insulin lispro or aspart be given?","Within 15 minutes before eating",["30 to 45 minutes before eating","Only at bedtime","2 hours after eating"],"Regular insulin is the one given about 30 minutes before meals.");
T5("Type 1 diabetes and insulin",1,"What is the rule of 15 for treating mild hypoglycemia?","Take 15 g of fast carbohydrate and recheck in 15 minutes",["Take 30 g of protein and recheck in 60 minutes","Eat a chocolate bar and recheck in 30 minutes","Take 15 g of fat and recheck in 15 minutes"],"Repeat until glucose is above 70 mg/dL, then eat a snack or meal.");

/* ---------- DKA ---------- */
T5("DKA",2,"What is the first priority in treating diabetic ketoacidosis?","Aggressive IV isotonic fluid replacement",["An insulin bolus","IV sodium bicarbonate","Oral potassium"],"Patients are volume depleted. Fluids come before insulin.");
T5("DKA",3,"Insulin infusion in DKA is held until potassium is at least:","3.3 mEq/L",["2.5 mEq/L","4.5 mEq/L","5.5 mEq/L"],"Insulin drives potassium into cells and can cause dangerous hypokalemia.");
T5("DKA",3,"Which finding shows DKA has resolved?","Anion gap closes and bicarbonate is 18 mEq/L or higher",["Glucose drops below 250 mg/dL","Urine ketones are negative","The insulin infusion has run for 6 hours"],"Resolution is based on the gap, bicarbonate and pH, not glucose alone.");

/* ---------- Gout and arthritis ---------- */
T5("Gout and arthritis",2,"Which urate-lowering drug is first line for gout?","Allopurinol",["Febuxostat","Probenecid","Pegloticase"],"Start low (100 mg daily or less) and titrate to a serum urate below 6 mg/dL.");
T5("Gout and arthritis",3,"Which allele should be screened before allopurinol in higher-risk ancestries?","HLA-B*58:01",["HLA-B*15:02","HLA-B*57:01","CYP2C19*2"],"It predicts severe cutaneous reactions. HLA-B*15:02 is for carbamazepine and HLA-B*57:01 for abacavir.");
T5("Gout and arthritis",2,"What is the colchicine dose for an acute gout flare?","1.2 mg, then 0.6 mg one hour later",["0.6 mg every hour until pain resolves","1.2 mg every 6 hours","2 mg every hour"],"Low-dose colchicine works as well as high dose with fewer GI effects.");
T5("Gout and arthritis",2,"Which prophylaxis is given for 3 to 6 months when starting allopurinol?","Low-dose colchicine",["High-dose NSAIDs","Pegloticase","Probenecid"],"Starting urate-lowering therapy can trigger flares, so cover the start of therapy.");
T5("Gout and arthritis",3,"Febuxostat carries a boxed warning for:","Cardiovascular death",["Hepatic failure","Agranulocytosis","Severe skin reactions"],"Use it when allopurinol fails or is not tolerated.");
T5("Gout and arthritis",3,"Which test is required before pegloticase?","G6PD deficiency",["TPMT activity","DPD activity","HLA-B*58:01"],"G6PD deficiency risks hemolysis and methemoglobinemia.");
T5("Gout and arthritis",2,"Which is a preferred first-line pharmacologic treatment for knee osteoarthritis?","A topical NSAID",["Tramadol","Glucosamine","Intra-articular hyaluronic acid"],"Topical NSAIDs are strongly recommended for knee OA with less systemic exposure.");

/* ---------- Headache and migraine ---------- */
T5("Headache and migraine",2,"What is first-line acute treatment for moderate to severe migraine?","A triptan",["An opioid","Butalbital combination","Daily propranolol"],"Triptans are 5-HT1B/1D agonists. Take early in the attack.");
T5("Headache and migraine",2,"Triptans are contraindicated in:","Ischemic heart disease",["Asthma","Hypothyroidism","Gout"],"They constrict coronary and cerebral arteries. Also avoid in uncontrolled hypertension and hemiplegic migraine.");
T5("Headache and migraine",3,"Erenumab prevents migraine by blocking the:","CGRP receptor",["5-HT1B/1D receptor","Angiotensin II receptor","Voltage-gated sodium channel"],"Fremanezumab, galcanezumab and eptinezumab bind the CGRP ligand instead.");
T5("Headache and migraine",2,"Which migraine preventive drug is avoided in pregnancy because of neural tube defects?","Valproate",["Propranolol","Amitriptyline","Candesartan"],"Valproate is also teratogenic for cognitive outcomes.");
T5("Headache and migraine",3,"Medication overuse headache can occur if triptans are used on at least how many days per month?","10 days",["2 days","4 days","20 days"],"Simple analgesics need 15 or more days per month to carry the same risk.");

/* ---------- RA and SLE ---------- */
T5("RA and SLE",1,"Which drug is the anchor DMARD for rheumatoid arthritis?","Methotrexate",["Hydroxychloroquine","Etanercept","Prednisone"],"Give it once weekly with folic acid.");
T5("RA and SLE",2,"Which supplement reduces methotrexate toxicity?","Folic acid",["Vitamin K","Iron","Calcium"],"Folic acid lowers mucositis and liver effects without losing efficacy.");
T5("RA and SLE",2,"What should be screened before starting a TNF inhibitor?","Latent tuberculosis and hepatitis B",["Thyroid function and lipid panel","Uric acid and ANA","Lung function tests only"],"TNF blockade can reactivate both infections.");
T5("RA and SLE",2,"Which SLE drug requires baseline and routine retinal eye exams?","Hydroxychloroquine",["Belimumab","Azathioprine","Prednisone"],"Retinal toxicity risk rises with dose and duration. It is recommended for nearly all SLE patients.");
T5("RA and SLE",3,"Belimumab inhibits which target?","BLyS (BAFF)",["CD20","TNF-alpha","IL-6 receptor"],"Rituximab targets CD20, tocilizumab the IL-6 receptor.");
T5("RA and SLE",2,"Tofacitinib belongs to which class?","JAK inhibitor",["TNF inhibitor","IL-6 receptor antagonist","CTLA-4 fusion protein"],"JAK inhibitors have boxed warnings for serious infections, mortality, malignancy, MACE and thrombosis.");

/* ---------- Thyroid ---------- */
T5("Thyroid",2,"How long should levothyroxine be separated from calcium or iron supplements?","4 hours",["30 minutes","1 hour","No separation is needed"],"They bind levothyroxine and reduce absorption. Take it on an empty stomach 30 to 60 minutes before breakfast.");
T5("Thyroid",2,"Which antithyroid drug is preferred in the first trimester of pregnancy?","Propylthiouracil",["Methimazole","Radioactive iodine","Levothyroxine"],"Methimazole is linked to birth defects early in pregnancy. Switch to it after the first trimester.");
T5("Thyroid",3,"What is the boxed warning for propylthiouracil?","Severe liver injury",["Agranulocytosis","Pulmonary fibrosis","Lupus-like syndrome"],"This is why PTU is reserved for the first trimester and methimazole intolerance.");
T5("Thyroid",3,"Which beta blocker also blocks peripheral conversion of T4 to T3?","Propranolol",["Metoprolol","Atenolol","Bisoprolol"],"It controls tremor and tachycardia in hyperthyroidism and in thyroid storm.");

/* ---------- Liver ---------- */
T5("Liver",2,"Which is NOT part of the Child-Pugh score?","Serum creatinine",["Albumin","Bilirubin","Hepatic encephalopathy"],"Child-Pugh uses bilirubin, albumin, INR, ascites and encephalopathy. MELD includes creatinine.");
T5("Liver",1,"What is first-line therapy for hepatic encephalopathy?","Lactulose",["Rifaximin alone","Long-term metronidazole","Strict protein restriction"],"Lactulose lowers ammonia. Rifaximin is added to prevent recurrence.");
T5("Liver",2,"What is the typical maximum acetaminophen dose in cirrhosis?","2 g per day",["4 g per day","5 g per day","6 g per day"],"It is still the safest analgesic here, but at a reduced dose.");
T5("Liver",2,"Which drugs are used for primary prophylaxis of variceal bleeding?","Nonselective beta blockers such as propranolol, nadolol or carvedilol",["ACE inhibitors","Loop diuretics alone","Selective beta-1 blockers such as atenolol"],"They lower portal pressure.");
T5("Liver",3,"What is the usual spironolactone to furosemide dose ratio for cirrhotic ascites?","100 mg to 40 mg",["40 mg to 100 mg","50 mg to 50 mg","200 mg to 20 mg"],"The ratio helps maintain normal potassium.");

/* ---------- Hepatitis ---------- */
T5("Hepatitis",2,"Which oral HBV agent has a high barrier to resistance and is preferred?","Entecavir",["Lamivudine","Adefovir","Telbivudine"],"Tenofovir (TDF or TAF) is the other preferred option.");
T5("Hepatitis",3,"Which is a pangenotypic hepatitis C regimen?","Sofosbuvir/velpatasvir",["Ledipasvir/sofosbuvir","Peginterferon plus ribavirin","Boceprevir plus peginterferon"],"Ledipasvir/sofosbuvir covers only genotypes 1, 4, 5 and 6.");
T5("Hepatitis",2,"What is the standard adult hepatitis B vaccine schedule for Engerix-B or Recombivax HB?","0, 1 and 6 months",["0, 2 and 12 months","A single dose","0, 7 and 21 days only"],"An accelerated schedule exists for some groups.");
T5("Hepatitis",1,"After a positive HCV antibody test, active infection is confirmed with:","HCV RNA (PCR)",["ALT level","HCV genotype","Liver biopsy"],"The antibody can persist after clearing infection.");

/* ---------- Hypertension ---------- */
T5("Hypertension",1,"What is the ACC/AHA blood pressure goal for most adults?","Below 130/80 mmHg",["Below 140/90 mmHg","Below 120/70 mmHg","Below 150/90 mmHg"],"The goal applies to most adults with confirmed hypertension.");
T5("Hypertension",2,"Blood pressure is 20/10 mmHg above goal. What is the recommended start?","Two first-line agents of different classes",["Monotherapy then titrate","A beta blocker plus an alpha blocker","A loop diuretic"],"A single-pill combination improves adherence.");
T5("Hypertension",2,"Which is NOT a first-line class for general hypertension?","Beta blockers",["Thiazide-type diuretics","ACE inhibitors","Dihydropyridine calcium channel blockers"],"Beta blockers are used with compelling indications such as heart failure or angina.");
T5("Hypertension",2,"What is initial therapy for a Black adult with hypertension and no heart failure or CKD?","A thiazide-type diuretic or calcium channel blocker",["An ACE inhibitor alone","An ARB alone","A beta blocker"],"These classes lower blood pressure more in this group.");
T5("Hypertension",2,"Which antihypertensive classes are contraindicated in pregnancy?","ACE inhibitors and ARBs",["Labetalol and nifedipine","Methyldopa only","Thiazide diuretics only"],"They cause fetal renal toxicity. Labetalol, nifedipine and methyldopa are preferred.");
T5("Hypertension",1,"ACE inhibitor cough is due to accumulation of:","Bradykinin",["Angiotensin II","Aldosterone","Renin"],"ARBs do not cause it. Angioedema also involves bradykinin.");
T5("Hypertension",2,"Which is the preferred fourth-line add-on for resistant hypertension?","Spironolactone",["Hydralazine","Clonidine","Atenolol"],"Monitor potassium and creatinine.");
T5("Hypertension",3,"In a hypertensive emergency, mean arterial pressure is lowered by no more than what in the first hour?","25%",["50%","75%","To normal"],"Rapid drops risk ischemia. Typical agents are nicardipine, clevidipine and labetalol.");

/* ---------- Lipids ---------- */
T5("Lipids",2,"Which regimen is a high-intensity statin?","Atorvastatin 80 mg",["Simvastatin 20 mg","Pravastatin 40 mg","Lovastatin 20 mg"],"High intensity lowers LDL by 50% or more: atorvastatin 40 to 80 mg or rosuvastatin 20 to 40 mg.");
T5("Lipids",2,"At least what intensity of statin is recommended for diabetes aged 40 to 75?","Moderate intensity",["Low intensity","No statin","High intensity only"],"Use high intensity with multiple risk factors.");
T5("Lipids",2,"Which agent is added next in very high-risk ASCVD with LDL 70 mg/dL or more on maximal statin?","Ezetimibe",["Niacin","Fenofibrate","Gemfibrozil"],"Ezetimibe is the usual first add-on, then a PCSK9 inhibitor.");
T5("Lipids",2,"Alirocumab and evolocumab target:","PCSK9",["HMG-CoA reductase","NPC1L1","ATP citrate lyase"],"They raise LDL receptor recycling and are given subcutaneously.");
T5("Lipids",3,"What is the maximum simvastatin dose with amlodipine?","20 mg daily",["40 mg daily","80 mg daily","No limit"],"Amlodipine raises simvastatin exposure through CYP3A4.");
T5("Lipids",2,"Avoid combining a statin with which drug?","Gemfibrozil",["Ezetimibe","Icosapent ethyl","Colesevelam"],"Gemfibrozil raises rhabdomyolysis risk. Fenofibrate is less problematic.");
T5("Lipids",2,"Triglycerides of 500 mg/dL or higher mainly raise the risk of:","Acute pancreatitis",["Stroke","Gout","Osteoporosis"],"A fibrate or omega-3 is used to lower triglycerides.");
T5("Lipids",2,"Which counseling reduces niacin flushing?","Take aspirin 325 mg about 30 minutes before",["Take on an empty stomach","Take with a high-fat meal","Take with a hot drink"],"Flushing is prostaglandin mediated.");

/* ---------- Pain ---------- */
T5("Pain",2,"What is the oral to IV morphine dose ratio?","About 3 to 1 (30 mg oral is about 10 mg IV)",["1 to 1","2 to 1","10 to 1"],"First-pass metabolism lowers oral bioavailability.");
T5("Pain",3,"When switching opioids, the calculated equianalgesic dose is usually reduced by:","25 to 50%",["0%","10%","75 to 90%"],"Incomplete cross-tolerance means a full conversion can cause overdose.");
T5("Pain",2,"Which opioid adverse effect shows little tolerance over time?","Constipation",["Sedation","Nausea","Respiratory depression"],"Start a stimulant laxative with the opioid.");
T5("Pain",2,"Which NSAID is the most COX-2 selective?","Celecoxib",["Ibuprofen","Naproxen","Ketorolac"],"It lowers GI bleeding risk but not cardiovascular risk.");
T5("Pain",2,"Which is first-line for painful diabetic neuropathy?","Duloxetine",["Ibuprofen","Acetaminophen","Oxycodone"],"Gabapentinoids and TCAs are also first line.");
T5("Pain",3,"Which opioid carries QT prolongation risk and a long, variable half-life?","Methadone",["Morphine","Hydromorphone","Oxymorphone"],"Obtain an ECG and titrate slowly.");
T5("Pain",3,"Which opioid is avoided in renal impairment because of the toxic metabolite normeperidine?","Meperidine",["Fentanyl","Hydromorphone","Methadone"],"Normeperidine causes seizures and accumulates in kidney disease.");

/* ---------- Nutritional support ---------- */
T5("Nutritional support",1,"When the gut works, which route is preferred?","Enteral nutrition",["Parenteral nutrition","Both together","Neither, only oral fluids"],"Enteral feeding preserves gut integrity and has fewer infections.");
T5("Nutritional support",2,"Which lab finding is the hallmark of refeeding syndrome?","Hypophosphatemia",["Hyperkalemia","Hypercalcemia","Hypernatremia"],"Give thiamine before dextrose and replace phosphorus, potassium and magnesium.");
T5("Nutritional support",2,"How many kilocalories per gram does hydrated dextrose provide in parenteral nutrition?","3.4",["4","7","9"],"Lipid provides about 10 kcal/g as an emulsion, and amino acids 4 kcal/g.");
T5("Nutritional support",2,"How many kilocalories per gram do amino acids provide?","4",["3.4","7","9"],"Amino acids are counted as protein calories.");
T5("Nutritional support",2,"What prevents essential fatty acid deficiency in long-term parenteral nutrition?","Lipid emulsion",["Extra dextrose","More amino acids","Trace elements"],"It supplies linoleic and alpha-linolenic acid.");
T5("Nutritional support",3,"Parenteral nutrition with an osmolarity above what must be given centrally?","900 mOsm/L",["300 mOsm/L","600 mOsm/L","1500 mOsm/L"],"Hyperosmolar solutions irritate peripheral veins.");

/* ---------- Fluids and electrolytes ---------- */
T5("Fluids and electrolytes",1,"How much sodium does 0.9% sodium chloride contain?","154 mEq/L",["77 mEq/L","130 mEq/L","0 mEq/L"],"Half-normal saline has 77 mEq/L, and lactated Ringer's has 130.");
T5("Fluids and electrolytes",3,"What is the maximum sodium correction in chronic hyponatremia in 24 hours?","8 to 10 mEq/L",["20 to 24 mEq/L","15 to 20 mEq/L","1 to 2 mEq/L"],"Faster correction risks osmotic demyelination.");
T5("Fluids and electrolytes",2,"Severe symptomatic hyponatremia with seizures is treated with:","3% hypertonic saline",["Fluid restriction alone","Oral salt tablets","Demeclocycline"],"A small bolus raises sodium quickly.");
T5("Fluids and electrolytes",2,"What is the usual maximum peripheral IV potassium chloride rate?","10 mEq per hour",["20 mEq per hour","40 mEq per hour","60 mEq per hour"],"Faster rates need a central line and cardiac monitoring.");
T5("Fluids and electrolytes",2,"By about how much does 10 mEq of KCl raise serum potassium?","0.1 mEq/L",["1 mEq/L","0.5 mEq/L","0.01 mEq/L"],"Total body deficits are large, so correct gradually.");
T5("Fluids and electrolytes",2,"Hypokalemia that will not correct suggests replacing:","Magnesium",["Sodium","Phosphorus","Zinc"],"Low magnesium causes renal potassium wasting.");
T5("Fluids and electrolytes",2,"What is first-line treatment for severe hypercalcemia of malignancy?","IV isotonic saline",["Furosemide first","Zoledronic acid first","Calcium acetate"],"Replace volume first, then give a bisphosphonate.");
T5("Fluids and electrolytes",3,"Serum albumin is 2.0 g/dL and total calcium is 7.6 mg/dL. What is the corrected calcium?","9.2 mg/dL",["6.0 mg/dL","7.6 mg/dL (no correction needed)","10.8 mg/dL"],"Corrected Ca = measured + 0.8 x (4.0 - albumin) = 7.6 + 1.6 = 9.2 mg/dL.");
T5("Fluids and electrolytes",2,"Using the 4-2-1 rule, what is the maintenance fluid rate for a 70 kg adult?","About 110 mL/hr",["70 mL/hr","150 mL/hr","90 mL/hr"],"40 + 20 + 50 mL/hr.");
