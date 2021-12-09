import { CAIP19 } from '@shapeshiftoss/caip'
import { MarketData } from '@shapeshiftoss/types'
import { bnOrZero } from 'lib/bignumber/bignumber'
import { AssetsState } from 'state/slices/assetsSlice/assetsSlice'

type SortByFiatInput = {
  balances: Record<CAIP19, string>
  assets: AssetsState['byId']
  marketData: Record<string, MarketData>
}

export const sortByFiat =
  ({ balances, assets, marketData }: SortByFiatInput) =>
  (a: string, b: string) => {
    const balanceA = assets[a]
      ? bnOrZero(balances[a]).div(`1e+${assets[a].precision}`)
      : bnOrZero(0)
    const balanceB = assets[b]
      ? bnOrZero(balances[b]).div(`1e+${assets[b].precision}`)
      : bnOrZero(0)
    const fiatValueA = balanceA.times(bnOrZero(marketData[a]?.price)).toNumber()
    const fiatValueB = balanceB.times(bnOrZero(marketData[b]?.price)).toNumber()
    return bnOrZero(fiatValueA).gt(bnOrZero(fiatValueB)) ? -1 : 1
  }
