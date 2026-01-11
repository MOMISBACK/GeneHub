/**
 * GenoDB Atlas v3.1 - Domain Types
 * 
 * Architecture de l'Information:
 * - Objets primaires: Gene, Protein, Note
 * - Objets de contexte: Organism, Source, Evidence
 * - Objets d'organisation: Project, View
 */

// ============ Evidence Model ============

/**
 * Curation Status - terminologie non ambiguë
 */
export type CurationStatus = 
  | 'curated'    // Human/expert curated
  | 'verified'   // Internal validation + explicit checks
  | 'imported';  // External, not verified by GenoDB

/**
 * Evidence Type - type de preuve
 */
export type EvidenceType =
  | 'experimental'       // Lab-derived evidence
  | 'computational'      // In-silico/predicted
  | 'author_statement'   // From publication authors
  | 'imported_assertion' // Imported from external DB
  | 'curator_inference'; // Inferred by curator

/**
 * Reliability Level - indication de confiance
 */
export type ReliabilityLevel = 'high' | 'moderate' | 'low' | 'unknown';

/**
 * Evidence object - attached to any data field
 */
export interface Evidence {
  id: string;
  
  /** Primary source (e.g., UniProt) */
  primarySource: Source;
  
  /** Supporting sources (e.g., NCBI, PDB, publications) */
  supportingSources?: Source[];
  
  /** GenoDB curation status */
  curationStatus: CurationStatus;
  
  /** Original source's own taxonomy (e.g., "UniProt reviewed") */
  sourceOwnStatus?: string;
  
  /** Type of evidence */
  evidenceType: EvidenceType;
  
  /** Consensus information */
  consensus: {
    /** Number of concordant sources */
    concordantCount: number;
    /** Number of independent sources (if known) */
    independentCount?: number;
    /** Is this derived from another source? */
    derivedFrom?: string;
  };
  
  /** Recency information */
  recency: {
    /** When the source was last updated */
    sourceLastUpdated?: string;
    /** When GenoDB ingested this data */
    ingestedAt: string;
    /** When this was computed (if derived) */
    computedAt?: string;
  };
  
  /** Reliability hint based on transparent rules */
  reliability?: ReliabilityLevel;
  
  /** Human-readable reliability explanation */
  reliabilityReason?: string;
}

// ============ Source ============

/**
 * Known data sources
 */
export type SourceType = 
  | 'ncbi_gene'
  | 'uniprot'
  | 'pdb'
  | 'alphafold'
  | 'string'
  | 'card'       // Antibiotic resistance
  | 'biocyc'
  | 'pubmed'
  | 'user'       // User-defined
  | 'genodb';    // Internal

/**
 * Source object
 */
export interface Source {
  id: string;
  type: SourceType;
  name: string;
  
  /** External accession/identifier */
  accession?: string;
  
  /** URL to source */
  url?: string;
  
  /** Source version/release */
  version?: string;
  
  /** Last updated date */
  lastUpdated?: string;
}

// ============ Organism ============

/**
 * Organism/Taxon information
 */
export interface Organism {
  id: string;
  
  /** NCBI Taxonomy ID */
  taxId: number;
  
  /** Scientific name */
  scientificName: string;
  
  /** Common name (if any) */
  commonName?: string;
  
  /** Strain/variant */
  strain?: string;
  
  /** Taxonomic lineage */
  lineage?: string[];
  
  /** Short display name */
  shortName?: string;
}

// ============ Gene ============

/**
 * Gene - genomic locus
 */
export interface Gene {
  id: string;
  
  /** Gene symbol (e.g., dnaA) */
  symbol: string;
  
  /** Official name */
  name?: string;
  
  /** Alternative names/synonyms */
  synonyms?: string[];
  
  /** Description */
  description?: string;
  
  /** Organism */
  organism: Organism;
  
  /** Genomic context */
  genomicContext?: {
    chromosome?: string;
    start?: number;
    stop?: number;
    strand?: '+' | '-';
    locusTag?: string;
  };
  
  /** Cross-references */
  crossRefs: {
    ncbiGeneId?: string;
    ensemblId?: string;
    biocycId?: string;
  };
  
  /** Associated protein(s) */
  proteinIds?: string[];
  
  /** Evidence for gene data */
  evidence?: Record<string, Evidence>;
  
  /** Metadata */
  meta: {
    sources: SourceType[];
    fetchedAt: string;
    updatedAt: string;
  };
}

// ============ Protein ============

/**
 * GO Term
 */
export interface GoTerm {
  id: string;
  term: string;
  category: 'molecular_function' | 'biological_process' | 'cellular_component';
  evidence?: Evidence;
}

/**
 * Protein domain
 */
export interface ProteinDomain {
  id: string;
  name: string;
  type: string; // e.g., Pfam, InterPro
  start: number;
  end: number;
  description?: string;
}

/**
 * PDB Structure
 */
export interface PdbStructure {
  id: string;
  method?: 'X-RAY DIFFRACTION' | 'ELECTRON MICROSCOPY' | 'NMR' | 'OTHER';
  resolution?: number;
  title?: string;
  releaseDate?: string;
  url?: string;
}

/**
 * Protein interactor
 */
export interface Interactor {
  geneSymbol: string;
  proteinId?: string;
  score: number;
  experimentalEvidence?: boolean;
}

/**
 * Protein - gene product
 */
export interface Protein {
  id: string;
  
  /** UniProt accession */
  uniprotId?: string;
  
  /** Protein name */
  name?: string;
  
  /** Recommended name */
  recommendedName?: string;
  
  /** Alternative names */
  alternativeNames?: string[];
  
  /** Parent gene ID */
  geneId: string;
  
  /** Function description */
  function?: string;
  
  /** Subcellular location(s) */
  subcellularLocation?: string[];
  
  /** GO terms */
  goTerms?: GoTerm[];
  
  /** Keywords */
  keywords?: string[];
  
  /** Sequence */
  sequence?: {
    value: string;
    length: number;
    mass?: number; // kDa
    checksum?: string;
  };
  
  /** Domains */
  domains?: ProteinDomain[];
  
  /** Structure information */
  structure?: {
    hasExperimental: boolean;
    hasAlphaFold: boolean;
    pdbStructures?: PdbStructure[];
    alphafoldUrl?: string;
  };
  
  /** Protein interactions */
  interactions?: Interactor[];
  
  /** Pathways */
  pathways?: Array<{
    id: string;
    name: string;
    source: SourceType;
  }>;
  
  /** Evidence for protein fields */
  evidence?: Record<string, Evidence>;
  
  /** Cross-references */
  crossRefs: {
    uniprotId?: string;
    pdbIds?: string[];
    alphafoldId?: string;
    stringId?: string;
  };
  
  /** Metadata */
  meta: {
    sources: SourceType[];
    fetchedAt: string;
    updatedAt: string;
  };
}

// ============ Conflict ============

/**
 * Data conflict between sources
 */
export interface Conflict {
  id: string;
  
  /** Field with conflict */
  field: string;
  
  /** Conflicting values with their sources */
  values: Array<{
    value: unknown;
    source: Source;
    evidence?: Evidence;
  }>;
  
  /** Recommended resolution */
  recommendation?: {
    value: unknown;
    reason: string;
    confidence: ReliabilityLevel;
  };
  
  /** Resolution status */
  resolution?: {
    resolvedValue: unknown;
    resolvedBy: 'system' | 'user';
    userId?: string;
    rationale?: string;
    resolvedAt: string;
  };
  
  /** Created timestamp */
  createdAt: string;
}

// ============ Note ============

/**
 * Note version (for versioning)
 */
export interface NoteVersion {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

/**
 * User note - attached to Gene/Protein
 */
export interface Note {
  id: string;
  
  /** Note content (markdown supported) */
  content: string;
  
  /** Attached to Gene */
  geneId?: string;
  
  /** Attached to Protein */
  proteinId?: string;
  
  /** Project context */
  projectId?: string;
  
  /** Tags */
  tags?: string[];
  
  /** Version history */
  versions: NoteVersion[];
  
  /** Current version number */
  currentVersion: number;
  
  /** Author */
  createdBy: string;
  
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

// ============ Entry (UI Container) ============

/**
 * Entry - unified UI container for Gene + Protein
 * Used for display purposes while maintaining IA distinction
 */
export interface Entry {
  gene: Gene;
  protein?: Protein;
  notes?: Note[];
  conflicts?: Conflict[];
  
  /** Is this entry pinned/favorited */
  isPinned: boolean;
  
  /** User tags */
  tags?: string[];
  
  /** Last viewed */
  lastViewedAt?: string;
}

// ============ Project ============

/**
 * Project - collection of entries
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  
  /** Entry IDs in this project */
  entryIds: string[];
  
  /** Saved views */
  viewIds?: string[];
  
  /** Owner */
  ownerId: string;
  
  /** Shared with */
  sharedWith?: string[];
  
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

// ============ View ============

/**
 * Saved View - filters/sort/columns configuration
 */
export interface SavedView {
  id: string;
  name: string;
  
  /** Filters */
  filters: {
    organisms?: string[];
    sources?: SourceType[];
    tags?: string[];
    hasConflicts?: boolean;
    curationStatus?: CurationStatus[];
    reliability?: ReliabilityLevel[];
  };
  
  /** Sort configuration */
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  
  /** Visible columns */
  columns?: string[];
  
  /** Query signature for reproducibility */
  querySignature: string;
  
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

// ============ Export ============

/**
 * Export configuration
 */
export interface ExportConfig {
  format: 'csv' | 'tsv' | 'json';
  
  /** Include options */
  include: {
    mainData: boolean;
    provenance: boolean;
    conflicts: boolean;
    resolutions: boolean;
    notes: boolean;
    overrides: boolean;
  };
  
  /** Selected columns (for CSV/TSV) */
  columns?: string[];
  
  /** Query signature */
  querySignature: string;
  
  /** Export timestamp */
  exportedAt: string;
  
  /** Dataset version */
  datasetVersion: string;
  
  /** Export ID for audit trail */
  exportId: string;
}

// ============ API Response Types ============

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    sources: SourceType[];
    fetchedAt: string;
    fromCache?: boolean;
    cacheAge?: number;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
