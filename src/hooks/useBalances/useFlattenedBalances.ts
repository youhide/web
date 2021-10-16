import { ChainAdapters, ChainTypes } from '@shapeshiftoss/types'
import { useMemo } from 'react'

import { useBalances } from './useBalances'

type FlattenedTokenBalances = {
  [k: string]: ChainAdapters.Account<ChainTypes>
}

export const flattenTokenBalances = (
  balances: Record<string, ChainAdapters.Account<ChainTypes>>
): FlattenedTokenBalances =>
  Object.keys(balances).reduce(
    (acc: Record<string, ChainAdapters.Account<ChainTypes>>, key: string) => {
      const value = balances[key]
      acc[key] = value
      if (value.chain === ChainTypes.Ethereum) {
        const ethValue = value as ChainAdapters.Account<ChainTypes.Ethereum>
        ;(ethValue.chainSpecific.tokens ?? []).forEach((token: ChainAdapters.Ethereum.Token) => {
          const { pubkey, chain, network, chainSpecific } = ethValue
          const { nonce } = chainSpecific
          const { balance } = token
          const symbol = 'ETH' // TODO(0xdef1cafe): fuck me this is gross
          const baseFields = { balance, pubkey, chain, network, symbol }
          acc[token.contract.toLowerCase()] = { chainSpecific: { ...token, nonce }, ...baseFields }
        })
      }
      return acc
    },
    {}
  )

export const useFlattenedBalances = () => {
  const { balances: walletBalances, error, loading } = useBalances()
  const balances = useMemo(() => flattenTokenBalances(walletBalances), [walletBalances])
  return {
    balances,
    error,
    loading
  }
}
