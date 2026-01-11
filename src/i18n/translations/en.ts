export default {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    search: 'Search',
    back: 'Back',
    settings: 'Settings',
    logout: 'Logout',
    yes: 'Yes',
    no: 'No',
  },

  // Login
  login: {
    title: 'GeneHub',
    subtitle: 'Bacterial Gene Explorer',
    signInGoogle: 'Sign in with Google',
    features: {
      ncbi: 'NCBI Gene',
      uniprot: 'UniProt',
      alphafold: 'AlphaFold',
      string: 'STRING',
    },
    tagline: 'Aggregated scientific data',
  },

  // Search
  search: {
    title: 'Search',
    genePlaceholder: 'Gene symbol (e.g. dnaA)',
    organismPlaceholder: 'Organism (e.g. Escherichia coli)',
    searchButton: 'Search',
    examples: 'Examples:',
    myGenes: 'My genes',
    recentSearches: 'Recent searches',
  },

  // Gene Detail
  geneDetail: {
    cached: 'Cached',
    save: 'Save',
    saved: 'Saved',
    sections: {
      genomicLocation: 'Genomic Location',
      protein: 'Protein',
      structure: 'Structure 3D',
      interactions: 'Interactions',
      notes: 'My Notes',
    },
    fields: {
      chromosome: 'Chromosome',
      position: 'Position',
      strand: 'Strand',
      function: 'Function',
      location: 'Subcellular location',
      goTerms: 'GO Terms',
      keywords: 'Keywords',
      sequence: 'Sequence',
      length: 'Length',
      mass: 'Mass',
      alphafold: 'AlphaFold Structure',
      viewStructure: 'View structure',
      pdbStructures: 'PDB Structures',
      interactors: 'Protein Interactors',
      confidence: 'confidence',
      sequenceLength: 'Length',
      sequenceMass: 'Mass',
      pubmed: 'PubMed',
      experimentalStructure: 'Experimental structure',
    },
    notes: {
      placeholder: 'Add your notes about this gene...',
      saving: 'Saving...',
      saved: 'Saved',
      deleteConfirm: 'Delete this note?',
    },
    annotations: {
      title: 'Annotations',
      new: '+ New annotation',
      empty: 'No annotations yet',
      untitled: 'Untitled',
      titlePlaceholder: 'Title (optional)',
      textPlaceholder: 'Write…',
      chipPlaceholder: 'Value…',
      addChip: '+ Chip',
      chooseType: 'Choose a type',
      searchPlaceholder: 'Search…',
      create: 'Create',
      insert: 'Insert',
      offlineGeneBlocked: 'Offline: you can’t add a new gene. Reconnect and try again.',
      types: {
        gene: 'gene',
        reference: 'ref',
        person: 'person',
        conference: 'conf',
        date: 'date',
      },
    },
    links: {
      externalLinks: 'External Links',
      viewOn: 'View on',
    },
    savedGenes: 'My saved genes',
    noData: 'No data available',
    sources: 'Sources',
    menu: {
      addToFavorites: 'Add to favorites',
      removeFromFavorites: 'Remove from favorites',
      refresh: 'Refresh',
      openOnNcbi: 'Open on NCBI',
    },
    sections2: {
      metabolicPathways: 'Metabolic Pathways',
      information: 'Information',
      structures: 'Structures',
      references: 'References',
    },
    readMore: 'Read more',
    readLess: 'Read less',
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

  // Saved Genes
  savedGenes: {
    title: 'My Genes',
    empty: 'No saved genes yet',
    emptyHint: 'Search for a gene and tap ⭐ to save it',
    deleteConfirm: 'Remove from favorites?',
    protein: 'Protein',
    interactors: 'interactors',    noResults: 'No results',
    searchGene: 'Search for a gene',  },

  // History
  history: {
    title: 'History',
    empty: 'No search history',
    emptyHint: 'Your consulted genes will appear here',
    deleteConfirm: 'Remove from history?',
  },

  // Settings
  settings: {
    title: 'Settings',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'Language',
    about: 'About',
    version: 'Version',
  },

  // Profile
  profile: {
    title: 'Profile',
    defaults: {
      name: 'User',
    },
    stats: {
      publications: 'Publications',
      hIndex: 'H-index',
      citations: 'Citations',
    },
    sections: {
      interests: 'Research interests',
      recentPublications: 'Recent publications',
    },
    interests: {
      addPlaceholder: 'Add an interest…',
    },
    publications: {
      empty: 'No publications yet',
      citationsLabel: 'citations',
      doiPrefix: 'DOI:',
    },
  },

  // People
  people: {
    title: 'People',
    empty: 'No people yet',
  },

  // Person Detail
  personDetail: {
    mentions: 'Mentions',
    empty: 'No mentions',
    unknown: 'Unknown',
  },

  // Annotation Card
  annotationCard: {
    title: 'Scientific Annotation Card',
    placeholder: 'Write your text here...',
    instructions: 'Click in the text to place your cursor, then add an annotation',
    chooseType: 'Choose annotation type',
    add: 'Add',
    back: 'Back',
    genePlaceholder: 'GroES',
    personPlaceholder: 'Dr. Smith',
    referencePlaceholder: 'PMID:12345',
    descriptionPlaceholder: 'is a chaperone protein',
    types: {
      gene: 'Gene',
      person: 'Researcher',
      reference: 'Reference',
    },
  },

  // Notes System
  notes: {
    title: 'Notes',
    empty: 'No notes yet',
    emptyHint: 'Tap the + button to add your first note',
    addNote: 'Add a note',
    editNote: 'Edit note',
    deleteConfirm: 'Delete this note?',
    deleteSuccess: 'Note deleted',
    saveSuccess: 'Note saved',
    placeholder: 'Write your note...',
    lastUpdated: 'Last updated',
    justNow: 'just now',
    minutesAgo: '{{count}} min ago',
    hoursAgo: '{{count}} h ago',
    daysAgo: '{{count}} d ago',
    chips: {
      addGene: '+ Gene',
      addPerson: '+ Researcher',
      addReference: '+ Ref',
      gene: 'Gene',
      person: 'Researcher',
      reference: 'Reference',
      genePlaceholder: 'Gene symbol (e.g. dnaA)',
      personPlaceholder: 'Researcher name',
      referencePlaceholder: 'PMID or DOI',
    },
    search: {
      placeholder: 'Search...',
      noResults: 'No results',
      create: 'Create',
    },
  },

  // Errors
  errors: {
    network: 'Network error. Check your connection.',
    unauthorized: 'Unauthorized. Please log in again.',
    notFound: 'Gene not found.',
    serverError: 'Server error. Please try again.',
    unknown: 'An error occurred.',
  },
};
