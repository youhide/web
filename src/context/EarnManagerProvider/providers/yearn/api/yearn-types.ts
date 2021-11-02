import { HDWallet } from '@shapeshiftoss/hdwallet-core'
import { BIP32Params } from '@shapeshiftoss/types'
import { BigNumber } from 'bignumber.js'

export type Allowanceinput = {
  spenderAddress: string
  tokenContractAddress: string
  userAddress: string
}

export type ApproveTxInput = {
  bip32Params: BIP32Params
  dryRun?: boolean
  spenderAddress: string
  tokenContractAddress: string
  userAddress: string
  vaultAddress: string
  wallet: HDWallet
}

export type ApproveTxEstimatedGasInput = Pick<
  ApproveTxInput,
  'spenderAddress' | 'userAddress' | 'tokenContractAddress'
>

export type VaultTxInput = {
  bip32Params: BIP32Params
  dryRun?: boolean
  tokenContractAddress: string
  userAddress: string
  vaultAddress: string
  wallet: HDWallet
  amountDesired: BigNumber
}

export type VaultTxEstimatedGasInput = Pick<
  VaultTxInput,
  'amountDesired' | 'userAddress' | 'vaultAddress'
>

export type BalanceInput = Pick<VaultTxInput, 'userAddress' | 'vaultAddress'>

export type APYInput = {
  vaultAddress: string
}
