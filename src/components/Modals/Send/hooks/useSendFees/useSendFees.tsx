import { ChainAdapters, NetworkTypes } from '@shapeshiftoss/types'
import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useWallet } from 'context/WalletProvider/WalletProvider'
import { useGetAssetData } from 'hooks/useAsset/useAsset'
import { bnOrZero } from 'lib/bignumber/bignumber'

import { SendFormFields, SendInput } from '../../Form'
import { FeePrice } from '../../views/Confirm'

export const useSendFees = () => {
  const [fees, setFees] = useState<FeePrice | null>(null)
  const { control } = useFormContext<SendInput>()
  const getAssetData = useGetAssetData()
  const asset = useWatch<SendInput, SendFormFields.Asset>({ control, name: SendFormFields.Asset })
  const estimatedFees = useWatch<SendInput, SendFormFields.EstimatedFees>({
    control,
    name: SendFormFields.EstimatedFees
  })
  const {
    state: { wallet }
  } = useWallet()

  useEffect(() => {
    ;(async () => {
      if (!wallet) return
      if (!asset) return
      if (!estimatedFees) return
      const { chain } = asset
      const network = NetworkTypes.MAINNET
      const assetData = await getAssetData({ chain, network })
      const txFees = (Object.keys(estimatedFees) as ChainAdapters.FeeDataKey[]).reduce(
        (acc: FeePrice, key: ChainAdapters.FeeDataKey) => {
          const current = estimatedFees[key]
          const { chainSpecific } = current
          const feePerTx = chainSpecific?.feePerTx
          const fee = bnOrZero(feePerTx).div(`1e+${assetData.precision}`).toFixed(5)
          const amount = bnOrZero(fee).times(bnOrZero(assetData.price)).toFixed(2)
          acc[key] = { ...current, fee, amount }
          return acc
        },
        {} as FeePrice
      )
      setFees(txFees)
    })()
    // We only want this effect to run on mount or when the estimatedFees in state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimatedFees])

  return { fees }
}
