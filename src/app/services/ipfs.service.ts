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

  generateDidUri(didJson:any):Promise<string>{

    return new Promise((resolve, reject) => {
      let formData = new FormData();
      formData.append('', JSON.stringify(didJson));
      this.nftPost(formData).then((result)=>{
          let hash = result['Hash'] || null;
          if (hash != null) {
            let jsonHash = 'feeds:json:' + hash;
            let userDidUriList = this.dataHelper.getUserDidUriList();
            let did = didJson["did"];
                userDidUriList[did] = jsonHash;
            this.dataHelper.setUserDidUriList(userDidUriList);
            this.dataHelper.saveData("feeds.userUriList",userDidUriList);
            resolve(jsonHash);
          }else{
            resolve(null);
          }
        }).catch((err)=>{
          resolve(null);
        });
    });
  }

}
