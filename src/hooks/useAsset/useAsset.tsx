import { CAIP19 } from '@shapeshiftoss/caip'
import { getMarketData } from '@shapeshiftoss/market-service'
import { Asset, ChainTypes, MarketData } from '@shapeshiftoss/types'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ReduxState } from 'state/reducer'
import { fetchAsset } from 'state/slices/assetsSlice/assetsSlice'

export type AssetMarketData = Asset & MarketData & { description?: string }

export const ALLOWED_CHAINS = {
  [ChainTypes.Ethereum]: true,
  [ChainTypes.Bitcoin]: true
}

export const useGetAssetData = (caip19: CAIP19) => {
  const dispatch = useDispatch()
  const asset = useSelector((state: ReduxState) => state.assets[caip19])

  useEffect(() => {
    // if (ALLOWED_CHAINS[chain]) {
    if (!asset) dispatch(fetchAsset(caip19))
    // }
  }, [asset, caip19, dispatch])

  const fetchMarketData = useCallback(
    async ({ chain, tokenId }: { chain: ChainTypes; tokenId?: string }): Promise<MarketData> => {
      const marketData: MarketData | null = await getMarketData({ chain, tokenId })

      return marketData
    },
    []
  )
  return fetchMarketData
}
