/**
 * gene-summary: Aggregates data from multiple scientific databases
 * - NCBI Gene (basic info, genomic context)
 * - UniProt (function, GO terms, subcellular location)
 * - AlphaFold (structure availability)
 * - PDB (experimental structures)
 * - STRING (protein interactions)
 * 
 * Improved search: tries multiple query strategies for better results
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneRequest {
  symbol: string;
  organism: string;
}

interface GeneSummary {
  symbol: string;
  organism: string;
  name?: string;
  synonyms?: string[];
  description?: string;
  ncbiGeneId?: string;
  chromosome?: string;
  start?: number;
  stop?: number;
  strand?: string;
  uniprotId?: string;
  proteinName?: string;
  function?: string;
  subcellularLocation?: string[];
  goTerms?: { id: string; term: string; category: string }[];
  keywords?: string[];
  sequence?: string;
  sequenceLength?: number;
  mass?: number;
  alphafoldUrl?: string;
  pdbStructures?: { id: string; method?: string; resolution?: number; title?: string }[];
  pdbIds?: string[];
  hasStructure?: boolean;
  interactors?: { gene: string; score: number }[];
  pathways?: string[];
  links: {
    ncbi?: string;
    uniprot?: string;
    alphafold?: string;
    string?: string;
    pdb?: string;
  };
  sources: string[];
  fetchedAt: string;
}

// Reference proteomes for model organisms (UniProt proteome IDs)
// These are the well-annotated reference proteomes to prioritize
const REFERENCE_PROTEOMES: Record<number, string> = {
  511145: 'UP000000625', // E. coli K-12 MG1655
  224308: 'UP000001570', // B. subtilis 168
  208964: 'UP000002438', // P. aeruginosa PAO1
  93061: 'UP000008816',  // S. aureus NCTC 8325
  99287: 'UP000001014',  // S. typhimurium LT2
  83332: 'UP000001584',  // M. tuberculosis H37Rv
  243277: 'UP000000584', // V. cholerae O1 biovar El Tor
  272620: 'UP000000265', // K. pneumoniae MGH 78578
};

// Extended organism mapping with multiple variants
const ORGANISM_TAX_MAP: Record<string, number> = {
  // E. coli variants
  'escherichia coli': 511145,
  'escherichia coli k-12': 511145,
  'escherichia coli k12': 511145,
  'escherichia coli mg1655': 511145,
  'e. coli': 511145,
  'e.coli': 511145,
  'ecoli': 511145,
  // B. subtilis
  'bacillus subtilis': 224308,
  'bacillus subtilis 168': 224308,
  'b. subtilis': 224308,
  'b.subtilis': 224308,
  // P. aeruginosa
  'pseudomonas aeruginosa': 208964,
  'pseudomonas aeruginosa pao1': 208964,
  'p. aeruginosa': 208964,
  'p.aeruginosa': 208964,
  // S. aureus
  'staphylococcus aureus': 93061,
  's. aureus': 93061,
  's.aureus': 93061,
  // Salmonella
  'salmonella enterica': 99287,
  'salmonella typhimurium': 99287,
  's. enterica': 99287,
  's. typhimurium': 99287,
  // M. tuberculosis
  'mycobacterium tuberculosis': 83332,
  'm. tuberculosis': 83332,
  // V. cholerae
  'vibrio cholerae': 243277,
  'v. cholerae': 243277,
  // K. pneumoniae
  'klebsiella pneumoniae': 272620,
  'k. pneumoniae': 272620,
  // Generic/fallback
  'bacteria': 2,
};

// Keywords to filter out (too generic or not scientifically useful)
const FILTERED_KEYWORDS = new Set([
  'Reference proteome',
  'Complete proteome',
  '3D-structure',
  'Direct protein sequencing',
  'Cytoplasm', // Already shown in subcellular location
  'Membrane', // Already shown in subcellular location
  'Plasmid',
  'Chromosomal rearrangement',
]);

// Also store broader taxonomy IDs for UniProt searches
const ORGANISM_BROAD_TAX: Record<number, number> = {
  511145: 562, // E. coli K-12 -> E. coli species
  224308: 1423, // B. subtilis 168 -> B. subtilis species
  208964: 287, // P. aeruginosa PAO1 -> P. aeruginosa species
  93061: 1280, // S. aureus -> S. aureus species
};

function getTaxId(organism: string): number {
  const key = organism.toLowerCase().trim();
  return ORGANISM_TAX_MAP[key] ?? 511145;
}

function getBroadTaxId(taxId: number): number {
  return ORGANISM_BROAD_TAX[taxId] ?? taxId;
}

// ============ NCBI Gene (improved search) ============
async function fetchNcbiGene(symbol: string, taxId: number): Promise<Partial<GeneSummary>> {
  try {
    // Try multiple search strategies
    const searches = [
      // Exact gene name search
      `${symbol}[gene]+AND+txid${taxId}[orgn]`,
      // With broader taxonomy
      `${symbol}[gene]+AND+txid${getBroadTaxId(taxId)}[orgn]`,
      // Also search in symbol field
      `${symbol}[sym]+AND+txid${taxId}[orgn]`,
      // Search as preferred symbol
      `${symbol}[Preferred Symbol]+AND+txid${taxId}[orgn]`,
    ];

    let geneId: string | undefined;

    for (const query of searches) {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${encodeURIComponent(query)}&retmode=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      geneId = searchData?.esearchresult?.idlist?.[0];
      if (geneId) break;
      
      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    if (!geneId) {
      console.log(`NCBI: No gene found for ${symbol} in taxid ${taxId}`);
      return {};
    }

    // Get gene summary
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    
    const doc = summaryData?.result?.[geneId];
    if (!doc) return { ncbiGeneId: geneId };

    const genomicInfo = doc.genomicinfo?.[0];

    return {
      ncbiGeneId: geneId,
      name: doc.description || doc.nomenclaturename,
      description: doc.summary,
      synonyms: doc.otheraliases?.split(',').map((s: string) => s.trim()).filter(Boolean),
      chromosome: genomicInfo?.chrloc,
      start: genomicInfo?.chrstart,
      stop: genomicInfo?.chrstop,
      strand: genomicInfo?.exoncount > 0 ? 'plus' : undefined,
      links: {
        ncbi: `https://www.ncbi.nlm.nih.gov/gene/${geneId}`,
      },
    };
  } catch (e) {
    console.error('NCBI fetch error:', e);
    return {};
  }
}

// ============ UniProt (improved search with reference proteomes) ============
async function fetchUniprot(symbol: string, taxId: number): Promise<Partial<GeneSummary> & { canonicalSymbol?: string }> {
  try {
    const broadTaxId = getBroadTaxId(taxId);
    const proteomeId = REFERENCE_PROTEOMES[taxId];
    
    // Build search queries prioritizing reference proteome
    const queries = proteomeId 
      ? [
          // Priority 1: Reference proteome + exact gene (best match for model organisms)
          `(gene_exact:${symbol}) AND (proteome:${proteomeId})`,
          // Priority 2: Reference proteome + gene name
          `(gene:${symbol}) AND (proteome:${proteomeId})`,
          // Priority 3: Reference proteome + reviewed (Swiss-Prot)
          `(gene:${symbol}) AND (proteome:${proteomeId}) AND (reviewed:true)`,
          // Priority 4: Exact taxid + exact gene
          `(gene_exact:${symbol}) AND (taxonomy_id:${taxId})`,
          // Priority 5: Reviewed only for this taxid
          `(gene:${symbol}) AND (taxonomy_id:${taxId}) AND (reviewed:true)`,
        ]
      : [
          // Fallback for organisms without reference proteome
          `(gene_exact:${symbol}) AND (taxonomy_id:${taxId})`,
          `(gene:${symbol}) AND (taxonomy_id:${taxId})`,
          `(gene:${symbol}) AND (taxonomy_id:${broadTaxId}) AND (reviewed:true)`,
          `(gene_names:${symbol}) AND (taxonomy_id:${broadTaxId})`,
        ];

    let entry: any = null;

    for (const query of queries) {
      const url = `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(query)}&format=json&size=1&fields=accession,id,protein_name,gene_names,cc_function,cc_subcellular_location,go,keyword,sequence,mass,organism_name`;
      
      console.log(`[UniProt] Trying: ${query}`);
      
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      
      entry = data?.results?.[0];
      if (entry) {
        console.log(`[UniProt] Found: ${entry.primaryAccession} (${entry.organism?.scientificName || 'unknown'})`);
        break;
      }
    }

    if (!entry) {
      console.log(`UniProt: No entry found for ${symbol} in taxid ${taxId}`);
      return {};
    }

    const accession = entry.primaryAccession;
    
    // Extract canonical gene symbol from gene_names (correctly cased)
    const geneNames = entry.genes?.[0];
    const canonicalSymbol = geneNames?.geneName?.value ?? 
                           geneNames?.orderedLocusNames?.[0]?.value ??
                           geneNames?.orfNames?.[0]?.value;
    
    // Parse function
    const functionComment = entry.comments?.find((c: any) => c.commentType === 'FUNCTION');
    const functionText = functionComment?.texts?.[0]?.value;

    // Parse subcellular location
    const locationComment = entry.comments?.find((c: any) => c.commentType === 'SUBCELLULAR LOCATION');
    const locations = locationComment?.subcellularLocations?.map((l: any) => 
      l.location?.value
    ).filter(Boolean) ?? [];

    // Parse GO terms
    const goTerms = entry.uniProtKBCrossReferences
      ?.filter((x: any) => x.database === 'GO')
      ?.map((x: any) => {
        const props = x.properties ?? [];
        const termProp = props.find((p: any) => p.key === 'GoTerm');
        const term = termProp?.value ?? '';
        const [category, ...rest] = term.split(':');
        return {
          id: x.id,
          term: rest.join(':').trim(),
          category: category === 'F' ? 'Molecular Function' : 
                   category === 'P' ? 'Biological Process' : 
                   category === 'C' ? 'Cellular Component' : category,
        };
      }) ?? [];

    // Parse keywords (filter out generic/useless ones)
    const keywords = (entry.keywords?.map((k: any) => k.name) ?? [])
      .filter((kw: string) => !FILTERED_KEYWORDS.has(kw));

    // Sequence info
    const seq = entry.sequence;

    // Mass: UniProt returns molWeight in Daltons, we want kDa (kilodaltons)
    // molWeight is already in Da, so divide by 1000 for kDa
    const massKDa = seq?.molWeight ? parseFloat((seq.molWeight / 1000).toFixed(1)) : undefined;

    return {
      canonicalSymbol, // The correctly-cased gene symbol from UniProt
      uniprotId: accession,
      proteinName: entry.proteinDescription?.recommendedName?.fullName?.value ??
                   entry.proteinDescription?.submissionNames?.[0]?.fullName?.value,
      function: functionText,
      subcellularLocation: locations,
      goTerms: goTerms.slice(0, 15),
      keywords: keywords.slice(0, 10),
      sequence: seq?.value,
      sequenceLength: seq?.length,
      mass: massKDa,
      links: {
        uniprot: `https://www.uniprot.org/uniprotkb/${accession}`,
      },
    };
  } catch (e) {
    console.error('UniProt fetch error:', e);
    return {};
  }
}

// ============ AlphaFold ============
async function fetchAlphafold(uniprotId: string | undefined): Promise<Partial<GeneSummary>> {
  if (!uniprotId) return {};
  
  try {
    const url = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
    const res = await fetch(url);
    
    if (!res.ok) return {};
    
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : data;
    
    if (entry?.pdbUrl || entry?.cifUrl) {
      return {
        alphafoldUrl: `https://alphafold.ebi.ac.uk/entry/${uniprotId}`,
        hasStructure: true,
        links: {
          alphafold: `https://alphafold.ebi.ac.uk/entry/${uniprotId}`,
        },
      };
    }
    return {};
  } catch (e) {
    console.error('AlphaFold fetch error:', e);
    return {};
  }
}

// ============ PDB (with structure details) ============
interface PdbStructure {
  id: string;
  method?: string;
  resolution?: number;
  title?: string;
}

async function fetchPdb(uniprotId: string | undefined): Promise<{ pdbStructures?: PdbStructure[]; pdbIds?: string[]; hasStructure?: boolean; links?: { pdb?: string } }> {
  if (!uniprotId) return {};
  
  try {
    // Try EBI PDBe API first
    const mappingUrl = `https://www.ebi.ac.uk/pdbe/api/mappings/uniprot/${uniprotId.toUpperCase()}`;
    console.log(`[PDB] Fetching: ${mappingUrl}`);
    
    let pdbIds: string[] = [];
    
    const mappingRes = await fetch(mappingUrl);
    
    if (mappingRes.ok) {
      const mappingData = await mappingRes.json();
      const mapping = mappingData?.[uniprotId] || mappingData?.[uniprotId.toUpperCase()];
      
      if (mapping?.PDB) {
        pdbIds = Object.keys(mapping.PDB).slice(0, 10);
      }
    }
    
    // Fallback: Try RCSB search API
    if (pdbIds.length === 0) {
      console.log(`[PDB] No results from EBI, trying RCSB search...`);
      const rcsbUrl = `https://search.rcsb.org/rcsbsearch/v2/query?json=${encodeURIComponent(JSON.stringify({
        query: {
          type: 'terminal',
          service: 'text',
          parameters: {
            attribute: 'rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession',
            operator: 'exact_match',
            value: uniprotId
          }
        },
        return_type: 'entry',
        request_options: { results_content_type: ['experimental'] }
      }))}`;
      
      try {
        const rcsbRes = await fetch(rcsbUrl);
        if (rcsbRes.ok) {
          const rcsbData = await rcsbRes.json();
          pdbIds = rcsbData?.result_set?.slice(0, 10).map((r: any) => r.identifier) || [];
        }
      } catch (e) {
        console.log('[PDB] RCSB search failed:', e);
      }
    }
    
    if (pdbIds.length === 0) {
      console.log(`[PDB] No structures found for ${uniprotId}`);
      return {};
    }
    
    console.log(`[PDB] Found ${pdbIds.length} structures: ${pdbIds.join(', ')}`);

    // Get structure details from RCSB
    const structures: PdbStructure[] = [];
    
    // Fetch details for first 5 structures
    for (const pdbId of pdbIds.slice(0, 5)) {
      try {
        const detailUrl = `https://data.rcsb.org/rest/v1/core/entry/${pdbId}`;
        const detailRes = await fetch(detailUrl);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const method = detail.exptl?.[0]?.method;
          const resolution = detail.rcsb_entry_info?.resolution_combined?.[0];
          structures.push({
            id: pdbId,
            method: method,
            resolution: resolution ? Math.round(resolution * 100) / 100 : undefined,
            title: detail.struct?.title,
          });
        }
      } catch {
        structures.push({ id: pdbId });
      }
    }

    return {
      pdbStructures: structures,
      pdbIds,
      hasStructure: true,
      links: {
        pdb: `https://www.rcsb.org/structure/${pdbIds[0]}`,
      },
    };
  } catch (e) {
    console.error('[PDB] Fetch error:', e);
    return {};
  }
}

// ============ STRING (Interactions) ============
async function fetchString(symbol: string, taxId: number): Promise<Partial<GeneSummary>> {
  try {
    const url = `https://string-db.org/api/json/interaction_partners?identifiers=${encodeURIComponent(symbol)}&species=${taxId}&limit=10`;
    const res = await fetch(url);
    
    if (!res.ok) {
      // Try with broader taxonomy
      const broadUrl = `https://string-db.org/api/json/interaction_partners?identifiers=${encodeURIComponent(symbol)}&species=${getBroadTaxId(taxId)}&limit=10`;
      const broadRes = await fetch(broadUrl);
      if (!broadRes.ok) return {};
      const broadData = await broadRes.json();
      return processStringData(broadData, symbol, getBroadTaxId(taxId));
    }
    
    const data = await res.json();
    return processStringData(data, symbol, taxId);
  } catch (e) {
    console.error('STRING fetch error:', e);
    return {};
  }
}

function processStringData(data: any, symbol: string, taxId: number): Partial<GeneSummary> {
  if (Array.isArray(data) && data.length > 0) {
    const interactors = data
      .filter((d: any) => d.preferredName_B && d.score)
      .map((d: any) => ({
        gene: d.preferredName_B,
        score: Math.round(d.score * 1000) / 1000,
      }))
      .slice(0, 10);

    return {
      interactors,
      links: {
        string: `https://string-db.org/network/${taxId}.${symbol}`,
      },
    };
  }
  return {};
}

// ============ Main Handler ============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symbol, organism }: GeneRequest = await req.json();

    if (!symbol || !organism) {
      return new Response(
        JSON.stringify({ error: 'Missing symbol or organism' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taxId = getTaxId(organism);
    const sources: string[] = [];

    console.log(`Fetching gene: ${symbol} for organism: ${organism} (taxid: ${taxId})`);

    // Fetch all sources in parallel
    const [ncbiData, uniprotData] = await Promise.all([
      fetchNcbiGene(symbol, taxId),
      fetchUniprot(symbol, taxId),
    ]);

    if (ncbiData.ncbiGeneId) sources.push('NCBI');
    if (uniprotData.uniprotId) sources.push('UniProt');

    // If neither primary source found anything, treat as a true "not found".
    // This prevents the app from rendering an empty-looking GeneDetail page.
    if (!ncbiData.ncbiGeneId && !uniprotData.uniprotId) {
      return new Response(
        JSON.stringify({ error: 'Gene not found' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch structure info (depends on UniProt ID)
    const [alphafoldData, pdbData, stringData] = await Promise.all([
      fetchAlphafold(uniprotData.uniprotId),
      fetchPdb(uniprotData.uniprotId),
      fetchString(symbol, taxId),
    ]);

    if (alphafoldData.alphafoldUrl) sources.push('AlphaFold');
    if (pdbData.pdbIds?.length) sources.push('PDB');
    if (stringData.interactors?.length) sources.push('STRING');

    // Use canonical symbol from UniProt if available (correct casing)
    const displaySymbol = uniprotData.canonicalSymbol || symbol;
    
    // Remove canonicalSymbol from the spread data
    const { canonicalSymbol, ...uniprotRest } = uniprotData;

    // Merge all data
    const summary: GeneSummary = {
      symbol: displaySymbol, // Use correctly-cased symbol
      organism,
      ...ncbiData,
      ...uniprotRest,
      ...alphafoldData,
      ...pdbData,
      ...stringData,
      links: {
        ...ncbiData.links,
        ...uniprotRest.links,
        ...alphafoldData.links,
        ...pdbData.links,
        ...stringData.links,
      },
      sources,
      fetchedAt: new Date().toISOString(),
    };

    console.log(`Found sources: ${sources.join(', ') || 'none'}`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
