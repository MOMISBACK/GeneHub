// Common bacteria for gene research
export const ORGANISMS = [
  { id: 'ecoli', name: 'Escherichia coli', shortName: 'E. coli' },
  { id: 'bsubtilis', name: 'Bacillus subtilis', shortName: 'B. subtilis' },
  { id: 'saureus', name: 'Staphylococcus aureus', shortName: 'S. aureus' },
  { id: 'paeruginosa', name: 'Pseudomonas aeruginosa', shortName: 'P. aeruginosa' },
  { id: 'mtb', name: 'Mycobacterium tuberculosis', shortName: 'M. tuberculosis' },
  { id: 'spneumoniae', name: 'Streptococcus pneumoniae', shortName: 'S. pneumoniae' },
  { id: 'kpneumoniae', name: 'Klebsiella pneumoniae', shortName: 'K. pneumoniae' },
  { id: 'abaumannii', name: 'Acinetobacter baumannii', shortName: 'A. baumannii' },
  { id: 'efaecalis', name: 'Enterococcus faecalis', shortName: 'E. faecalis' },
  { id: 'cdifficile', name: 'Clostridioides difficile', shortName: 'C. difficile' },
  { id: 'hpylori', name: 'Helicobacter pylori', shortName: 'H. pylori' },
  { id: 'vcholera', name: 'Vibrio cholerae', shortName: 'V. cholerae' },
  { id: 'styphimurium', name: 'Salmonella typhimurium', shortName: 'S. typhimurium' },
  { id: 'ngonorrhoeae', name: 'Neisseria gonorrhoeae', shortName: 'N. gonorrhoeae' },
  { id: 'lpneumophila', name: 'Legionella pneumophila', shortName: 'L. pneumophila' },
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
