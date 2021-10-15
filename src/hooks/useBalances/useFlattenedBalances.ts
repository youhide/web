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
          acc[token.contract.toLowerCase()] = token
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
