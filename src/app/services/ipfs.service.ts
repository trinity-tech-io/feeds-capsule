import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/services/HttpService';
import { ApiUrl } from './ApiUrl';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger } from './logger';
const TAG: string = "IPFSService";

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

  uploadData(value: string | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      let formData = new FormData();
      formData.append('', value);
      Logger.log(TAG, 'Send data to ipfs, formdata length is', formData.getAll('').length);
      this.nftPost(formData)
        .then(result => {
          let hash = result['Hash'] || null;
          if (!hash) {
            reject("Upload Data error, hash is null")
            return;
          }
          resolve(hash);
        })
        .catch(err => {
          reject('Upload Data error, error is ' + JSON.stringify(err));
        });
    });
  }
}
