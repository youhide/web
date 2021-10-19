import { getMarketData } from '@shapeshiftoss/market-service'
import { Asset, ChainTypes, MarketData, NetworkTypes } from '@shapeshiftoss/types'
import { useCallback } from 'react'

import { useAssets } from '../../context/AssetProvider/AssetProvider'

export type AssetMarketData = Asset & MarketData & { description: string }

type UseGetAssetDataParams = {
  chain: ChainTypes
  network: NetworkTypes
  tokenId?: string
}

export type UseGetAssetDataReturn = MarketData &
  Asset & {
    description: string
  }

type UseGetAssetData = () => (params: UseGetAssetDataParams) => Promise<UseGetAssetDataReturn>

export const useGetAssetData: UseGetAssetData = () => {
  const assetService = useAssets()

  return useCallback(
    async ({ chain, network, tokenId }: UseGetAssetDataParams) => {
      const marketData = await getMarketData({ chain, tokenId })
      const assetData: Asset = assetService.byTokenId({ chain, network, tokenId })
      const description = await assetService.description(chain, tokenId)

      return {
        ...marketData,
        ...assetData,
        description
      }
    },
    [assetService]
  )
}
