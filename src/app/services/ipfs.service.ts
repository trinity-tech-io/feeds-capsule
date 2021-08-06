import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from './ApiUrl';

@Injectable()
export class IPFSService {
  private baseNFTIPFSUrl = ApiUrl.IPFS_TEST_SERVER;
  constructor(private httpService: HttpService
  ) { }

  nftGet(url: string): Promise<Object> {
    return this.httpService.httpGet(url);
  }

  nftPost(body: any): Promise<Object> {
    return this.httpService.httpPost(this.getNFTAddUrl(), body, {});
  }

  setTESTMode(testMode: boolean) {
    if (testMode) {
      this.setBaseNFTIPFSUrl(ApiUrl.IPFS_TEST_SERVER);
      return;
    }

    this.setBaseNFTIPFSUrl(ApiUrl.IPFS_SERVER);
    return;
  }

  setBaseNFTIPFSUrl(url: string) {
    this.baseNFTIPFSUrl = url;
  }

  getBaseNFTIPFSUrl() {
    return this.baseNFTIPFSUrl;
  }

  getNFTGetUrl() {
    return this.getBaseNFTIPFSUrl() + ApiUrl.IPFS_NFT_GET;
  }

  getNFTAddUrl() {
    return this.getBaseNFTIPFSUrl() + ApiUrl.IPFS_NFT_ADD;
  }

}
