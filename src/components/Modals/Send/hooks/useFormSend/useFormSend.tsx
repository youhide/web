import { useToast } from '@chakra-ui/react'
import { ChainAdapter } from '@shapeshiftoss/chain-adapters'
import { ChainTypes } from '@shapeshiftoss/types'
import { useTranslate } from 'react-polyglot'
import { useChainAdapters } from 'context/ChainAdaptersProvider/ChainAdaptersProvider'
import { useModal } from 'context/ModalProvider/ModalProvider'
import { useWallet } from 'context/WalletProvider/WalletProvider'
import { bnOrZero } from 'lib/bignumber/bignumber'

import { SendInput } from '../../Form'

export const useFormSend = () => {
  const toast = useToast()
  const translate = useTranslate()
  const chainAdapter = useChainAdapters()
  const { send } = useModal()
  const {
    state: { wallet }
  } = useWallet()

  const handleSend = async (data: SendInput) => {
    if (!wallet) return
    try {
      const adapter = chainAdapter.byChain(data.asset.chain)
      const value = bnOrZero(data.cryptoAmount)
        .times(bnOrZero(10).exponentiatedBy(data.asset.precision))
        .toFixed(0)

      const { estimatedFees, feeType } = data
      const { feePerUnit } = estimatedFees[feeType]

      let txToSign
      switch (data.asset.chain) {
        case ChainTypes.Ethereum: {
          const ethAdapter = adapter as ChainAdapter<ChainTypes.Ethereum>
          const txToSend = await ethAdapter.buildSendTransaction({
            to: data.address,
            value,
            erc20ContractAddress: data.asset.tokenId,
            wallet,
            fee: feePerUnit,
            gasLimit: estimatedFees[feeType].chainSpecific?.feeLimit
          })
          txToSign = txToSend.txToSign
          break
        }
        case ChainTypes.Bitcoin: {
          const btcAdapter = adapter as ChainAdapter<ChainTypes.Bitcoin>
          const txToSend = await btcAdapter.buildSendTransaction({
            to: data.address,
            value,
            wallet,
            fee: feePerUnit
          })
          txToSign = txToSend.txToSign
          break
        }
        default: {
          throw new Error(`useFormSend: unsupported chain ${data.asset.chain}`)
        }
      }

      const signedTx = await adapter.signTransaction({ txToSign, wallet })

      await adapter.broadcastTransaction(signedTx)

      toast({
        title: translate('modals.send.sent', { asset: data.asset.name }),
        description: translate('modals.send.youHaveSent', {
          amount: data.cryptoAmount,
          symbol: data.cryptoSymbol
        }),
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-right'
      })
    } catch (error) {
      toast({
        title: translate('modals.send.sent'),
        description: translate('modals.send.somethingWentWrong'),
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-right'
      })
    } finally {
      send.close()
    }
  }
  return {
    handleSend
  }
}
