// te53: Therapeutics questions about how many days/weeks symptoms last (or when to refer) must name the disease state
const fs = require('fs');
const files = ['bank.js', 'th3.js', 'th3c.js', 'ger.js', 'th553.js', 'him.js'];
const B = new Function(files.map(f => fs.readFileSync(__dirname + '/' + f, 'utf8')).join('\n') + ';return BANK;')();
const time = /\b(days?|weeks?|hours?|months?|how long)\b/i, symp = /(symptom|self-treat|referral|refer\b|persist|no relief|no improvement|returns)/i;
const disease = /(diarrhea|constipation|IBS|irritable|hemorrhoid|crohn|colitis|IBD|ulcer|GERD|heartburn|reflux|esophagitis|dyspepsia|pregnan|contracept|insomnia|delirium|migraine|headache|hypertens|diabet|gout|asthma|COPD|thyroid|hepatitis|infection|UTI|pain|nausea|vomit|bleeding|incontinence|fall|heart failure|hyponatremia|hypoglycemia)/i;
const bad = B.filter(q => ['TH3', 'TH3F', 'TH3C', 'GER', 'T553', 'HIM'].includes(q.c) && !q.draw && time.test(q.q) && symp.test(q.q) && !disease.test(q.q));
console.log('duration-of-symptom questions missing a disease state:', bad.length);
bad.forEach(q => console.log(' -', q.c, q.q));
console.log('errs []');
