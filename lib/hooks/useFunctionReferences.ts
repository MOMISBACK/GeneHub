/**
 * useFunctionReferences - Hook for loading PubMed citations
 * 
 * Handles fetching citation metadata (authors, year) from PubMed API
 * for references found in function text.
 */

import { useState, useEffect } from 'react';

type Reference = { index: number; pubmedId: string };

export type UseFunctionReferencesResult = {
  refCitations: Record<string, string>;
  loadingRefs: boolean;
};

export function useFunctionReferences(
  functionReferences: Reference[]
): UseFunctionReferencesResult {
  const [refCitations, setRefCitations] = useState<Record<string, string>>({});
  const [loadingRefs, setLoadingRefs] = useState(false);

  useEffect(() => {
    if (functionReferences.length === 0) {
      setRefCitations({});
      return;
    }

    let cancelled = false;
    
    const fetchCitations = async () => {
      setLoadingRefs(true);
      const ids = functionReferences.map(r => r.pubmedId).join(',');

      try {
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
        const res = await fetch(url);
        if (!res.ok) return;
        const payload = await res.json();

        const citations: Record<string, string> = {};
        for (const ref of functionReferences) {
          const article = payload.result?.[ref.pubmedId];
          if (!article) continue;

          const authors = article.authors;
          const year = article.pubdate?.split(' ')?.[0] || article.epubdate?.split(' ')?.[0];
          
          if (authors && authors.length > 0) {
            const firstAuthor = authors[0]?.name?.split(' ')?.[0] || authors[0]?.name;
            citations[ref.pubmedId] = authors.length > 1 
              ? `${firstAuthor} et al., ${year || '?'}` 
              : `${firstAuthor}, ${year || '?'}`;
          } else {
            citations[ref.pubmedId] = `PMID:${ref.pubmedId}`;
          }
        }

        if (!cancelled) setRefCitations(citations);
      } catch {
        // Ignore citation fetch failures; fall back to PMID display.
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    };

    fetchCitations();
    
    return () => {
      cancelled = true;
    };
  }, [functionReferences]);

  return { refCitations, loadingRefs };
}
