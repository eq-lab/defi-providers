import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import {
  GetTvlRequest,
  GetTvlReply,
  GetPoolAndTokenVolumesRequest,
  GetPoolAndTokenVolumesReply,
  PoolVolume,
  TokenVolume,
  GetTokenDetailsRequest,
  GetTokenDetailsReply,
} from '../generated/dappradar-proto/defi-providers';
import { RpcException } from '@nestjs/microservices';

interface IProvider {
  tvl: ({ block, chain, provider, date }) => GetTvlReply;
  getPoolVolumes: ({ block, chain, provider, pools }) => {
    [key: string]: PoolVolume;
  };
  getTokenVolumes: ({ block, chain, provider, tokens }) => {
    [key: string]: TokenVolume;
  };
}

@Injectable()
export class FactoryService {
  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }

    const providerService: IProvider = await import(
      this.getProviderServicePath(req.chain, req.provider)
    );

    const tvlData = await providerService.tvl({
      chain: req?.chain,
      provider: req?.provider,
      block: parseInt(req.query?.block),
      date: req.query?.date,
    });

    return { balances: tvlData.balances, poolBalances: tvlData.poolBalances };
  }

  async getPoolAndTokenVolumes(
    req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }

    const providerService: IProvider = await import(
      this.getProviderServicePath(req.chain, req.provider)
    );

    const poolVolumes = await providerService.getPoolVolumes({
      chain: req.chain,
      provider: req.provider,
      block: parseInt(req.query.block),
      pools: req.query.pools,
    });
    for (const [, poolVolume] of Object.entries(poolVolumes)) {
      poolVolume.volumes = poolVolume.volumes.map((volume) =>
        BigNumber(volume).toFixed(),
      );
      poolVolume.volumeUsd = BigNumber(poolVolume.volumeUsd).toFixed(2);
    }

    const tokenVolumes = await providerService.getTokenVolumes({
      chain: req.chain,
      provider: req.provider,
      block: parseInt(req.query.block),
      tokens: req.query.tokens,
    });
    for (const [, tokenVolume] of Object.entries(tokenVolumes)) {
      tokenVolume.volume = BigNumber(tokenVolume.volume).toFixed();
      tokenVolume.volumeUsd = BigNumber(tokenVolume.volumeUsd).toFixed(2);
    }

    return { poolVolumes, tokenVolumes };
  }

  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    const { address, name, symbol, decimals, logo } = await import(
      this.getProviderServicePath(req.chain, req.provider)
    );
    return { address, name, symbol, decimals, logo };
  }

  getProviderServicePath(chain: string, provider: string): string {
    return `./providers/${chain}/${provider}/index`;
  }
}