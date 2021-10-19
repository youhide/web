import { Asset, ChainTypes, ContractTypes, NetworkTypes } from '@shapeshiftoss/types'
import { act, renderHook } from '@testing-library/react-hooks'
import { useGetAssetData, UseGetAssetDataReturn } from 'hooks/useAsset/useAsset'
import { TestProviders } from 'jest/TestProviders'

import { useAccountBalances } from './useAccountBalances'

jest.mock('context/WalletProvider/WalletProvider')
jest.mock('hooks/useAsset/useAsset')

const mockBalances: UseGetAssetDataReturn = {
  [ChainTypes.Ethereum]: {
    chain: ChainTypes.Ethereum,
    network: NetworkTypes.MAINNET,
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    balance: '50000000000000000',
    tokens: [
      {
        type: 'ERC20',
        name: 'THORChain ETH.RUNE',
        contract: '0x3155BA85D5F96b2d030a4966AF206230e46849cb',
        transfers: 10,
        symbol: 'RUNE',
        decimals: 18,
        balance: '21000000000000000000'
      }
    ]
  },
  '0x3155ba85d5f96b2d030a4966af206230e46849cb': {
    type: 'ERC20',
    name: 'THORChain ETH.RUNE',
    contract: '0x3155BA85D5F96b2d030a4966AF206230e46849cb',
    transfers: 10,
    symbol: 'RUNE',
    decimals: 18,
    balance: '21000000000000000000'
  }
}

const mockEth: Asset = {
  chain: ChainTypes.Ethereum,
  network: NetworkTypes.MAINNET,
  symbol: 'ETH',
  name: 'Ethereum',
  precision: 18,
  slip44: 60,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coincap.io/assets/icons/eth@2x.png',
  explorer: 'https://etherscan.io',
  explorerTxLink: 'https://etherscan.io/tx/',
  sendSupport: true,
  receiveSupport: true
}

const mockRuneErc20: Asset = {
  chain: ChainTypes.Ethereum,
  network: NetworkTypes.MAINNET,
  slip44: 60,
  name: 'THORChain  ERC20 ',
  precision: 18,
  tokenId: '0x3155ba85d5f96b2d030a4966af206230e46849cb',
  contractType: ContractTypes.ERC20,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coingecko.com/coins/images/13677/thumb/IMG_20210123_132049_458.png?1612179252',
  explorer: 'https://etherscan.io',
  explorerTxLink: 'https://etherscan.io/tx/',
  sendSupport: true,
  receiveSupport: true,
  symbol: 'RUNE'
}

const fooBarErc20: Asset = {
  chain: ChainTypes.Ethereum,
  network: NetworkTypes.MAINNET,
  slip44: 60,
  name: 'THORChain  ERC20 ',
  precision: 18,
  tokenId: '0xfoobar',
  contractType: ContractTypes.ERC20,
  color: '#FFFFFF',
  secondaryColor: '#FFFFFF',
  icon: 'https://assets.coingecko.com/coins/images/13677/thumb/IMG_20210123_132049_458.png?1612179252',
  explorer: 'https://etherscan.io',
  explorerTxLink: 'https://etherscan.io/tx/',
  sendSupport: true,
  receiveSupport: true,
  symbol: 'RUNE'
}

const getAssetData = () => Promise.resolve(mockEth)

const setup = ({ asset = {} as Asset, balances = {} }: { asset: Asset; balances: any }) => {
  ;(useGetAssetData as jest.Mock<unknown>).mockImplementation(() => getAssetData)
  const wrapper: React.FC = ({ children }) => {
    return <TestProviders>{children}</TestProviders>
  }
  return renderHook(() => useAccountBalances({ asset, balances }), { wrapper })
}

describe.skip('useAccountBalances', () => {
  it('should return assetBalance and accountBalances for chain asset', async () => {
    await act(async () => {
      const hook = setup({
        asset: mockEth,
        balances: mockBalances
      })
      const { waitForNextUpdate, result } = hook
      await waitForNextUpdate()

      expect(result.current.assetBalance).toEqual(mockBalances.ethereum)

      const expectedCrypto = '0.05'
      const crypto = result.current.accountBalances.crypto.toString()
      expect(crypto).toBe(expectedCrypto)

      const expectedFiat = '175.00'
      const fiat = result.current.accountBalances.fiat.toFixed(2)
      expect(fiat).toBe(expectedFiat)
    })
  })

  it('should return assetBalance and accountBalances for erc20', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = setup({
        asset: mockRuneErc20 as unknown as Asset,
        balances: mockBalances
      })
      expect(result.current.assetBalance).toEqual(
        mockBalances['0x3155ba85d5f96b2d030a4966af206230e46849cb']
      )

      await waitForNextUpdate()

      const expectedCrypto = '21'
      const crypto = result.current.accountBalances.crypto.toString()
      expect(crypto).toBe(expectedCrypto)

      const expectedFiat = '73500.00'
      const fiat = result.current.accountBalances.fiat.toFixed(2)
      expect(fiat).toBe(expectedFiat)
    })
  })

  it('returns zeros for asset that is not available', async () => {
    await act(async () => {
      const { result, waitForNextUpdate } = setup({
        asset: fooBarErc20 as unknown as Asset,
        balances: mockBalances
      })
      expect(result.current.assetBalance).toBe(undefined)

      await waitForNextUpdate()

      const expectedCrypto = '0'
      const crypto = result.current.accountBalances.crypto.toString()
      expect(crypto).toBe(expectedCrypto)

      const expectedFiat = '0.00'
      const fiat = result.current.accountBalances.fiat.toFixed(2)
      expect(fiat).toBe(expectedFiat)
    })
  })
})
