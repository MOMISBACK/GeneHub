export default {
  // Common
  common: {
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    confirm: '确认',
    search: '搜索',
    back: '返回',
    settings: '设置',
    logout: '退出登录',
    yes: '是',
    no: '否',
  },

  // Login
  login: {
    title: 'GeneHub',
    subtitle: '细菌基因浏览器',
    signInGoogle: '使用Google登录',
    features: {
      ncbi: 'NCBI Gene',
      uniprot: 'UniProt',
      alphafold: 'AlphaFold',
      string: 'STRING',
    },
    tagline: '聚合科学数据',
  },

  // Search
  search: {
    title: '搜索',
    genePlaceholder: '基因符号（如：dnaA）',
    organismPlaceholder: '生物体（如：Escherichia coli）',
    searchButton: '搜索',
    examples: '示例：',
    myGenes: '我的基因',
    recentSearches: '最近搜索',
  },

  // Gene Detail
  geneDetail: {
    cached: '缓存',
    save: '保存',
    saved: '已保存',
    sections: {
      genomicLocation: '基因组位置',
      protein: '蛋白质',
      structure: '3D结构',
      interactions: '相互作用',
      notes: '我的笔记',
    },
    fields: {
      chromosome: '染色体',
      position: '位置',
      strand: '链',
      function: '功能',
      location: '亚细胞定位',
      goTerms: 'GO术语',
      keywords: '关键词',
      sequence: '序列',
      length: '长度',
      mass: '质量',
      alphafold: 'AlphaFold结构',
      viewStructure: '查看结构',
      pdbStructures: 'PDB结构',
      interactors: '蛋白质相互作用体',
      confidence: '置信度',
      sequenceLength: '长度',
      sequenceMass: '质量',
      pubmed: 'PubMed',
      experimentalStructure: '实验结构',
    },
    notes: {
      placeholder: '添加关于此基因的笔记...',
      saving: '保存中...',
      saved: '已保存',
      deleteConfirm: '删除此笔记？',
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
      externalLinks: '外部链接',
      viewOn: '查看于',
    },
    savedGenes: '我保存的基因',
    noData: '暂无数据',
    sources: '来源',    menu: {
      addToFavorites: '添加到收藏',
      removeFromFavorites: '从收藏中移除',
      refresh: '刷新',
      openOnNcbi: '在 NCBI 上打开',
    },
    sections2: {
      metabolicPathways: '代谢途径',
      information: '信息',
      structures: '结构',
      references: '参考文献',
    },
    readMore: '阅读更多',
    readLess: '收起',
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
    title: '我的基因',
    empty: '没有保存的基因',
    emptyHint: '搜索基因并点击⭐保存',
    deleteConfirm: '从收藏中移除？',
    protein: '蛋白质',
    interactors: '相互作用体',
    noResults: '无结果',
    searchGene: '搜索基因',
  },

  // History
  history: {
    title: '历史',
    empty: '无历史记录',
    emptyHint: '您查看的基因将显示在这里',
    deleteConfirm: '从历史中移除？',
  },

  // Settings
  settings: {
    title: '设置',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '系统',
    language: '语言',
    about: '关于',
    version: '版本',
  },

  // Profile
  profile: {
    title: '个人资料',
    defaults: {
      name: '用户',
    },
    stats: {
      publications: '发表论文',
      hIndex: 'H 指数',
      citations: '引用',
    },
    sections: {
      interests: '研究兴趣',
      recentPublications: '近期论文',
    },
    interests: {
      addPlaceholder: '添加一个兴趣…',
    },
    publications: {
      empty: '暂无论文',
      citationsLabel: '次引用',
      doiPrefix: 'DOI:',
    },
  },

  // People
  people: {
    title: '人物',
    empty: '暂无人物',
  },

  // Person Detail
  personDetail: {
    mentions: '提及',
    empty: '暂无提及',
    unknown: '未知',
  },

  // Annotation Card
  annotationCard: {
    title: '科学注释卡',
    placeholder: '在此输入文本...',
    instructions: '点击文本设置光标，然后添加注释',
    chooseType: '选择注释类型',
    add: '添加',
    back: '返回',
    genePlaceholder: 'GroES',
    personPlaceholder: '史密斯博士',
    referencePlaceholder: 'PMID:12345',
    descriptionPlaceholder: '是一种分子伴侣蛋白',
    types: {
      gene: '基因',
      person: '研究员',
      reference: '参考文献',
    },
  },

  // Notes System
  notes: {
    title: '笔记',
    empty: '暂无笔记',
    emptyHint: '点击 + 添加您的第一个笔记',
    addNote: '添加笔记',
    editNote: '编辑笔记',
    deleteConfirm: '删除此笔记？',
    deleteSuccess: '笔记已删除',
    saveSuccess: '笔记已保存',
    placeholder: '写下您的笔记...',
    lastUpdated: '最后更新',
    justNow: '刚刚',
    minutesAgo: '{{count}} 分钟前',
    hoursAgo: '{{count}} 小时前',
    daysAgo: '{{count}} 天前',
    chips: {
      addGene: '+ 基因',
      addPerson: '+ 研究员',
      addReference: '+ 参考',
      gene: '基因',
      person: '研究员',
      reference: '参考文献',
      genePlaceholder: '基因符号（例如：dnaA）',
      personPlaceholder: '研究员姓名',
      referencePlaceholder: 'PMID 或 DOI',
    },
    search: {
      placeholder: '搜索...',
      noResults: '无结果',
      create: '创建',
    },
  },

  // Errors
  errors: {
    network: '网络错误。请检查连接。',
    unauthorized: '未授权。请重新登录。',
    notFound: '未找到基因。',
    serverError: '服务器错误。请稍后重试。',
    unknown: '发生错误。',
  },
};
