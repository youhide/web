import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CAIP19, caip19 } from '@shapeshiftoss/caip'
import { Asset, NetworkTypes } from '@shapeshiftoss/types'
import { getAssetService } from 'lib/assetService'
import { ReduxState } from 'state/reducer'

export type FullAsset = Asset & { description?: string }
export type AssetsState = { [key: string]: Asset & { description?: string } }

export const fetchAsset = createAsyncThunk('asset/fetchAsset', async (assetCAIP19: CAIP19) => {
  try {
    const service = await getAssetService()
    const { chain, network, tokenId } = caip19.fromCAIP19(assetCAIP19)
    const asset = service?.byTokenId({ chain, network, tokenId })
    if (!asset) return {}
    const description = await service?.description({ asset })
    const { caip19: key } = asset
    if (!description) return { [key]: asset }
    return { [key]: { ...asset, description } }
  } catch (error) {
    console.error(error)
    return {}
  }
})

export const fetchAssets = createAsyncThunk('asset/fetchAssets', async (_, thunkApi) => {
  try {
    const service = await getAssetService()
    const network = NetworkTypes.MAINNET
    const assets = service?.byNetwork(network)
    const assetsObj = {} as AssetsState
    const state = thunkApi.getState() as ReduxState

    assets.forEach((asset: Asset) => {
      const { caip19: key } = asset
      assetsObj[key] = { ...(state?.assets[key] ? state?.assets[key] : {}), ...asset }
    })
    return assetsObj
  } catch (error) {
    console.error(error)
    return {}
  }
})

const initialState = {} as AssetsState

export const assets = createSlice({
  name: 'asset',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAsset.fulfilled, (state, { payload }) => {
        if (!payload.arg) return
        const { caip19: key } = payload.arg
        if (payload[key]) {
          state[key] = payload[key]
        }
      })
      .addCase(fetchAssets.fulfilled, (state, { payload }) => {
        Object.keys(payload).forEach(key => {
          state[key] = payload[key]
        })
      })
  }
})
