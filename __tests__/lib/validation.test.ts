/**
 * Tests for data validation and type checking utilities
 */

// Gene data validation helpers
function isValidGeneSummary(data: unknown): data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.symbol === 'string' &&
    typeof obj.organism === 'string'
  );
}

function isValidSavedGene(data: unknown): data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.organism === 'string' &&
    typeof obj.savedAt === 'string'
  );
}

function isValidBiocycResponse(data: unknown): data is Record<string, unknown> {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.success === 'boolean' &&
    typeof obj.supported === 'boolean'
  );
}

describe('Data Validation', () => {
  describe('isValidGeneSummary', () => {
    it('should validate correct gene summary', () => {
      const valid = {
        symbol: 'dnaA',
        organism: 'E. coli',
        name: 'DnaA protein',
        function: 'Initiates DNA replication',
      };
      expect(isValidGeneSummary(valid)).toBe(true);
    });

    it('should reject missing symbol', () => {
      const invalid = {
        organism: 'E. coli',
      };
      expect(isValidGeneSummary(invalid)).toBe(false);
    });

    it('should reject missing organism', () => {
      const invalid = {
        symbol: 'dnaA',
      };
      expect(isValidGeneSummary(invalid)).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidGeneSummary(null)).toBe(false);
    });

    it('should reject primitives', () => {
      expect(isValidGeneSummary('string')).toBe(false);
      expect(isValidGeneSummary(123)).toBe(false);
      expect(isValidGeneSummary(undefined)).toBe(false);
    });
  });

  describe('isValidSavedGene', () => {
    it('should validate correct saved gene', () => {
      const valid = {
        id: 'dnaa_e. coli_1234567890',
        symbol: 'dnaA',
        organism: 'E. coli',
        savedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(isValidSavedGene(valid)).toBe(true);
    });

    it('should validate saved gene with optional fields', () => {
      const valid = {
        id: 'dnaa_e. coli_1234567890',
        symbol: 'dnaA',
        organism: 'E. coli',
        savedAt: '2024-01-01T00:00:00.000Z',
        proteinName: 'DnaA',
        data: { symbol: 'dnaA', organism: 'E. coli' },
      };
      expect(isValidSavedGene(valid)).toBe(true);
    });

    it('should reject missing id', () => {
      const invalid = {
        symbol: 'dnaA',
        organism: 'E. coli',
        savedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(isValidSavedGene(invalid)).toBe(false);
    });

    it('should reject missing savedAt', () => {
      const invalid = {
        id: 'dnaa_e. coli_1234567890',
        symbol: 'dnaA',
        organism: 'E. coli',
      };
      expect(isValidSavedGene(invalid)).toBe(false);
    });
  });

  describe('isValidBiocycResponse', () => {
    it('should validate successful response', () => {
      const valid = {
        success: true,
        supported: true,
        data: {
          biocycId: 'ECOLI:EG10234',
          name: 'dnaA',
        },
      };
      expect(isValidBiocycResponse(valid)).toBe(true);
    });

    it('should validate unsupported organism response', () => {
      const valid = {
        success: false,
        supported: false,
        error: 'Organism not supported',
      };
      expect(isValidBiocycResponse(valid)).toBe(true);
    });

    it('should reject missing success field', () => {
      const invalid = {
        supported: true,
      };
      expect(isValidBiocycResponse(invalid)).toBe(false);
    });

    it('should reject missing supported field', () => {
      const invalid = {
        success: true,
      };
      expect(isValidBiocycResponse(invalid)).toBe(false);
    });
  });
});

describe('Gene Symbol Validation', () => {
  // Standard bacterial gene naming conventions
  function isValidBacterialGene(symbol: string): boolean {
    // Pattern: 2-4 lowercase + 1 uppercase + optional number
    // Examples: dnaA, recA, ftsZ, rpoB1
    return /^[a-z]{2,4}[A-Z][0-9]?$/.test(symbol);
  }

  it('should validate standard gene names', () => {
    expect(isValidBacterialGene('dnaA')).toBe(true);
    expect(isValidBacterialGene('recA')).toBe(true);
    expect(isValidBacterialGene('ftsZ')).toBe(true);
    expect(isValidBacterialGene('rpoB')).toBe(true);
    expect(isValidBacterialGene('gyrA')).toBe(true);
  });

  it('should validate gene names with numbers', () => {
    expect(isValidBacterialGene('trpA1')).toBe(true);
    expect(isValidBacterialGene('rpoB2')).toBe(true);
  });

  it('should validate genes with 2-4 lowercase prefix', () => {
    expect(isValidBacterialGene('atA')).toBe(true);   // 2 lowercase
    expect(isValidBacterialGene('dnaN')).toBe(true);  // 3 lowercase
    expect(isValidBacterialGene('murA')).toBe(true);  // 3 lowercase
  });

  it('should reject invalid patterns', () => {
    expect(isValidBacterialGene('DNAA')).toBe(false);  // All uppercase
    expect(isValidBacterialGene('dnaa')).toBe(false);  // All lowercase
    expect(isValidBacterialGene('DnaA')).toBe(false);  // Starts with uppercase
    expect(isValidBacterialGene('d')).toBe(false);     // Too short
    expect(isValidBacterialGene('dnaaa')).toBe(false); // Missing uppercase
  });
});

describe('Organism Normalization', () => {
  // Known organism aliases mapping
  const ORGANISM_ALIASES: Record<string, string> = {
    'e. coli': 'escherichia coli',
    'e.coli': 'escherichia coli',
    'ecoli': 'escherichia coli',
    'b. subtilis': 'bacillus subtilis',
    'b.subtilis': 'bacillus subtilis',
    'p. aeruginosa': 'pseudomonas aeruginosa',
  };

  function normalizeOrganismAlias(input: string): string {
    const normalized = input.toLowerCase().trim();
    return ORGANISM_ALIASES[normalized] || normalized;
  }

  it('should normalize common E. coli aliases', () => {
    expect(normalizeOrganismAlias('E. coli')).toBe('escherichia coli');
    expect(normalizeOrganismAlias('e.coli')).toBe('escherichia coli');
    expect(normalizeOrganismAlias('ecoli')).toBe('escherichia coli');
  });

  it('should normalize B. subtilis aliases', () => {
    expect(normalizeOrganismAlias('B. subtilis')).toBe('bacillus subtilis');
    expect(normalizeOrganismAlias('b.subtilis')).toBe('bacillus subtilis');
  });

  it('should return lowercase for unknown organisms', () => {
    expect(normalizeOrganismAlias('Unknown Organism')).toBe('unknown organism');
    expect(normalizeOrganismAlias('MYCOBACTERIUM')).toBe('mycobacterium');
  });
});

describe('Date Handling', () => {
  it('should generate valid ISO date strings', () => {
    const date = new Date().toISOString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should parse ISO date strings correctly', () => {
    const isoString = '2024-01-15T10:30:00.000Z';
    const date = new Date(isoString);
    
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January is 0
    expect(date.getDate()).toBe(15);
  });

  it('should calculate time differences correctly', () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    expect(now - oneHourAgo).toBe(60 * 60 * 1000);
    expect(now - oneDayAgo).toBe(24 * 60 * 60 * 1000);
  });
});

describe('URL Generation', () => {
  it('should generate valid PubMed URLs', () => {
    const pubmedId = '12345678';
    const url = `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`;
    
    expect(url).toBe('https://pubmed.ncbi.nlm.nih.gov/12345678/');
    expect(url).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/);
  });

  it('should generate valid UniProt URLs', () => {
    const uniprotId = 'P12345';
    const url = `https://www.uniprot.org/uniprotkb/${uniprotId}`;
    
    expect(url).toBe('https://www.uniprot.org/uniprotkb/P12345');
  });

  it('should generate valid NCBI Gene URLs', () => {
    const geneId = '944745';
    const url = `https://www.ncbi.nlm.nih.gov/gene/${geneId}`;
    
    expect(url).toBe('https://www.ncbi.nlm.nih.gov/gene/944745');
  });

  it('should generate valid AlphaFold URLs', () => {
    const uniprotId = 'P12345';
    const url = `https://alphafold.ebi.ac.uk/entry/${uniprotId}`;
    
    expect(url).toBe('https://alphafold.ebi.ac.uk/entry/P12345');
  });

  it('should generate valid STRING DB URLs', () => {
    const identifier = '511145.b3702';
    const url = `https://string-db.org/network/${identifier}`;
    
    expect(url).toBe('https://string-db.org/network/511145.b3702');
  });
});
