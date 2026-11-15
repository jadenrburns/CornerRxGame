/* Wardrobe gear: every unlockable thing for the pharmacist (and the pets), in one table.
   Fields: id, slot (which Character slider it lives in), name, e (emoji fallback), r (rarity key in RAR),
   src: 'start' (everyone has it) | 'capsule' (drops from the lost pills vial) | 'shop' (price) | 'rank' (rank number) | 'award' (mastery awards),
   buff: small tycoon bonuses that stack across equipped items:
     pay    fraction added to cash per correct fill     tech   fraction added to technician tips
     time   extra seconds before the speed bonus fades  rep    extra reputation per correct fill
     pills  fraction more lost pills popping out        streak extra answers before the streak bonus caps
   d: one line shown under the item. Never rename a shipped id (saves store them). */
const RAR = {
  common: { n: 'Common', c: '#7D8C99', w: 60 },
  rare: { n: 'Rare', c: '#3E72D9', w: 28 },
  epic: { n: 'Epic', c: '#8A63C9', w: 10 },
  legendary: { n: 'Legendary', c: '#D99A00', w: 2 }
};
const SLOTS = [
  ['face', 'Facial hair'], ['eyes', 'Glasses'], ['hat', 'Hat'], ['neck', 'Neck'], ['coat', 'Coat'], ['hands', 'In hand'], ['extra', 'Extras'], ['cyber', 'Cyborg parts'], ['hair', 'Hair style'], ['pet', 'Pets']
];
const GEAR = [
  /* facial hair (capsules) */
  { id: 'mustache', slot: 'face', name: 'Mustache', e: '🥸', r: 'common', src: 'capsule', buff: { rep: 1 }, d: 'Patients trust a tidy mustache.' },
  { id: 'goatee', slot: 'face', name: 'Goatee', e: '🧔', r: 'common', src: 'capsule', buff: {}, d: 'Just looks sharp.' },
  { id: 'soulpatch', slot: 'face', name: 'Soul patch', e: '😏', r: 'common', src: 'capsule', buff: {}, d: 'Jazz night at the counter.' },
  { id: 'handlebar', slot: 'face', name: 'Handlebar mustache', e: '🤵', r: 'rare', src: 'capsule', buff: { rep: 1 }, d: 'Old-time apothecary energy.' },
  { id: 'beard', slot: 'face', name: 'Full beard', e: '🧔‍♂️', r: 'rare', src: 'capsule', buff: { time: 1 }, d: 'Wise. Takes a second longer to be rushed.' },
  { id: 'chops', slot: 'face', name: 'Mutton chops', e: '🤠', r: 'rare', src: 'capsule', buff: { streak: 1 }, d: 'Frontier pharmacist.' },
  /* glasses */
  { id: 'round', slot: 'eyes', name: 'Round glasses', e: '👓', r: 'common', src: 'start', buff: {}, d: '' },
  { id: 'square', slot: 'eyes', name: 'Square glasses', e: '👓', r: 'common', src: 'start', buff: {}, d: '' },
  { id: 'readers', slot: 'eyes', name: 'Reading glasses', e: '🤓', r: 'common', src: 'capsule', buff: { rep: 1 }, d: 'You read every label. Patients notice.' },
  { id: 'goggles', slot: 'eyes', name: 'Lab goggles', e: '🥽', r: 'common', src: 'capsule', buff: { tech: 0.02 }, d: 'Compounding ready. Techs follow your lead.' },
  { id: 'monocle', slot: 'eyes', name: 'Monocle', e: '🧐', r: 'rare', src: 'capsule', buff: { pay: 0.02 }, d: 'Distinguished. Fills pay a little more.' },
  { id: 'eyepatch', slot: 'eyes', name: 'Eyepatch', e: '🏴‍☠️', r: 'rare', src: 'capsule', buff: { streak: 1 }, d: 'Nobody argues with the pirate pharmacist.' },
  { id: 'shades', slot: 'eyes', name: 'Sunglasses', e: '🕶️', r: 'rare', src: 'rank', rank: 2, buff: { rep: 1 }, d: 'Promotion gift. Too cool to be rushed.' },
  { id: 'aviators', slot: 'eyes', name: 'Gold aviators', e: '😎', r: 'epic', src: 'capsule', buff: { pay: 0.03 }, d: 'Top gun of the drive-through.' },
  /* hats */
  { id: 'visor', slot: 'hat', name: 'Pharmacy visor', e: '🧢', r: 'common', src: 'capsule', buff: { time: 1 }, d: 'Keeps the counter lights out of your eyes.' },
  { id: 'beanie', slot: 'hat', name: 'Beanie', e: '🧶', r: 'common', src: 'capsule', buff: {}, d: 'Cold storage shift.' },
  { id: 'party', slot: 'hat', name: 'Party hat', e: '🥳', r: 'common', src: 'capsule', buff: { rep: 1 }, d: 'Every fill is a celebration.' },
  { id: 'surgcap', slot: 'hat', name: 'Scrub cap', e: '🩺', r: 'common', src: 'shop', price: 150, buff: { tech: 0.02 }, d: 'Clean room style. Techs work a bit faster.' },
  { id: 'chef', slot: 'hat', name: 'Chef hat', e: '👨‍🍳', r: 'rare', src: 'capsule', buff: { tech: 0.02 }, d: 'Compounding is just cooking with rules.' },
  { id: 'cowboy', slot: 'hat', name: 'Cowboy hat', e: '🤠', r: 'rare', src: 'capsule', buff: { streak: 1 }, d: 'Steady hands.' },
  { id: 'tophat', slot: 'hat', name: 'Top hat', e: '🎩', r: 'rare', src: 'capsule', buff: { pay: 0.02 }, d: 'Fancy fills cost a little more.' },
  { id: 'propeller', slot: 'hat', name: 'Propeller cap', e: '🚁', r: 'rare', src: 'capsule', buff: { time: 2 }, d: 'Thinking fast.' },
  { id: 'fedora', slot: 'hat', name: 'Fedora', e: '🎩', r: 'rare', src: 'rank', rank: 5, buff: { pay: 0.02 }, d: 'Promotion gift.' },
  { id: 'crown', slot: 'hat', name: 'Gold crown', e: '👑', r: 'epic', src: 'capsule', buff: { pay: 0.03, rep: 1 }, d: 'Ruler of the corner.' },
  { id: 'wizard', slot: 'hat', name: 'Wizard hat', e: '🧙', r: 'epic', src: 'capsule', buff: { time: 3 }, d: 'Pharmacokinetics is basically magic.' },
  { id: 'halo', slot: 'hat', name: 'Golden halo', e: '😇', r: 'legendary', src: 'capsule', buff: { pay: 0.05, rep: 2 }, d: 'Andy approves. Patients leave glowing.' },
  /* neck */
  { id: 'lanyard', slot: 'neck', name: 'ID badge lanyard', e: '🪪', r: 'common', src: 'capsule', buff: { tech: 0.02 }, d: 'Official. Techs take you seriously.' },
  { id: 'bowtie', slot: 'neck', name: 'Bow tie', e: '🎀', r: 'common', src: 'capsule', buff: { rep: 1 }, d: 'Dapper counter service.' },
  { id: 'scarf', slot: 'neck', name: 'Striped scarf', e: '🧣', r: 'common', src: 'capsule', buff: {}, d: 'Flu season chic.' },
  { id: 'steth', slot: 'neck', name: 'Stethoscope', e: '🩺', r: 'rare', src: 'capsule', buff: { rep: 1, time: 1 }, d: 'Clinical. Patients relax and wait.' },
  { id: 'chain', slot: 'neck', name: 'Gold chain', e: '⛓️', r: 'rare', src: 'rank', rank: 1, buff: { pay: 0.02 }, d: 'Promotion gift. Bling pays.' },
  { id: 'mortar', slot: 'neck', name: 'Golden mortar pendant', e: '🏺', r: 'legendary', src: 'capsule', buff: { pay: 0.04, streak: 2 }, d: 'The symbol of the profession, in gold.' },
  /* coats (the color coats are built in; these are gear) */
  { id: 'hoodie', slot: 'coat', name: 'Pharmacy hoodie', e: '🧥', r: 'rare', src: 'capsule', buff: { time: 2 }, d: 'Night shift comfort.' },
  { id: 'goldcoat', slot: 'coat', name: 'Gold-trim coat', e: '🥼', r: 'rare', src: 'shop', price: 900, buff: { pay: 0.02, rep: 1 }, d: 'The owner’s coat.' },
  { id: 'cape', slot: 'coat', name: 'Pharmacist cape', e: '🦸', r: 'epic', src: 'capsule', buff: { streak: 3 }, d: 'Hero of the refill line.' },
  { id: 'furcoat', slot: 'coat', name: 'Purple fur coat', e: '🧥', r: 'epic', src: 'rank', rank: 7, buff: { pay: 0.03 }, d: 'Promotion gift. Director energy.' },
  /* in hand */
  { id: 'mug', slot: 'hands', name: 'Coffee mug', e: '☕', r: 'common', src: 'capsule', buff: { time: 1 }, d: 'Caffeine buys a second.' },
  { id: 'clipboard', slot: 'hands', name: 'Clipboard', e: '📋', r: 'common', src: 'capsule', buff: { tech: 0.02 }, d: 'Techs love a checklist.' },
  { id: 'pillbottle', slot: 'hands', name: 'Giant pill bottle', e: '💊', r: 'rare', src: 'capsule', buff: { pills: 0.15 }, d: 'Lost pills pop out more often.' },
  { id: 'knuckles', slot: 'hands', name: 'Brass knuckles', e: '👊', r: 'rare', src: 'rank', rank: 3, buff: { streak: 1 }, d: 'Promotion gift. Karen thinks twice.' },
  { id: 'cane', slot: 'hands', name: 'Cane', e: '🦯', r: 'rare', src: 'rank', rank: 6, buff: { time: 2 }, d: 'Promotion gift. Nobody rushes the chief.' },
  { id: 'wand', slot: 'hands', name: 'Sparkle wand', e: '🪄', r: 'epic', src: 'capsule', buff: { pay: 0.03 }, d: 'Abracadabra, your copay is lower.' },
  /* extras */
  { id: 'pin', slot: 'extra', name: 'Rx lapel pin', e: '📌', r: 'common', src: 'capsule', buff: { rep: 1 }, d: 'Small, proud.' },
  { id: 'clownnose', slot: 'extra', name: 'Clown nose', e: '🤡', r: 'common', src: 'capsule', buff: {}, d: 'Pediatric counseling secret weapon.' },
  { id: 'earring', slot: 'extra', name: 'Gold earrings', e: '💎', r: 'rare', src: 'capsule', buff: { pay: 0.01 }, d: 'A little shine.' },
  { id: 'headphones', slot: 'extra', name: 'Headphones', e: '🎧', r: 'rare', src: 'capsule', buff: { time: 1 }, d: 'Lo-fi beats to count pills to.' },
  { id: 'grill', slot: 'extra', name: 'Gold grill', e: '🦷', r: 'rare', src: 'rank', rank: 4, buff: { pay: 0.01 }, d: 'Promotion gift.' },
  /* cyborg parts (shop) */
  { id: 'cyeye', slot: 'cyber', name: 'Cyber eye', e: '🤖', r: 'rare', src: 'shop', price: 700, buff: { time: 2 }, d: 'Reads the sig before the patient finishes talking.' },
  { id: 'cyant', slot: 'cyber', name: 'Antenna', e: '📡', r: 'rare', src: 'shop', price: 600, buff: { tech: 0.03 }, d: 'Beams instructions to the techs.' },
  { id: 'cyarm', slot: 'cyber', name: 'Mech arm', e: '🦾', r: 'epic', src: 'shop', price: 1200, buff: { pay: 0.03 }, d: 'Counts by fives, never drops a pill.' },
  { id: 'cyjet', slot: 'cyber', name: 'Jetpack', e: '🚀', r: 'epic', src: 'shop', price: 1500, buff: { time: 3 }, d: 'Shelf to counter in no time.' },
  { id: 'cykit', slot: 'cyber', name: 'Full cyborg kit', e: '🦿', r: 'legendary', src: 'shop', price: 3000, buff: { pay: 0.05, tech: 0.05, time: 3 }, d: 'The whole upgrade.' },
  /* hair styles (shop); hv is the style number in world.js */
  { id: 'hmo', slot: 'hair', name: 'Mohawk', e: '💇', r: 'common', src: 'shop', price: 250, hv: 9, buff: {}, d: '' },
  { id: 'haf', slot: 'hair', name: 'Afro', e: '💇', r: 'common', src: 'shop', price: 300, hv: 10, buff: {}, d: '' },
  { id: 'hpo', slot: 'hair', name: 'Ponytail', e: '💇', r: 'common', src: 'shop', price: 250, hv: 11, buff: {}, d: '' },
  { id: 'hpm', slot: 'hair', name: 'Pompadour', e: '💇', r: 'rare', src: 'shop', price: 400, hv: 12, buff: {}, d: '' },
  { id: 'hsb', slot: 'hair', name: 'Space buns', e: '💇', r: 'rare', src: 'shop', price: 400, hv: 13, buff: {}, d: '' },
  /* pets: award pets come from mastery; the rest drop from capsules. kind is the world.js pet kind. */
  { id: 'bunny', slot: 'pet', name: 'Bunny', e: '🐰', r: 'common', src: 'award', kind: 'bunny', buff: {}, d: 'Hops around the floor.' },
  { id: 'cat', slot: 'pet', name: 'Cat', e: '🐱', r: 'common', src: 'award', kind: 'cat', buff: {}, d: 'Gray tabby. Judges the queue.' },
  { id: 'dog', slot: 'pet', name: 'Dog', e: '🐶', r: 'common', src: 'award', kind: 'dog', buff: {}, d: 'Greets every patient.' },
  { id: 'bunnyx', slot: 'pet', name: 'Chubby bunny', e: '🐰', r: 'rare', src: 'capsule', kind: 'bunnyx', buff: { pills: 0.1 }, d: 'Nudges lost pills out of hiding.' },
  { id: 'catx', slot: 'pet', name: 'Chubby cat', e: '🐱', r: 'epic', src: 'capsule', kind: 'catx', buff: { rep: 1 }, d: 'Patients stay to pet it.' },
  { id: 'dogx', slot: 'pet', name: 'Chubby dog', e: '🐶', r: 'epic', src: 'capsule', kind: 'dogx', buff: { tech: 0.02 }, d: 'Morale officer for the techs.' },
  { id: 'orange', slot: 'pet', name: 'Orange cat', e: '🐈', r: 'legendary', src: 'capsule', kind: 'orange', buff: { pay: 0.03, rep: 1 }, d: 'One shared brain cell, all of it charm. Sparkles.' }
];
const GEAR_BY = {}; GEAR.forEach(g => { GEAR_BY[g.id] = g; });
const SLOT_NAME = {}; SLOTS.forEach(s => { SLOT_NAME[s[0]] = s[1]; });
