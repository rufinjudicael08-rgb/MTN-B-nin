import { NetworkTheme, OperatorName, VerificationLevel } from '../types';

export interface BeninCommune {
  name: string;
  department: string;
  role: string;
  quartiers: string[];
}

export const BENIN_COMMUNES: BeninCommune[] = [
  {
    name: 'Cotonou',
    department: 'Littoral',
    role: 'Poumon économique et marchés centraux',
    quartiers: [
      'Dantokpa',
      'Akpakpa',
      'Fidjrossè',
      'Cadjèhoun',
      'Gbégamey',
      'Haie Vive',
      'Missèbo',
      'Gbèdjromèdé',
      'Zongo',
      'Sainte-Rita',
      'Vêdoko',
      'Agla',
    ],
  },
  {
    name: 'Abomey-Calavi',
    department: 'Atlantique',
    role: 'Pôle universitaire et forte croissance résidentielle',
    quartiers: [
      'Tankpè',
      'Calavi-Centre (UAC)',
      'Godomey',
      'Akassato',
      'Togba',
      'Togbin',
      'Ouèdo',
      'Glo-Djigbé',
      'Arconville',
      'Zopah',
    ],
  },
  {
    name: 'Porto-Novo',
    department: 'Ouémé',
    role: 'Capitale administrative et échanges frontaliers',
    quartiers: [
      'Ouando',
      'Adjina',
      'Attaké',
      'Oganla',
      'Djègan-Kpèvi',
      'Tokpota',
      'Catchi',
      'Agbokou',
    ],
  },
  {
    name: 'Parakou',
    department: 'Borgou',
    role: 'Métropole commerciale du Nord-Bénin',
    quartiers: [
      'Albarika',
      'Zongo',
      'Banikanni',
      'Kpébié',
      'Titirou',
      'Dépôt',
      'Guéma',
    ],
  },
  {
    name: 'Bohicon',
    department: 'Zou',
    role: 'Carrefour routier et commercial du Centre',
    quartiers: [
      'Bohicon Centre',
      'Houègbo',
      'Zakpo',
      'Sodohomè',
      'Agongointon',
      'Lissèzou',
    ],
  },
  {
    name: 'Ouidah',
    department: 'Atlantique',
    role: 'Pôle historique et axe côtier Mono-Atlantique',
    quartiers: [
      'Ouidah Centre',
      'Pahou',
      'Kpasse',
      'Zoungbodji',
      'Savi',
    ],
  },
  {
    name: 'Abomey',
    department: 'Zou',
    role: 'Pôle historique et marché régional',
    quartiers: ['Djègbé', 'Hounli', 'Vidolé', 'Goho'],
  },
  {
    name: 'Lokossa',
    department: 'Mono',
    role: 'Chef-lieu administratif du Sud-Ouest',
    quartiers: ['Lokossa Centre', 'Guinkomey', 'Agnamè', 'Koudo'],
  },
  {
    name: 'Natitingou',
    department: 'Atacora',
    role: 'Carrefour économique du Nord-Ouest',
    quartiers: ['Yimporima', 'Kantaborifa', 'Ourbouga', 'Bagapodi'],
  },
  {
    name: 'Kandi',
    department: 'Alibori',
    role: 'Grand marché agricole et transit Nord-Est',
    quartiers: ['Kandi Centre', 'Kossarou', 'Baobab', 'Angaradébou'],
  },
  {
    name: 'Djougou',
    department: 'Donga',
    role: 'Pôle commercial de la Donga',
    quartiers: ['Djougou Centre', 'Taïfa', 'Zountori', 'Kilirk'],
  },
  {
    name: 'Pobè',
    department: 'Plateau',
    role: 'Pôle agro-industriel du Plateau',
    quartiers: ['Pobè Centre', 'Oké-Ola', 'Issaba'],
  },
];

export interface OperatorMeta {
  name: OperatorName;
  shortName: string;
  themeKey: Exclude<NetworkTheme, 'global'>;
  parentGroup: string;
  primaryColor: string;
  secondaryColor: string;
  textOnPrimary: string;
  softBg: string;
  tagline: string;
}

export const OPERATORS_META: Record<OperatorName, OperatorMeta> = {
  'MTN MoMo': {
    name: 'MTN MoMo',
    shortName: 'MTN',
    themeKey: 'mtn',
    parentGroup: 'MTN Bénin',
    primaryColor: '#FFCC00',
    secondaryColor: '#111827',
    textOnPrimary: '#111827',
    softBg: '#FEF9C7',
    tagline: 'Réseau jaune · Forte capillarité urbaine et rurale au Bénin',
  },
  'Moov Money': {
    name: 'Moov Money',
    shortName: 'Moov',
    themeKey: 'moov',
    parentGroup: 'Moov Africa Bénin',
    primaryColor: '#005CA9',
    secondaryColor: '#E30613',
    textOnPrimary: '#FFFFFF',
    softBg: '#EBF4FF',
    tagline: 'Bleu & Rouge · Échanges marchands et corridors inter-villes',
  },
  'Celtiis Cash': {
    name: 'Celtiis Cash',
    shortName: 'Celtiis',
    themeKey: 'celtiis',
    parentGroup: 'Celtiis Bénin (SBIN)',
    primaryColor: '#008390',
    secondaryColor: '#16A34A',
    textOnPrimary: '#FFFFFF',
    softBg: '#E6F7F6',
    tagline: 'Turquoise & Vert · Opérateur national numérique du Bénin',
  },
};

export const THEME_OPTIONS: {
  key: NetworkTheme;
  label: string;
  operator?: OperatorName;
  swatchPrimary: string;
  swatchSecondary: string;
}[] = [
  {
    key: 'global',
    label: 'Tous les réseaux',
    swatchPrimary: '#0F2942',
    swatchSecondary: '#0D9488',
  },
  {
    key: 'mtn',
    label: 'MTN MoMo',
    operator: 'MTN MoMo',
    swatchPrimary: '#FFCC00',
    swatchSecondary: '#111827',
  },
  {
    key: 'moov',
    label: 'Moov Money',
    operator: 'Moov Money',
    swatchPrimary: '#005CA9',
    swatchSecondary: '#E30613',
  },
  {
    key: 'celtiis',
    label: 'Celtiis Cash',
    operator: 'Celtiis Cash',
    swatchPrimary: '#008390',
    swatchSecondary: '#16A34A',
  },
];

export const VERIFICATION_LABELS: Record<
  VerificationLevel,
  { label: string; description: string }
> = {
  standard: {
    label: 'Profil standard',
    description: 'Compte Google vérifié avec point de service déclaré au Bénin.',
  },
  community: {
    label: 'Vérifié communauté',
    description: 'Activité régulière et informations validées par la modération.',
  },
  certified: {
    label: 'Agent certifié',
    description: 'Point de service contrôlé avec justificatif professionnel.',
  },
};

// Constantes de validation synchronisées avec firebase-blueprint.json & firestore.rules
export const FIELD_LIMITS = {
  businessNameMin: 2,
  businessNameMax: 60,
  communeMin: 2,
  communeMax: 50,
  quartierMin: 2,
  quartierMax: 60,
  bioMax: 240,
  listingDetailsMax: 300,
  messageMax: 500,
  amountMin: 500,
  amountMax: 25_000_000,
  whatsappRegex: /^\+?229[0-9]{8,10}$/,
};

const SENSITIVE_PATTERN = /\b(pin|otp|mot\s*de\s*passe|password|code\s*secret|code\s*momo)\b/i;

export function containsSensitiveSecret(text: string): boolean {
  return SENSITIVE_PATTERN.test(text);
}

export function normalizeBeninWhatsapp(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('229')) return `+${digits}`;
  if (/^[0-9]{8,10}$/.test(digits)) return `+229${digits}`;
  return digits;
}

export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount))} FCFA`;
}

export function themeToOperator(theme: NetworkTheme): OperatorName | '' {
  if (theme === 'mtn') return 'MTN MoMo';
  if (theme === 'moov') return 'Moov Money';
  if (theme === 'celtiis') return 'Celtiis Cash';
  return '';
}

export function operatorToTheme(op: OperatorName | ''): NetworkTheme {
  if (op === 'MTN MoMo') return 'mtn';
  if (op === 'Moov Money') return 'moov';
  if (op === 'Celtiis Cash') return 'celtiis';
  return 'global';
}
