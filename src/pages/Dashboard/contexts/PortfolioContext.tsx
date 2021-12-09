import React, { useContext } from 'react'
import { useSelector } from 'react-redux'
import { flattenTokenBalances, useFlattenedBalances } from 'hooks/useBalances/useFlattenedBalances'
import { usePubkeys } from 'hooks/usePubkeys/usePubkeys'
import {
  selectTotalFiatBalance,
  useGetAccountsQuery
} from 'state/slices/portfolioSlice/portfolioSlice'

type PortfolioContextProps = {
  totalBalance: number // TODO(0xdef1cafe): rename this totalFiatBalance
  loading: boolean
  balances: ReturnType<typeof flattenTokenBalances>
}

const PortfolioContext = React.createContext<PortfolioContextProps | null>(null)

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const { balances, loading } = useFlattenedBalances()
  const totalBalance = useSelector(selectTotalFiatBalance)

  // usePubkeys will change when the wallet changes
  const pubkeys = usePubkeys()
  // useGetAccountQuery manages fetching and caching accounts and balances
  useGetAccountsQuery(pubkeys)

  return (
    <PortfolioContext.Provider value={{ totalBalance, loading, balances }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => {
  const context = useContext(PortfolioContext)
  if (!context) throw new Error("usePortfolio can't be used outside of a PortfolioProvider")
  return context
}
