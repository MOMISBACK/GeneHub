export default {
  // Common
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    retry: 'Повторить',
    cancel: 'Отмена',
    save: 'Сохранить',
    delete: 'Удалить',
    confirm: 'Подтвердить',
    search: 'Поиск',
    back: 'Назад',
    settings: 'Настройки',
    logout: 'Выйти',
    yes: 'Да',
    no: 'Нет',
  },

  // Login
  login: {
    title: 'GeneHub',
    subtitle: 'Исследователь бактериальных генов',
    signInGoogle: 'Войти через Google',
    features: {
      ncbi: 'NCBI Gene',
      uniprot: 'UniProt',
      alphafold: 'AlphaFold',
      string: 'STRING',
    },
    tagline: 'Агрегированные научные данные',
  },

  // Search

    // Profile
    profile: {
      title: 'Профиль',
      defaults: {
        name: 'Пользователь',
      },
      stats: {
        publications: 'Публикации',
        hIndex: 'h-индекс',
        citations: 'Цитирования',
      },
      sections: {
        interests: 'Научные интересы',
        recentPublications: 'Недавние публикации',
      },
      interests: {
        addPlaceholder: 'Добавить интерес…',
      },
      publications: {
        empty: 'Публикаций пока нет',
        citationsLabel: 'цит.',
        doiPrefix: 'DOI:',
      },
    },
  search: {
    title: 'Поиск',
    genePlaceholder: 'Символ гена (напр.: dnaA)',
    organismPlaceholder: 'Организм (напр.: Escherichia coli)',
    searchButton: 'Искать',
    examples: 'Примеры:',
    myGenes: 'Мои гены',
    recentSearches: 'Недавние поиски',
  },

  // Gene Detail
  geneDetail: {
    cached: 'Кэш',
    save: 'Сохранить',
    saved: 'Сохранено',
    sections: {
      genomicLocation: 'Геномное расположение',
      protein: 'Белок',
      structure: '3D структура',
      interactions: 'Взаимодействия',
      notes: 'Мои заметки',
    },
    fields: {
      chromosome: 'Хромосома',
      position: 'Позиция',
      strand: 'Цепь',
      function: 'Функция',
      location: 'Субклеточная локализация',
      goTerms: 'GO термины',
      keywords: 'Ключевые слова',
      sequence: 'Последовательность',
      length: 'Длина',
      mass: 'Масса',
      alphafold: 'Структура AlphaFold',
      viewStructure: 'Просмотр структуры',
      pdbStructures: 'Структуры PDB',
      interactors: 'Белковые интеракторы',
      confidence: 'достоверность',
      sequenceLength: 'Длина',
      sequenceMass: 'Масса',
      pubmed: 'PubMed',
      experimentalStructure: 'Экспериментальная структура',
    },
    notes: {
      placeholder: 'Добавьте заметки об этом гене...',
      saving: 'Сохранение...',
      saved: 'Сохранено',
      deleteConfirm: 'Удалить эту заметку?',
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
      externalLinks: 'Внешние ссылки',
      viewOn: 'Смотреть на',
    },
    savedGenes: 'Мои сохранённые гены',
    noData: 'Данные недоступны',
    sources: 'Источники',    menu: {
      addToFavorites: 'Добавить в избранное',
      removeFromFavorites: 'Удалить из избранного',
      refresh: 'Обновить',
      openOnNcbi: 'Открыть в NCBI',
    },
    sections2: {
      metabolicPathways: 'Метаболические пути',
      information: 'Информация',
      structures: 'Структуры',
      references: 'Ссылки',
    },
    readMore: 'Читать дальше',
    readLess: 'Свернуть',
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
    title: 'Мои гены',
    empty: 'Нет сохранённых генов',
    emptyHint: 'Найдите ген и нажмите ⭐ для сохранения',
    deleteConfirm: 'Удалить из избранного?',
    protein: 'Белок',
    interactors: 'интеракторов',    noResults: 'Нет результатов',
    searchGene: 'Поиск гена',  },

  // History
  history: {
    title: 'История',
    empty: 'История пуста',
    emptyHint: 'Просмотренные гены появятся здесь',
    deleteConfirm: 'Удалить из истории?',
  },

  // Settings
  settings: {
    title: 'Настройки',
    theme: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeSystem: 'Системная',
    language: 'Язык',
    about: 'О приложении',
    version: 'Версия',
  },

  // People
  people: {
    title: 'Люди',
    empty: 'Пока нет людей',
  },

  // Person Detail
  personDetail: {
    mentions: 'Упоминания',
    empty: 'Нет упоминаний',
    unknown: 'Неизвестно',
  },

  // Annotation Card
  annotationCard: {
    title: 'Карта научной аннотации',
    placeholder: 'Введите текст здесь...',
    instructions: 'Нажмите на текст, чтобы установить курсор, затем добавьте аннотацию',
    chooseType: 'Выберите тип аннотации',
    add: 'Добавить',
    back: 'Назад',
    genePlaceholder: 'GroES',
    personPlaceholder: 'Д-р Смит',
    referencePlaceholder: 'PMID:12345',
    descriptionPlaceholder: 'является шаперонным белком',
    types: {
      gene: 'Ген',
      person: 'Исследователь',
      reference: 'Ссылка',
    },
  },

  // Notes System
  notes: {
    title: 'Заметки',
    empty: 'Нет заметок',
    emptyHint: 'Нажмите + чтобы добавить первую заметку',
    addNote: 'Добавить заметку',
    editNote: 'Редактировать заметку',
    deleteConfirm: 'Удалить эту заметку?',
    deleteSuccess: 'Заметка удалена',
    saveSuccess: 'Заметка сохранена',
    placeholder: 'Напишите заметку...',
    lastUpdated: 'Последнее обновление',
    justNow: 'только что',
    minutesAgo: '{{count}} мин назад',
    hoursAgo: '{{count}} ч назад',
    daysAgo: '{{count}} д назад',
    chips: {
      addGene: '+ Ген',
      addPerson: '+ Исследователь',
      addReference: '+ Ссылка',
      gene: 'Ген',
      person: 'Исследователь',
      reference: 'Ссылка',
      genePlaceholder: 'Символ гена (напр: dnaA)',
      personPlaceholder: 'Имя исследователя',
      referencePlaceholder: 'PMID или DOI',
    },
    search: {
      placeholder: 'Поиск...',
      noResults: 'Нет результатов',
      create: 'Создать',
    },
  },

  // Errors
  errors: {
    network: 'Ошибка сети. Проверьте соединение.',
    unauthorized: 'Не авторизован. Войдите снова.',
    notFound: 'Ген не найден.',
    serverError: 'Ошибка сервера. Попробуйте позже.',
    unknown: 'Произошла ошибка.',
  },
};
