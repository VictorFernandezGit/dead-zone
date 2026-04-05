// Oregon Trail-style travel events between levels
// Each event has: text, choices (each with label + outcome), and an image emoji

export const TRAVEL_EVENTS = [
  {
    text: "You spot movement inside an abandoned gas station. Survivors? Or the dead?",
    emoji: "⛽",
    choices: [
      { label: "Investigate", outcome: { type: "good", message: "Three survivors emerge, shaking but alive. They join your group.", survivors: 3, scrap: 25 } },
      { label: "Drive past", outcome: { type: "neutral", message: "Better safe than sorry. The bus rolls on." } },
    ],
  },
  {
    text: "The road ahead is blocked by a massive pileup. Twisted metal and overturned trucks stretch across both lanes.",
    emoji: "🚧",
    choices: [
      { label: "Clear the wreckage", outcome: { type: "bad", message: "It takes hours and costs fuel and supplies to push through.", scrap: -40 } },
      { label: "Take the back roads", outcome: { type: "neutral", message: "The detour takes longer but the bus makes it through. Lost some fuel.", scrap: -20 } },
    ],
  },
  {
    text: "A mechanic survivor flags you down. She offers to reinforce the bus in exchange for passage.",
    emoji: "🔧",
    choices: [
      { label: "Welcome aboard", outcome: { type: "good", message: "She reinforces the bus hull. +2 bonus lives next level and a new survivor.", survivors: 1, bonusLives: 2 } },
      { label: "No room", outcome: { type: "neutral", message: "You drive on. She watches the bus disappear down the road." } },
    ],
  },
  {
    text: "Armed raiders step out of a barricade. 'Toll road,' their leader grins. 'Pay up or bleed.'",
    emoji: "🏴‍☠️",
    choices: [
      { label: "Pay the toll", outcome: { type: "bad", message: "You hand over supplies. They let you pass.", scrap: -60 } },
      { label: "Floor it!", outcome: { type: "risky", message: "The bus smashes through! A few bullet holes, but everyone's alive.", bonusLives: -1, scrap: 10 } },
    ],
  },
  {
    text: "An abandoned military checkpoint. The soldiers are long gone, but their supplies might not be.",
    emoji: "🪖",
    choices: [
      { label: "Search thoroughly", outcome: { type: "good", message: "Jackpot! Ammo crates, MREs, and scrap metal.", scrap: 75 } },
      { label: "Grab and go", outcome: { type: "good", message: "You grab what you can carry. Not bad.", scrap: 35 } },
    ],
  },
  {
    text: "A survivor waves you down. He says he was a demolitions expert with the National Guard.",
    emoji: "💣",
    choices: [
      { label: "Take him in", outcome: { type: "good", message: "His expertise will come in handy. He shares knowledge about explosives.", survivors: 1, scrap: 50 } },
      { label: "Too risky", outcome: { type: "neutral", message: "Could be a trap. You keep driving." } },
    ],
  },
  {
    text: "You find a school bus just like yours, crashed in a ditch. The passengers didn't make it, but their supplies are intact.",
    emoji: "🚌",
    choices: [
      { label: "Salvage everything", outcome: { type: "good", message: "Fuel, food, tools, and scrap. This will help.", scrap: 55, survivors: 0 } },
      { label: "Pay respects and move on", outcome: { type: "neutral", message: "You bury what you can and mark the site. Someone should know they were here." } },
    ],
  },
  {
    text: "Rain starts to fall — hard. The road is flooding and visibility drops to nothing.",
    emoji: "🌧️",
    choices: [
      { label: "Push through", outcome: { type: "risky", message: "The bus slides but you keep control. Barely. Some supplies got soaked.", scrap: -25 } },
      { label: "Wait it out", outcome: { type: "neutral", message: "You shelter under an overpass. The storm passes after a few hours." } },
    ],
  },
  {
    text: "Smoke rises from a farmhouse up ahead. Through binoculars, you see people — alive — cooking over a fire.",
    emoji: "🏚️",
    choices: [
      { label: "Approach friendly", outcome: { type: "good", message: "A family of four. They share food and join your convoy.", survivors: 4, scrap: 15 } },
      { label: "Keep distance", outcome: { type: "neutral", message: "Not everyone out here is friendly. You circle around." } },
    ],
  },
  {
    text: "The bus radio crackles to life: '...repeat, safe zone at the Jersey docks... ship departing... all survivors...'",
    emoji: "📻",
    choices: [
      { label: "Boost morale", outcome: { type: "good", message: "Everyone's spirits lift. The destination is real. The ship is waiting.", scrap: 20 } },
      { label: "Keep it quiet", outcome: { type: "neutral", message: "No sense getting hopes up until you see it with your own eyes." } },
    ],
  },
  {
    text: "A herd of zombies blocks the highway. Hundreds of them, shambling east.",
    emoji: "🧟",
    choices: [
      { label: "Plow through", outcome: { type: "risky", message: "The bus takes damage but you break through the herd.", bonusLives: -2, scrap: -15 } },
      { label: "Wait and circle", outcome: { type: "bad", message: "You burn fuel going the long way around.", scrap: -30 } },
    ],
  },
  {
    text: "An abandoned pharmacy, mostly looted. But the back room might have supplies.",
    emoji: "💊",
    choices: [
      { label: "Send a team in", outcome: { type: "good", message: "Medical supplies and bandages. This could save lives.", bonusLives: 3 } },
      { label: "Not worth the risk", outcome: { type: "neutral", message: "Too many dark corners. You drive on." } },
    ],
  },
];

// Pick 1-2 random events, avoiding duplicates
export function pickEvents(count = 1, usedIndices = []) {
  const available = TRAVEL_EVENTS
    .map((e, i) => ({ event: e, index: i }))
    .filter(({ index }) => !usedIndices.includes(index));

  const picked = [];
  for (let i = 0; i < Math.min(count, available.length); i++) {
    const idx = Math.floor(Math.random() * available.length);
    picked.push(available[idx]);
    available.splice(idx, 1);
  }
  return picked;
}
