import { NextResponse } from 'next/server';
import type { MagiState } from '@/types/magi';

export interface MagiScore {
  magiId: string;
  score: number;
  mode: 'full' | 'brief';
}

const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can',
  'this','that','these','those','it','its','by','from','as','into',
  'through','during','before','after','above','below','between',
  'each','all','both','few','more','most','other','some','such',
  'no','not','only','same','than','too','very','just','about','their',
  'they','them','he','she','we','our','who','what','when','where','two',
]);

// Semantic synonym expansion — bidirectional, so expanding either side bridges gaps
const SYNONYMS: Record<string, string[]> = {
  // conflict / military
  war:          ['warfare','military','combat','battle','conflict','armed','troops','hostilities'],
  warfare:      ['war','military','combat','battle','conflict','armed'],
  military:     ['war','warfare','armed','combat','troops','forces','soldier','army'],
  conflict:     ['war','warfare','battle','dispute','clash','hostility','violence','struggle'],
  battle:       ['war','warfare','combat','conflict','fight','assault','skirmish'],
  // knowledge / science
  knowledge:    ['science','scientific','research','discovery','information','data','archive'],
  science:      ['knowledge','scientific','research','technology','discovery','study'],
  scientific:   ['science','knowledge','research','technology'],
  research:     ['science','knowledge','scientific','study','investigation'],
  // communication / information
  communication:['network','information','signal','broadcast','transmission','message'],
  network:      ['communication','information','system','infrastructure','grid','channel'],
  information:  ['knowledge','data','communication','intelligence','signal'],
  // resources / energy
  resource:     ['energy','resources','supply','production','allocation','distribution'],
  resources:    ['energy','resource','supply','production','allocation','distribution'],
  energy:       ['resource','resources','power','supply','production','fuel'],
  allocation:   ['resource','distribution','supply','management','rationing'],
  distribution: ['resource','allocation','supply','network','trade'],
  // governance / politics
  political:    ['governance','government','policy','power','authority','faction','state'],
  governance:   ['political','government','policy','authority','administration'],
  government:   ['political','governance','state','authority','power','regime'],
  // ecology / environment
  ecological:   ['environment','climate','nature','ecosystem','biological','species'],
  environment:  ['ecological','climate','nature','ecosystem','world'],
  climate:      ['ecological','environment','weather','temperature','atmospheric'],
  // technology
  technology:   ['technological','science','engineering','system','innovation','machine'],
  technological:['technology','science','engineering','innovation'],
  // social / society
  social:       ['society','community','population','cultural','human','people'],
  society:      ['social','community','population','civilization','culture'],
  // astronomical
  astronomical: ['space','stellar','cosmic','orbit','planet','star','celestial'],
  space:        ['astronomical','stellar','cosmic','orbit','celestial','universe'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

// Strip common suffixes to normalize plurals and conjugations
function normalize(word: string): string {
  return word
    .replace(/tion$/, '')
    .replace(/ment$/, '')
    .replace(/ness$/, '')
    .replace(/ance$/, '')
    .replace(/ence$/, '')
    .replace(/ical$/, 'ic')
    .replace(/ing$/, '')
    .replace(/ied$/, 'y')
    .replace(/ies$/, 'y')
    .replace(/ed$/, '')
    .replace(/es$/, '')
    .replace(/s$/, '');
}

function expandTokens(tokens: string[]): Set<string> {
  const expanded = new Set<string>();
  for (const t of tokens) {
    expanded.add(t);
    expanded.add(normalize(t));
    for (const syn of SYNONYMS[t] ?? []) {
      expanded.add(syn);
      expanded.add(normalize(syn));
    }
  }
  return expanded;
}

// Score how relevant a trigger is to a MAGI's domain
// Only scores against domain (not optimizationTarget) to keep signal clean
function scoreRelevance(trigger: string, domain: string): number {
  const triggerTokens = tokenize(trigger);
  const domainTokens = tokenize(domain);

  if (!triggerTokens.length || !domainTokens.length) return 0.35;

  // Expand trigger vocab with synonyms + normalizations to bridge semantic gaps
  const triggerExpanded = expandTokens(triggerTokens);
  const domainSet = new Set(domainTokens.map(normalize));

  let matches = 0;
  for (const dw of domainSet) {
    if (triggerExpanded.has(dw)) matches++;
  }

  const raw = matches / domainSet.size;
  // Floor at 0.35 (all listed MAGI get at least brief), ceiling at 1.0
  return Math.min(1.0, 0.35 + raw * 0.65);
}

export async function POST(req: Request) {
  const { trigger, affectedMagiIds, magiStates } = await req.json() as {
    trigger: string;
    affectedMagiIds: string[];
    magiStates: MagiState[];
  };

  if (!trigger || !affectedMagiIds?.length || !magiStates?.length) {
    return NextResponse.json(
      { error: 'trigger, affectedMagiIds, and magiStates are required' },
      { status: 400 }
    );
  }

  const relevant = magiStates.filter((s) => affectedMagiIds.includes(s.id));

  const scores: MagiScore[] = relevant.map((s) => {
    const score = scoreRelevance(trigger, s.domain);
    return { magiId: s.id, score, mode: score > 0.6 ? 'full' : 'brief' };
  });

  return NextResponse.json({ scores });
}
