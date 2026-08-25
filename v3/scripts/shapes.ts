// STORY SHAPES — generic, combinatorial seeds. Designer 2026-08-24:
//   "the goal of seed is to make the stories vary. the 'story' seed can be 'person with unexpected
//    background'. then we have keyword seeds — maybe it randomly picks 'wolf' and 'morning', so the
//    ai can generate a werewolf that transforms in morning."
//
// This REPLACES scripts/motives2.ts, which was my design error: 149 pre-written scenarios ("watch
// the roof at night", "clear the ruin and be seen paying for it") are not seeds, they are plots.
// 149 authored entries = 149 stories, then repetition. It also violated this project's own recorded
// law — AI-feeding lists are single-word atoms that COMBINE, never authored phrases.
//
// A shape says nothing about WHAT happens; it says what KIND of turn the story takes. Combined with
// concrete atoms from the engine's existing pools (THINGS 726 · PEOPLE 335 · UNCANNY 144 ·
// OCCASIONS 154 · QUALITIES 382), the space is ~40 x 726 x 335 rather than 149.
export const SHAPES: string[] = [
  'someone is not what they are taken for',
  'a person with an unexpected background',
  'the one who asks for help caused the trouble',
  'two people want the same thing for opposite reasons',
  'a kindness that has become a trap',
  'an old debt coming due at the worst moment',
  'a thing that is not what it appears to be',
  'someone protecting a secret at a cost',
  'a rule being obeyed to the letter and broken in spirit',
  'a small wrong that has grown out of proportion',
  'someone who has already given up and will not say so',
  'a bargain both sides intend to break',
  'the danger is real but not the one named',
  'a person doing the right thing for a bad reason',
  'someone taking the blame for another',
  'an inheritance nobody wants',
  'a stranger who knows too much about the place',
  'a job that is easy for a reason nobody likes',
  'a person who cannot go back',
  'a habit that has turned into a compulsion',
  'someone being paid to look the other way',
  'a reputation that no longer matches the person',
  'a duty inherited from the dead',
  'two versions of the same story, both partly true',
  'a promise kept too literally',
  'someone hiding a person rather than a thing',
  'a crowd that has decided something without evidence',
  'a professional out of their depth',
  'a thing returned that should have stayed lost',
  'someone whose usefulness is running out',
  'a rescue that the rescued will resent',
  'an outsider taking a local custom seriously',
  'a person waiting for something that will not come',
  'a favour that puts you in someone else\'s quarrel',
  'a fear that is justified for the wrong reason',
  'someone who has done this before and did not learn',
  'a thing everyone can see and nobody will name',
  'a person who profits either way',
  'an accident that keeps happening',
  'somebody who needs the problem to continue',
];

/** Concrete atom pools — deliberately NOT emotions or abstractions. The engine's own BOND/TIE
 *  pools are abstract (grief, spite, oath, pledge) and all three independent writers reported them
 *  unusable in a 25-word card: an abstraction cannot be DEPICTED, only named, which reads as filler.
 *  These are things a card can put on the page. */
export const CONCRETE = {
  creature: ['wolf','dog','crow','horse','bee','rat','goat','boar','cat','hawk','fish','snake','owl','ox','hound','ferret','stag','heron','moth','wasp','pig','donkey','eel','bat'],
  time: ['morning','midnight','dusk','harvest','thaw','first frost','market day','a feast day','the small hours','noon','a funeral','a wedding','the first snow','midsummer','a fair','a hanging'],
  thing: ['a knife','a bell','a rope','a ring','a coat','a key','a boot','a cup','a letter','a lamp','a chain','a saddle','a comb','a coin','a shoe','a doll','a mirror','a net','a spade','a whistle','a jar','a ledger-stick','a splint','a cradle','a mask','a wheel','a shroud','a beehive','an anvil','a millstone'],
  place: ['a cellar','a well','a bridge','a barn','a chapel','a ford','a mill','a kiln','a pen','a loft','a crossroads','a boundary stone','a smokehouse','a jetty','a hedge','a burial ground','a toll gate','a sheepfold'],
  condition: ['soaked','burnt','frozen','half-buried','freshly painted','older than it should be','newer than it should be','the wrong size','missing a piece','mended badly','marked','emptied','sealed','left open','warm','still wet'],
};
