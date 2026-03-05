import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Edge Cache for 60s

const EVM_CONFIG: Record<string, { id: string, name: string, estGas: number }> = {
  eth: { id: 'eth', name: 'Ethereum', estGas: 15.0 },
  bsc: { id: 'bsc', name: 'BSC', estGas: 0.3 },
  arbitrum: { id: 'arbitrum', name: 'Arbitrum', estGas: 0.1 },
  polygon_pos: { id: 'polygon_pos', name: 'Polygon', estGas: 0.05 },
  base: { id: 'base', name: 'Base', estGas: 0.01 },
  optimism: { id: 'optimism', name: 'Optimism', estGas: 0.05 },
  avax: { id: 'avax', name: 'Avalanche', estGas: 0.2 }
};

export async function GET() {
  try {
    const fetchPools = Object.keys(EVM_CONFIG).map(async (chain) => {
      const res = await fetch(https://api.geckoterminal.com/api/v2/networks/${chain}/trending_pools?include=base_token,dex, {
        headers: { 'Accept': 'application/json;version=20230203' },
        next: { revalidate: 60 }
      });
      const json = await res.json();
      return json.data || [];
    });

    const allPools = (await Promise.all(fetchPools)).flat();
    const groups: Record<string, any[]> = {};

    allPools.forEach(pool => {
      const symbol = pool.attributes.symbol.split(' / ')[0];
      if (parseFloat(pool.attributes.reserve_in_usd) < 1000) return;
      if (!groups[symbol]) groups[symbol] = [];
      groups[symbol].push(pool);
    });

    const ranked = Object.keys(groups).map(symbol => {
      const pools = groups[symbol].sort((a, b) => parseFloat(a.attributes.token_price_usd) - parseFloat(b.attributes.token_price_usd));
      if (pools.length < 2) return null;

      const low = pools[0];
      const high = pools[pools.length - 1];
      const spread = ((parseFloat(high.attributes.token_price_usd) - parseFloat(low.attributes.token_price_usd)) / parseFloat(low.attributes.token_price_usd)) * 100;

      return {
        symbol,
        tokenAddress: low.relationships.base_token.data.id.split('_')[1],
        spread: parseFloat(spread.toFixed(2)),
        liquidity: parseFloat(high.attributes.reserve_in_usd),
        totalGasEst: EVM_CONFIG[low.relationships.network.data.id].estGas + EVM_CONFIG[high.relationships.network.data.id].estGas,
        buy: { 
          dex: low.relationships.dex.data.id.toUpperCase().replace('_', ' '), 
          price: parseFloat(low.attributes.token_price_usd), 
          chain: EVM_CONFIG[low.relationships.network.data.id].name,
          link: https://www.geckoterminal.com/${low.relationships.network.data.id}/pools/${low.attributes.address}
        },
        sell: { 
          dex: high.relationships.dex.data.id.toUpperCase().replace('_', ' '), 
          price: parseFloat(high.attributes.token_price_usd), 
          chain: EVM_CONFIG[high.relationships.network.data.id].name 
        }
      };
    }).filter(Boolean).sort((a: any, b: any) => b.spread - a.spread);

    return NextResponse.json({ ranked, gas: EVM_CONFIG });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
