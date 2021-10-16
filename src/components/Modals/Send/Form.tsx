import { Asset, ChainAdapters, ChainTypes, NetworkTypes } from '@shapeshiftoss/types'
import { AnimatePresence } from 'framer-motion'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  useHistory,
  useLocation
} from 'react-router-dom'
import { AssetMarketData, useGetAssetData } from 'hooks/useAsset/useAsset'

import { SelectAssets } from '../../SelectAssets/SelectAssets'
import { useFormSend } from './hooks/useFormSend/useFormSend'
import { SendRoutes } from './Send'
import { Address } from './views/Address'
import { Confirm } from './views/Confirm'
import { Details } from './views/Details'
import { QrCodeScanner } from './views/QrCodeScanner'

export enum SendFormFields {
  Address = 'address',
  Asset = 'asset',
  FeeType = 'feeType',
  EstimatedFees = 'estimatedFees',
  CryptoAmount = 'cryptoAmount',
  CryptoSymbol = 'cryptoSymbol',
  FiatAmount = 'fiatAmount',
  FiatSymbol = 'fiatSymbol'
  // Transaction = 'transaction'
}

export type SendInput<T extends ChainTypes = ChainTypes> = {
  [SendFormFields.Address]: string
  [SendFormFields.Asset]: AssetMarketData
  [SendFormFields.FeeType]: ChainAdapters.FeeDataKey
  [SendFormFields.EstimatedFees]: ChainAdapters.FeeDataEstimate<T>
  [SendFormFields.CryptoAmount]: string
  [SendFormFields.CryptoSymbol]: string
  [SendFormFields.FiatAmount]: string
  [SendFormFields.FiatSymbol]: string
  // [SendFormFields.Transaction]: ChainAdapters.ChainTxType<T>
}

type SendFormProps = {
  asset: AssetMarketData
}

export const Form = ({ asset: initalAsset }: SendFormProps) => {
  const location = useLocation()
  const history = useHistory()
  const { handleSend } = useFormSend()
  const getAssetData = useGetAssetData()

  const methods = useForm<SendInput>({
    mode: 'onChange',
    defaultValues: {
      address: '',
      asset: initalAsset,
      feeType: ChainAdapters.FeeDataKey.Average,
      cryptoAmount: '',
      cryptoSymbol: initalAsset?.symbol,
      fiatAmount: '',
      fiatSymbol: 'USD' // TODO: localize currency
    }
  })

  const { handleSubmit, setValue } = methods

  const handleAssetSelect = async (asset: Asset) => {
    const assetMarketData = await getAssetData({
      chain: asset.chain,
      network: NetworkTypes.MAINNET,
      tokenId: asset.tokenId
    })

    setValue(SendFormFields.Asset, assetMarketData)
    setValue(SendFormFields.CryptoSymbol, asset.symbol)
    setValue(SendFormFields.CryptoAmount, '')
    setValue(SendFormFields.FiatSymbol, 'USD')
    setValue(SendFormFields.FiatAmount, '')

    history.push(SendRoutes.Address)
  }

  const checkKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter') event.preventDefault()
  }

  return (
    <FormProvider {...methods}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form onSubmit={handleSubmit(handleSend)} onKeyDown={checkKeyDown}>
        <AnimatePresence exitBeforeEnter initial={false}>
          <Switch location={location} key={location.key}>
            <Route
              path={SendRoutes.Select}
              component={(props: RouteComponentProps) => (
                <SelectAssets onClick={handleAssetSelect} {...props} />
              )}
            />
            <Route path={SendRoutes.Address} component={Address} />
            <Route path={SendRoutes.Details} component={Details} />
            <Route path={SendRoutes.Scan} component={QrCodeScanner} />
            <Route path={SendRoutes.Confirm} component={Confirm} />
            <Redirect exact from='/' to={SendRoutes.Select} />
          </Switch>
        </AnimatePresence>
      </form>
    </FormProvider>
  )
}
