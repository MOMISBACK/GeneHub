/**
 * gene-biocyc Edge Function
 * 
 * Fetches BioCyc data for a gene including:
 * - Pathways
 * - Regulation (regulators and regulated genes)
 * - Transcription units / operons
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getBiocycGeneData,
  isBiocycSupported,
  getBiocycUrl,
  BiocycGeneData,
} from '../_shared/biocyc.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiocycRequest {
  gene: string;
  organism: string;
}

interface BiocycResponse {
  success: boolean;
  data?: BiocycGeneData & {
    links: {
      biocyc?: string;
    };
  };
  error?: string;
  supported: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { gene, organism }: BiocycRequest = await req.json();
    console.log(`[gene-biocyc] Request: gene=${gene}, organism=${organism}`);

    if (!gene || !organism) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: gene, organism',
          supported: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if organism is supported by BioCyc
    if (!isBiocycSupported(organism)) {
      console.log(`[gene-biocyc] Organism not supported: ${organism}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Organism "${organism}" is not supported by BioCyc`,
          supported: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[gene-biocyc] Fetching BioCyc data for ${gene}...`);
    
    // Fetch directly without cache for now
    const data = await getBiocycGeneData(gene, organism, supabase);
    console.log(`[gene-biocyc] Result:`, data ? 'Found' : 'Not found');

    if (!data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gene "${gene}" not found in BioCyc for ${organism}`,
          supported: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build response with links
    const response: BiocycResponse = {
      success: true,
      data: {
        ...data,
        links: {
          biocyc: getBiocycUrl(data.biocycId, organism),
        },
      },
      supported: true,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[gene-biocyc] Error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        supported: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
