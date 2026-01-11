export default {
  // Common
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    search: 'Rechercher',
    back: 'Retour',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    yes: 'Oui',
    no: 'Non',
  },

  // Login
  login: {
    title: 'GeneHub',
    subtitle: 'Explorateur de gènes bactériens',
    signInGoogle: 'Connexion avec Google',
    features: {
      ncbi: 'NCBI Gene',
      uniprot: 'UniProt',
      alphafold: 'AlphaFold',
      string: 'STRING',
    },
    tagline: 'Données scientifiques agrégées',
  },

  // Search
  search: {
    title: 'Gène',
    genePlaceholder: 'Symbole du gène (ex: dnaA)',
    organismPlaceholder: 'Organisme (ex: Escherichia coli)',
    searchButton: 'Rechercher',
    examples: 'Exemples :',
    myGenes: 'Mes gènes',
    recentSearches: 'Recherches récentes',
  },

  // Gene Detail
  geneDetail: {
    cached: 'Cache',
    save: 'Sauvegarder',
    saved: 'Sauvegardé',
    sections: {
      genomicLocation: 'Localisation génomique',
      protein: 'Protéine',
      structure: 'Structure 3D',
      interactions: 'Interactions',
      notes: 'Mes notes',
    },
    fields: {
      chromosome: 'Chromosome',
      position: 'Position',
      strand: 'Brin',
      function: 'Fonction',
      location: 'Localisation subcellulaire',
      goTerms: 'Termes GO',
      keywords: 'Mots-clés',
      sequence: 'Séquence',
      length: 'Longueur',
      mass: 'Masse',
      alphafold: 'Structure AlphaFold',
      viewStructure: 'Voir la structure',
      pdbStructures: 'Structures PDB',
      interactors: 'Protéines interactrices',
      confidence: 'confiance',
      sequenceLength: 'Longueur',
      sequenceMass: 'Masse',
      pubmed: 'PubMed',
      experimentalStructure: 'Structure expérimentale',
    },
    notes: {
      placeholder: 'Ajoutez vos notes sur ce gène...',
      saving: 'Enregistrement...',
      saved: 'Enregistré',
      deleteConfirm: 'Supprimer cette note ?',
    },
    annotations: {
      title: 'Annotations',
      new: '+ Nouvelle annotation',
      empty: 'Aucune annotation',
      untitled: 'Sans titre',
      titlePlaceholder: 'Titre (optionnel)',
      textPlaceholder: 'Écrire…',
      chipPlaceholder: 'Valeur…',
      addChip: '+ Chip',
      chooseType: 'Choisir un type',
      searchPlaceholder: 'Rechercher…',
      create: 'Créer',
      insert: 'Insérer',
      offlineGeneBlocked: 'Hors ligne : impossible d’ajouter un gène. Reconnecte-toi puis réessaie.',
      types: {
        gene: 'gène',
        reference: 'ref',
        person: 'personne',
        conference: 'conf',
        date: 'date',
      },
    },
    links: {
      externalLinks: 'Liens externes',
      viewOn: 'Voir sur',
    },
    savedGenes: 'Mes gènes sauvegardés',
    noData: 'Aucune donnée disponible',
    sources: 'Sources',
    menu: {
      addToFavorites: 'Ajouter aux favoris',
      removeFromFavorites: 'Retirer des favoris',
      refresh: 'Rafraîchir',
      openOnNcbi: 'Ouvrir sur NCBI',
    },
    sections2: {
      metabolicPathways: 'Voies métaboliques',
      information: 'Informations',
      structures: 'Structures',
      references: 'Références',
    },
    readMore: 'Lire plus',
    readLess: 'Réduire',
    sourceNames: {
      ncbiGene: 'NCBI Gene',
      uniprot: 'UniProt',
      ecocyc: 'EcoCyc',
      pdb: 'PDB',
      alphafold: 'AlphaFold',
      string: 'STRING',
      biocyc: 'BioCyc',
    },
  },

  // Notes System
  notes: {
    title: 'Notes',
    empty: 'Aucune note',
    emptyHint: 'Appuyez sur + pour ajouter votre première note',
    addNote: 'Ajouter une note',
    editNote: 'Modifier la note',
    deleteConfirm: 'Supprimer cette note ?',
    deleteSuccess: 'Note supprimée',
    saveSuccess: 'Note sauvegardée',
    placeholder: 'Écrivez votre note...',
    lastUpdated: 'Dernière mise à jour',
    justNow: 'à l\'instant',
    minutesAgo: 'il y a {{count}} min',
    hoursAgo: 'il y a {{count}} h',
    daysAgo: 'il y a {{count}} j',
    chips: {
      addGene: '+ Gène',
      addPerson: '+ Chercheur',
      addReference: '+ Réf',
      gene: 'Gène',
      person: 'Chercheur',
      reference: 'Référence',
      genePlaceholder: 'Symbole du gène (ex: dnaA)',
      personPlaceholder: 'Nom du chercheur',
      referencePlaceholder: 'PMID ou DOI',
    },
    search: {
      placeholder: 'Rechercher...',
      noResults: 'Aucun résultat',
      create: 'Créer',
    },
  },

  // Saved Genes
  savedGenes: {
    title: 'Mes gènes',
    empty: 'Aucun gène sauvegardé',
    emptyHint: 'Recherchez un gène et appuyez sur ⭐ pour le sauvegarder',
    deleteConfirm: 'Retirer des favoris ?',
    protein: 'Protéine',
    interactors: 'interacteurs',
    noResults: 'Aucun résultat',
    searchGene: 'Rechercher un gène',
  },

  // History
  history: {
    title: 'Historique',
    empty: 'Aucun historique',
    emptyHint: 'Vos gènes consultés apparaîtront ici',
    deleteConfirm: 'Retirer de l\'historique ?',
  },

  // Settings
  settings: {
    title: 'Paramètres',
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    themeSystem: 'Système',
    language: 'Langue',
    about: 'À propos',
    version: 'Version',
  },

  // Profile
  profile: {
    title: 'Profil',
    defaults: {
      name: 'Utilisateur',
    },
    stats: {
      publications: 'Publications',
      hIndex: 'Index H',
      citations: 'Citations',
    },
    sections: {
      interests: "Centres d'intérêt de recherche",
      recentPublications: 'Publications récentes',
    },
    interests: {
      addPlaceholder: "Ajouter un centre d'intérêt…",
    },
    publications: {
      empty: 'Aucune publication ajoutée',
      citationsLabel: 'citations',
      doiPrefix: 'DOI :',
    },
  },

  // People
  people: {
    title: 'Personnes',
    empty: 'Aucune personne',
  },

  // Person Detail
  personDetail: {
    mentions: 'Mentions',
    empty: 'Aucune mention',
    unknown: 'Inconnu',
  },

  // Annotation Card
  annotationCard: {
    title: 'Carte d\'Annotation Scientifique',
    placeholder: 'Écrivez votre texte ici...',
    instructions: 'Cliquez dans le texte pour placer votre curseur, puis ajoutez une annotation',
    chooseType: 'Choisir le type d\'annotation',
    add: 'Ajouter',
    back: 'Retour',
    genePlaceholder: 'GroES',
    personPlaceholder: 'Dr. Smith',
    referencePlaceholder: 'PMID:12345',
    descriptionPlaceholder: 'est une proteine chaperone',
    types: {
      gene: 'Gène',
      person: 'Chercheur',
      reference: 'Référence',
    },
  },

  // Errors
  errors: {
    network: 'Erreur réseau. Vérifiez votre connexion.',
    unauthorized: 'Non autorisé. Reconnectez-vous.',
    notFound: 'Gène non trouvé.',
    serverError: 'Erreur serveur. Réessayez plus tard.',
    unknown: 'Une erreur est survenue.',
  },
};
