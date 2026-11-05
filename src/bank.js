/* Question bank: Q(category, difficulty 1-3, question, correct, [3 wrong], explanation) */
const BANK = [];
function Q(c, d, q, a, w, e, t, s) { const o = { c, d, q, a, w, e }; if (t) o.t = t; if (s) o.s = s; BANK.push(o); }

/* ---------- Brand <-> Generic ---------- */
Q("BG",1,"Lipitor is the brand name of which drug?","atorvastatin",["simvastatin","rosuvastatin","pravastatin"],"Lipitor = atorvastatin, a high-intensity statin at 40-80 mg.");
Q("BG",1,"Zocor is the brand name of which drug?","simvastatin",["lovastatin","atorvastatin","pitavastatin"],"Zocor = simvastatin. Keep the dose at or below 20 mg with amlodipine, and avoid strong CYP3A4 inhibitors.");
Q("BG",1,"Crestor is the brand name of which drug?","rosuvastatin",["pravastatin","fluvastatin","atorvastatin"],"Crestor = rosuvastatin, a high-intensity statin that is less dependent on CYP3A4.");
Q("BG",1,"Norvasc is the brand name of which drug?","amlodipine",["nifedipine","diltiazem","felodipine"],"Norvasc = amlodipine, a dihydropyridine calcium channel blocker. Watch for peripheral edema.");
Q("BG",1,"Zestril and Prinivil are brand names of which drug?","lisinopril",["enalapril","ramipril","benazepril"],"Both brands are lisinopril, an ACE inhibitor.");
Q("BG",1,"Cozaar is the brand name of which drug?","losartan",["valsartan","irbesartan","olmesartan"],"Cozaar = losartan, an ARB. Hyzaar adds hydrochlorothiazide.");
Q("BG",2,"Toprol-XL is the brand name of which drug?","metoprolol succinate",["metoprolol tartrate","atenolol","carvedilol"],"Toprol-XL is extended-release metoprolol succinate (once daily, used in heart failure). Lopressor is metoprolol tartrate, taken twice daily.");
Q("BG",1,"Coreg is the brand name of which drug?","carvedilol",["labetalol","bisoprolol","nebivolol"],"Coreg = carvedilol, a non-selective beta-blocker with alpha-1 blockade. Take with food.");
Q("BG",1,"Lasix is the brand name of which drug?","furosemide",["bumetanide","torsemide","hydrochlorothiazide"],"Lasix = furosemide, a loop diuretic.");
Q("BG",1,"Zoloft is the brand name of which drug?","sertraline",["paroxetine","fluoxetine","citalopram"],"Zoloft = sertraline, an SSRI.");
Q("BG",1,"Lexapro is the brand name of which drug?","escitalopram",["citalopram","duloxetine","venlafaxine"],"Lexapro = escitalopram, the S-enantiomer of citalopram (Celexa).");
Q("BG",1,"Xanax is the brand name of which drug?","alprazolam",["lorazepam","clonazepam","diazepam"],"Xanax = alprazolam, a C-IV short-acting benzodiazepine.");
Q("BG",1,"Ambien is the brand name of which drug?","zolpidem",["eszopiclone","zaleplon","temazepam"],"Ambien = zolpidem, a C-IV sedative-hypnotic. Women are advised a lower starting dose.");
Q("BG",1,"Nexium is the brand name of which drug?","esomeprazole",["omeprazole","pantoprazole","lansoprazole"],"Nexium = esomeprazole. Prilosec is omeprazole, Protonix is pantoprazole, Prevacid is lansoprazole.");
Q("BG",1,"Synthroid is the brand name of which drug?","levothyroxine",["liothyronine","methimazole","propylthiouracil"],"Synthroid = levothyroxine (T4). Cytomel is liothyronine (T3).");
Q("BG",2,"Januvia is the brand name of which drug?","sitagliptin",["linagliptin","saxagliptin","alogliptin"],"Januvia = sitagliptin, a DPP-4 inhibitor. Tradjenta is linagliptin.");
Q("BG",2,"Jardiance is the brand name of which drug?","empagliflozin",["dapagliflozin","canagliflozin","ertugliflozin"],"Jardiance = empagliflozin, an SGLT2 inhibitor. Farxiga is dapagliflozin, Invokana is canagliflozin.");
Q("BG",2,"Eliquis is the brand name of which drug?","apixaban",["rivaroxaban","dabigatran","edoxaban"],"Eliquis = apixaban, a direct factor Xa inhibitor dosed twice daily.");
Q("BG",2,"Xarelto is the brand name of which drug?","rivaroxaban",["apixaban","dabigatran","warfarin"],"Xarelto = rivaroxaban, a factor Xa inhibitor. Higher doses should be taken with the evening meal.");
Q("BG",1,"Plavix is the brand name of which drug?","clopidogrel",["ticagrelor","prasugrel","cilostazol"],"Plavix = clopidogrel, a P2Y12 inhibitor. Brilinta is ticagrelor, Effient is prasugrel.");
Q("BG",2,"Singulair is the brand name of which drug?","montelukast",["zafirlukast","zileuton","theophylline"],"Singulair = montelukast, a leukotriene receptor antagonist. It has a boxed warning for neuropsychiatric events.");
Q("BG",1,"Neurontin is the brand name of which drug?","gabapentin",["pregabalin","topiramate","lamotrigine"],"Neurontin = gabapentin. Lyrica is pregabalin (C-V).");
Q("BG",2,"Seroquel is the brand name of which drug?","quetiapine",["olanzapine","risperidone","aripiprazole"],"Seroquel = quetiapine, an atypical antipsychotic. Zyprexa is olanzapine, Abilify is aripiprazole.");
Q("BG",2,"Keppra is the brand name of which drug?","levetiracetam",["lamotrigine","lacosamide","phenytoin"],"Keppra = levetiracetam. Watch for irritability and mood changes.");
Q("BG",2,"Flomax is the brand name of which drug?","tamsulosin",["finasteride","doxazosin","alfuzosin"],"Flomax = tamsulosin, an alpha-1A blocker for BPH. Proscar is finasteride.");
Q("BG",2,"Zofran is the brand name of which drug?","ondansetron",["promethazine","metoclopramide","granisetron"],"Zofran = ondansetron, a 5-HT3 antagonist. It can prolong the QT interval.");
Q("BG",1,"Zithromax is the brand name of which drug?","azithromycin",["clarithromycin","erythromycin","doxycycline"],"Zithromax = azithromycin, a macrolide. Biaxin is clarithromycin.");
Q("BG",1,"Bactrim is a combination of which two drugs?","sulfamethoxazole + trimethoprim",["amoxicillin + clavulanate","sulfasalazine + methotrexate","trimethoprim + nitrofurantoin"],"Bactrim = sulfamethoxazole + trimethoprim (SMX-TMP). Avoid in sulfa allergy and watch potassium and INR.");
Q("BG",1,"Augmentin is a combination of which two drugs?","amoxicillin + clavulanate",["ampicillin + sulbactam","piperacillin + tazobactam","amoxicillin + probenecid"],"Augmentin = amoxicillin + clavulanic acid, a beta-lactamase inhibitor. Take with food to reduce GI upset.");
Q("BG",2,"Wellbutrin contains which drug?","bupropion",["buspirone","venlafaxine","mirtazapine"],"Wellbutrin = bupropion, also sold as Zyban for smoking cessation. Buspirone (Buspar) is easy to mix up.");
Q("BG",2,"Ozempic and Wegovy contain which drug?","semaglutide",["liraglutide","dulaglutide","tirzepatide"],"Ozempic and Wegovy = semaglutide, a weekly GLP-1 agonist. Victoza is liraglutide, Trulicity is dulaglutide, Mounjaro is tirzepatide.");
Q("BG",3,"Entresto is a combination of which two drugs?","sacubitril + valsartan",["sacubitril + lisinopril","aliskiren + valsartan","azilsartan + chlorthalidone"],"Entresto = sacubitril (neprilysin inhibitor) + valsartan. Never combine with an ACE inhibitor because of angioedema risk; wait 36 hours after the last ACE inhibitor dose.");

/* ---------- Drug classes ---------- */
Q("CL",1,"Lisinopril belongs to which class?","ACE inhibitor",["Angiotensin receptor blocker","Calcium channel blocker","Beta-blocker"],"-pril = ACE inhibitor.");
Q("CL",1,"Valsartan belongs to which class?","Angiotensin II receptor blocker",["ACE inhibitor","Direct renin inhibitor","Aldosterone antagonist"],"-sartan = ARB. ARBs rarely cause the dry cough seen with ACE inhibitors.");
Q("CL",1,"Metoprolol is best described as a:","Selective beta-1 blocker",["Non-selective beta blocker","Alpha-1 blocker","Central alpha-2 agonist"],"Metoprolol is cardioselective (beta-1). Selectivity is lost at higher doses.");
Q("CL",1,"Hydrochlorothiazide is a:","Thiazide diuretic",["Loop diuretic","Potassium-sparing diuretic","Carbonic anhydrase inhibitor"],"HCTZ acts on the distal convoluted tubule.");
Q("CL",1,"Glipizide is a:","Sulfonylurea",["Biguanide","DPP-4 inhibitor","Thiazolidinedione"],"Glipizide, glyburide and glimepiride are sulfonylureas, which carry a hypoglycemia risk.");
Q("CL",2,"Sitagliptin (-gliptin) is a:","DPP-4 inhibitor",["SGLT2 inhibitor","GLP-1 receptor agonist","Alpha-glucosidase inhibitor"],"-gliptins block DPP-4, so incretins last longer.");
Q("CL",2,"Empagliflozin (-gliflozin) is a:","SGLT2 inhibitor",["DPP-4 inhibitor","Sulfonylurea","Meglitinide"],"-gliflozins block renal glucose reabsorption. They are also used in heart failure and CKD.");
Q("CL",2,"Liraglutide is a:","GLP-1 receptor agonist",["Amylin analog","DPP-4 inhibitor","Basal insulin analog"],"-tides such as liraglutide, semaglutide and dulaglutide are GLP-1 receptor agonists.");
Q("CL",1,"Omeprazole is a:","Proton pump inhibitor",["H2 receptor antagonist","Antacid","Prostaglandin analog"],"-prazole = PPI.");
Q("CL",1,"Famotidine is a:","H2 receptor antagonist",["Proton pump inhibitor","Antacid","Prokinetic agent"],"-tidine = H2 blocker.");
Q("CL",2,"Apixaban (-xaban) is a:","Direct factor Xa inhibitor",["Direct thrombin inhibitor","Vitamin K antagonist","Low molecular weight heparin"],"-xaban = factor Xa inhibitor.");
Q("CL",2,"Dabigatran is a:","Direct thrombin inhibitor",["Direct factor Xa inhibitor","Vitamin K antagonist","P2Y12 inhibitor"],"Dabigatran (-gatran) inhibits thrombin directly. Its reversal agent is idarucizumab.");
Q("CL",1,"Albuterol is a:","Short-acting beta-2 agonist",["Long-acting muscarinic antagonist","Inhaled corticosteroid","Leukotriene antagonist"],"Albuterol is a rescue inhaler (SABA).");
Q("CL",2,"Tiotropium is a:","Long-acting muscarinic antagonist (LAMA)",["Long-acting beta-2 agonist","Short-acting beta-2 agonist","Inhaled corticosteroid"],"Tiotropium (Spiriva) is a LAMA for COPD maintenance.");
Q("CL",2,"Venlafaxine is a:","Serotonin-norepinephrine reuptake inhibitor",["Selective serotonin reuptake inhibitor","Tricyclic antidepressant","Monoamine oxidase inhibitor"],"Venlafaxine and duloxetine are SNRIs. Venlafaxine can raise blood pressure at high doses.");
Q("CL",2,"Tamsulosin is a:","Alpha-1 blocker",["5-alpha reductase inhibitor","PDE5 inhibitor","Beta-blocker"],"Tamsulosin relaxes prostate and bladder neck smooth muscle.");
Q("CL",2,"Spironolactone is a:","Aldosterone antagonist (potassium-sparing diuretic)",["Loop diuretic","Thiazide diuretic","Carbonic anhydrase inhibitor"],"Spironolactone blocks the mineralocorticoid receptor. Monitor potassium.");
Q("CL",3,"Ezetimibe works as a:","Cholesterol absorption inhibitor",["Bile acid sequestrant","Fibrate","PCSK9 inhibitor"],"Ezetimibe blocks NPC1L1 in the intestine.");
Q("CL",3,"Linezolid is a(n):","Oxazolidinone",["Glycopeptide","Lipopeptide","Macrolide"],"Linezolid treats MRSA and VRE. It is a weak MAO inhibitor, so watch for serotonin syndrome.");
Q("CL",3,"Pioglitazone is a:","Thiazolidinedione (PPAR-gamma agonist)",["Sulfonylurea","Meglitinide","Biguanide"],"-glitazones cause fluid retention and are avoided in heart failure.");

/* ---------- Mechanisms ---------- */
Q("MOA",1,"Statins lower LDL by:","Inhibiting HMG-CoA reductase",["Blocking NPC1L1 absorption","Binding bile acids","Activating PPAR-alpha"],"HMG-CoA reductase is the rate-limiting step of cholesterol synthesis in the liver.");
Q("MOA",2,"Metformin works mainly by:","Decreasing hepatic glucose production and improving insulin sensitivity",["Closing K-ATP channels to release insulin","Blocking renal glucose reabsorption","Inhibiting the DPP-4 enzyme"],"Metformin (activates AMPK) lowers gluconeogenesis and does not cause hypoglycemia on its own.");
Q("MOA",2,"Clopidogrel works by:","Irreversibly blocking the platelet P2Y12 receptor",["Inhibiting COX-1","Blocking GP IIb/IIIa","Inhibiting PDE3"],"Clopidogrel is a prodrug activated by CYP2C19.");
Q("MOA",1,"Proton pump inhibitors work by:","Irreversibly inhibiting the H+/K+ ATPase",["Blocking H2 receptors","Neutralizing gastric acid","Coating ulcer craters"],"They shut down the final step of acid secretion in parietal cells.");
Q("MOA",2,"Warfarin works by:","Inhibiting vitamin K epoxide reductase, lowering factors II, VII, IX and X",["Directly inhibiting factor Xa","Enhancing antithrombin III","Directly inhibiting thrombin"],"Warfarin depletes the active vitamin K-dependent clotting factors. Effect takes days.");
Q("MOA",2,"Loop diuretics act on:","The Na-K-2Cl cotransporter in the thick ascending limb",["The Na-Cl cotransporter in the distal tubule","Aldosterone receptors in the collecting duct","Carbonic anhydrase in the proximal tubule"],"Loop diuretics are the most potent diuretics. They can cause hypokalemia and ototoxicity.");
Q("MOA",2,"Sulfonylureas lower glucose by:","Closing K-ATP channels on pancreatic beta cells to release insulin",["Activating PPAR-gamma","Slowing carbohydrate digestion","Increasing GLP-1 secretion"],"Insulin release does not depend on glucose, so hypoglycemia is the main risk.");
Q("MOA",2,"Fluoroquinolones kill bacteria by inhibiting:","DNA gyrase and topoisomerase IV",["The 30S ribosomal subunit","The 50S ribosomal subunit","Folate synthesis"],"Gyrase and topoisomerase IV are needed for DNA replication.");
Q("MOA",2,"Macrolides (azithromycin) bind to the:","50S ribosomal subunit",["30S ribosomal subunit","Penicillin-binding proteins","DNA gyrase"],"Mnemonic: macrolides, clindamycin and linezolid hit 50S. Aminoglycosides and tetracyclines hit 30S.");
Q("MOA",3,"Penicillins kill bacteria by:","Binding penicillin-binding proteins and blocking cell wall cross-linking",["Inhibiting DNA gyrase","Blocking the 30S ribosome","Inhibiting dihydrofolate reductase"],"Beta-lactams block transpeptidation, so the cell wall weakens and the bacteria lyse.");
Q("MOA",2,"Digoxin works by inhibiting:","The Na+/K+ ATPase",["The Na-K-2Cl cotransporter","Phosphodiesterase 3","The If channel"],"Higher intracellular calcium gives positive inotropy; vagal effects slow the AV node.");
Q("MOA",2,"Sildenafil works by inhibiting:","PDE5, which raises cGMP",["PDE3, which raises cAMP","Xanthine oxidase","Alpha-1 receptors"],"PDE5 inhibition gives vasodilation. Never combine with nitrates.");
Q("MOA",2,"Allopurinol lowers uric acid by inhibiting:","Xanthine oxidase",["URAT1","Uricase","Cyclooxygenase"],"Probenecid blocks URAT1 instead. Rasburicase is a recombinant uricase.");
Q("MOA",3,"Methotrexate inhibits:","Dihydrofolate reductase",["Thymidylate synthase","Topoisomerase II","Microtubule assembly"],"Leucovorin (folinic acid) rescues cells because it bypasses DHFR.");
Q("MOA",3,"Heparin works by:","Potentiating antithrombin III",["Inhibiting vitamin K epoxide reductase","Directly inhibiting factor Xa","Blocking P2Y12"],"Antithrombin III inactivates thrombin and factor Xa. Protamine reverses heparin.");
Q("MOA",2,"GLP-1 receptor agonists lower glucose by:","Increasing glucose-dependent insulin release, lowering glucagon and slowing gastric emptying",["Closing K-ATP channels regardless of glucose","Blocking SGLT2 in the kidney","Inhibiting alpha-glucosidase"],"Glucose-dependent action means low hypoglycemia risk unless paired with insulin or a sulfonylurea.");
Q("MOA",3,"Benzodiazepines enhance GABA-A by:","Increasing the frequency of chloride channel opening",["Increasing the duration of chloride channel opening","Blocking NMDA receptors","Activating 5-HT1A receptors"],"Barbiturates increase the duration of opening. Remember: BenzoFrequency, BarbiDuration.");

/* ---------- Adverse effects ---------- */
Q("AE",1,"Which adverse effect is characteristic of ACE inhibitors?","Dry cough",["Peripheral edema","Reflex tachycardia","Hypokalemia"],"Bradykinin builds up and causes a dry cough. ACE inhibitors also raise potassium (hyperkalemia) and rarely cause angioedema.");
Q("AE",1,"Statins most commonly raise concern for:","Myopathy and rhabdomyolysis",["Pulmonary fibrosis","Tendon rupture","Gingival hyperplasia"],"Report unexplained muscle pain or dark urine. Check CK if symptomatic.");
Q("AE",2,"Fluoroquinolones carry a boxed warning for:","Tendon rupture",["Ototoxicity","Red man syndrome","Gingival hyperplasia"],"Risk rises with age over 60, corticosteroids and transplant. Also tendinitis, neuropathy and CNS effects.");
Q("AE",2,"Aminoglycosides are most associated with:","Nephrotoxicity and ototoxicity",["Tendon rupture","Hepatic necrosis","Pulmonary fibrosis"],"Monitor levels and renal function. Avoid combining with other nephrotoxic drugs and loop diuretics.");
Q("AE",2,"Long-term amiodarone is associated with:","Pulmonary fibrosis, thyroid dysfunction and hepatotoxicity",["Gingival hyperplasia","Agranulocytosis","Peripheral edema only"],"Baseline and ongoing monitoring: chest X-ray, PFTs, TSH and liver tests.");
Q("AE",2,"Isoniazid commonly causes:","Peripheral neuropathy (give pyridoxine) and hepatotoxicity",["Optic neuritis","Orange body fluids","Hyperuricemia"],"Optic neuritis is ethambutol, orange fluids are rifampin, hyperuricemia is pyrazinamide.");
Q("AE",2,"Gingival hyperplasia is a classic effect of:","Phenytoin",["Valproate","Carbamazepine","Lamotrigine"],"Phenytoin also causes hirsutism and has non-linear (zero-order) kinetics at higher doses.");
Q("AE",2,"Digoxin toxicity may present with:","Nausea, yellow-green visual halos and arrhythmias",["Dry cough and angioedema","Hypoglycemia and tremor","Constipation and hirsutism"],"Toxicity is more likely with hypokalemia and renal impairment. Treat severe cases with digoxin immune Fab.");
Q("AE",2,"Long-term hydroxychloroquine requires monitoring for:","Retinopathy",["Ototoxicity","Peripheral edema","Tendon rupture"],"Baseline and periodic retinal screening are recommended.");
Q("AE",3,"Clozapine requires monitoring of the:","Absolute neutrophil count (agranulocytosis risk)",["Serum potassium","INR","Uric acid"],"Clozapine also causes sedation, hypersalivation, seizures and myocarditis.");
Q("AE",2,"Lithium toxicity or long-term use is associated with:","Tremor, hypothyroidism and nephrogenic diabetes insipidus",["Gingival hyperplasia and hirsutism","Dry cough and hyperkalemia","Photosensitivity and tendon rupture"],"Narrow therapeutic index. NSAIDs, ACE inhibitors and thiazides raise lithium levels.");
Q("AE",2,"Carbamazepine requires HLA-B*1502 screening in some patients because of the risk of:","Stevens-Johnson syndrome / TEN",["Agranulocytosis only","Pancreatitis","Hepatic steatosis"],"HLA-B*1502 is most common in patients of Asian ancestry. Hyponatremia is another common effect.");
Q("AE",2,"Spironolactone can cause:","Hyperkalemia and gynecomastia",["Hypokalemia and gout","Ototoxicity","Dry cough"],"Eplerenone is more selective and causes less gynecomastia.");
Q("AE",1,"Which electrolyte disturbance is typical of thiazide diuretics?","Hypokalemia",["Hyperkalemia","Hypocalcemia","Hypermagnesemia"],"Thiazides also cause hyponatremia, hypomagnesemia, hypercalcemia and hyperuricemia.");
Q("AE",2,"The most important safety risk of sulfonylureas is:","Hypoglycemia",["Lactic acidosis","Genital mycotic infections","Pancreatitis"],"Insulin secretion is not glucose dependent. Weight gain is also common.");
Q("AE",3,"Tamsulosin is linked to which eye-surgery complication?","Intraoperative floppy iris syndrome",["Angle-closure glaucoma","Optic neuritis","Retinal detachment"],"Tell patients to inform their ophthalmologist before cataract surgery.");
Q("AE",3,"Which risk is dose-related with bupropion?","Seizures",["Weight gain","Sedation","Sexual dysfunction"],"Bupropion lowers the seizure threshold. It is contraindicated in seizure and eating disorders.");
Q("AE",1,"Which is an anticholinergic effect?","Urinary retention",["Diarrhea","Bradycardia","Miosis"],"Think: dry mouth, blurred vision, constipation, urinary retention, confusion and tachycardia.");

/* ---------- Interactions and contraindications ---------- */
Q("DDI",2,"Which antibiotic most commonly raises the INR of a patient on warfarin?","Sulfamethoxazole-trimethoprim",["Rifampin","Nafcillin","Dicloxacillin"],"SMX-TMP inhibits CYP2C9. Rifampin, nafcillin and dicloxacillin lower the INR.");
Q("DDI",1,"Which combination is contraindicated?","Sildenafil + isosorbide mononitrate",["Sildenafil + metformin","Sildenafil + atorvastatin","Sildenafil + lisinopril"],"PDE5 inhibitors plus nitrates cause profound hypotension.");
Q("DDI",2,"Why should simvastatin be avoided with clarithromycin?","CYP3A4 inhibition raises simvastatin levels and the risk of rhabdomyolysis",["CYP3A4 induction lowers simvastatin","They chelate in the gut","Additive hypoglycemia"],"Clarithromycin is a strong CYP3A4 inhibitor. Azithromycin does not share this interaction.");
Q("DDI",2,"Grapefruit juice interacts with many drugs because it:","Inhibits intestinal CYP3A4",["Induces CYP2D6","Inhibits CYP2C9 in the liver only","Induces P-glycoprotein"],"It raises levels of drugs such as simvastatin, felodipine and some immunosuppressants.");
Q("DDI",2,"Which pair carries the highest hyperkalemia risk?","Lisinopril + spironolactone",["Lisinopril + furosemide","Amlodipine + hydrochlorothiazide","Metoprolol + furosemide"],"Both raise potassium. Loop and thiazide diuretics waste potassium instead.");
Q("DDI",2,"Which combination carries the highest risk of serotonin syndrome?","Phenelzine + sertraline",["Lisinopril + sertraline","Atorvastatin + fluoxetine","Metformin + escitalopram"],"Never combine MAOIs with SSRIs. Allow a washout of 14 days (5 weeks after fluoxetine).");
Q("DDI",2,"How should ciprofloxacin be scheduled with an aluminum or magnesium antacid?","Cipro at least 2 hours before or 6 hours after the antacid",["Take them together with food","Take the antacid 30 minutes before","No separation is needed"],"Polyvalent cations chelate quinolones and cut absorption.");
Q("DDI",2,"How should levothyroxine be separated from calcium or iron supplements?","By at least 4 hours",["By 30 minutes","Take together for better absorption","By 12 hours after dinner only"],"Calcium, iron, aluminum and bile acid binders all reduce levothyroxine absorption.");
Q("DDI",3,"Which acid suppressor is a CYP2C19 inhibitor that can blunt clopidogrel activation?","Omeprazole",["Pantoprazole","Famotidine","Sucralfate"],"Esomeprazole acts the same way. Pantoprazole is the preferred PPI with clopidogrel.");
Q("DDI",3,"Amiodarone is started in a patient on digoxin. What is expected?","Digoxin levels rise, so the digoxin dose is usually reduced",["Digoxin levels fall","No change","Digoxin renal clearance doubles"],"Amiodarone inhibits P-glycoprotein and reduces clearance.");
Q("DDI",2,"Which drug is a strong CYP3A4 inhibitor?","Ketoconazole",["Rifampin","Carbamazepine","Phenytoin"],"The other three are inducers. Inhibitors raise substrate levels; inducers lower them.");
Q("DDI",2,"Which herbal product can reduce the effectiveness of oral contraceptives?","St. John's wort",["Ginger","Melatonin","Fish oil"],"St. John's wort induces CYP3A4 and P-glycoprotein. It also risks serotonin syndrome with SSRIs.");
Q("DDI",3,"Methotrexate plus trimethoprim-sulfamethoxazole can cause:","Pancytopenia from additive antifolate effects",["Hypoglycemia","Serotonin syndrome","Torsades de pointes"],"Both drugs interfere with folate metabolism, and SMX-TMP may also reduce methotrexate clearance.");
Q("DDI",3,"What is the main concern when allopurinol is added to azathioprine?","Azathioprine toxicity (myelosuppression), so its dose must be reduced",["Reduced allopurinol efficacy","Serotonin syndrome","Prolonged QT interval"],"Xanthine oxidase breaks down 6-MP, the active metabolite of azathioprine.");
Q("DDI",1,"Which drug class is contraindicated in pregnancy?","ACE inhibitors",["Labetalol","Methyldopa","Nifedipine"],"ACE inhibitors and ARBs cause fetal renal injury. Labetalol, methyldopa and nifedipine are preferred.");
Q("DDI",2,"Metformin is contraindicated when eGFR falls below:","30 mL/min/1.73 m2",["60 mL/min/1.73 m2","45 mL/min/1.73 m2","15 mL/min/1.73 m2"],"Do not start metformin at eGFR 30-45. Contraindicated below 30 because of lactic acidosis risk.");
Q("DDI",2,"Which beta-blocker is best avoided in a patient with asthma?","Propranolol",["Metoprolol","Atenolol","Bisoprolol"],"Non-selective beta-blockers block beta-2 receptors and may trigger bronchospasm.");

/* ---------- Counseling ---------- */
Q("CN",1,"How should alendronate be taken?","With a full glass of plain water on an empty stomach, staying upright for 30 minutes",["With breakfast and milk","At bedtime, lying down","With coffee to improve absorption"],"This reduces the risk of esophageal irritation and improves absorption.");
Q("CN",1,"When should levothyroxine be taken?","On an empty stomach, 30-60 minutes before breakfast",["With a large breakfast","At bedtime with dairy","Only on days with symptoms"],"Take it consistently at the same time each day, with water.");
Q("CN",2,"A patient used one sublingual nitroglycerin tablet and the chest pain is not better after 5 minutes. What should they do?","Call 911 and then may take another dose",["Wait 30 minutes","Swallow three tablets together","Take a PPI"],"Dose can be repeated every 5 minutes up to 3 doses, but emergency services should be called after the first.");
Q("CN",1,"What should you advise after using an inhaled corticosteroid?","Rinse your mouth and spit",["Drink a glass of milk","Do not use water for 1 hour","Store the inhaler in the freezer"],"This prevents oral thrush and hoarseness.");
Q("CN",2,"Counseling on warfarin and diet should emphasize:","Keep vitamin K intake consistent",["Avoid all leafy greens","Eat leafy greens only on weekends","Diet has no effect on warfarin"],"Consistency matters more than avoidance, because it keeps the INR stable.");
Q("CN",2,"Which counseling point applies to metronidazole?","Avoid alcohol during treatment and for about 3 days after",["Avoid dairy products","Take with grapefruit juice","Avoid sunlight for 1 week"],"It may cause flushing, nausea and vomiting with alcohol.");
Q("CN",1,"Which counseling is most important for doxycycline?","Take with a full glass of water, stay upright, and use sun protection",["Take it only with dairy","Lie down after each dose","Stop when you feel better"],"Doxycycline can irritate the esophagus and causes photosensitivity. Separate from antacids, iron and calcium.");
Q("CN",2,"Where is an epinephrine autoinjector injected?","Outer mid-thigh, then call 911",["Upper arm vein","Buttock only","Abdomen after removing clothing"],"It can be injected through clothing. Emergency care is still needed even if symptoms improve.");
Q("CN",2,"A patient uses two different eye drops. How should they be spaced?","About 5 minutes apart",["Back to back","One hour apart","Mixed in a single bottle"],"Waiting prevents wash-out of the first drop. Gentle pressure on the inner corner of the eye also reduces systemic absorption.");
Q("CN",2,"What should you tell a patient about stopping sertraline?","Do not stop suddenly; taper with a clinician",["Stop as soon as you feel well","Double the dose first","Stop if you feel nausea"],"Abrupt stops can cause discontinuation symptoms such as dizziness, irritability and flu-like symptoms.");
Q("CN",2,"When should a PPI be taken?","30-60 minutes before the first meal of the day",["Right after dinner","At bedtime with a snack","Only when heartburn starts"],"PPIs work best on active pumps, which are stimulated by food.");
Q("CN",2,"How long can most in-use insulin vials and pens be kept before discarding?","About 28 days",["90 days","Until empty","6 months if refrigerated"],"Check the product label because some insulins differ. Unopened insulin is refrigerated until the expiration date.");
Q("CN",1,"How should a patient measure an antibiotic suspension?","Shake well and use an oral syringe or dosing cup",["Use a kitchen teaspoon","Dilute with hot water","Freeze it for storage"],"Household spoons vary widely. Always use the device supplied.");
Q("CN",2,"A patient misses one active combined birth control pill. What is the general advice?","Take it as soon as you remember, even if that means two pills in one day",["Skip it and continue the next day","Restart the pack","Double the next pill and stop the pack"],"If more than one pill is missed, backup contraception is advised.");

/* ---------- Antidotes ---------- */
Q("AD",1,"Antidote for acetaminophen overdose?","N-acetylcysteine",["Flumazenil","Fomepizole","Naloxone"],"NAC restores glutathione. Use the Rumack-Matthew nomogram to guide treatment.");
Q("AD",1,"Antidote for opioid overdose?","Naloxone",["Flumazenil","Physostigmine","Atropine"],"Naloxone is a short-acting opioid antagonist, so repeat dosing may be needed.");
Q("AD",1,"Antidote for benzodiazepine overdose?","Flumazenil",["Naloxone","Glucagon","Protamine"],"Flumazenil can precipitate seizures in chronic benzodiazepine users.");
Q("AD",1,"Reversal agent for warfarin?","Vitamin K (phytonadione)",["Protamine","Idarucizumab","Andexanet alfa"],"Add prothrombin complex concentrate (PCC) for life-threatening bleeding.");
Q("AD",1,"Reversal agent for heparin?","Protamine sulfate",["Vitamin K","Idarucizumab","Deferoxamine"],"Protamine neutralizes heparin.");
Q("AD",2,"Antidote for digoxin toxicity?","Digoxin immune Fab",["Flumazenil","Glucagon","Calcium gluconate"],"Reserved for life-threatening arrhythmias or very high levels.");
Q("AD",2,"Treatment for organophosphate poisoning?","Atropine plus pralidoxime",["Physostigmine","Naloxone","Hydroxocobalamin"],"Atropine treats muscarinic signs, pralidoxime reactivates cholinesterase.");
Q("AD",2,"Antidote for methanol or ethylene glycol poisoning?","Fomepizole",["N-acetylcysteine","Deferoxamine","Hydroxocobalamin"],"Fomepizole inhibits alcohol dehydrogenase.");
Q("AD",2,"Antidote for iron overdose?","Deferoxamine",["Dimercaprol","Fomepizole","Flumazenil"],"Deferoxamine is an iron chelator.");
Q("AD",2,"Antidote for cyanide poisoning?","Hydroxocobalamin",["Deferoxamine","Pralidoxime","Methylene blue"],"Hydroxocobalamin binds cyanide to form cyanocobalamin (vitamin B12).");
Q("AD",2,"Rescue agent for methotrexate toxicity?","Leucovorin",["N-acetylcysteine","Vitamin K","Folic acid alone"],"Leucovorin bypasses the DHFR block.");
Q("AD",2,"Reversal agent for dabigatran?","Idarucizumab",["Andexanet alfa","Protamine","Vitamin K"],"Idarucizumab (Praxbind) binds dabigatran directly.");
Q("AD",2,"Reversal agent for apixaban or rivaroxaban?","Andexanet alfa",["Idarucizumab","Protamine","Phytonadione alone"],"Andexanet alfa is a decoy factor Xa. Four-factor PCC is an alternative.");
Q("AD",2,"Antidote for beta-blocker overdose?","Glucagon",["Calcium gluconate","Flumazenil","Atropine only"],"Glucagon raises cAMP through a non-adrenergic route.");
Q("AD",2,"Treatment for tricyclic antidepressant overdose with QRS widening?","Sodium bicarbonate",["Flumazenil","Physostigmine","Naloxone"],"Bicarbonate reduces sodium channel blockade and alkalinizes the blood.");
Q("AD",2,"Isoniazid overdose with seizures is treated with:","Pyridoxine (vitamin B6)",["Vitamin K","Thiamine","Leucovorin"],"Isoniazid depletes GABA through B6 depletion.");
Q("AD",3,"Anticholinergic toxicity with severe agitation can be treated with:","Physostigmine",["Neostigmine","Pralidoxime","Atropine"],"Physostigmine crosses the blood-brain barrier. Use it carefully after checking the ECG.");

/* ---------- Sig codes and law ---------- */
Q("SIG",1,"What does BID mean?","Twice daily",["Before meals","Every other day","At bedtime"],"BID = bis in die. TID is three times daily, QID is four times daily.");
Q("SIG",1,"What does QHS mean?","Every night at bedtime",["Every hour","Four times daily","Every morning"],"QHS = quaque hora somni.");
Q("SIG",1,"What does PRN mean?","As needed",["Every day","By mouth","Before meals"],"PRN = pro re nata. PO = by mouth.");
Q("SIG",1,"What does AC mean on a sig?","Before meals",["After meals","With meals","At bedtime"],"AC = ante cibum. PC = post cibum (after meals).");
Q("SIG",2,"What does OS mean?","Left eye",["Right eye","Both eyes","Left ear"],"OD = right eye, OS = left eye, OU = both eyes. AD, AS and AU are for ears.");
Q("SIG",2,"Interpret: ii gtt OU q6h","Instill 2 drops in both eyes every 6 hours",["Instill 2 drops in the left eye every 6 hours","Instill 2 drops in both ears every 6 hours","Take 2 tablets by mouth every 6 hours"],"gtt = drops, OU = both eyes, q6h = every 6 hours.");
Q("SIG",2,"Which abbreviation is on the Joint Commission Do Not Use list?","U for units",["mL","mg","PRN"],"U can be misread as 0, 4 or cc. Write out units.");
Q("SIG",2,"Which dose is written safely?","0.5 mg",[".5 mg","5.0 mg","0.50 mg"],"Always use a leading zero (0.5) and never a trailing zero (5.0 could be read as 50).");
Q("SIG",2,"Which drug is Schedule II?","Hydrocodone/acetaminophen",["Tramadol","Alprazolam","Pregabalin"],"Hydrocodone combinations moved to C-II in 2014. Tramadol and alprazolam are C-IV, pregabalin is C-V.");
Q("SIG",2,"Which drug is Schedule IV?","Zolpidem",["Oxycodone","Pregabalin","Testosterone"],"Oxycodone is C-II, pregabalin is C-V, testosterone is C-III.");
Q("SIG",2,"How many refills are allowed on a Schedule II prescription?","None; a new prescription is required",["Up to 5 within 6 months","Up to 11 within 1 year","Unlimited"],"C-III and C-IV allow up to 5 refills in 6 months.");
Q("SIG",2,"An Orange Book rating beginning with A (such as AB) means:","Therapeutically equivalent",["Not equivalent","A biologic product","Pending approval"],"A-rated generics can generally be substituted unless the prescriber prohibits it.");
Q("SIG",2,"DAW 1 on a prescription means:","The prescriber requires the brand; no substitution",["The patient requested brand","Generic is unavailable","Substitution is allowed"],"DAW 2 means the patient requested the brand.");
Q("SIG",1,"Why is tall man lettering (for example predniSONE and prednisoLONE) used?","To reduce look-alike and sound-alike errors",["To mark controlled substances","To show refrigerated drugs","To highlight high-alert drugs"],"ISMP uses capitals to highlight the differing letters.");
Q("SIG",3,"Which DEA number has a valid check digit?","AS1234563",["AS1234567","AS1234561","AS1234569"],"Add digits 1+3+5, then add twice the sum of digits 2+4+6. The last digit of that total must equal the 7th digit. Here 9 + 24 = 33, so the last digit is 3.");
Q("SIG",2,"OBRA 90 requires pharmacists to:","Perform prospective DUR and offer to counsel",["Verify all prescriptions by phone","Dispense generics only","Keep records for 20 years"],"Originally for Medicaid patients, and most states have extended counseling requirements to all patients.");
Q("SIG",2,"An NDC is made of which three segments?","Labeler, product and package",["Dose, route and frequency","Prescriber, patient and drug","Schedule, strength and quantity"],"The NDC identifies the labeler, product and package size.");

/* ---------- Calculation generators (infinite supply) ---------- */
function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function fmtN(n) { return String(Math.round(n * 100) / 100); }
function mkCalc(d, q, correct, cands, unit, e) {
  const cs = fmtN(correct), out = [];
  cands.forEach(c => { const s = fmtN(c); if (c > 0 && s !== cs && out.indexOf(s) < 0) out.push(s); });
  const spare = [1.25, 0.75, 1.5, 0.5, 2, 0.6, 3, 1.1];
  for (let i = 0; out.length < 3 && i < spare.length; i++) {
    const s = fmtN(correct * spare[i]);
    if (s !== cs && out.indexOf(s) < 0) out.push(s);
  }
  const u = unit ? " " + unit : "";
  return { c: "CALC", d, q, a: cs + u, w: out.slice(0, 3).map(s => s + u), e, gen: true };
}
const CALC_GENS = [
  function weightDose() {
    let kg, mk, div, total, dose;
    do { kg = pick([12, 16, 20, 24, 30, 36, 40, 48, 60, 72, 80]); mk = pick([10, 20, 30, 40, 50]); div = pick([2, 4]); total = kg * mk; dose = total / div; } while (dose !== Math.floor(dose));
    return mkCalc(2, `A ${kg} kg child is ordered an antibiotic at ${mk} mg/kg/day divided every ${24 / div} hours. How many mg per dose?`, dose,
      [total, dose * 2, dose / 2, total / (div + 1)], "mg", `${kg} kg x ${mk} mg/kg/day = ${total} mg/day. Divide by ${div} doses = ${dose} mg per dose.`);
  },
  function lbToKg() {
    const lb = pick([88, 110, 132, 154, 176, 198, 220]); const kg = lb / 2.2;
    return mkCalc(1, `A patient weighs ${lb} lb. What is the weight in kg? (1 kg = 2.2 lb)`, kg, [lb * 2.2, lb / 2, lb / 2.5, kg + 10], "kg", `${lb} lb / 2.2 = ${fmtN(kg)} kg.`);
  },
  function daysSupply() {
    const qty = pick([120, 240]), tabs = pick([1, 2]);
    const fr = pick([{ n: "once daily", f: 1 }, { n: "twice daily", f: 2 }, { n: "three times daily", f: 3 }, { n: "four times daily", f: 4 }]);
    const days = qty / (tabs * fr.f);
    return mkCalc(1, `Sig: take ${tabs} tablet${tabs > 1 ? "s" : ""} ${fr.n}. Quantity dispensed: #${qty}. What is the days supply?`, days,
      [qty / fr.f, qty / tabs, qty * fr.f, qty / (tabs * fr.f) * 2], "days", `Tablets per day = ${tabs} x ${fr.f} = ${tabs * fr.f}. ${qty} / ${tabs * fr.f} = ${days} days.`);
  },
  function dilution() {
    const t = pick([[20, 5, 200], [10, 2, 500], [50, 10, 250], [25, 5, 300], [10, 2.5, 200]]);
    const v1 = t[1] * t[2] / t[0];
    return mkCalc(2, `How many mL of a ${t[0]}% stock solution are needed to prepare ${t[2]} mL of a ${t[1]}% solution?`, v1,
      [t[0] * t[2] / t[1], t[2] - v1, t[2] * t[1], v1 * 2], "mL", `C1V1 = C2V2. V1 = (${t[1]} x ${t[2]}) / ${t[0]} = ${fmtN(v1)} mL. Add diluent to reach ${t[2]} mL.`);
  },
  function ivRate() {
    const t = pick([[1000, 8], [500, 4], [250, 5], [1000, 10], [500, 5], [1000, 12]]); const r = t[0] / t[1];
    return mkCalc(1, `Infuse ${t[0]} mL over ${t[1]} hours. What is the rate in mL/hr?`, r, [t[0] * t[1], t[0] / (t[1] * 60), r * 2, r / 2], "mL/hr", `${t[0]} mL / ${t[1]} hr = ${fmtN(r)} mL/hr.`);
  },
  function gtt() {
    const t = pick([[1000, 8, 15], [500, 4, 20], [250, 2, 10], [1000, 10, 15], [500, 5, 60]]);
    const r = Math.round(t[0] * t[2] / (t[1] * 60));
    return mkCalc(3, `Infuse ${t[0]} mL over ${t[1]} hours with a drip factor of ${t[2]} gtt/mL. What is the rate in gtt/min (rounded to a whole number)?`, r,
      [t[0] / t[1], t[0] * t[2] / t[1], t[0] * t[1] / t[2]], "gtt/min", `(${t[0]} mL x ${t[2]} gtt/mL) / (${t[1]} x 60 min) = ${r} gtt/min.`);
  },
  function pct() {
    const t = pick([[500, 2], [250, 4], [1000, 0.9], [300, 5], [800, 0.5]]); const g = t[0] * t[1] / 100;
    return mkCalc(2, `How many grams of drug are in ${t[0]} mL of a ${t[1]}% w/v solution?`, g, [t[0] * t[1], t[0] / t[1], t[0] * t[1] / 10, t[1]], "g", `A ${t[1]}% w/v solution has ${t[1]} g per 100 mL. ${t[0]} mL x ${t[1]} / 100 = ${fmtN(g)} g.`);
  },
  function crcl() {
    const age = pick([50, 60, 65, 70, 75, 80]), wt = pick([60, 72, 80, 90]), scr = pick([0.8, 1, 1.2, 1.5, 2]), female = Math.random() < 0.5;
    const base = (140 - age) * wt / (72 * scr), v = Math.round(base * (female ? 0.85 : 1));
    return mkCalc(3, `Estimate creatinine clearance (Cockcroft-Gault, actual body weight): ${age}-year-old ${female ? "female" : "male"}, ${wt} kg, serum creatinine ${scr} mg/dL.`, v,
      [female ? base : base * 0.85, base * 1.15, (140 - age) * wt / scr / 10, Math.round(base * 1.4)].map(Math.round), "mL/min",
      `CrCl = ((140 - age) x weight) / (72 x SCr)${female ? " x 0.85 for females" : ""} = ${v} mL/min.`);
  },
  function household() {
    const u = pick([["tsp", 5], ["tbsp", 15], ["fl oz", 30]]), n = pick([2, 3, 4]), v = n * u[1];
    return mkCalc(1, `How many mL are in ${n} ${u[0]}? (1 tsp = 5 mL, 1 tbsp = 15 mL, 1 fl oz = 30 mL)`, v, [n * 5, n * 15, n * 30, n * 10], "mL", `${n} ${u[0]} x ${u[1]} mL = ${v} mL.`);
  },
  function liquidQty() {
    const dose = pick([5, 10, 15]), fr = pick([{ n: "twice daily", f: 2 }, { n: "three times daily", f: 3 }, { n: "four times daily", f: 4 }]), days = pick([5, 7, 10, 14]);
    const tot = dose * fr.f * days;
    return mkCalc(1, `Sig: ${dose} mL ${fr.n} for ${days} days. How many mL must be dispensed?`, tot, [dose * days, dose * fr.f, fr.f * days, tot / 2], "mL", `${dose} mL x ${fr.f} per day x ${days} days = ${tot} mL.`);
  }
];
function genCalc() { return pick(CALC_GENS)(); }

if (typeof module !== "undefined") module.exports = { BANK, genCalc, CALC_GENS };

/* ---------- Law and safety (also used by the health inspector) ---------- */
Q("SIG",2,"Which form is used to order Schedule II controlled substances from a wholesaler?","DEA Form 222 (or the electronic CSOS)",["DEA Form 106","DEA Form 224","DEA Form 41"],"Form 222 (or CSOS electronically) is the C-II order form. Form 106 reports theft or loss, Form 224 is a new pharmacy registration, and Form 41 documents destruction of controlled substances.");
Q("SIG",2,"A pharmacy finds a significant theft or loss of controlled substances. Which DEA form reports it?","DEA Form 106",["DEA Form 222","DEA Form 224","DEA Form 363"],"Form 106 reports theft or significant loss. The pharmacy also notifies the local DEA office in writing within one business day of discovery.");
Q("SIG",1,"How long must a pharmacy keep federal controlled substance records?","At least 2 years",["30 days","6 months","10 years"],"Federal law requires controlled substance records to be kept for at least 2 years and be readily retrievable. Many states require longer.");
Q("SIG",1,"Which law requires child-resistant caps on most oral prescription containers?","Poison Prevention Packaging Act",["Controlled Substances Act","Durham-Humphrey Amendment","Food, Drug, and Cosmetic Act of 1938"],"The Poison Prevention Packaging Act (enforced by the Consumer Product Safety Commission) requires child-resistant packaging. The patient or prescriber can request a non-child-resistant container.");
Q("SIG",2,"Which product is exempt from child-resistant packaging requirements?","Sublingual nitroglycerin",["Warfarin","Amlodipine","Metformin"],"Sublingual nitroglycerin is exempt so patients can open it quickly during angina. It stays in its original glass bottle.");
Q("SIG",2,"What is the purpose of a REMS program?","To manage a known serious risk of a medication",["To set the price of a drug","To extend a patent","To track expiration dates"],"A Risk Evaluation and Mitigation Strategy is required by the FDA for drugs with serious risks, for example iPLEDGE for isotretinoin.");
Q("SIG",2,"Which drug requires patient enrollment in the iPLEDGE REMS program?","Isotretinoin",["Methotrexate","Warfarin","Spironolactone"],"Isotretinoin is teratogenic. iPLEDGE requires pregnancy testing and contraception counseling before each fill.");
Q("SIG",1,"A recall notice lists lots you have on the shelf. What should you do first?","Remove and quarantine the affected lots and follow the recall notice",["Dispense them until they run out","Relabel them and put them back","Wait for patients to report problems"],"Pull affected lots right away, keep them separate from active stock, check what was already dispensed, and follow the notice for patient notification and return.");
Q("SIG",1,"What is the correct temperature range for a pharmacy refrigerator?","36 to 46 °F (2 to 8 °C)",["20 to 30 °F","68 to 77 °F","50 to 60 °F"],"Refrigerated drugs and vaccines are kept at 2 to 8 °C, with temperatures monitored and logged. Room temperature is 20 to 25 °C (68 to 77 °F).");
Q("SIG",2,"Under HIPAA, which use of patient information is allowed without written authorization?","Treatment, payment and health care operations",["Selling patient lists to a marketer","Posting a patient's name on social media","Telling a neighbor about a patient's diagnosis"],"HIPAA permits use and disclosure for treatment, payment and operations. Marketing, sale of information and casual disclosures need authorization or are not allowed.");
Q("SIG",1,"What should be done with expired medications in the pharmacy?","Separate them from active stock for return or destruction",["Keep them mixed in with stock","Sell them at a discount","Relabel them with a new date"],"Expired drugs are removed from active stock, clearly marked, and sent through a reverse distributor or destroyed according to the rules for their schedule.");
Q("SIG",1,"Which two patient identifiers should be checked when handing out a prescription?","Full name and date of birth",["Phone number and insurance plan","First name and drug color","Street address and prescriber name"],"Use two identifiers, such as full name and date of birth, to prevent giving a prescription to the wrong patient.");
Q("SIG",2,"Which drugs need a Medication Guide handed out with each dispensing?","Drugs with serious risks, such as NSAIDs and antidepressants",["Only controlled substances","Only injectable drugs","Only over-the-counter products"],"The FDA requires Medication Guides for drugs with serious, preventable risks. Antidepressants (suicidality) and NSAIDs (cardiovascular and GI risk) are common examples.");
Q("SIG",2,"Which schedule includes pregabalin and cough preparations containing small amounts of codeine?","Schedule V",["Schedule II","Schedule III","Schedule IV"],"Pregabalin (Lyrica) is C-V, as are some codeine cough preparations (state rules vary).");
Q("SIG",2,"What does checking the prescription drug monitoring program (PDMP) help detect?","Overlapping controlled-substance prescriptions and doctor shopping",["Drug allergies","Generic equivalence","Insurance plan changes"],"The PDMP shows a patient's controlled-substance fill history across prescribers and pharmacies.");
Q("SIG",1,"Which waste belongs in a sharps container?","Needles and lancets",["Expired tablets","Empty paper boxes","Ointment tubes"],"Needles, syringes with needles and lancets go in a puncture-resistant sharps container. Expired drugs follow separate disposal rules.");
Q("SIG",1,"What is a medication 'near miss'?","An error caught before it reaches the patient",["An error that harmed a patient","A late delivery","A refused prescription"],"Near misses are reported and reviewed too, because they reveal weak points in the workflow before someone is hurt.");
Q("SIG",2,"What is the best check for a high-alert medication such as insulin?","An independent double check",["A single quick check","Checking only the label color","Asking the patient to read the label"],"High-alert drugs get an independent double check by a second person, because errors with them cause the most harm.");
