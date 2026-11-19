export type LanguageCode =
  | 'fr'
  | 'en'
  | 'fon'
  | 'yo'
  | 'guw'
  | 'bba'
  | 'ddn'
  | 'es'
  | 'pt'
  | 'ar';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  region: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', region: 'Bénin', dir: 'ltr' },
  { code: 'en', label: 'English', region: 'International', dir: 'ltr' },
  { code: 'fon', label: 'Fɔngbè', region: 'Sud & Centre Bénin', dir: 'ltr' },
  { code: 'yo', label: 'Yorùbá / Nàgó', region: 'Sud-Est Bénin & NG', dir: 'ltr' },
  { code: 'guw', label: 'Gungbe', region: 'Porto-Novo & Ouémé', dir: 'ltr' },
  { code: 'bba', label: 'Baatonum', region: 'Borgou & Alibori', dir: 'ltr' },
  { code: 'ddn', label: 'Dendi', region: 'Donga & Alibori', dir: 'ltr' },
  { code: 'es', label: 'Español', region: 'ES / LatAm', dir: 'ltr' },
  { code: 'pt', label: 'Português', region: 'PT / BR', dir: 'ltr' },
  { code: 'ar', label: 'العربية', region: 'AR', dir: 'rtl' },
];

export type TranslationKey =
  | 'nav.listings'
  | 'nav.agents'
  | 'nav.messages'
  | 'nav.analytics'
  | 'nav.publish'
  | 'bar.tagline'
  | 'bar.alerts'
  | 'bar.signIn'
  | 'bar.signOut'
  | 'bar.completeProfile'
  | 'bar.checkingSession'
  | 'hero.badge'
  | 'hero.titleStart'
  | 'hero.titleEnd'
  | 'hero.subtitle'
  | 'hero.ctaPublish'
  | 'hero.ctaInstall'
  | 'hero.ctaAnalytics'
  | 'kpi.listings'
  | 'kpi.communes'
  | 'kpi.offers'
  | 'kpi.requests'
  | 'search.heading'
  | 'search.reset'
  | 'search.minAmount'
  | 'search.commune'
  | 'search.allCommunes'
  | 'search.quartier'
  | 'search.operation'
  | 'search.allOps'
  | 'search.offersOnly'
  | 'search.requestsOnly'
  | 'search.cashAndUv'
  | 'search.cashOnly'
  | 'search.uvOnly'
  | 'search.mixed'
  | 'listings.heading'
  | 'listings.safetyReminder'
  | 'listings.details'
  | 'listings.emptyTitle'
  | 'listings.emptyDesc'
  | 'listings.showAll'
  | 'floating.eyebrow'
  | 'floating.title'
  | 'floating.subtitle'
  | 'floating.card1Title'
  | 'floating.card1Desc'
  | 'floating.card2Title'
  | 'floating.card2Desc'
  | 'floating.card3Title'
  | 'floating.card3Desc'
  | 'floating.securityNote'
  | 'install.bannerTitle'
  | 'install.bannerDesc'
  | 'install.bannerBtn'
  | 'footer.tagline'
  | 'footer.disclaimer'
  | 'footer.installLink'
  | 'auth.title'
  | 'auth.subtitle'
  | 'auth.tabPhone'
  | 'auth.tabEmail'
  | 'auth.tabGoogle';

const FR: Record<TranslationKey, string> = {
  'nav.listings': 'Annonces',
  'nav.agents': 'Agents',
  'nav.messages': 'Messagerie',
  'nav.analytics': 'Analyses Bénin',
  'nav.publish': 'Publier',
  'bar.tagline': 'Réseau MTN MoMo · Agents du Bénin',
  'bar.alerts': 'Alertes',
  'bar.signIn': 'Connexion / Créer un compte',
  'bar.signOut': 'Déconnexion',
  'bar.completeProfile': 'Compléter mon profil',
  'bar.checkingSession': 'Vérification…',
  'hero.badge': 'MTN MoMo · République du Bénin',
  'hero.titleStart': 'La liquidité ',
  'hero.titleEnd': ' entre agents du Bénin.',
  'hero.subtitle':
    'Consultez les disponibilités de cash et d’UV signalées en temps réel par les kiosques MTN MoMo à Cotonou, Abomey-Calavi, Porto-Novo, Parakou et dans tout le Bénin.',
  'hero.ctaPublish': 'Publier une annonce',
  'hero.ctaInstall': 'Installer l’application',
  'hero.ctaAnalytics': 'Analyses Bénin',
  'kpi.listings': 'Annonces actives',
  'kpi.communes': 'Communes actives',
  'kpi.offers': 'Cash & UV offerts',
  'kpi.requests': 'Besoins signalés',
  'search.heading': 'Filtrer les disponibilités MTN MoMo',
  'search.reset': 'Réinitialiser',
  'search.minAmount': 'Montant min. (FCFA)',
  'search.commune': 'Commune (Bénin)',
  'search.allCommunes': 'Toutes les communes',
  'search.quartier': 'Quartier / marché',
  'search.operation': 'Type d’opération',
  'search.allOps': 'Offres et besoins',
  'search.offersOnly': 'Offres disponibles',
  'search.requestsOnly': 'Besoins urgents',
  'search.cashAndUv': 'Cash & UV',
  'search.cashOnly': 'Cash physique',
  'search.uvOnly': 'UV / Float MoMo',
  'search.mixed': 'Échange mixte',
  'listings.heading': 'Disponibilités et besoins en direct',
  'listings.safetyReminder': 'Confirmez toujours la disponibilité avant de vous déplacer',
  'listings.details': 'Voir détails',
  'listings.emptyTitle': 'Aucune annonce active ne correspond à votre recherche',
  'listings.emptyDesc':
    'Élargissez la commune ou le montant, ou publiez votre disponibilité pour alerter les agents voisins.',
  'listings.showAll': 'Tout afficher',
  'floating.eyebrow': 'Transactions internes entre agents au Bénin',
  'floating.title': 'Échanges rapides de cash et d’UV sur le terrain',
  'floating.subtitle':
    'Une entraide directe entre points de service MTN MoMo vérifiés pour éviter les ruptures de caisse aux heures de pointe.',
  'floating.card1Title': 'Remise cash contre UV en kiosque',
  'floating.card1Desc':
    'Un agent disposant de billets FCFA dépanne un confrère en besoin de liquidité contre transfert instantané d’UV.',
  'floating.card2Title': 'Contrôle visuel et validation MoMo',
  'floating.card2Desc':
    'Vérification mutuelle des montants sur place et confirmation directe dans votre espace MTN MoMo.',
  'floating.card3Title': 'Maillage de confiance par quartier',
  'floating.card3Desc':
    'Interconnexion directe entre kiosques de Cotonou, Calavi, Porto-Novo, Parakou, Bohicon et Natitingou.',
  'floating.securityNote':
    'Sécurité des agents : ne communiquez jamais votre code PIN MoMo, code OTP ou mot de passe. Cette plateforme met en relation les agents sans jamais conserver ni transférer vos fonds.',
  'install.bannerTitle': 'Installer MTN MoMo Connect Bénin',
  'install.bannerDesc': 'Accès direct sur votre écran d’accueil avec alertes temps réel.',
  'install.bannerBtn': 'Installer',
  'footer.tagline': 'République du Bénin · Réseau MTN MoMo',
  'footer.disclaimer':
    'Plateforme indépendante de mise en relation et de visibilité des liquidités entre agents MTN MoMo au Bénin. Non affiliée officiellement à MTN Bénin.',
  'footer.installLink': 'Installer l’application sur téléphone ou PC',
  'auth.title': 'Compte Agent MTN MoMo Bénin',
  'auth.subtitle': 'Créez votre compte avec votre numéro +229, votre e-mail ou Google.',
  'auth.tabPhone': 'Numéro (+229) · Code SMS',
  'auth.tabEmail': 'E-mail · Confirmation',
  'auth.tabGoogle': 'Google rapide',
};

const EN: Record<TranslationKey, string> = {
  'nav.listings': 'Listings',
  'nav.agents': 'Agents',
  'nav.messages': 'Messages',
  'nav.analytics': 'Benin Insights',
  'nav.publish': 'Post',
  'bar.tagline': 'MTN MoMo Network · Benin Agents',
  'bar.alerts': 'Alerts',
  'bar.signIn': 'Sign in / Create account',
  'bar.signOut': 'Sign out',
  'bar.completeProfile': 'Complete agent profile',
  'bar.checkingSession': 'Checking session…',
  'hero.badge': 'MTN MoMo · Republic of Benin',
  'hero.titleStart': 'Real-time ',
  'hero.titleEnd': ' liquidity across Benin agents.',
  'hero.subtitle':
    'Browse live physical cash and e-float (UV) availability reported by MTN MoMo kiosks in Cotonou, Abomey-Calavi, Porto-Novo, Parakou, and across Benin.',
  'hero.ctaPublish': 'Post availability',
  'hero.ctaInstall': 'Install App',
  'hero.ctaAnalytics': 'Benin Insights',
  'kpi.listings': 'Active listings',
  'kpi.communes': 'Benin communes',
  'kpi.offers': 'Available offers',
  'kpi.requests': 'Urgent requests',
  'search.heading': 'Filter MTN MoMo liquidity',
  'search.reset': 'Reset',
  'search.minAmount': 'Min amount (FCFA)',
  'search.commune': 'Commune (Benin)',
  'search.allCommunes': 'All communes',
  'search.quartier': 'District / market',
  'search.operation': 'Operation type',
  'search.allOps': 'Offers & requests',
  'search.offersOnly': 'Available offers',
  'search.requestsOnly': 'Urgent needs',
  'search.cashAndUv': 'Cash & UV',
  'search.cashOnly': 'Physical Cash',
  'search.uvOnly': 'UV / MoMo Float',
  'search.mixed': 'Mixed exchange',
  'listings.heading': 'Live availability and requests',
  'listings.safetyReminder': 'Always confirm availability before heading out',
  'listings.details': 'Details',
  'listings.emptyTitle': 'No active listings match your current filters',
  'listings.emptyDesc':
    'Adjust the commune or amount, or post your availability to notify nearby agents.',
  'listings.showAll': 'Show all',
  'floating.eyebrow': 'Internal agent-to-agent exchanges in Benin',
  'floating.title': 'Fast cash and float balancing on the ground',
  'floating.subtitle':
    'Direct peer support between verified MTN MoMo kiosks to avoid cash or float shortages during peak hours.',
  'floating.card1Title': 'In-kiosk cash for UV swap',
  'floating.card1Desc':
    'An agent with surplus FCFA notes supports a nearby peer in exchange for an instant UV transfer.',
  'floating.card2Title': 'Mutual verification on MoMo',
  'floating.card2Desc':
    'Verify amounts face-to-face and confirm transfers directly inside your MTN MoMo app.',
  'floating.card3Title': 'Trusted neighborhood network',
  'floating.card3Desc':
    'Direct coordination across Cotonou, Calavi, Porto-Novo, Parakou, Bohicon, and Natitingou.',
  'floating.securityNote':
    'Agent security: never share your MoMo PIN, OTP code, or password. This platform connects agents only and never holds or transfers funds.',
  'install.bannerTitle': 'Install MTN MoMo Connect Benin',
  'install.bannerDesc': 'One-tap home screen access with real-time alerts.',
  'install.bannerBtn': 'Install',
  'footer.tagline': 'Republic of Benin · MTN MoMo Network',
  'footer.disclaimer':
    'Independent peer liquidity coordination platform for MTN MoMo agents in Benin. Not officially affiliated with MTN Benin.',
  'footer.installLink': 'Install app on mobile or desktop',
  'auth.title': 'MTN MoMo Benin Agent Account',
  'auth.subtitle': 'Create an account with your +229 phone number, email, or Google.',
  'auth.tabPhone': 'Phone (+229) · SMS Code',
  'auth.tabEmail': 'Email · Verification',
  'auth.tabGoogle': 'Quick Google',
};

const FON: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Wɛn lɛ',
  'nav.agents': 'Azɔ̌watɔ́ lɛ',
  'nav.messages': 'Wɛnsɛ́dó',
  'nav.analytics': 'Benɛɛ gbeɖiɖe',
  'nav.publish': 'Sɛ́ dó',
  'bar.tagline': 'MTN MoMo Benɛɛ · Azɔ̌watɔ́ lɛ sín kan',
  'bar.alerts': 'Alɛ́ti lɛ',
  'bar.signIn': 'Byɔ̌ mɛ / Hun kɔ́nti',
  'bar.signOut': 'Tɔ́n',
  'bar.completeProfile': 'Klɛ́n nyikɔ towe',
  'hero.badge': 'MTN MoMo · Benɛɛ tò mɛ',
  'hero.titleStart': 'Akúɛ & UV ',
  'hero.titleEnd': ' ɖò azɔ̌watɔ́ Benɛɛ tɔn lɛ tɛntin.',
  'hero.subtitle':
    'Kpɔ́n akúɛ (cash) kpó UV kpó e azɔ̌watɔ́ MTN MoMo tɔn lɛ ɖó ɖò Kutɔ́nu, Agbomɛ-Kalavi, Xɔ̀gbónù, Parakou kpó Benɛɛ bǐ mɛ é.',
  'hero.ctaPublish': 'Ɖɔ̀ akúɛ e a ɖó é',
  'hero.ctaInstall': 'Zé alɔkan jí',
  'hero.ctaAnalytics': 'Benɛɛ gbeɖiɖe',
  'search.heading': 'Ba akúɛ MTN MoMo ɖò toxo towe mɛ',
  'search.reset': 'Vɔ́ bɛ́',
  'search.commune': 'Toxo (Benɛɛ)',
  'search.allCommunes': 'Toxo lɛ bǐ',
  'search.quartier': 'Slà / axì mɛ',
  'listings.heading': 'Wɛn yɔyɔ́ lɛ ɖò tɛnmɛ',
  'listings.details': 'Kpɔ́n bǐ',
  'floating.eyebrow': 'Azɔ̌watɔ́ lɛ sín akúɛ dídó ɖò Benɛɛ',
  'floating.title': 'Mi gɔ̀ alɔ nú miɖée kplakpla ɖò tɛnmɛ',
  'install.bannerTitle': 'Zé MTN MoMo Connect Benɛɛ ɖò alɔkan jí',
  'install.bannerBtn': 'Zé ɖ’ayǐ',
  'auth.title': 'Kɔ́nti Azɔ̌watɔ́ MTN MoMo Benɛɛ',
  'auth.tabPhone': 'Nùmɛ́lò (+229) · Kɔ́dù SMS',
  'auth.tabEmail': 'E-mail · Kɔ́dù',
};

const YORUBA: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Àwọn ìpolówó',
  'nav.agents': 'Àwọn aṣojú',
  'nav.messages': 'Ìfọ̀rọ̀wérọ̀',
  'nav.analytics': 'Ìṣirò Bìnì',
  'nav.publish': 'Kéde',
  'bar.tagline': 'MTN MoMo Bìnì · Àjọṣepọ̀ àwọn aṣojú',
  'bar.alerts': 'Ìkìlọ̀',
  'bar.signIn': 'Wọlé / Ṣẹ̀dá àkọọ́lẹ̀',
  'bar.signOut': 'Jáde',
  'hero.badge': 'MTN MoMo · Orílẹ̀-èdè Bìnì',
  'hero.titleStart': 'Owó àti UV ',
  'hero.titleEnd': ' láàárín àwọn aṣojú Bìnì.',
  'hero.subtitle':
    'Wo ibi tí owó (cash) tàbí UV wà lọ́wọ́lọ́wọ́ ní Kútɔ́nu, Abomey-Kalavi, Pọ́tọ́-Nòfò, Parakú àti gbogbo Bìnì.',
  'hero.ctaPublish': 'Fi owó tó wà síta',
  'hero.ctaInstall': 'Gba ohun-èlò sí fóònù',
  'search.heading': 'Ṣàwárí owó MTN MoMo',
  'listings.heading': 'Ìkéde owó lọ́wọ́lọ́wọ́',
  'listings.details': 'Àlàyé',
  'floating.eyebrow': 'Ìfọwọ́sowọ́pọ̀ láàárín àwọn aṣojú ní Bìnì',
  'floating.title': 'Pàṣípààrọ̀ owó àti UV kíákíá',
  'install.bannerBtn': 'Fi sori fóònù',
  'auth.title': 'Àkọọ́lẹ̀ Aṣojú MTN MoMo Bìnì',
  'auth.tabPhone': 'Nọ́mbà (+229) · Kóòdù SMS',
  'auth.tabEmail': 'Ìmeèlì · Ìjẹ́rìísí',
};

const GUNGBE: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Lɛ́ndò lɛ',
  'nav.agents': 'Azɔ̌watɔ́ lɛ',
  'nav.messages': 'Wɛn lɛ',
  'nav.analytics': 'Benɛɛ tɔn',
  'nav.publish': 'Dó wɛn',
  'bar.tagline': 'MTN MoMo Benɛɛ · Xɔ̀gbónù & Benɛɛ bǐ',
  'bar.alerts': 'Alɛ́ti lɛ',
  'bar.signIn': 'Byɔ̌ mɛ / Hun kɔ́nti',
  'hero.ctaPublish': 'Dó akúɛ wɛn',
  'hero.ctaInstall': 'Zé ɖò fóònù jí',
  'listings.details': 'Kpɔ́n',
};

const BAATONUM: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Gari yɛɛ',
  'nav.agents': 'Sɔmbuobu',
  'nav.messages': 'Gari geru',
  'nav.analytics': 'Benɛɛ gɛnɛ',
  'nav.publish': 'Wɔ̃ɔsi',
  'bar.tagline': 'MTN MoMo Benɛɛ · Borgou & Alibori',
  'bar.alerts': 'Labaari',
  'bar.signIn': 'Duure / Kɔnti ko',
  'hero.ctaPublish': 'Gari wɔ̃ɔsi',
  'hero.ctaInstall': 'App suaa',
  'listings.details': 'Mɛɛra',
};

const DENDI: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Alhabar',
  'nav.agents': 'Goykoyey',
  'nav.messages': 'Sanni',
  'nav.analytics': 'Benen hisabu',
  'nav.publish': 'Feeji',
  'bar.tagline': 'MTN MoMo Benɛɛ · Donga & Alibori',
  'bar.alerts': 'Alhabar taaga',
  'bar.signIn': 'Huro / Te konti',
  'hero.ctaPublish': 'Feeji nooru',
  'hero.ctaInstall': 'App sambu',
  'listings.details': 'Dii',
};

const ES: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Anuncios',
  'nav.agents': 'Agentes',
  'nav.messages': 'Mensajes',
  'nav.analytics': 'Análisis Benín',
  'nav.publish': 'Publicar',
  'bar.tagline': 'Red MTN MoMo · Agentes de Benín',
  'bar.alerts': 'Alertas',
  'bar.signIn': 'Entrar / Crear cuenta',
  'bar.signOut': 'Cerrar sesión',
  'bar.completeProfile': 'Completar perfil',
  'hero.badge': 'MTN MoMo · República de Benín',
  'hero.titleStart': 'Liquidez ',
  'hero.titleEnd': ' entre agentes de Benín.',
  'hero.subtitle':
    'Consulte la disponibilidad de efectivo y saldo UV en tiempo real de los puntos MTN MoMo en Cotonú, Abomey-Calavi, Porto-Novo, Parakou y todo Benín.',
  'hero.ctaPublish': 'Publicar disponibilidad',
  'hero.ctaInstall': 'Instalar aplicación',
  'hero.ctaAnalytics': 'Análisis Benín',
  'search.heading': 'Filtrar liquidez MTN MoMo',
  'search.reset': 'Restablecer',
  'search.allCommunes': 'Todas las comunas',
  'listings.heading': 'Disponibilidad y solicitudes en vivo',
  'listings.details': 'Ver detalles',
  'floating.eyebrow': 'Transacciones internas entre agentes en Benín',
  'floating.title': 'Intercambio rápido de efectivo y saldo UV en campo',
  'install.bannerTitle': 'Instalar MTN MoMo Connect Benín',
  'install.bannerBtn': 'Instalar',
  'auth.title': 'Cuenta de Agente MTN MoMo Benín',
  'auth.tabPhone': 'Teléfono (+229) · Código SMS',
  'auth.tabEmail': 'Correo · Confirmación',
};

const PT: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'Anúncios',
  'nav.agents': 'Agentes',
  'nav.messages': 'Mensagens',
  'nav.analytics': 'Análises Benim',
  'nav.publish': 'Publicar',
  'bar.tagline': 'Rede MTN MoMo · Agentes do Benim',
  'bar.alerts': 'Alertas',
  'bar.signIn': 'Entrar / Criar conta',
  'bar.signOut': 'Sair',
  'bar.completeProfile': 'Completar perfil',
  'hero.badge': 'MTN MoMo · República do Benim',
  'hero.titleStart': 'Liquidez ',
  'hero.titleEnd': ' entre agentes do Benim.',
  'hero.subtitle':
    'Consulte a disponibilidade de dinheiro físico e saldo UV em tempo real dos quiosques MTN MoMo em Cotonou, Abomey-Calavi, Porto-Novo, Parakou e em todo o Benim.',
  'hero.ctaPublish': 'Publicar disponibilidade',
  'hero.ctaInstall': 'Instalar aplicativo',
  'hero.ctaAnalytics': 'Análises Benim',
  'search.heading': 'Filtrar liquidez MTN MoMo',
  'search.reset': 'Limpar',
  'search.allCommunes': 'Todas as comunas',
  'listings.heading': 'Disponibilidade e pedidos ao vivo',
  'listings.details': 'Ver detalhes',
  'floating.eyebrow': 'Transações internas entre agentes no Benim',
  'floating.title': 'Troca rápida de dinheiro e UV no terreno',
  'install.bannerTitle': 'Instalar MTN MoMo Connect Benim',
  'install.bannerBtn': 'Instalar',
  'auth.title': 'Conta de Agente MTN MoMo Benim',
  'auth.tabPhone': 'Telefone (+229) · Código SMS',
  'auth.tabEmail': 'E-mail · Confirmação',
};

const AR: Partial<Record<TranslationKey, string>> = {
  'nav.listings': 'الإعلانات',
  'nav.agents': 'الوكلاء',
  'nav.messages': 'الرسائل',
  'nav.analytics': 'تحليلات بنين',
  'nav.publish': 'نشر',
  'bar.tagline': 'شبكة MTN MoMo · وكلاء جمهورية بنين',
  'bar.alerts': 'التنبيهات',
  'bar.signIn': 'تسجيل الدخول / إنشاء حساب',
  'bar.signOut': 'تسجيل الخروج',
  'bar.completeProfile': 'إكمال الملف',
  'hero.badge': 'MTN MoMo · جمهورية بنين',
  'hero.titleStart': 'سيولة ',
  'hero.titleEnd': ' بين وكلاء بنين.',
  'hero.subtitle':
    'تصفح توافر السيولة النقدية والرصيد الإلكتروني في الوقت الفعلي لدى وكلاء MTN MoMo في كوتونو وأبومي كالافي وبورتو نوفو وباراكو.',
  'hero.ctaPublish': 'نشر إعلان سيولة',
  'hero.ctaInstall': 'تثبيت التطبيق',
  'hero.ctaAnalytics': 'تحليلات بنين',
  'search.heading': 'تصفية سيولة MTN MoMo',
  'search.reset': 'إعادة ضبط',
  'search.allCommunes': 'جميع البلديات',
  'listings.heading': 'العروض والطلبات المباشرة',
  'listings.details': 'التفاصيل',
  'floating.eyebrow': 'تبادلات داخلية بين الوكلاء في بنين',
  'floating.title': 'تبادل سريع للنقد والرصيد الإلكتروني في الميدان',
  'install.bannerTitle': 'تثبيت MTN MoMo Connect بنين',
  'install.bannerBtn': 'تثبيت',
  'auth.title': 'حساب وكيل MTN MoMo بنين',
  'auth.tabPhone': 'رقم الهاتف (+229) · رمز SMS',
  'auth.tabEmail': 'البريد الإلكتروني · تأكيد',
};

export const TRANSLATIONS: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  fr: FR,
  en: EN,
  fon: FON,
  yo: YORUBA,
  guw: GUNGBE,
  bba: BAATONUM,
  ddn: DENDI,
  es: ES,
  pt: PT,
  ar: AR,
};

export function translate(lang: LanguageCode, key: TranslationKey): string {
  return TRANSLATIONS[lang]?.[key] || EN[key] || FR[key];
}

export function detectBestLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'fr';

  try {
    const saved = window.localStorage.getItem('momo_benin_lang') as LanguageCode | null;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch {
    // ignore storage restriction
  }

  const navLangs = [
    ...(navigator.languages || []),
    navigator.language || '',
  ]
    .map((l) => l.toLowerCase().trim())
    .filter(Boolean);

  for (const tag of navLangs) {
    const base = tag.split('-')[0];
    if (base === 'fr') return 'fr';
    if (base === 'en') return 'en';
    if (base === 'yo') return 'yo';
    if (base === 'es') return 'es';
    if (base === 'pt') return 'pt';
    if (base === 'ar') return 'ar';
    if (base === 'fon') return 'fon';
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Porto-Novo') || tz.includes('Abidjan') || tz.includes('Dakar')) return 'fr';
    if (tz.includes('Lagos')) return 'en';
    if (tz.includes('Sao_Paulo') || tz.includes('Lisbon')) return 'pt';
    if (tz.includes('Madrid') || tz.includes('Mexico') || tz.includes('Bogota')) return 'es';
    if (tz.includes('Cairo') || tz.includes('Riyadh') || tz.includes('Casablanca')) return 'ar';
  } catch {
    // ignore Intl fallback
  }

  return 'fr';
}
