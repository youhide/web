import { useToast } from '@chakra-ui/react'
import { ChainAdapters, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import get from 'lodash/get'
import { useEffect, useState } from 'react'
import { useWatch } from 'react-hook-form'
import { useTranslate } from 'react-polyglot'
import { useHistory } from 'react-router-dom'
import { useChainAdapters } from 'context/ChainAdaptersProvider/ChainAdaptersProvider'
import { useWallet } from 'context/WalletProvider/WalletProvider'
import { useGetAssetData } from 'hooks/useAsset/useAsset'
import { useFlattenedBalances } from 'hooks/useBalances/useFlattenedBalances'
import { bnOrZero } from 'lib/bignumber/bignumber'
import { useFormContext } from 'lib/formUtils'

import { SendFormFields, SendInput } from '../../Form'
import { SendRoutes } from '../../Send'
import { useAccountBalances } from '../useAccountBalances/useAccountBalances'

type AmountFieldName = SendFormFields.FiatAmount | SendFormFields.CryptoAmount

type UseSendDetailsReturnType = {
  amountFieldError: string
  balancesLoading: boolean
  fieldName: AmountFieldName
  handleInputChange(inputValue: string): void
  handleNextClick(): Promise<void>
  handleSendMax(): Promise<void>
  loading: boolean
  toggleCurrency(): void
  validateCryptoAmount(value: string): boolean | string
  validateFiatAmount(value: string): boolean | string
}

export const useSendDetails = (): UseSendDetailsReturnType => {
  const [fieldName, setFieldName] = useState<AmountFieldName>(SendFormFields.FiatAmount)
  const [loading, setLoading] = useState<boolean>(false)
  const history = useHistory()
  const toast = useToast()
  const translate = useTranslate()
  const asset = useWatch({ name: SendFormFields.Asset }) as SendInput[SendFormFields.Asset]
  const {
    clearErrors,
    getValues,
    setValue,
    setError,
    formState: { errors }
  } = useFormContext<SendInput>()
  const address = useWatch({ name: SendFormFields.Address }) as SendInput[SendFormFields.Address]
  const { balances, error: balanceError, loading: balancesLoading } = useFlattenedBalances()
  const { assetBalance, accountBalances } = useAccountBalances({ asset, balances })
  const chainAdapter = useChainAdapters()
  const {
    state: { wallet }
  } = useWallet()

  const getAssetData = useGetAssetData()

  useEffect(() => {
    if (balanceError) {
      toast({
        status: 'error',
        description: translate(`modals.send.getBalanceError`),
        duration: 4000,
        isClosable: true,
        position: 'top-right'
      })
      history.push(SendRoutes.Address)
    }
  }, [balanceError, toast, history, translate])

  const adapter = chainAdapter.byChain(asset.chain)

  const buildTransaction = async (): Promise<{
    txToSign: ChainAdapters.ChainTxType<ChainTypes>
    estimatedFees: ChainAdapters.FeeDataEstimate<ChainTypes>
  }> => {
    if (!wallet) throw new Error('No wallet connected')

    const values = getValues()
    const value = bnOrZero(values.cryptoAmount)
      .times(bnOrZero(10).exponentiatedBy(values.asset.precision))
      .toFixed(0)

    return adapter.buildSendTransaction({
      to: values.address,
      value,
      erc20ContractAddress: values.asset.tokenId,
      wallet
    })
  }

  const handleNextClick = async () => {
    try {
      setLoading(true)
      const { txToSign, estimatedFees } = await buildTransaction()
      setValue(SendFormFields.Transaction, txToSign)
      setValue(SendFormFields.EstimatedFees, estimatedFees)
      history.push(SendRoutes.Confirm)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(true)
    }
  }

  const handleSendMax = async () => {
    if (assetBalance && wallet) {
      setLoading(true)
      const fromAddress = await adapter.getAddress({ wallet })
      const adapterFees = await adapter.getFeeData({
        to: address,
        from: fromAddress,
        value: asset.tokenId ? '0' : assetBalance.balance,
        contractAddress: asset.tokenId
      })
      // Assume fast fee for send max
      const fastFee = adapterFees[ChainAdapters.FeeDataKey.Fast]
      const chainAsset = await getAssetData({
        chain: asset.chain,
        network: NetworkTypes.MAINNET, // TODO(0xdef1cafe): get this from user prefs/unchained
        tokenId: asset.tokenId
      })
      let networkFee
      switch (asset.chain) {
        case ChainTypes.Ethereum: {
          const ethFee = fastFee as ChainAdapters.FeeData<ChainTypes.Ethereum>
          networkFee = bnOrZero(fastFee?.feePerUnit)
            .times(ethFee.chainSpecific.feeLimit)
            .div(`1e${chainAsset.precision}`)
          break
        }
        default: {
          throw new Error(`useSendDetails(handleSendMax): unsupported chain ${asset.chain}`)
        }
      }

      if (asset.tokenId) {
        setValue(SendFormFields.CryptoAmount, accountBalances.crypto.toPrecision())
        setValue(SendFormFields.FiatAmount, accountBalances.fiat.toFixed(2))
      } else {
        const maxCrypto = accountBalances.crypto.minus(networkFee)
        const maxFiat = maxCrypto.times(chainAsset?.price || 0)
        setValue(SendFormFields.CryptoAmount, maxCrypto.toPrecision())
        setValue(SendFormFields.FiatAmount, maxFiat.toFixed(2))
      }
      setLoading(false)
    }
  }

  const handleInputChange = (inputValue: string) => {
    const key =
      fieldName !== SendFormFields.FiatAmount
        ? SendFormFields.FiatAmount
        : SendFormFields.CryptoAmount
    const assetPrice = asset.price
    const amount =
      fieldName === SendFormFields.FiatAmount
        ? bnOrZero(inputValue).div(assetPrice).toString()
        : bnOrZero(inputValue).times(assetPrice).toString()
    setValue(key, amount)
  }

  const validateCryptoAmount = (value: string) => {
    const hasValidBalance = accountBalances.crypto.gte(value)
    return hasValidBalance || 'common.insufficientFunds'
  }

  const validateFiatAmount = (value: string) => {
    const hasValidBalance = accountBalances.fiat.gte(value)
    return hasValidBalance || 'common.insufficientFunds'
  }

  const cryptoError = get(errors, 'cryptoAmount.message', null)
  const fiatError = get(errors, 'fiatAmount.message', null)
  const amountFieldError = cryptoError || fiatError

  const toggleCurrency = () => {
    if (amountFieldError) {
      // Toggles an existing error to the other field if present
      const clearErrorKey = fiatError ? SendFormFields.FiatAmount : SendFormFields.CryptoAmount
      const setErrorKey = fiatError ? SendFormFields.CryptoAmount : SendFormFields.FiatAmount
      clearErrors(clearErrorKey)
      setError(setErrorKey, { message: 'common.insufficientFunds' })
    }
    setFieldName(
      fieldName === SendFormFields.FiatAmount
        ? SendFormFields.CryptoAmount
        : SendFormFields.FiatAmount
    )
  }

  return {
    amountFieldError,
    balancesLoading,
    fieldName,
    handleInputChange,
    handleNextClick,
    handleSendMax,
    loading,
    toggleCurrency,
    validateCryptoAmount,
    validateFiatAmount
  }
}
