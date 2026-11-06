/* ---------- Pharmacy shop: items the player can buy with cash (see the Shop tab on the Character screen) ----------
   Each list is plain data. Ids are saved in S.store, so never rename an id once it has shipped. */
/* wall paint: [id, name, back wall colour, side wall colour, price]; the first entry is the free default */
const SHOP_WALLS = [
  ['w0', 'Seafoam', '#A5D6D0', '#8FC9C3', 0],
  ['w1', 'Butter yellow', '#F3E3A0', '#E4D088', 150],
  ['w2', 'Blush pink', '#F1C4D2', '#E3AEC0', 150],
  ['w3', 'Sky blue', '#B5D5F2', '#9DC2E6', 200],
  ['w4', 'Lavender', '#CFC4F0', '#BBAEE3', 200],
  ['w5', 'Sage green', '#B7D3A6', '#A2C28F', 250],
  ['w6', 'Terracotta', '#E5A98D', '#D4937A', 300],
  ['w7', 'Midnight navy', '#46587E', '#3A4A6C', 400],
  ['w8', 'Charcoal', '#5A6168', '#4A5057', 400]
];
/* floor tiles: [id, name, tile A, tile B, price] */
const SHOP_FLOORS = [
  ['f0', 'Classic white', '#E4F1F0', '#D2E7E5', 0],
  ['f1', 'Warm wood', '#D8B58A', '#C9A175', 200],
  ['f2', 'Pink tile', '#F8DCE5', '#F1C6D4', 200],
  ['f3', 'Mint tile', '#CFEFDF', '#B8E3CE', 250],
  ['f4', 'Slate grey', '#9AA5AE', '#8995A0', 300],
  ['f5', 'Black and white', '#F4F4F4', '#2B2F36', 450],
  ['f6', 'Navy tile', '#41567A', '#374A6A', 450]
];
/* technician uniforms: [id, name, shirt, pants, hat, buff, price, blurb]. buff = { tech: x } adds x to tech tip income, { pay: x } adds x to every answer payout.
   Only one uniform is worn at a time, by every technician. The buff works once you have hired at least one technician. */
const SHOP_UNI = [
  ['u1', 'Mint scrubs', '#BFEBDD', '#2E7D6B', '', { tech: 0.05 }, 400, 'Cool and calm. Techs earn a little more.'],
  ['u2', 'Navy scrubs', '#3C5A8F', '#1F2F4F', '', { tech: 0.08 }, 900, 'Sharp and professional.'],
  ['u3', 'Crisp lab coats', '#FFFFFF', '#27384F', '', { pay: 0.02 }, 1500, 'Customers trust a pressed coat.'],
  ['u4', 'Chef whites', '#FFFFFF', '#2B2B33', 'chef', { pay: 0.04 }, 2200, 'Cooking up prescriptions, hat and all.'],
  ['u5', 'Space suits', '#E8EEF7', '#7B8BA8', '', { tech: 0.06, pay: 0.03 }, 3500, 'Goggles on. Mission control energy.'],
  ['u6', 'Gold executive', '#F2C94C', '#3B2F12', 'tophat', { tech: 0.10, pay: 0.05 }, 6000, 'Top hats for the top team.']
];
/* decorations: [id, name, price, blurb, emoji] */
const SHOP_DECOR = [
  ['rug', 'Welcome rug', 150, 'A plush rug leading to the counseling room.', '🟫'],
  ['bell', 'Service bell', 120, 'Ding! On the counter.', '🔔'],
  ['cactus', 'Desk cactus', 150, 'Low maintenance, high attitude.', '🌵'],
  ['lava', 'Lava lamp', 250, 'Glows on the counter.', '🪔'],
  ['fish', 'Fish tank', 450, 'Soothing for waiting patients.', '🐠'],
  ['cooler', 'Water cooler', 500, 'Hydration station by the counter.', '🚰'],
  ['neon', 'Neon sign', 700, 'An OPEN sign for the side wall.', '💡'],
  ['vend', 'Vending machine', 900, 'Snacks by the counter.', '🥤']
];
/* extra pharmacist hairstyles: [id, name, style number in world.js, price] */
const SHOP_HAIR = [
  ['hmo', 'Mohawk', 9, 250],
  ['haf', 'Afro', 10, 300],
  ['hpo', 'Ponytail', 11, 250],
  ['hpm', 'Pompadour', 12, 400],
  ['hsb', 'Space buns', 13, 400]
];
/* cyborg parts for the pharmacist: [slot, id, name, emoji, price]. They live in the "Cyborg" row of the Character screen. */
const SHOP_CYBER = [
  ['cyber', 'cyeye', 'Cyber eye', '🤖', 700],
  ['cyber', 'cyant', 'Antenna', '📡', 600],
  ['cyber', 'cyarm', 'Mech arm', '🦾', 1200],
  ['cyber', 'cyjet', 'Jetpack', '🚀', 1500],
  ['cyber', 'cykit', 'Full cyborg kit', '🦿', 3000]
];
