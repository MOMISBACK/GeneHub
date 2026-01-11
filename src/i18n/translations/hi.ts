export default {
  // Common
  common: {
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    retry: 'पुनः प्रयास करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    confirm: 'पुष्टि करें',
    search: 'खोजें',
    back: 'वापस',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    yes: 'हां',
    no: 'नहीं',
  },

  // Login
  login: {
    title: 'GeneHub',
    subtitle: 'बैक्टीरियल जीन एक्सप्लोरर',
    signInGoogle: 'Google से साइन इन करें',
    features: {
      ncbi: 'NCBI Gene',
      uniprot: 'UniProt',
      alphafold: 'AlphaFold',
      string: 'STRING',
    },
    tagline: 'एकत्रित वैज्ञानिक डेटा',
  },

  // Search

    // Profile
    profile: {
      title: 'प्रोफ़ाइल',
      defaults: {
        name: 'उपयोगकर्ता',
      },
      stats: {
        publications: 'प्रकाशन',
        hIndex: 'एच-इंडेक्स',
        citations: 'उद्धरण',
      },
      sections: {
        interests: 'अनुसंधान रुचियाँ',
        recentPublications: 'हाल की प्रकाशन',
      },
      interests: {
        addPlaceholder: 'एक रुचि जोड़ें…',
      },
      publications: {
        empty: 'अभी कोई प्रकाशन नहीं',
        citationsLabel: 'उद्धरण',
        doiPrefix: 'DOI:',
      },
    },
  search: {
    title: 'खोज',
    genePlaceholder: 'जीन प्रतीक (जैसे: dnaA)',
    organismPlaceholder: 'जीव (जैसे: Escherichia coli)',
    searchButton: 'खोजें',
    examples: 'उदाहरण:',
    myGenes: 'मेरे जीन',
    recentSearches: 'हाल की खोजें',
  },

  // Gene Detail
  geneDetail: {
    cached: 'कैश',
    save: 'सहेजें',
    saved: 'सहेजा गया',
    sections: {
      genomicLocation: 'जीनोमिक स्थान',
      protein: 'प्रोटीन',
      structure: '3D संरचना',
      interactions: 'इंटरैक्शन',
      notes: 'मेरे नोट्स',
    },
    fields: {
      chromosome: 'क्रोमोसोम',
      position: 'स्थिति',
      strand: 'स्ट्रैंड',
      function: 'कार्य',
      location: 'उपकोशिकीय स्थान',
      goTerms: 'GO टर्म्स',
      keywords: 'कीवर्ड',
      sequence: 'अनुक्रम',
      length: 'लंबाई',
      mass: 'द्रव्यमान',
      alphafold: 'AlphaFold संरचना',
      viewStructure: 'संरचना देखें',
      pdbStructures: 'PDB संरचनाएं',
      interactors: 'प्रोटीन इंटरैक्टर',
      confidence: 'विश्वास',
      sequenceLength: 'लंबाई',
      sequenceMass: 'द्रव्यमान',
      pubmed: 'PubMed',
      experimentalStructure: 'प्रयोगात्मक संरचना',
    },
    notes: {
      placeholder: 'इस जीन के बारे में अपने नोट्स जोड़ें...',
      saving: 'सहेजा जा रहा है...',
      saved: 'सहेजा गया',
      deleteConfirm: 'इस नोट को हटाएं?',
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
      externalLinks: 'बाहरी लिंक',
      viewOn: 'पर देखें',
    },
    savedGenes: 'मेरे सहेजे गए जीन',
    noData: 'कोई डेटा उपलब्ध नहीं',
    sources: 'स्रोत',
    menu: {
      addToFavorites: 'पसंदीदा में जोड़ें',
      removeFromFavorites: 'पसंदीदा से हटाएं',
      refresh: 'ताज़ा करें',
      openOnNcbi: 'NCBI पर खोलें',
    },
    sections2: {
      metabolicPathways: 'मेटाबॉलिक पाथवेज़',
      information: 'जानकारी',
      structures: 'संरचनाएं',
      references: 'संदर्भ',
    },
    readMore: 'और पढ़ें',
    readLess: 'कम पढ़ें',
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
    title: 'मेरे जीन',
    empty: 'कोई सहेजे गए जीन नहीं',
    emptyHint: 'एक जीन खोजें और ⭐ पर टैप करके सहेजें',
    deleteConfirm: 'पसंदीदा से हटाएं?',
    protein: 'प्रोटीन',
    interactors: 'इंटरैक्टर',
    noResults: 'कोई परिणाम नहीं',
    searchGene: 'एक जीन खोजें',
  },

  // History
  history: {
    title: 'इतिहास',
    empty: 'कोई इतिहास नहीं',
    emptyHint: 'आपके देखे गए जीन यहां दिखाई देंगे',
    deleteConfirm: 'इतिहास से हटाएं?',
  },

  // Settings
  settings: {
    title: 'सेटिंग्स',
    theme: 'थीम',
    themeLight: 'लाइट',
    themeDark: 'डार्क',
    themeSystem: 'सिस्टम',
    language: 'भाषा',
    about: 'के बारे में',
    version: 'संस्करण',
  },

  // People
  people: {
    title: 'लोग',
    empty: 'अभी कोई व्यक्ति नहीं',
  },

  // Person Detail
  personDetail: {
    mentions: 'उल्लेख',
    empty: 'कोई उल्लेख नहीं',
    unknown: 'अज्ञात',
  },

  // Annotation Card
  annotationCard: {
    title: 'वैज्ञानिक एनोटेशन कार्ड',
    placeholder: 'अपना पाठ यहाँ लिखें...',
    instructions: 'कर्सर रखने के लिए पाठ में क्लिक करें, फिर एनोटेशन जोड़ें',
    chooseType: 'एनोटेशन प्रकार चुनें',
    add: 'जोड़ें',
    back: 'वापस',
    genePlaceholder: 'GroES',
    personPlaceholder: 'डॉ. स्मिथ',
    referencePlaceholder: 'PMID:12345',
    descriptionPlaceholder: 'एक चैपरोन प्रोटीन है',
    types: {
      gene: 'जीन',
      person: 'शोधकर्ता',
      reference: 'संदर्भ',
    },
  },

  // Notes System
  notes: {
    title: 'नोट्स',
    empty: 'कोई नोट नहीं',
    emptyHint: 'अपना पहला नोट जोड़ने के लिए + टैप करें',
    addNote: 'एक नोट जोड़ें',
    editNote: 'नोट संपादित करें',
    deleteConfirm: 'इस नोट को हटाएं?',
    deleteSuccess: 'नोट हटाया गया',
    saveSuccess: 'नोट सहेजा गया',
    placeholder: 'अपना नोट लिखें...',
    lastUpdated: 'अंतिम अपडेट',
    justNow: 'अभी',
    minutesAgo: '{{count}} मिनट पहले',
    hoursAgo: '{{count}} घंटे पहले',
    daysAgo: '{{count}} दिन पहले',
    chips: {
      addGene: '+ जीन',
      addPerson: '+ शोधकर्ता',
      addReference: '+ संदर्भ',
      gene: 'जीन',
      person: 'शोधकर्ता',
      reference: 'संदर्भ',
      genePlaceholder: 'जीन प्रतीक (जैसे: dnaA)',
      personPlaceholder: 'शोधकर्ता का नाम',
      referencePlaceholder: 'PMID या DOI',
    },
    search: {
      placeholder: 'खोजें...',
      noResults: 'कोई परिणाम नहीं',
      create: 'बनाएं',
    },
  },

  // Errors
  errors: {
    network: 'नेटवर्क त्रुटि। कनेक्शन जांचें।',
    unauthorized: 'अनधिकृत। कृपया पुनः लॉग इन करें।',
    notFound: 'जीन नहीं मिला।',
    serverError: 'सर्वर त्रुटि। बाद में पुनः प्रयास करें।',
    unknown: 'एक त्रुटि हुई।',
  },
};
