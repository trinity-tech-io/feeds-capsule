import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { DataHelper } from 'src/app/services/DataHelper';
import { IPFSService } from 'src/app/services/ipfs.service';


let TAG: string = 'Feeds-UserDIDService';
@Injectable()
export class UserDIDService {
  constructor(private dataHelper: DataHelper,
    private ipfsService: IPFSService) { }

  getSigninDid(signinData: FeedsData.SignInData): string {
    if (!signinData || !signinData.did) {
      return '';
    }
    return signinData.did;
  }

  generateUserDidJson(did: string): FeedsData.DidObj {
    const didJson: FeedsData.DidObj = {
      version: "1",
      did: did
    }
    return didJson;
  }

  getUserDidObj(did: string): FeedsData.DidObj {
    let didUriObj: FeedsData.DIDUriObj = this.dataHelper.getUserDidUriObj(did);
    if (!didUriObj || !didUriObj.didObj) {
      const didObj = this.generateUserDidJson(did);
      this.dataHelper.updateUserDidUriInfo(didObj, null);
      return didObj;
    }

    return didUriObj.didObj;
  }

  getDidUri(did: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let didUri = this.dataHelper.getUserDidUri(did);
        if (didUri) {
          resolve(didUri)
          return;
        }

        didUri = await this.getDidUriFromIpfs(did);
        resolve(didUri);
      } catch (error) {
        reject(error)
      }
    });
  }

  getDidUriFromIpfs(did: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let formData = new FormData();
      const didObj: FeedsData.DidObj = this.getUserDidObj(did);
      formData.append('', JSON.stringify(didObj));
      this.ipfsService.sendDIDJsonWithPost(formData).then((result) => {
        let didUri = this.parseIPFSDidUriResult(didObj, result);
        if (didUri) {
          this.dataHelper.updateUserDidUriInfo(didObj, didUri);
          resolve(didUri);
        } else {
          const error = 'Cant fetch valid diduri';
          Logger.error(TAG, error);
          reject(error);
        }
      }).catch((err) => {
        const error = 'Cant fetch valid diduri';
        Logger.error(TAG, error);
        resolve(error);
      });
    });
  }

  parseIPFSDidUriResult(didObj: FeedsData.DidObj, result: any) {
    let hash = result['Hash'] || null;
    if (hash) {
      let jsonHash = 'feeds:json:' + hash;
      return jsonHash;
    }
    return null;
  }

}
