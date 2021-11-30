import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from './ApiUrl';
import { DataHelper } from 'src/app/services/DataHelper';
@Injectable()
export class IPFSService {
  private baseNFTIPFSUrl = ApiUrl.IPFS_TEST_SERVER;
  constructor(
    private httpService: HttpService,
    private dataHelper: DataHelper
  ) { }

  nftGet(url: string): Promise<Object> {
    return this.httpService.httpGet(url);
  }

  nftPost(body: any): Promise<Object> {
    return this.httpService.httpPost(this.getNFTAddUrl(), body, {});
  }

  sendDIDJsonWithPost(body: any): Promise<Object> {
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
