/**
 * Transit and urban location text formatting and abbreviation utilities.
 * Standardizes common Brazilian transit terms, prefixes, and prepositions
 * regardless of user input variations (accents, casing, dots).
 */

export interface TransitTermRule {
  /** Canonical full name (e.g. 'Praça', 'Terminal', 'Avenida') */
  full: string;
  /** Standard abbreviated form with trailing dot if applicable (e.g. 'Pça.', 'Term.', 'Av.') */
  short: string;
  /** All known user variations/misspellings (lowercase, normalized) */
  variations: string[];
}

/**
 * Common Brazilian transit and geographic terms dictionary
 */
export const TRANSIT_TERMS: TransitTermRule[] = [
  {
    full: 'Terminal',
    short: 'Term.',
    variations: ['terminal', 'term.', 'term', 't.'],
  },
  {
    full: 'Praça',
    short: 'Pça.',
    variations: ['praça', 'praca', 'pça.', 'pça', 'pca.', 'pca', 'prc.', 'prc'],
  },
  {
    full: 'Estação',
    short: 'Est.',
    variations: ['estação', 'estacao', 'est.', 'est', 'estac.'],
  },
  {
    full: 'Metrô',
    short: 'Metrô',
    variations: ['metrô', 'metro', 'm.'],
  },
  {
    full: 'Avenida',
    short: 'Av.',
    variations: ['avenida', 'av.', 'av'],
  },
  {
    full: 'Rua',
    short: 'R.',
    variations: ['rua', 'r.', 'r'],
  },
  {
    full: 'Alameda',
    short: 'Al.',
    variations: ['alameda', 'al.', 'al'],
  },
  {
    full: 'Travessa',
    short: 'Tv.',
    variations: ['travessa', 'tv.', 'tv'],
  },
  {
    full: 'Parque',
    short: 'Pq.',
    variations: ['parque', 'pq.', 'pq', 'prq.', 'prq'],
  },
  {
    full: 'Jardim',
    short: 'Jd.',
    variations: ['jardim', 'jd.', 'jd'],
  },
  {
    full: 'Vila',
    short: 'Vl.',
    variations: ['vila', 'vl.', 'vl'],
  },
  {
    full: 'Bairro',
    short: 'B.',
    variations: ['bairro', 'b.', 'b', 'br.'],
  },
  {
    full: 'Hospital',
    short: 'Hosp.',
    variations: ['hospital', 'hosp.', 'hosp', 'hp.'],
  },
  {
    full: 'Shopping',
    short: 'Shp.',
    variations: ['shopping', 'shop.', 'shop', 'shp.', 'shp'],
  },
  {
    full: 'Rodoviária',
    short: 'Rodov.',
    variations: ['rodoviária', 'rodoviaria', 'rodov.', 'rodov', 'rod.'],
  },
  {
    full: 'Rodovia',
    short: 'Rod.',
    variations: ['rodovia', 'rod.', 'rod'],
  },
  {
    full: 'Estrada',
    short: 'Estr.',
    variations: ['estrada', 'estr.', 'estr'],
  },
  {
    full: 'Aeroporto',
    short: 'Aerop.',
    variations: ['aeroporto', 'aerop.', 'aerop', 'aero.', 'aero'],
  },
  {
    full: 'Cemitério',
    short: 'Cem.',
    variations: ['cemitério', 'cemiterio', 'cem.', 'cem'],
  },
  {
    full: 'Conjunto',
    short: 'Conj.',
    variations: ['conjunto', 'conj.', 'conj', 'conj.hab.', 'cohab'],
  },
  {
    full: 'Universidade',
    short: 'Univ.',
    variations: ['universidade', 'univ.', 'univ'],
  },
  {
    full: 'Faculdade',
    short: 'Fac.',
    variations: ['faculdade', 'fac.', 'fac'],
  },
  {
    full: 'Centro',
    short: 'Ctr.',
    variations: ['centro', 'ctr.', 'ctr'],
  },
  {
    full: 'Largo',
    short: 'Lgo.',
    variations: ['largo', 'lgo.', 'lgo'],
  },
  {
    full: 'Viaduto',
    short: 'Vd.',
    variations: ['viaduto', 'vd.', 'vd'],
  },
  {
    full: 'Passarela',
    short: 'Pas.',
    variations: ['passarela', 'pas.', 'pas'],
  },
];

/**
 * Portuguese lowercase prepositions and connectors to maintain lowercase in titles
 */
const PREPOSITIONS = new Set([
  'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'no', 'na', 'nos', 'nas',
  'ao', 'aos', 'à', 'às', 'por', 'pelo', 'pela', 'pelos', 'pelas',
]);

/**
 * Known geographic accent corrections for common Brazilian place names
 */
const ACCENT_CORRECTIONS: Record<string, string> = {
  sao: 'São',
  praca: 'Praça',
  estacao: 'Estação',
  metro: 'Metrô',
  aviao: 'Avião',
  angela: 'Ângela',
  consolacao: 'Consolação',
  tiete: 'Tietê',
  clinicas: 'Clínicas',
  itaquera: 'Itaquera',
  santana: 'Santana',
  bras: 'Brás',
  antonio: 'Antônio',
  joao: 'João',
  america: 'América',
  americo: 'Américo',
  sé: 'Sé',
  se: 'Sé',
  belem: 'Belém',
  butanta: 'Butantã',
  jabaquara: 'Jabaquara',
  tucuruvi: 'Tucuruvi',
  carrao: 'Carrão',
  penha: 'Penha',
  anhangabau: 'Anhangabaú',
  republica: 'República',
  paraíso: 'Paraíso',
  paraiso: 'Paraíso',
  saude: 'Saúde',
  conceicao: 'Conceição',
  oratorio: 'Oratório',
  tamanduatei: 'Tamanduateí',
};

// Map variation lookup
const VARIATION_MAP = new Map<string, TransitTermRule>();
TRANSIT_TERMS.forEach((rule) => {
  rule.variations.forEach((v) => {
    VARIATION_MAP.set(v.toLowerCase(), rule);
  });
  VARIATION_MAP.set(rule.full.toLowerCase(), rule);
  VARIATION_MAP.set(rule.short.toLowerCase(), rule);
});

export type TransitFormatMode = 'full' | 'short' | 'standard';

export interface TransitFormatOptions {
  /**
   * - 'full': Expands to full word ('Praça', 'Terminal', 'Avenida', etc.)
   * - 'short': Compact abbreviation ('Pça.', 'Term.', 'Av.', etc.)
   * - 'standard': Transit convention: 'Term.' for Terminal, 'Praça' for Praça, 'Metrô', etc.
   */
  mode?: TransitFormatMode;
}

/**
 * Strips leading/trailing punctuation except letters, digits, and accented latin chars
 */
function cleanWord(word: string): string {
  return word.toLowerCase().replace(/^[^\w\u00C0-\u017F]+|[^\w\u00C0-\u017F.]+$/g, '');
}

/**
 * Formats a location name with standard transit rules, correcting casing,
 * prepositions, accents, and expanding/abbreviating transit terms as requested.
 *
 * Examples:
 * - formatTransitLocation('TERMINAL SAO MIGUEL', { mode: 'short' }) => 'Term. São Miguel'
 * - formatTransitLocation('TERMINAL SAO MIGUEL', { mode: 'full' }) => 'Terminal São Miguel'
 * - formatTransitLocation('PÇA. DO CORREIO', { mode: 'full' }) => 'Praça do Correio'
 * - formatTransitLocation('Praça do Aviao', { mode: 'short' }) => 'Pça. do Avião'
 * - formatTransitLocation('praca do aviao', { mode: 'full' }) => 'Praça do Avião'
 * - formatTransitLocation('AV. PAULISTA', { mode: 'full' }) => 'Avenida Paulista'
 * - formatTransitLocation('Avenida Paulista', { mode: 'short' }) => 'Av. Paulista'
 */
export function formatTransitLocation(
  name: string | null | undefined,
  options: TransitFormatOptions = {}
): string {
  if (!name || typeof name !== 'string') return '';
  const text = name.trim();
  if (!text) return '';

  const mode = options.mode || 'standard';

  // Split keeping punctuation tokens like '-' or '/'
  const words = text.split(/\s+/);

  const formattedWords = words.map((w, idx) => {
    // Keep raw separator dashes or slashes
    if (w === '-' || w === '/') return w;

    const cleaned = cleanWord(w);

    // Check if word is a recognized transit term (e.g. terminal, praça, av, etc.)
    const termRule = VARIATION_MAP.get(cleaned) || VARIATION_MAP.get(cleaned.replace(/\.$/, ''));
    if (termRule) {
      if (mode === 'short') {
        return termRule.short;
      }
      if (mode === 'full') {
        return termRule.full;
      }
      // 'standard' mode: Terminal becomes 'Term.', others follow transit standard
      if (termRule.full === 'Terminal') return 'Term.';
      if (termRule.full === 'Praça') return 'Praça';
      if (termRule.full === 'Metrô') return 'Metrô';
      return termRule.full;
    }

    // Check prepositions (only in middle of text, not first word)
    if (idx > 0 && PREPOSITIONS.has(cleaned)) {
      return cleaned.toLowerCase();
    }

    // Check known accent corrections
    if (ACCENT_CORRECTIONS[cleaned]) {
      return ACCENT_CORRECTIONS[cleaned];
    }

    // Handle hyphenated sub-words (e.g. "São-Miguel" or "M'Boi")
    if (w.includes('-')) {
      return w
        .split('-')
        .map((part) => {
          const cleanPart = cleanWord(part);
          if (ACCENT_CORRECTIONS[cleanPart]) return ACCENT_CORRECTIONS[cleanPart];
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('-');
    }

    // Default title case: first letter uppercase, rest lowercase
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });

  return formattedWords.join(' ');
}

/**
 * Abbreviates any location string to its standardized compact form.
 * e.g. "Praça do Avião" => "Pça. do Avião"
 *      "Terminal São Miguel" => "Term. São Miguel"
 *      "Avenida Paulista" => "Av. Paulista"
 */
export function abbreviateTransitLocation(name: string | null | undefined): string {
  return formatTransitLocation(name, { mode: 'short' });
}

/**
 * Expands any location string to its canonical full form.
 * e.g. "Pça. do Avião" => "Praça do Avião"
 *      "Term. São Miguel" => "Terminal São Miguel"
 *      "Av. Paulista" => "Avenida Paulista"
 */
export function expandTransitLocation(name: string | null | undefined): string {
  return formatTransitLocation(name, { mode: 'full' });
}
