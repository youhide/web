import { Asset, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { useEffect, useMemo, useState } from 'react'
import { AssetMarketData, useGetAssetData } from 'hooks/useAsset/useAsset'
import { BalanceByChain } from 'hooks/useBalances/useBalances'
import { bnOrZero } from 'lib/bignumber/bignumber'

type UseAccountBalancesProps = {
  asset: Asset
  balances: Partial<BalanceByChain>
}

export const useAccountBalances = ({ asset, balances }: UseAccountBalancesProps) => {
  const [assetData, setAssetData] = useState<AssetMarketData>()
  const getAssetData = useGetAssetData()
  const { chain, tokenId } = asset

  let assetBalance = ''

  switch (chain) {
    case ChainTypes.Ethereum: {
      const ethBalance = balances[ChainTypes.Ethereum]?.chainSpecific
      if (!ethBalance) break
      const { tokens } = ethBalance
      if (!tokens || !tokens.length) break
      const token = tokens.find(({ contract }) => contract.toLowerCase() === tokenId)
      if (!token) break
      const { balance } = token
      if (!balance) break
      assetBalance = balance
      break
    }
    case ChainTypes.Bitcoin: {
      assetBalance = balances[ChainTypes.Bitcoin]?.balance ?? ''
      break
    }
    default: {
      throw new Error(`useAccountBalances: unsupported chain ${asset.chain}`)
    }
  }

  useEffect(() => {
    ;(async () => {
      const network = NetworkTypes.MAINNET
      const data = await getAssetData({ chain, network, tokenId })
      setAssetData(data)
    })()
  }, [chain, tokenId]) // eslint-disable-line react-hooks/exhaustive-deps

  const accountBalances = useMemo(() => {
    const crypto = bnOrZero(assetBalance).div(`1e${asset.precision}`)
    const fiat = crypto.times(assetData?.price || 0)
    return { crypto, fiat }
  }, [assetBalance, assetData, asset])

  return { assetBalance, accountBalances }
}
