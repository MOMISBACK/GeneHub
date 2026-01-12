export default {
  // Common
  common: {
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    search: 'Buscar',
    back: 'Volver',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
    yes: 'Sí',
    no: 'No',
  },

  // Login
  login: {
    title: 'GeneHub',
    subtitle: 'Explorador de genes bacterianos',
    signInGoogle: 'Iniciar sesión con Google',
    features: {
      ncbi: 'NCBI Gene',
      uniprot: 'UniProt',
      alphafold: 'AlphaFold',
      string: 'STRING',
    },
    tagline: 'Datos científicos agregados',
  },

  // Search

    // Profile
    profile: {
      title: 'Perfil',
      defaults: {
        name: 'Usuario',
      },
      stats: {
        publications: 'Publicaciones',
        hIndex: 'Índice H',
        citations: 'Citas',
      },
      sections: {
        interests: 'Intereses de investigación',
        recentPublications: 'Publicaciones recientes',
      },
      interests: {
        addPlaceholder: 'Añadir un interés…',
      },
      publications: {
        empty: 'Aún no hay publicaciones',
        citationsLabel: 'citas',
        doiPrefix: 'DOI:',
      },
    },
  search: {
    title: 'Búsqueda',
    genePlaceholder: 'Símbolo del gen (ej: dnaA)',
    organismPlaceholder: 'Organismo (ej: Escherichia coli)',
    searchButton: 'Buscar',
    examples: 'Ejemplos:',
    myGenes: 'Mis genes',
    recentSearches: 'Búsquedas recientes',
  },

  // Gene Detail
  geneDetail: {
    cached: 'Cache',
    save: 'Guardar',
    saved: 'Guardado',
    sections: {
      genomicLocation: 'Ubicación genómica',
      protein: 'Proteína',
      structure: 'Estructura 3D',
      interactions: 'Interacciones',
      notes: 'Mis notas',
    },
    fields: {
      chromosome: 'Cromosoma',
      position: 'Posición',
      strand: 'Hebra',
      function: 'Función',
      location: 'Ubicación subcelular',
      goTerms: 'Términos GO',
      keywords: 'Palabras clave',
      sequence: 'Secuencia',
      length: 'Longitud',
      mass: 'Masa',
      alphafold: 'Estructura AlphaFold',
      viewStructure: 'Ver estructura',
      pdbStructures: 'Estructuras PDB',
      interactors: 'Proteínas interactoras',
      confidence: 'confianza',
      sequenceLength: 'Longitud',
      sequenceMass: 'Masa',
      pubmed: 'PubMed',
      experimentalStructure: 'Estructura experimental',
    },
    notes: {
      placeholder: 'Añade tus notas sobre este gen...',
      saving: 'Guardando...',
      saved: 'Guardado',
      deleteConfirm: '¿Eliminar esta nota?',
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
      externalLinks: 'Enlaces externos',
      viewOn: 'Ver en',
    },
    savedGenes: 'Mis genes guardados',
    noData: 'Sin datos disponibles',
    sources: 'Fuentes',    menu: {
      addToFavorites: 'Agregar a favoritos',
      removeFromFavorites: 'Quitar de favoritos',
      refresh: 'Actualizar',
      openOnNcbi: 'Abrir en NCBI',
    },
    sections2: {
      metabolicPathways: 'Vías metabólicas',
      information: 'Información',
      structures: 'Estructuras',
      references: 'Referencias',
    },
    readMore: 'Leer más',
    readLess: 'Reducir',
    sourceNames: {
      ncbiGene: 'NCBI Gene',
      uniprot: 'UniProt',
      ecocyc: 'EcoCyc',
      pdb: 'PDB',
      alphafold: 'AlphaFold',
      string: 'STRING',
      biocyc: 'BioCyc',
    },  },

  // Saved Genes
  savedGenes: {
    title: 'Mis genes',
    empty: 'Sin genes guardados',
    emptyHint: 'Busca un gen y toca ⭐ para guardarlo',
    deleteConfirm: '¿Quitar de favoritos?',
    protein: 'Proteína',
    interactors: 'interactores',    noResults: 'Sin resultados',
    searchGene: 'Buscar un gen',  },

  // History
  history: {
    title: 'Historial',
    empty: 'Sin historial',
    emptyHint: 'Tus genes consultados aparecerán aquí',
    deleteConfirm: '¿Quitar del historial?',
  },

  // Settings
  settings: {
    title: 'Configuración',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
    language: 'Idioma',
    about: 'Acerca de',
    version: 'Versión',
  },

  // People
  people: {
    title: 'Personas',
    empty: 'Aún no hay personas',
  },

  // Person Detail
  personDetail: {
    mentions: 'Menciones',
    empty: 'Sin menciones',
    unknown: 'Desconocido',
  },

  // Annotation Card
  annotationCard: {
    title: 'Tarjeta de Anotación Científica',
    placeholder: 'Escribe tu texto aquí...',
    instructions: 'Haz clic en el texto para colocar el cursor, luego añade una anotación',
    chooseType: 'Elegir tipo de anotación',
    add: 'Añadir',
    back: 'Volver',
    genePlaceholder: 'GroES',
    personPlaceholder: 'Dr. Smith',
    referencePlaceholder: 'PMID:12345',
    descriptionPlaceholder: 'es una proteína chaperona',
    types: {
      gene: 'Gen',
      person: 'Investigador',
      reference: 'Referencia',
    },
  },

  // Notes System
  notes: {
    title: 'Notas',
    empty: 'Sin notas',
    emptyHint: 'Toca + para añadir tu primera nota',
    addNote: 'Añadir una nota',
    editNote: 'Editar nota',
    deleteConfirm: '¿Eliminar esta nota?',
    deleteSuccess: 'Nota eliminada',
    saveSuccess: 'Nota guardada',
    placeholder: 'Escribe tu nota...',
    lastUpdated: 'Última actualización',
    justNow: 'ahora mismo',
    minutesAgo: 'hace {{count}} min',
    hoursAgo: 'hace {{count}} h',
    daysAgo: 'hace {{count}} d',
    chips: {
      addGene: '+ Gen',
      addPerson: '+ Investigador',
      addReference: '+ Ref',
      gene: 'Gen',
      person: 'Investigador',
      reference: 'Referencia',
      genePlaceholder: 'Símbolo del gen (ej: dnaA)',
      personPlaceholder: 'Nombre del investigador',
      referencePlaceholder: 'PMID o DOI',
    },
    search: {
      placeholder: 'Buscar...',
      noResults: 'Sin resultados',
      create: 'Crear',
    },
  },

  // Errors
  errors: {
    network: 'Error de red. Verifica tu conexión.',
    unauthorized: 'No autorizado. Inicia sesión de nuevo.',
    notFound: 'Gen no encontrado.',
    serverError: 'Error del servidor. Intenta más tarde.',
    unknown: 'Ocurrió un error.',
  },
};
