// Common bacteria for gene research
export const ORGANISMS = [
  { id: 'ecoli', name: 'Escherichia coli', shortName: 'E. coli', code: 'eco' },
  { id: 'bsubtilis', name: 'Bacillus subtilis', shortName: 'B. subtilis', code: 'bsu' },
  { id: 'saureus', name: 'Staphylococcus aureus', shortName: 'S. aureus', code: 'sau' },
  { id: 'paeruginosa', name: 'Pseudomonas aeruginosa', shortName: 'P. aeruginosa', code: 'pae' },
  { id: 'mtb', name: 'Mycobacterium tuberculosis', shortName: 'M. tuberculosis', code: 'mtb' },
  { id: 'spneumoniae', name: 'Streptococcus pneumoniae', shortName: 'S. pneumoniae', code: 'spn' },
  { id: 'kpneumoniae', name: 'Klebsiella pneumoniae', shortName: 'K. pneumoniae', code: 'kpn' },
  { id: 'abaumannii', name: 'Acinetobacter baumannii', shortName: 'A. baumannii', code: 'aba' },
  { id: 'efaecalis', name: 'Enterococcus faecalis', shortName: 'E. faecalis', code: 'efa' },
  { id: 'cdifficile', name: 'Clostridioides difficile', shortName: 'C. difficile', code: 'cdi' },
  { id: 'hpylori', name: 'Helicobacter pylori', shortName: 'H. pylori', code: 'hpy' },
  { id: 'vcholera', name: 'Vibrio cholerae', shortName: 'V. cholerae', code: 'vch' },
  { id: 'styphimurium', name: 'Salmonella typhimurium', shortName: 'S. typhimurium', code: 'sty' },
  { id: 'ngonorrhoeae', name: 'Neisseria gonorrhoeae', shortName: 'N. gonorrhoeae', code: 'ngo' },
  { id: 'lpneumophila', name: 'Legionella pneumophila', shortName: 'L. pneumophila', code: 'lpn' },
] as const;

export type OrganismId = typeof ORGANISMS[number]['id'];

export function getOrganismById(id: string) {
  return ORGANISMS.find(o => o.id === id);
}

export function getOrganismByName(name: string) {
  const lower = name.toLowerCase();
  return ORGANISMS.find(o => 
    o.name.toLowerCase() === lower || 
    o.shortName.toLowerCase() === lower
  );
}

/**
 * Get organism code from full name (for tag naming)
 * E.g., "Escherichia coli" -> "eco"
 */
export function getOrganismCode(name: string): string {
  const organism = getOrganismByName(name);
  return organism?.code ?? name.slice(0, 3).toLowerCase();
}
