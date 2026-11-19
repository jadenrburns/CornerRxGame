/* P1 Biochemistry, Exam 4: digestion, PDH and citric acid cycle, electron transport, gluconeogenesis.
   Concept questions (B4D, B4C, B4E, B4G) and drag-and-place cards (B4PD, B4PC, B4PE, B4PG).
   Built from the four lecture PDFs: digestion, citric acid cycle (incl. PDH), electron transport chain, gluconeogenesis. */
const XD = (d, q, a, w, e, t) => Q("B4D", d, q, a, w, e, t || "Digestion and energy carriers", "Digestion lecture");
const XC = (d, q, a, w, e, t) => Q("B4C", d, q, a, w, e, t || "Citric acid cycle", "Citric acid cycle lecture");
const XE = (d, q, a, w, e, t) => Q("B4E", d, q, a, w, e, t || "Electron transport", "Electron transport lecture");
const XG = (d, q, a, w, e, t) => Q("B4G", d, q, a, w, e, t || "Gluconeogenesis", "Gluconeogenesis lecture");
/* place card: rows are arrays of text and {a: answer} blanks. extra = decoy tiles. */
const PLC = (cat, d, title, rows, extra, e, src, dia) => {
  const ans = []; if (dia) dia.nodes.forEach(n => { if (n.a) ans.push(n.a); });
  rows.forEach(r => r.forEach(p => { if (typeof p !== 'string') ans.push(p.a); }));
  Q(cat, d, title, ans.join(' | '), ["A blank is wrong", "A blank is empty", "The order is mixed up"], e, "Drag and place", src);
  BANK[BANK.length - 1].place = { rows, extra, dia };
};
const CAC_ORDER = ['Oxaloacetate', 'Citrate', 'Isocitrate', 'Alpha-ketoglutarate', 'Succinyl-CoA', 'Succinate', 'Fumarate', 'Malate'];
const CAC_ENZ = ['Citrate synthase', 'Aconitase', 'Isocitrate dehydrogenase', 'Alpha-ketoglutarate dehydrogenase', 'Succinyl-CoA synthetase', 'Succinate dehydrogenase', 'Fumarase', 'Malate dehydrogenase'];
const CAC_RES = ['CoA released', 'none (isomerization)', 'NADH + CO2', 'NADH + CO2', 'GTP', 'FADH2', 'H2O added', 'NADH'];
const CAC_IN = ['+ acetyl-CoA', '', '+ NAD+', '+ NAD+ + CoA', '+ GDP + Pi', '+ FAD', '+ H2O', '+ NAD+'];
const SH = (m) => m;

/* ---------- Digestion and energy carriers ---------- */
XD(1, "What turns pepsinogen into active pepsin in the stomach?", "The low pH, which lets pepsinogen cut itself", ["Enteropeptidase released from the duodenal cells", "Secretin released by the intestinal wall into the blood", "Trypsin arriving from the pancreas"], "Stomach acid (pH 1 to 2) denatures proteins and also activates pepsinogen, which then cleaves itself to make active pepsin.", "Protein digestion");
XD(1, "Omeprazole (Prilosec) works by irreversibly blocking which target?", "The K+/H+ ATPase (proton pump) of parietal cells", ["The pancreatic bicarbonate transporter of the duct cells", "Pepsin itself, in the stomach lumen", "The Na+-glucose transporter of the small intestine"], "The sulfenamide form of omeprazole binds the K+/H+ ATPase, so the stomach makes far less acid.", "Protein digestion");
XD(1, "Which hormone, released when acidic food reaches the small intestine, makes the pancreas secrete sodium bicarbonate?", "Secretin", ["Cholecystokinin (CCK)", "Insulin", "Glucagon"], "Low pH in the digest makes the intestinal wall release secretin. Bicarbonate raises the pH so pancreatic proteases can work.", "Protein digestion");
XD(1, "Polypeptides in the small intestine trigger release of CCK. What does CCK make happen?", "The pancreas releases digestive enzymes and the gallbladder releases bile salts", ["The stomach makes more acid and more pepsinogen", "The pancreas releases only sodium bicarbonate, no enzymes", "The duodenum releases enteropeptidase and the gallbladder stays closed"], "CCK acts on the pancreas (enzymes) and the gallbladder (bile salts). Secretin is the one tied to bicarbonate.", "Protein digestion");
XD(1, "What does enteropeptidase do?", "It converts trypsinogen to trypsin, and trypsin then activates the other zymogens", ["It cuts proteins into single amino acids at the brush border of the gut", "It releases bicarbonate from the pancreas when the digest is acidic", "It activates pepsinogen in the stomach once the pH falls"], "Enteropeptidase is made by duodenal cells. It starts the zymogen cascade by activating trypsinogen.", "Protein digestion");
XD(1, "What is a zymogen?", "An inactive protease precursor that is activated by cleavage", ["A fully active enzyme that is stored in granules in the gallbladder", "A bile salt made from cholesterol that emulsifies dietary fat", "A hormone from the gut wall that triggers enzyme release"], "Pepsinogen and trypsinogen are zymogens. Making them inactive protects the cells that produce them.", "Protein digestion");
XD(2, "Which sequence correctly orders protein digestion?", "Pepsin in the stomach, then pancreatic proteases in the lumen, then peptidases on the intestinal cells", ["Pancreatic proteases in the lumen, then pepsin in the stomach, then peptidases on the intestinal cells", "Peptidases on the intestinal cells, then trypsin in the lumen, then pepsin in the stomach", "Trypsin in the stomach, then pepsin in the lumen, then chymotrypsin on the cells"], "Stomach (pepsin), small intestine lumen (trypsin, chymotrypsin, elastase, carboxypeptidase), then cell-associated peptidases.", "Protein digestion");
XD(1, "In what form is most digested protein absorbed by intestinal cells?", "Amino acids, dipeptides and tripeptides", ["Whole proteins in chylomicrons", "Only free single amino acids, never peptides", "Peptides of 20 or more residues in micelles"], "Specific transporters take up amino acids, di- and tripeptides and pass them to the blood.", "Protein digestion");
XD(2, "Which bonds does alpha-amylase cleave in starch?", "Alpha 1-4 bonds, but not alpha 1-6 branch points", ["Alpha 1-6 branch bonds only, but not alpha 1-4", "Both alpha 1-4 and alpha 1-6 bonds equally well", "Beta 1-4 bonds, as in cellulose"], "Amylase leaves branch points behind. Alpha-dextrinase handles the alpha 1-6 bonds.", "Carbohydrate digestion");
XD(1, "Which brush-border enzyme splits lactose, and into what?", "Lactase, into glucose and galactose", ["Sucrase, into glucose and fructose", "Maltase, into two glucoses", "Alpha-amylase, into glucose and galactose"], "Lactase: lactose to glucose plus galactose. Sucrase: sucrose to glucose plus fructose. Maltase: maltose to two glucoses.", "Carbohydrate digestion");
XD(2, "Sucrose is broken down by sucrase into which two sugars?", "Glucose and fructose", ["Glucose and galactose", "Two molecules of glucose", "Fructose and galactose"], "Sucrose is the main sugar of fruit and honey. Lactose (animal source) is glucose plus galactose.", "Carbohydrate digestion");
XD(2, "How do glucose and galactose enter the intestinal epithelial cell?", "By Na+-dependent co-transporters", ["Only by passive diffusion through the lipid membrane", "By uptake inside chylomicrons made in the lumen", "Only through GLUT2 on the lumen side of the cell"], "Glucose and galactose use Na+-dependent co-transport. Facilitative GLUT transporters also move glucose across cell membranes.", "Carbohydrate digestion");
XD(2, "Acarbose helps type 2 diabetes by blocking which enzymes?", "Pancreatic alpha-amylase and brush-border alpha-glucosidases", ["Lactase and sucrase of the brush border only", "Pancreatic lipase and bile salt micelles", "Hexokinase and glucokinase in the liver"], "Less carbohydrate is digested, so less glucose enters the blood. Undigested carbohydrate causes flatulence and diarrhea.", "Carbohydrate digestion");
XD(1, "Why does acarbose cause flatulence and diarrhea?", "Undigested carbohydrate reaches the colon and is fermented by bacteria", ["It blocks the release of bile salts from the gallbladder", "It stimulates too much secretin release from the gut wall", "It irritates the lining of the stomach and causes acid reflux"], "Carbohydrate that is not digested in the small intestine builds up in the colon, where gut bacteria ferment it.", "Carbohydrate digestion");
XD(1, "Bile salts are made from which molecule in the liver?", "Cholesterol", ["Glucose", "Pyruvate", "Chylomicron remnants"], "Bile salts such as glycocholate come from cholesterol and emulsify lipid so lipases can reach it.", "Lipid digestion");
XD(2, "After lipases act on triacylglycerols, which products are carried in micelles to the intestinal wall?", "Free fatty acids and monoacylglycerol", ["Intact triacylglycerols and bile salts", "Glycerol and cholesterol esters only", "Fully formed chylomicrons with apoprotein B48"], "Micelles formed with bile salts carry fatty acids and monoacylglycerol to the cell surface for absorption.", "Lipid digestion");
XD(2, "Inside intestinal cells, absorbed fat is rebuilt into triacylglycerol and packaged as what, and where does it go first?", "Chylomicrons, which enter the lymph", ["VLDL, which enter the portal vein", "Micelles, which enter the lymph", "Free fatty acids, which enter the portal vein"], "Chylomicrons contain apoprotein B48 and travel through the lymph before reaching the blood.", "Lipid digestion");
XD(1, "What is steatorrhea and when does it appear?", "Fat in the stool when bile salts are low", ["Blood in the stool after a protease deficiency in the stomach", "Watery stool with gas from lactase deficiency in the gut", "Undigested starch in the stool after taking acarbose"], "Without bile salts fat is not emulsified or absorbed, so it is excreted.", "Lipid digestion");
XD(2, "Which fuels can the body store?", "Carbohydrate (glycogen) and lipid (fat), but not amino acids", ["Carbohydrate and amino acids, but not lipid or fat", "Amino acids and lipid, but not carbohydrate or glycogen", "All three fuels, in equal amounts, in every tissue"], "Excess amino acids are broken down to carbohydrate or acetyl units. Liver and muscle store glycogen; adipose stores fat.", "Fuel use");
XD(2, "When glucose runs low, what is the correct order of fuel mobilization?", "Glycogen, then fat, then amino acids only in fasting", ["Amino acids first, then glycogen, and then fat from adipose", "Fat from adipose first, then glycogen, and amino acids last", "Fat and amino acids together before any glycogen is touched"], "The liver breaks down glycogen first. Adipose lipases mobilize fat only when glucose is scarce.", "Fuel use");
XD(1, "NAD+ is made from which vitamin?", "Niacin (vitamin B3)", ["Riboflavin (vitamin B2)", "Thiamine (vitamin B1)", "Pantothenate (vitamin B5)"], "FAD comes from riboflavin, TPP from thiamine, and acetyl-CoA contains pantothenate.", "Energy carriers");
XD(1, "The isoalloxazine ring of FAD comes from which vitamin?", "Riboflavin (vitamin B2)", ["Niacin (vitamin B3), the NAD+ precursor", "Thiamine (vitamin B1), the TPP precursor", "Folate, the one-carbon carrier"], "Humans cannot make FAD and must get riboflavin from the diet.", "Energy carriers");
XD(2, "What is NADPH used for?", "Reductive biosynthesis, not ATP production", ["Carrying electrons to complex I of the electron transport chain", "Substrate-level phosphorylation", "Carrying acetyl groups into the citric acid cycle"], "NADPH carries electrons like NADH but is used for reductive biosynthesis. NADH feeds the respiratory chain.", "Energy carriers");
XD(2, "When NAD+ is reduced, what does it accept?", "A hydride ion (one proton and two electrons)", ["Two protons and one electron from the fuel", "A single electron only, with no proton", "A phosphate group from ATP"], "NAD+ + hydride gives NADH. A second proton is released into solution.", "Energy carriers");
XD(2, "Creatine kinase helps a sprinter by doing what?", "Passing phosphate from creatine phosphate to ADP", ["Making creatine phosphate from ATP in the liver at rest", "Oxidizing fatty acids in the muscle mitochondria", "Moving lactate out of working muscle into the blood"], "Creatine phosphate + ADP gives ATP + creatine. It is a quick reserve for bursts of energy.", "Energy carriers");
XD(2, "Which statement about ATP hydrolysis is correct?", "ATP to ADP + Pi releases about -30.5 kJ/mol, and ATP to AMP + Pi about -45.6 kJ/mol", ["ATP to ADP + Pi releases about -45.6 kJ/mol, and ATP to AMP + Pi about -30.5 kJ/mol", "ATP to AMP + Pi releases less energy than ATP to ADP + Pi does", "ATP hydrolysis absorbs about 30 kJ/mol, and synthesis releases it"], "The energy is held in the phosphoanhydride bonds of the triphosphate group.", "Energy carriers");
XD(1, "Substrate-level phosphorylation makes ATP by which means?", "Direct phosphoryl transfer from a high-energy compound, e.g. PEP", ["A proton gradient across the inner mitochondrial membrane that drives ATP synthase", "Reduction of oxygen to water at complex IV of the chain", "Hydrolysis of NADH to NAD+ in the cytosol"], "The other route is oxidative phosphorylation, which uses the proton gradient.", "Energy carriers");
XD(1, "Which describes a catabolic reaction?", "It breaks molecules down and releases useful energy", ["It uses energy to build larger new molecules", "It only happens in the nucleus of the cell", "It never produces any ATP or reduced carriers"], "Anabolic reactions are the ones that use energy to synthesize molecules.", "Metabolism basics");
XD(2, "Which vitamins are coenzyme precursors?", "The water-soluble vitamins", ["The fat-soluble vitamins A, D, E and K", "Only vitamins A and D", "None of the vitamins, which are not coenzymes"], "Almost all activated carriers that act as coenzymes come from water-soluble vitamins. Fat-soluble vitamins are not coenzymes.", "Metabolism basics");

/* ---------- Pyruvate dehydrogenase and the citric acid cycle ---------- */
XC(1, "Where in the cell do pyruvate dehydrogenase and the citric acid cycle enzymes sit?", "In the mitochondrial matrix", ["In the cytosol", "On the outer mitochondrial membrane", "In the intermembrane space"], "Succinate dehydrogenase is the one exception: it is embedded in the inner membrane.", "Pyruvate dehydrogenase");
XC(1, "What is the reaction catalyzed by the pyruvate dehydrogenase complex?", "Pyruvate + CoA + NAD+ to acetyl-CoA + CO2 + NADH", ["Pyruvate + CO2 + ATP to oxaloacetate + ADP + Pi", "Pyruvate + NADH to lactate + NAD+ (no CO2 made)", "Acetyl-CoA + oxaloacetate to citrate + CoA (no CO2 made)"], "It is an oxidative decarboxylation. It is irreversible and commits the carbon to oxidation (or to fatty acid synthesis).", "Pyruvate dehydrogenase");
XC(2, "Which three enzymes make up the PDH complex?", "Pyruvate dehydrogenase (E1), dihydrolipoyl transacetylase (E2) and dihydrolipoyl dehydrogenase (E3)", ["Citrate synthase, aconitase and isocitrate dehydrogenase of the cycle", "Pyruvate carboxylase, PEPCK and lactate dehydrogenase of the liver", "Hexokinase, phosphofructokinase and pyruvate kinase of glycolysis"], "The E2 transacetylase forms the core of the complex. E3 resets the enzyme for another round.", "Pyruvate dehydrogenase");
XC(2, "Which coenzymes of PDH are stoichiometric (used up as substrates)?", "CoA and NAD+", ["TPP and lipoic acid", "TPP and FAD", "Lipoic acid and FAD"], "TPP (vitamin B1), lipoic acid and FAD are catalytic and regenerated. CoA and NAD+ behave as substrates.", "Pyruvate dehydrogenase");
XC(2, "Which vitamin supplies thiamine pyrophosphate (TPP), a PDH coenzyme?", "Thiamine (vitamin B1)", ["Riboflavin (vitamin B2)", "Niacin (vitamin B3)", "Pantothenate (vitamin B5)"], "TPP is also needed by alpha-ketoglutarate dehydrogenase.", "Pyruvate dehydrogenase");
XC(2, "How does the PDH kinase change PDH activity?", "It phosphorylates E1 and inactivates the complex", ["It phosphorylates E1 and activates the complex", "It dephosphorylates E1 and inactivates the complex", "It removes CoA from E2"], "PDH phosphatase reverses the effect. The kinase and phosphatase are both bound to E2.", "PDH regulation");
XC(2, "Which conditions activate PDH kinase (and so shut PDH off)?", "High NADH, acetyl-CoA and ATP ratios", ["High ADP and high pyruvate during exercise", "A rise in Ca2+ in muscle cells", "Insulin acting on the liver cell"], "High energy charge turns PDH off. ADP, pyruvate and Ca2+ (during exercise) turn it back on.", "PDH regulation");
XC(2, "Which signal activates PDH phosphatase?", "A rise in Ca2+ and insulin (in liver)", ["High NADH and high acetyl-CoA in the matrix", "High acetyl-CoA alone", "High ATP in resting muscle"], "Insulin pushes pyruvate toward acetyl-CoA for fatty acid synthesis.", "PDH regulation");
XC(2, "Product inhibition of PDH works through which pair?", "Acetyl-CoA inhibits E2 and NADH inhibits E3", ["Acetyl-CoA inhibits E1 and NADH inhibits E2", "ATP inhibits E2 and ADP inhibits E3", "CO2 inhibits E1 and CoA inhibits E3"], "High products signal that the complex does not need to run.", "PDH regulation");
XC(2, "Thiamine deficiency (beriberi) causes pyruvate and alpha-ketoglutarate to build up. Why?", "TPP is needed by both PDH and alpha-ketoglutarate dehydrogenase", ["TPP is needed by citrate synthase and aconitase", "Thiamine is the carrier of CO2 for pyruvate carboxylase", "Thiamine is converted into NAD+"], "The nervous system suffers most because it depends on glucose. Cardiac problems also occur.", "PDH clinical");
XC(2, "Arsenite and mercury inhibit PDH by binding which component?", "The E3 subunit", ["The E1 subunit", "The E2 core only", "The PDH kinase"], "Both have a high affinity for the lipoic acid/E3 part, giving beriberi-like symptoms.", "PDH clinical");
XC(2, "A person with PDH phosphatase deficiency has PDH that is always phosphorylated. What happens to glucose?", "It is converted to lactate instead of acetyl-CoA", ["It is stored as extra glycogen only, with no lactate", "It is converted to oxaloacetate and to citrate", "It cannot enter glycolysis at all"], "The complex is inactive, so pyruvate is pushed to lactate, and the nervous system malfunctions.", "PDH clinical");
XC(1, "What two-carbon molecule enters the citric acid cycle, and what accepts it?", "Acetyl-CoA, which is added to oxaloacetate", ["Pyruvate, which is added to citrate to form isocitrate", "Acetyl-CoA, which is added to succinate", "Acetate, which is added directly to malate"], "Oxaloacetate is regenerated at the end of each turn, so it can take up another acetyl unit.", "Citric acid cycle");
XC(1, "Which enzyme condenses acetyl-CoA with oxaloacetate?", "Citrate synthase", ["Aconitase", "Isocitrate dehydrogenase", "Malate dehydrogenase"], "The reaction goes through a citryl-CoA intermediate. Oxaloacetate must bind first.", "Citric acid cycle");
XC(2, "Fluoroacetate is a toxin because its product, fluorocitrate, is a suicide inhibitor of which enzyme?", "Aconitase", ["Citrate synthase", "Fumarase", "Succinate dehydrogenase"], "Aconitase converts citrate to isocitrate through cis-aconitate.", "Citric acid cycle");
XC(1, "Which step of the cycle makes the first NADH and the first CO2?", "Isocitrate dehydrogenase (isocitrate to alpha-ketoglutarate)", ["Citrate synthase (acetyl-CoA + oxaloacetate)", "Aconitase (citrate to isocitrate)", "Succinyl-CoA synthetase (making GTP)"], "The second NADH and CO2 come from alpha-ketoglutarate dehydrogenase.", "Citric acid cycle");
XC(2, "Alpha-ketoglutarate dehydrogenase is most like which other enzyme?", "Pyruvate dehydrogenase, with the same five coenzymes", ["Citrate synthase, with CoA and acetyl groups", "Aconitase, with an iron-sulfur cluster", "Fumarase, which also needs TPP"], "Both turn a 2-oxo acid into an acyl-CoA + CO2 + NADH. Unlike PDH, alpha-KGDH is not regulated by covalent modification.", "Citric acid cycle");
XC(2, "Which step is a substrate-level phosphorylation?", "Succinyl-CoA to succinate (succinyl-CoA synthetase), making GTP or ATP", ["Succinate to fumarate (succinate dehydrogenase), making FADH2", "Malate to oxaloacetate (malate dehydrogenase), making NADH", "Isocitrate to alpha-ketoglutarate (isocitrate dehydrogenase), making NADH"], "Cleaving the thioester bond of succinyl-CoA drives formation of GTP (liver) or ATP (muscle).", "Citric acid cycle");
XC(2, "Why does succinate dehydrogenase use FAD instead of NAD+?", "The free energy change is too small to reduce NAD+", ["It sits in the cytosol where NAD+ is scarce", "It makes CO2, which needs FAD", "FAD is a stronger oxidant than NAD+ in every reaction"], "The FADH2 stays bound and passes its electrons to coenzyme Q.", "Citric acid cycle");
XC(2, "Which citric acid cycle enzyme is embedded in the inner mitochondrial membrane?", "Succinate dehydrogenase", ["Citrate synthase of the matrix", "Fumarase of the matrix", "Malate dehydrogenase of the matrix"], "It is also complex II of the electron transport chain.", "Citric acid cycle");
XC(1, "What does fumarase do?", "It adds water to fumarate to make malate", ["It oxidizes succinate to fumarate using FAD", "It oxidizes malate to oxaloacetate using NAD+", "It makes GTP from succinyl-CoA and GDP"], "No electron carrier is reduced in this hydration step.", "Citric acid cycle");
XC(1, "Which is the net result of one turn of the cycle for one acetyl-CoA?", "3 NADH, 1 FADH2, 1 GTP and 2 CO2", ["2 NADH, 2 FADH2, 1 ATP and 3 CO2", "3 NADH, 3 FADH2 and 2 CO2", "1 NADH, 1 FADH2, 3 GTP and 1 CO2"], "About 10 ATP are made when the electrons are passed to O2 by oxidative phosphorylation.", "Citric acid cycle");
XC(2, "Why can the citric acid cycle run only when oxygen is available?", "NAD+ and FAD must be regenerated by oxidative phosphorylation", ["Citrate synthase needs O2 as a direct substrate", "Oxaloacetate is made from O2 in the matrix", "CO2 cannot leave the mitochondrion without O2 present"], "Glycolysis has an anaerobic mode, but the cycle has only an aerobic mode.", "Citric acid cycle");
XC(2, "What are the three main control points of the cycle?", "PDH, isocitrate dehydrogenase and alpha-KGDH", ["Citrate synthase, fumarase and malate dehydrogenase of the cycle", "Aconitase, succinyl-CoA synthetase and fumarase of the cycle", "Pyruvate kinase, hexokinase and PFK of glycolysis in the cytosol"], "Alpha-KGDH is inhibited by succinyl-CoA, NADH, ATP and GTP.", "Citric acid cycle");
XC(2, "What is the difference between anaplerotic and cataplerotic reactions?", "Anaplerotic reactions refill cycle intermediates; cataplerotic reactions drain them", ["Anaplerotic reactions drain intermediates; cataplerotic reactions refill them", "Both make NADH", "Anaplerotic reactions happen only in the cytosol"], "Draining intermediates supplies biosynthesis. Refilling keeps the cycle running.", "Citric acid cycle");
XC(2, "Pyruvate carboxylase refills the cycle. What turns it on?", "Acetyl-CoA, signaling low oxaloacetate", ["High ADP, signaling low energy", "Insulin only, acting through the kinase", "Citrate, made by citrate synthase"], "The enzyme is only active when acetyl-CoA is bound.", "Citric acid cycle");
XC(1, "Which of these sources of acetyl-CoA is correct besides pyruvate?", "Fatty acid breakdown and some amino acids", ["Only glucose, through pyruvate", "Only lactate from the muscle", "Only the pentose phosphate pathway"], "Acetyl-CoA from many fuels meets in the cycle.", "Citric acid cycle");

/* ---------- Electron transport and oxidative phosphorylation ---------- */
XE(1, "Where are the electron transport chain complexes located?", "In the inner mitochondrial membrane", ["In the mitochondrial matrix", "In the outer mitochondrial membrane", "In the cytosol"], "The inner membrane is folded into cristae, giving a huge surface area.", "Mitochondria");
XE(2, "Which statement about mitochondrial membranes is correct?", "The outer membrane has VDAC pores; the inner membrane is freely permeable only to H2O, O2 and CO2", ["The inner membrane has VDAC pores; the outer membrane is impermeable to small ions", "Both membranes are freely permeable to ions and to protons", "The inner membrane is smooth and the outer membrane is folded into many cristae"], "The inner membrane controls passage of ATP, ADP, pyruvate, Ca2+ and phosphate through transport proteins.", "Mitochondria");
XE(2, "Which statement about mitochondrial DNA is correct?", "It is circular, inherited from the mother, and encodes 13 genes for oxidative phosphorylation", ["It is linear and inherited from both parents equally", "It encodes all of the 1500 proteins the mitochondrion needs", "It is inherited from the father and encodes 13 genes"], "Most mitochondrial proteins come from the nuclear genome.", "Mitochondria");
XE(1, "Which complex is NADH-Q oxidoreductase?", "Complex I", ["Complex II", "Complex III", "Complex IV"], "Complex II is succinate dehydrogenase, III is Q-cytochrome c oxidoreductase, IV is cytochrome c oxidase.", "Complexes");
XE(1, "Where does FADH2 from succinate oxidation donate its electrons?", "Complex II (succinate dehydrogenase)", ["Complex I (NADH-Q oxidoreductase)", "Complex III (Q-cytochrome c oxidoreductase)", "Complex IV (cytochrome c oxidase)"], "Electrons from FADH2 enter downstream of those from NADH. Complexes I and II do not operate in series.", "Complexes");
XE(2, "What carries electrons from complexes I and II to complex III?", "Coenzyme Q (ubiquinone)", ["Cytochrome c", "NAD+", "Iron-sulfur clusters only"], "CoQ is hydrophobic, with a long isoprenoid tail, and diffuses in the inner membrane.", "Carriers");
XE(2, "What carries electrons from complex III to complex IV?", "Cytochrome c, carrying one electron at a time", ["Coenzyme Q, carrying two electrons at a time", "FADH2, carrying a hydride ion", "NADPH, carrying two electrons"], "Cytochrome c is a small water-soluble heme protein associated with the inner membrane.", "Carriers");
XE(2, "Which is the fully reduced form of coenzyme Q?", "Ubiquinol (QH2)", ["Semiquinone (QH)", "Ubiquinone (Q)", "Cytochrome c"], "Q takes one electron and H+ to form QH, and a second to form QH2.", "Carriers");
XE(2, "How many protons does complex I pump per NADH?", "4", ["2", "6", "10"], "Complex III pumps 2 and complex IV pumps 4, giving 10 per NADH.", "Proton pumping");
XE(2, "Which complex of the main chain does NOT pump protons?", "Complex II", ["Complex I", "Complex III", "Complex IV"], "That is why FADH2 yields less ATP than NADH.", "Proton pumping");
XE(2, "Per pair of electrons, about how many protons are pumped for NADH versus FADH2?", "10 for NADH and 6 for FADH2", ["6 for NADH and 10 for FADH2", "4 for NADH and 2 for FADH2", "10 for both"], "FADH2 skips complex I, so it loses the 4 protons pumped there.", "Proton pumping");
XE(2, "What is the final electron acceptor, and what is formed?", "O2, which is reduced to water by complex IV", ["NAD+, which is reduced to NADH by complex IV", "CO2, which is reduced to glucose by complex IV", "Cytochrome c, which is reduced to water by complex III"], "Four electrons reduce one O2 to two H2O. This is why oxygen is needed.", "Complexes");
XE(2, "Where is the proton gradient built?", "Protons are pumped from the matrix to the cytoplasmic (intermembrane) side, making the matrix negative", ["Protons are pumped into the matrix, making it positive and the outside negative", "Protons are pumped into the cytosol through VDAC in the outer membrane", "Protons are pumped from the cytosol into the matrix side by complex II"], "The two sides are called N (matrix, negative) and P (cytoplasmic, positive).", "Proton pumping");
XE(1, "Which complex does rotenone inhibit?", "Complex I", ["Complex III", "Complex IV", "Complex II"], "Barbiturates such as amobarbital also inhibit complex I.", "Inhibitors");
XE(1, "Which complex does antimycin A inhibit?", "Complex III", ["Complex I (NADH-Q oxidoreductase)", "Complex II (succinate dehydrogenase)", "Complex IV (cytochrome c oxidase)"], "Antimycin A is an antibiotic that blocks Q-cytochrome c oxidoreductase.", "Inhibitors");
XE(1, "Cyanide, carbon monoxide and hydrogen sulfide all inhibit which complex?", "Complex IV (cytochrome c oxidase)", ["Complex I (NADH-Q oxidoreductase)", "Complex II (succinate dehydrogenase)", "Complex III (Q-cytochrome c oxidoreductase)"], "Blocking the last step stops the whole chain because electrons back up.", "Inhibitors");
XE(2, "Partial reduction of O2 by one electron makes which reactive oxygen species?", "Superoxide", ["Water, the product of complex IV", "Peroxide, from two electrons", "Hydroxide ion"], "Two electrons give peroxide. About 2 to 4% of O2 used by mitochondria becomes superoxide.", "ROS");
XE(2, "Which enzyme converts superoxide to hydrogen peroxide and O2?", "Superoxide dismutase", ["Catalase", "Cytochrome c oxidase", "Succinate dehydrogenase"], "2 O2- + 2 H+ gives O2 + H2O2.", "ROS");
XE(2, "Which enzyme breaks down hydrogen peroxide?", "Catalase, making O2 and water", ["Superoxide dismutase, making superoxide", "Aconitase, making citrate", "Complex III, making water"], "2 H2O2 gives O2 + 2 H2O. Vitamins E and C also help.", "ROS");
XE(2, "Why does the ETC use iron?", "Iron-sulfur clusters and heme groups in cytochromes carry electrons", ["Iron makes ATP directly from ADP and Pi", "Iron pumps protons without any protein at all", "Iron reduces NAD+ in the matrix"], "Both Fe-S clusters and hemes are redox centers.", "Carriers");

/* ---------- Gluconeogenesis and the Cori cycle ---------- */
XG(1, "In which organs does gluconeogenesis mainly occur?", "Liver and kidney", ["Skeletal muscle and brain", "Heart and red blood cells", "Adipose tissue and pancreas"], "They keep blood glucose up for the brain and muscle.", "Basics");
XG(1, "When is gluconeogenesis most important?", "During fasting, when dietary glucose is gone and glycogen is used up", ["Right after a large carbohydrate meal, when insulin is high", "Only during hard exercise, when lactate is high", "Only in newborn infants, never in adults"], "Glucose reserves last about a day. Brain needs roughly 120 g of the 160 g used daily.", "Basics");
XG(2, "Which three glycolysis enzymes catalyze the irreversible steps that gluconeogenesis must bypass?", "Hexokinase, phosphofructokinase and pyruvate kinase", ["Aldolase, enolase and phosphoglycerate kinase, which are reversible", "Hexokinase, aldolase and enolase, which includes reversible steps", "Glucose 6-phosphatase, FBPase and PEPCK, which are gluconeogenic enzymes"], "These steps have large negative free energy changes, so they cannot simply run backward.", "Bypass steps");
XG(2, "The pyruvate kinase step is bypassed by which two enzymes?", "Pyruvate carboxylase and PEP carboxykinase", ["Hexokinase and glucose 6-phosphatase together", "Phosphofructokinase and fructose 1,6-bisphosphatase", "Lactate dehydrogenase and pyruvate dehydrogenase"], "Pyruvate goes to oxaloacetate, then to phosphoenolpyruvate.", "Bypass steps");
XG(2, "Which enzyme bypasses the phosphofructokinase step?", "Fructose 1,6-bisphosphatase", ["Glucose 6-phosphatase of the liver", "PEP carboxykinase of the cytosol", "Pyruvate carboxylase of the mitochondria"], "It is a major control point of the pathway.", "Bypass steps");
XG(2, "Which enzyme bypasses the hexokinase step, and where is it found mainly?", "Glucose 6-phosphatase, mainly in the liver", ["Glucose 6-phosphatase, mainly in muscle", "Hexokinase IV, mainly in the brain", "Phosphoglucomutase, mainly in red blood cells"], "Free glucose is released mainly by the liver. Other tissues stop at glucose 6-phosphate (stored as glycogen).", "Bypass steps");
XG(2, "Where is pyruvate carboxylase located and what does it need?", "The mitochondrial matrix; biotin, ATP and acetyl-CoA", ["The cytosol; biotin, ATP and NADH", "The mitochondrial matrix; thiamine, ATP and FAD", "The cytosol; ATP, lipoic acid and acetyl-CoA"], "Biotin carries the CO2 group. Acetyl-CoA binding activates the enzyme.", "Pyruvate to PEP");
XG(2, "Where is PEP carboxykinase (PEPCK) located?", "The cytosol", ["The mitochondrial matrix only", "The outer mitochondrial membrane", "The inner mitochondrial membrane"], "Oxaloacetate is shuttled out of the mitochondrion as malate and converted back to oxaloacetate in the cytosol.", "Pyruvate to PEP");
XG(2, "Why is oxaloacetate converted to malate in the mitochondrion?", "So it can leave the mitochondrion, since oxaloacetate itself is not shuttled out", ["To make NAD+ for the citric acid cycle", "Because malate is the substrate of PEPCK in the cytosol", "To make ATP in the matrix by substrate-level phosphorylation"], "Malate dehydrogenase reduces OAA to malate; in the cytosol malate is oxidized back to OAA.", "Pyruvate to PEP");
XG(2, "Why can fatty acids not be turned into a net amount of glucose in humans?", "Acetyl-CoA cannot be converted back to oxaloacetate", ["Fatty acids are too hydrophobic to enter the liver cell", "Fatty acids are degraded to pyruvate, which cannot go forward", "Fatty acids are only stored in the brain and kidney"], "There is no pathway from acetyl-CoA to oxaloacetate: the two carbons that enter the cycle are matched by two lost as CO2.", "Substrates");
XG(2, "How does glycerol enter gluconeogenesis?", "As dihydroxyacetone phosphate", ["As oxaloacetate, after a carboxylation", "As acetyl-CoA, through beta-oxidation", "As lactate, through lactate dehydrogenase"], "Glycerol comes from breakdown of triacylglycerols.", "Substrates");
XG(2, "Which amino acids cannot be used to make glucose?", "Leucine and lysine", ["Alanine and glutamine", "Aspartate and glutamate", "Serine and glycine"], "Those two are degraded to acetyl-CoA, not to oxaloacetate or pyruvate.", "Substrates");
XG(2, "How many high-energy phosphates are spent to make one glucose from two pyruvates?", "Six (4 ATP and 2 GTP)", ["Two ATP and no GTP", "Four ATP and no GTP", "Two ATP and two GTP, giving four"], "The extra cost of reversing the favorable pathway is 4 high-energy phosphates.", "Energetics");
XG(2, "How does the cost compare when two glycerols make one glucose?", "It costs only 2 ATP", ["It costs 4 ATP and 2 GTP", "It costs 6 ATP", "It makes ATP"], "Glycerol enters at DHAP, past the expensive pyruvate to PEP steps.", "Energetics");
XG(2, "What does fructose 2,6-bisphosphate do?", "It activates PFK (glycolysis) and inhibits fructose 1,6-bisphosphatase (gluconeogenesis)", ["It inhibits PFK and activates fructose 1,6-bisphosphatase in the liver", "It activates both PFK and fructose 1,6-bisphosphatase", "It inhibits both PFK and fructose 1,6-bisphosphatase"], "It is the signal that glucose is abundant.", "Regulation");
XG(2, "Low blood glucose leads to glucagon release and a rise in cAMP. What happens to fructose 2,6-bisphosphate?", "It falls, because the FBPase2 activity is activated", ["It rises, because PFK2 is activated by glucagon", "It is unchanged, because cAMP has no effect on it", "It becomes fructose 1,6-bisphosphate in the cell"], "Low F2,6BP lets gluconeogenesis run and slows glycolysis.", "Regulation");
XG(2, "Which cell conditions favor gluconeogenesis over glycolysis in the liver?", "High ATP and citrate, low AMP", ["High AMP and ADP, low ATP", "Low citrate and high AMP", "High fructose 2,6-bisphosphate"], "When energy is needed (high AMP), glycolysis (PFK) is on and FBPase is off.", "Regulation");
XG(2, "What is the Cori cycle?", "Muscle lactate goes to the liver, becomes glucose, and returns to muscle", ["Liver glucose goes to muscle and becomes glycogen only, with no lactate", "Muscle pyruvate is turned into acetyl-CoA in the liver and stored", "Fatty acids from adipose are turned into glucose in the kidney"], "Lactate from skeletal muscle and red blood cells travels in the blood to the liver, where lactate dehydrogenase makes pyruvate for gluconeogenesis.", "Cori cycle");
XG(1, "Which enzyme converts lactate to pyruvate in the liver?", "Lactate dehydrogenase", ["Pyruvate carboxylase", "Pyruvate dehydrogenase", "Aldolase"], "Lactate can also be oxidized by well-oxygenated cells such as heart muscle.", "Cori cycle");

/* ---------- Drag and place: citric acid cycle and PDH ---------- */
PLC("B4PC", 2, "Citric acid cycle: fill in the net result of one turn for one acetyl-CoA.", [
  ["NAD+ used:  ", { a: '3' }, "   NADH made:  ", { a: '3' }],
  ["FAD used:  ", { a: '1' }, "   FADH2 made:  ", { a: '1' }],
  ["GDP used:  ", { a: '1' }, "   GTP made:  ", { a: '1' }],
  ["CO2 released:  ", { a: '2' }],
  ["ATP made later by oxidative phosphorylation (about):  ", { a: '10' }]
], ['0', '4', '6'], "3 NAD+ + FAD + GDP + Pi + acetyl-CoA gives 3 NADH + FADH2 + GTP + CoA + 2 CO2. About 10 ATP result when the four electron pairs reach O2.", "Citric acid cycle lecture");
PLC("B4PC", 3, "Citric acid cycle: how many carbons does each molecule have?", [
  ["Oxaloacetate:  ", { a: '4' }, "   Citrate:  ", { a: '6' }],
  ["Isocitrate:  ", { a: '6' }, "   Alpha-ketoglutarate:  ", { a: '5' }],
  ["Succinyl-CoA (acyl part):  ", { a: '4' }, "   Succinate:  ", { a: '4' }],
  ["Fumarate:  ", { a: '4' }, "   Malate:  ", { a: '4' }]
], ['2', '3'], "Acetyl (2C) adds to oxaloacetate (4C) to make citrate (6C). Two carbons are lost as CO2 (isocitrate DH, then alpha-KGDH), leaving 4-carbon molecules until oxaloacetate is regenerated.", "Citric acid cycle lecture");
PLC("B4PC", 2, "Pyruvate dehydrogenase: place the substrates and products of the reaction.", [
  ["Pyruvate + ", { a: 'CoA' }, " + ", { a: 'NAD+' }],
  ["→  ", { a: 'Acetyl-CoA' }, " + ", { a: 'CO2' }, " + ", { a: 'NADH' }],
  ["Where it happens:  ", { a: 'Mitochondrial matrix' }],
  ["Is the reaction reversible?  ", { a: 'No, irreversible' }]
], ['FAD', 'Oxaloacetate', 'FADH2', 'Cytosol', 'Yes, reversible'], "Pyruvate + CoA + NAD+ gives acetyl-CoA + CO2 + NADH in the matrix. It cannot be reversed, so animals cannot turn acetyl-CoA back into pyruvate.", "Citric acid cycle lecture");
PLC("B4PC", 3, "Pyruvate dehydrogenase: place each coenzyme as catalytic (regenerated) or stoichiometric (used as a substrate).", [
  ["Thiamine pyrophosphate (TPP):  ", { a: 'Catalytic' }],
  ["Lipoic acid:  ", { a: 'Catalytic' }],
  ["FAD:  ", { a: 'Catalytic' }],
  ["CoA:  ", { a: 'Stoichiometric' }],
  ["NAD+:  ", { a: 'Stoichiometric' }]
], ['Allosteric inhibitor'], "TPP (B1), lipoic acid and FAD are catalytic coenzymes. CoA and NAD+ are consumed as substrates.", "Citric acid cycle lecture");
PLC("B4PC", 3, "Pyruvate dehydrogenase: place the enzyme (E1, E2, E3) with its job and its regulator.", [
  ["E1:  ", { a: 'Pyruvate dehydrogenase' }, "  (phosphorylated by PDH kinase, which ", { a: 'inactivates' }, " it)"],
  ["E2:  ", { a: 'Dihydrolipoyl transacetylase' }, "  (inhibited by ", { a: 'acetyl-CoA' }, ")"],
  ["E3:  ", { a: 'Dihydrolipoyl dehydrogenase' }, "  (inhibited by ", { a: 'NADH' }, "; bound by ", { a: 'arsenite' }, ")"]
], ['activates', 'Citrate synthase', 'ATP', 'cyanide'], "E1 decarboxylates pyruvate and is the target of the kinase/phosphatase pair. E2 forms the core and makes acetyl-CoA. E3 resets the enzyme. Arsenite and mercury hit E3.", "Citric acid cycle lecture");

/* ---------- Drag and place: gluconeogenesis ---------- */
PLC("B4PG", 2, "Gluconeogenesis: match each irreversible glycolysis enzyme with the enzyme that replaces it.", [
  ["Hexokinase is bypassed by:  ", { a: 'Glucose 6-phosphatase' }],
  ["Phosphofructokinase is bypassed by:  ", { a: 'Fructose 1,6-bisphosphatase' }],
  ["Pyruvate kinase is bypassed by:  ", { a: 'Pyruvate carboxylase' }, "  then  ", { a: 'PEP carboxykinase' }]
], ['Lactate dehydrogenase', 'Aldolase', 'Enolase'], "The three glycolytic enzymes with large negative free energy changes are replaced by four gluconeogenic enzymes.", "Gluconeogenesis lecture");
PLC("B4PG", 3, "Gluconeogenesis: place the location and helper for each key enzyme.", [
  ["Pyruvate carboxylase is in the ", { a: 'mitochondrial matrix' }, ", uses the vitamin ", { a: 'biotin' }, " and needs ", { a: 'acetyl-CoA' }, " bound to be active"],
  ["PEP carboxykinase is in the ", { a: 'cytosol' }],
  ["Glucose 6-phosphatase frees glucose mainly in the ", { a: 'liver' }]
], ['muscle', 'thiamine (TPP)', 'NADH', 'outer membrane'], "Pyruvate carboxylase needs ATP, biotin (CO2 carrier) and acetyl-CoA as an activator. PEPCK is cytosolic. Glucose release is mainly a liver job.", "Gluconeogenesis lecture");
PLC("B4PG", 2, "Gluconeogenesis: which substrates enter, and where?", [
  ["Lactate enters as:  ", { a: 'Pyruvate' }],
  ["Glycerol enters as:  ", { a: 'Dihydroxyacetone phosphate' }],
  ["Most amino acids (not leucine or lysine) can be converted to:  ", { a: 'Oxaloacetate' }],
  ["Fatty acids give ", { a: 'Acetyl-CoA' }, ", which cannot make net glucose because it cannot become ", { a: 'Oxaloacetate' }]
], ['Fructose 1,6-bisphosphate', 'Citrate', 'Glucose 6-phosphate'], "Lactate and some amino acids enter via pyruvate, glycerol via DHAP, and many amino acids via oxaloacetate. Acetyl-CoA has no route back to oxaloacetate.", "Gluconeogenesis lecture");
PLC("B4PG", 2, "Gluconeogenesis: fill in the energy cost.", [
  ["Two pyruvate make one glucose and cost  ", { a: '4' }, "  ATP plus  ", { a: '2' }, "  GTP, which is  ", { a: '6' }, "  high-energy phosphates"],
  ["Two glycerol make one glucose and cost only  ", { a: '2' }, "  ATP"]
], ['1', '3', '8'], "Pyruvate to glucose costs 4 ATP + 2 GTP. Glycerol enters at DHAP, past the costly steps, so 2 ATP is enough.", "Gluconeogenesis lecture");
PLC("B4PG", 3, "Gluconeogenesis and glycolysis: place the regulatory effects (reciprocal regulation in the liver).", [
  ["Fructose 2,6-bisphosphate ", { a: 'activates' }, " PFK and ", { a: 'inhibits' }, " fructose 1,6-bisphosphatase"],
  ["High AMP (energy needed): gluconeogenesis is  ", { a: 'turned off' }, ",  glycolysis is  ", { a: 'turned on' }],
  ["High ATP and citrate (energy plentiful): gluconeogenesis is  ", { a: 'turned on' }],
  ["Low blood glucose, glucagon high: fructose 2,6-bisphosphate  ", { a: 'falls' }],
  ["High blood glucose, fructose 6-phosphate high: fructose 2,6-bisphosphate  ", { a: 'rises' }]
], ['no change'], "Reciprocal regulation keeps only one of the two pathways active. Glucose scarce means gluconeogenesis; glucose abundant means glycolysis.", "Gluconeogenesis lecture");
PLC("B4PE", 2, "Electron transport: place the name of each complex.", [
  ["Complex I:  ", { a: 'NADH-Q oxidoreductase' }],
  ["Complex II:  ", { a: 'Succinate dehydrogenase' }],
  ["Complex III:  ", { a: 'Q-cytochrome c oxidoreductase' }],
  ["Complex IV:  ", { a: 'Cytochrome c oxidase' }]
], ['Pyruvate dehydrogenase', 'ATP synthase', 'Catalase'], "Complex I: NADH-Q oxidoreductase; II: succinate dehydrogenase; III: Q-cytochrome c oxidoreductase; IV: cytochrome c oxidase.", "Electron transport lecture");
PLC("B4PE", 3, "Electron transport: how many protons are pumped?", [
  ["Complex I:  ", { a: '4' }, "   Complex II:  ", { a: '0' }],
  ["Complex III:  ", { a: '2' }, "   Complex IV:  ", { a: '4' }],
  ["Total for one NADH:  ", { a: '10' }, "   Total for one FADH2:  ", { a: '6' }]
], ['1', '3', '8', '12'], "NADH: 4 + 2 + 4 = 10 protons. FADH2 skips complex I and II pumps none, so 2 + 4 = 6.", "Electron transport lecture");
PLC("B4PE", 2, "Electron transport: which complex does each inhibitor block?", [
  ["Rotenone:  ", { a: 'Complex I' }],
  ["Amobarbital (a barbiturate):  ", { a: 'Complex I' }],
  ["Antimycin A:  ", { a: 'Complex III' }],
  ["Cyanide:  ", { a: 'Complex IV' }],
  ["Carbon monoxide and hydrogen sulfide:  ", { a: 'Complex IV' }]
], ['Complex II', 'ATP synthase'], "Rotenone and amytal block complex I, antimycin A blocks III, and cyanide, CO and H2S block cytochrome c oxidase.", "Electron transport lecture");
PLC("B4PE", 3, "Reactive oxygen species: place each step of the chain of events.", [
  ["Step 1: O2 plus one electron makes  ", { a: 'Superoxide' }],
  ["Step 2: superoxide is converted by the enzyme  ", { a: 'Superoxide dismutase' }, "  into O2 and  ", { a: 'Hydrogen peroxide' }],
  ["Step 3: hydrogen peroxide is converted by the enzyme  ", { a: 'Catalase' }, "  into O2 and  ", { a: 'Water' }],
  ["Antioxidant vitamins that also help:  ", { a: 'E and C' }]
], ['Cytochrome c oxidase', 'Hydroxide', 'B1 and B2'], "Partial reduction of O2 gives superoxide (and peroxide with two electrons). SOD makes H2O2, catalase breaks it into O2 and water; vitamins E and C add protection.", "Electron transport lecture");
PLC("B4PE", 2, "Mitochondria: place the location of each process.", [
  ["Electron transport chain complexes:  ", { a: 'Inner membrane' }],
  ["Citric acid cycle enzymes and PDH:  ", { a: 'Matrix' }],
  ["Protons are pumped from the matrix into the  ", { a: 'Intermembrane space' }],
  ["The matrix side of the inner membrane is  ", { a: 'Negative (N)' }, "  and the cytoplasmic side is  ", { a: 'Positive (P)' }]
], ['Outer membrane', 'Cytosol', 'Nucleus'], "The chain sits in the inner membrane. Pumping protons out of the matrix makes the matrix side negative and the outer side positive.", "Electron transport lecture");

/* ---------- Drag and place: digestion and energy carriers ---------- */
PLC("B4PD", 2, "Protein digestion: place the signals and the enzymes.", [
  ["Stomach acid activates  ", { a: 'Pepsinogen' }, "  into  ", { a: 'Pepsin' }],
  ["Acid chyme makes the intestine release  ", { a: 'Secretin' }, ",  which makes the pancreas release  ", { a: 'Sodium bicarbonate' }],
  ["Polypeptides make the intestine release  ", { a: 'CCK' }, ",  which makes the pancreas release enzymes and the gallbladder release  ", { a: 'Bile salts' }],
  ["The duodenum makes  ", { a: 'Enteropeptidase' }, ",  which turns trypsinogen into  ", { a: 'Trypsin' }]
], ['Insulin', 'Glucagon', 'Lipase', 'Pepsin A'], "Secretin brings bicarbonate; CCK brings enzymes and bile; enteropeptidase starts the pancreatic zymogen cascade by making trypsin.", "Digestion lecture");
PLC("B4PD", 2, "Carbohydrate digestion: place the enzyme and the products.", [
  ["Starch alpha 1-4 bonds are cut by  ", { a: 'Alpha-amylase' }],
  ["Alpha 1-6 branch points are cut by  ", { a: 'Alpha-dextrinase' }],
  ["Sucrose is split by  ", { a: 'Sucrase' }, "  into glucose and  ", { a: 'Fructose' }],
  ["Lactose is split by  ", { a: 'Lactase' }, "  into glucose and  ", { a: 'Galactose' }],
  ["Maltose is split by  ", { a: 'Maltase' }, "  into two  ", { a: 'Glucose' }]
], ['Pepsin', 'Trypsin', 'Mannose'], "Amylase and dextrinase work on starch. Sucrase, lactase and maltase are brush-border disaccharidases. Acarbose blocks amylase and alpha-glucosidases.", "Digestion lecture");
PLC("B4PD", 2, "Lipid digestion: place the steps from the diet to the lymph.", [
  ["Bile salts are made from  ", { a: 'Cholesterol' }, "  in the liver and make an  ", { a: 'Emulsion' }],
  ["Lipases break triacylglycerol into  ", { a: 'Fatty acids' }, "  and  ", { a: 'Monoacylglycerol' }],
  ["These are carried to the gut wall in  ", { a: 'Micelles' }],
  ["Inside the cell they are rebuilt into  ", { a: 'Triacylglycerol' }, "  and packed into  ", { a: 'Chylomicrons' }, "  with apoprotein  ", { a: 'B48' }],
  ["Chylomicrons first enter the  ", { a: 'Lymph' }]
], ['Glucose', 'Portal vein', 'B100', 'Amino acids'], "Emulsified fat is cut by lipases; absorbed products form triacylglycerol in the gut cell, then chylomicrons carrying apoB48 go to lymph and then blood.", "Digestion lecture");
PLC("B4PD", 2, "Energy carriers: place the vitamin or role for each carrier.", [
  ["NAD+ is made from  ", { a: 'Niacin (B3)' }],
  ["FAD is made from  ", { a: 'Riboflavin (B2)' }],
  ["Acetyl-CoA contains  ", { a: 'Pantothenate (B5)' }],
  ["TPP, the PDH coenzyme, is made from  ", { a: 'Thiamine (B1)' }],
  ["NADPH is used for  ", { a: 'Reductive biosynthesis' }, ";  NADH and FADH2 feed the  ", { a: 'Electron transport chain' }]
], ['Folate', 'Vitamin K', 'Glycolysis', 'Beta-oxidation'], "Water-soluble vitamins are coenzyme precursors: niacin to NAD+, riboflavin to FAD, pantothenate to CoA, thiamine to TPP.", "Digestion lecture");
PLC("B4PD", 3, "ATP and fast energy: fill in the numbers and molecules.", [
  ["ATP + H2O → ADP + Pi releases about  ", { a: '-30.5 kJ/mol' }],
  ["ATP hydrolyzed all the way to AMP releases about  ", { a: '-45.6 kJ/mol' }],
  ["Creatine phosphate + ADP →  ", { a: 'ATP' }, "  +  ", { a: 'Creatine' }, "  (enzyme:  ", { a: 'Creatine kinase' }, ")"]
], ['-15 kJ/mol', '+30.5 kJ/mol', 'Hexokinase', 'Creatinine'], "Hydrolysis to ADP releases about 30.5 kJ/mol and to AMP about 45.6 kJ/mol. Creatine kinase moves a phosphoryl group from creatine phosphate to ADP for quick bursts.", "Digestion lecture");

/* ---------- Diagram cards (v153): cyclic and ladder layouts like the lecture outlines ---------- */
const GLU = (mode) => {
  const dy = 5, L = 40, M = (t, a, y, x, w) => Object.assign({ x: x || L, y: y + dy, w: w || 33 }, mode === 'mol' ? { a } : { t }), E = (t, a, x, y, w, al) => Object.assign({ x, y: y + dy, w: w || 38, al: al || 'l' }, mode === 'enz' ? { a } : { t, c: 'note' });
  const ys = [8, 28, 48, 68, 88, 108, 132, 168];
  const nodes = [
    M('Glucose', 'Glucose', ys[0]), M('Glucose 6-phosphate', 'Glucose 6-phosphate', ys[1]), M('Fructose 6-phosphate', 'Fructose 6-phosphate', ys[2]), M('Fructose 1,6-bisphosphate', 'Fructose 1,6-bisphosphate', ys[3]),
    M('Triose phosphates (DHAP, G3P)', 'Triose phosphates (DHAP, G3P)', ys[4]), M('Phosphoenolpyruvate', 'Phosphoenolpyruvate', ys[5]), M('Oxaloacetate (cytosol)', 'Oxaloacetate', ys[6]), M('Pyruvate', 'Pyruvate', ys[7]),
    M('Malate', 'Malate', 152, 81, 28), M('Oxaloacetate (mito)', 'Oxaloacetate', 172, 81, 28),
    { x: 1, y: 2, t: 'Glycolysis (down)', c: 'note', al: 'l', w: 30 }, { x: 60, y: 2, t: 'Gluconeogenesis (up)', c: 'note', al: 'l', w: 38 },
    { x: 1, y: 18 + dy, t: 'Hexokinase', c: 'note', al: 'l', w: 17 }, { x: 1, y: 58 + dy, t: 'PFK-1', c: 'note', al: 'l', w: 17 }, { x: 1, y: 138 + dy, t: 'Pyruvate kinase', c: 'note', al: 'l', w: 17 },
    E('Glucose 6-phosphatase', 'Glucose 6-phosphatase', 60, 18), E('Fructose 1,6-bisphosphatase', 'Fructose 1,6-bisphosphatase', 60, 58), E('PEP carboxykinase', 'PEP carboxykinase', 60, 120), E('Pyruvate carboxylase', 'Pyruvate carboxylase', 40, 188, 36, 'c')
  ];
  const arrows = [];
  for (let i = 0; i < 6; i++) { const y1 = ys[i] + dy, y2 = ys[i + 1] + dy; arrows.push({ p: [[L + 6, y2 - 4], [L + 6, y1 + 4]] }); }
  arrows.pop(); arrows.push({ p: [[L + 6, ys[6] + dy - 4], [L + 6, ys[5] + dy + 4]] });
  for (let i = 0; i < 5; i++) arrows.push({ p: [[21, ys[i] + dy + 3], [21, ys[i + 1] + dy - 3]], c: 'g' });
  arrows.push({ p: [[21, ys[5] + dy + 3], [21, ys[7] + dy - 3]], c: 'g' });
  arrows.push({ p: [[57, ys[7] + dy], [66, 172 + dy]] }); arrows.push({ p: [[81, 167 + dy], [81, 158 + dy]] }); arrows.push({ p: [[67, 152 + dy], [57, ys[6] + dy + 3]] });
  return { W: 100, H: 196, nodes, arrows, boxes: [{ x: 63, y: 140 + dy, w: 36, h: 46, t: 'Mitochondrion' }] };
};
PLC("B4PG", 2, "Gluconeogenesis (ladder, up arrows): place every molecule. Dashed grey arrows are glycolysis going down; black arrows go up.", [],
  ['Lactate', 'Citrate', 'Acetyl-CoA', 'Fructose 2,6-bisphosphate'],
  "From pyruvate the pathway goes into the mitochondrion (oxaloacetate, malate), out to the cytosol (oxaloacetate), then up through PEP, triose phosphates, fructose 1,6-bisphosphate, fructose 6-phosphate and glucose 6-phosphate to glucose.", "Gluconeogenesis lecture", GLU('mol'));
PLC("B4PG", 2, "Gluconeogenesis (ladder, up arrows): place the four bypass enzymes. The grey labels on the left are the glycolysis enzymes they replace.", [],
  ['Hexokinase', 'Phosphofructokinase', 'Pyruvate kinase', 'Lactate dehydrogenase'],
  "Pyruvate carboxylase (mitochondria) plus PEP carboxykinase (cytosol) bypass pyruvate kinase. Fructose 1,6-bisphosphatase bypasses PFK-1. Glucose 6-phosphatase (mainly liver) bypasses hexokinase.", "Gluconeogenesis lecture", GLU('enz'));
PLC("B4PG", 2, "The Cori cycle: place each part of the loop. Arrows show the direction of travel.", [],
  ['Acetyl-CoA', 'Glycolysis', 'Brain', 'Pyruvate dehydrogenase', 'Citrate'],
  "Working muscle (low oxygen) makes lactate, which travels in the blood to the liver. The liver makes pyruvate with lactate dehydrogenase, then glucose by gluconeogenesis, and glucose returns through the blood to muscle.", "Gluconeogenesis lecture",
  { W: 100, H: 100, boxes: [{ x: 2, y: 8, w: 40, h: 88, t: 'Skeletal muscle' }, { x: 58, y: 8, w: 40, h: 88, t: 'Liver' }],
    nodes: [{ x: 22, y: 24, t: 'Glucose', w: 30 }, { x: 22, y: 52, t: 'Pyruvate', w: 30 }, { x: 22, y: 82, a: 'Lactate', w: 30 }, { x: 78, y: 82, a: 'Lactate', w: 30 }, { x: 78, y: 52, a: 'Pyruvate', w: 30 }, { x: 78, y: 24, a: 'Glucose', w: 30 },
      { x: 50, y: 93, t: 'Blood', c: 'note', w: 14 }, { x: 50, y: 13, t: 'Blood', c: 'note', w: 14 }, { x: 50, y: 64, a: 'Lactate dehydrogenase', w: 20 }, { x: 50, y: 38, a: 'Gluconeogenesis', w: 20 }],
    arrows: [{ p: [[22, 28], [22, 47]] }, { p: [[22, 57], [22, 77]] }, { p: [[38, 82], [62, 82]] }, { p: [[78, 77], [78, 57]] }, { p: [[78, 47], [78, 29]] }, { p: [[62, 24], [38, 24]] }] });

PLC("B4PE", 2, "Electron transport: place each carrier and complex. Follow the arrows from NADH (and FADH2) to oxygen.", [],
  ['NAD+', 'CO2', 'Superoxide dismutase', 'ATP synthase'],
  "NADH: Complex I, then coenzyme Q, then Complex III, then cytochrome c, then Complex IV, then O2 to H2O. FADH2 joins at Complex II, then coenzyme Q.", "Electron transport lecture",
  { W: 100, H: 100, boxes: [{ x: 1, y: 4, w: 98, h: 92, t: 'Inner mitochondrial membrane' }],
    nodes: [{ x: 12, y: 18, t: 'NADH', w: 17 }, { x: 38, y: 18, a: 'Complex I', w: 21 }, { x: 64, y: 18, a: 'Coenzyme Q', w: 21 }, { x: 89, y: 18, a: 'Complex II', w: 19 }, { x: 89, y: 44, t: 'FADH2 (from succinate)', w: 19 },
      { x: 64, y: 50, a: 'Complex III', w: 21 }, { x: 38, y: 50, a: 'Cytochrome c', w: 21 }, { x: 12, y: 50, a: 'Complex IV', w: 19 }, { x: 12, y: 80, a: 'O2', w: 15 }, { x: 38, y: 80, a: 'H2O', w: 15 },
      { x: 20, y: 31, t: 'H+ pumped: 4', c: 'note', al: 'l', w: 20 }, { x: 70, y: 36, t: 'H+: 2', c: 'note', al: 'l', w: 12 }, { x: 14, y: 65, t: 'H+: 4', c: 'note', al: 'l', w: 14 }],
    arrows: [{ p: [[21, 18], [26.5, 18]] }, { p: [[49.5, 18], [53.5, 18]] }, { p: [[79, 18], [74.5, 18]] }, { p: [[89, 38], [89, 24]] }, { p: [[64, 24], [64, 44]] }, { p: [[53.5, 50], [48.5, 50]] }, { p: [[27.5, 50], [21.5, 50]] }, { p: [[12, 56], [12, 74]] }, { p: [[20, 80], [30, 80]] }] });

/* cyclic citric acid cycle diagram: molecules on an ellipse, curved arrows, enzymes inside, results outside.
   blank = list of 'mol' | 'enz' | 'res' kinds that are blanks; the rest are fixed labels. */
const CYCD = (blank) => {
  const W = 170, H = 124, cx = 85, cy = 62, Rx = 56, Ry = 44, rad = x => x * Math.PI / 180, out = { W, H, nodes: [], arrows: [] };
  const P = (i, kx, ky, off) => [cx + kx * Math.cos(rad(-90 + 45 * i + (off || 0))), cy + ky * Math.sin(rad(-90 + 45 * i + (off || 0)))];
  const nd = (kind, x, y, w, text, cap, cls) => { const o = { x, y, w, c: cls || kind }; if (blank.indexOf(kind) >= 0) o.a = text; else o.t = text; if (cap) { if (o.a) o.t = cap; else o.t = cap + ' ' + text; } return o; };
  const cen = [];
  for (let i = 0; i < 8; i++) { const p = P(i, Rx, Ry); cen.push(p); out.nodes.push(nd('mol', p[0], p[1], 13, CAC_ORDER[i], '', 'mol')); }
  for (let i = 0; i < 8; i++) {
    const a = cen[i], b = cen[(i + 1) % 8], vx = b[0] - a[0], vy = b[1] - a[1], hw = 12.5, hh = 5;
    const sh = (v) => Math.min(hw / Math.max(Math.abs(vx), .01), hh / Math.max(Math.abs(vy), .01)) * 1.0 + .07;
    const s = sh(), p1 = [a[0] + vx * s, a[1] + vy * s], p2 = [b[0] - vx * s, b[1] - vy * s];
    const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, ox = (mx - cx) * .22, oy = (my - cy) * .22, cxp = mx + ox, cyp = my + oy;
    out.arrows.push({ d: 'M' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) + ' Q' + cxp.toFixed(1) + ',' + cyp.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1) });
    const q = [(p1[0] + 2 * cxp + p2[0]) / 4, (p1[1] + 2 * cyp + p2[1]) / 4];
    const e = P(i, Rx * .66, Ry * .55, 22.5), r = P(i, Rx * 1.13, Ry * 1.22, 22.5);
    out.nodes.push(nd('enz', e[0], e[1], 13.5, CAC_ENZ[i], '', 'enz'));
    out.nodes.push(nd('res', r[0], r[1], 13, CAC_RES[i], CAC_IN[i], 'res'));
    out.arrows.push({ p: [[q[0], q[1]], [q[0] + (r[0] - q[0]) * .55, q[1] + (r[1] - q[1]) * .55]], c: 'g', nm: 1 });
    out.arrows.push({ p: [[q[0], q[1]], [q[0] + (e[0] - q[0]) * .5, q[1] + (e[1] - q[1]) * .5]], c: 'g', nm: 1 });
  }
  out.nodes.push({ x: cx, y: cy + 1, t: 'Citric acid cycle', c: 'note', w: 11 });
  return out;
};
const CYC_EX = { mol: ['Pyruvate', 'Glutamate', 'Phosphoenolpyruvate', 'Acetyl-CoA'], enz: ['Pyruvate dehydrogenase', 'Pyruvate carboxylase', 'Lactate dehydrogenase'], res: ['FADH2 + CO2', 'ATP + NADPH', 'H2O removed', 'NAD+ made'] };
const CYC_E = "Clockwise from the top: oxaloacetate, citrate, isocitrate, alpha-ketoglutarate, succinyl-CoA, succinate, fumarate, malate. Enzymes: citrate synthase, aconitase, isocitrate dehydrogenase, alpha-ketoglutarate dehydrogenase, succinyl-CoA synthetase, succinate dehydrogenase, fumarase, malate dehydrogenase. Per turn: 3 NADH, 1 FADH2, 1 GTP and 2 CO2.";
PLC("B4PC", 2, "Citric acid cycle (molecules): place the molecule at each position. Acetyl-CoA joins at the first arrow, clockwise from the top.", [], CYC_EX.mol, CYC_E, "Citric acid cycle lecture", CYCD(['mol']));
PLC("B4PC", 2, "Citric acid cycle (enzymes): place the enzyme inside each arrow.", [], CYC_EX.enz, CYC_E, "Citric acid cycle lecture", CYCD(['enz']));
PLC("B4PC", 2, "Citric acid cycle (results): place what is made or released at each step.", [], CYC_EX.res, CYC_E, "Citric acid cycle lecture", CYCD(['res']));
PLC("B4PC", 3, "Citric acid cycle (full diagram): place every molecule, enzyme and result. Blue blanks are molecules, purple are enzymes, green are results.", [], CYC_EX.mol.concat(CYC_EX.enz, CYC_EX.res), CYC_E, "Citric acid cycle lecture", CYCD(['mol', 'enz', 'res']));
