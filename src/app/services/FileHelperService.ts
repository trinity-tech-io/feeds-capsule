import { Injectable } from '@angular/core';
import { FileService } from 'src/app/services/FileService';
import { Logger } from './logger';
import { UtilService } from './utilService';

const TAG: string = 'Feeds-FileHelperService';
const carrierPath: string = '/carrier/';
// const nftPath: string = 'nft'
const orderPath: string = '/data/';
const tokenJsonPath: string = '/tokenJson/';
@Injectable()
export class FileHelperService {
  constructor(private fileService: FileService) { }

  moveCarrierData(oldName: string, newName: string): Promise<Entry> {
    return new Promise(async (resolve, reject) => {
      try {
        let carrierDirEntry = await this.getCarrierDirEntry();
        let carrierOldDataDirEntry = await this.fileService.getDirectory(
          carrierDirEntry,
          oldName,
        );
        let newEntry = await this.fileService.moveTo(
          carrierOldDataDirEntry,
          carrierDirEntry,
          newName,
        );
        resolve(newEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  getCarrierDirEntry(): Promise<DirectoryEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
        let carrierDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          carrierPath,
        );
        resolve(carrierDirEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  getOrderFileEntry(fileName: string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
        // let nftDirEntry = await this.fileService.getDirectory(
        //   rootDirEntry,
        //   nftPath,
        //   true
        // );
        let orderDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          orderPath,
          true
        );

        let fileEntry = await this.fileService.getFile(orderDirEntry, fileName, true);
        resolve(fileEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTokenJsonFileEntry(fileName: string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
        // let nftDirEntry = await this.fileService.getDirectory(
        //   rootDirEntry,
        //   nftPath,
        //   true
        // );
        let orderDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          tokenJsonPath,
          true
        );

        let fileEntry = await this.fileService.getFile(orderDirEntry, fileName, true);
        resolve(fileEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  getBlobFromCacheFile(fileName: string): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        let fileEntry = await this.getOrderFileEntry(fileName);
        let blob = await this.fileService.getFileData(fileEntry);
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    });
  }

  getTokenJsonFromCacheFile(fileName: string): Promise<File> {
    return new Promise(async (resolve, reject) => {
      try {
        let fileEntry = await this.getTokenJsonFileEntry(fileName);
        let file = await this.fileService.getFileData(fileEntry);
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  transBlobToBase64(blob: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = async event => {
        try {
          const result = event.target.result.toString();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  async getNFTData(fileUrl: string, fileName: string, type: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const base64Type: string = this.transType(type);
        const fileBlob = await this.getBlobFromCacheFile(fileName);
        if (fileBlob.size > 0) {
          const result = await this.transBlobToBase64(fileBlob);
          let finalresult = result;
          if (result.startsWith('data:null;base64,'))
            finalresult = result.replace("data:null;base64,", base64Type);

          if (result.startsWith('unsafe:data:*/*'))
            finalresult = result.replace("unsafe:data:*/*", base64Type);

          Logger.log(TAG, "Get data from local");
          resolve(finalresult);
          return;
        }
        let blob = await UtilService.downloadFileFromUrl(fileUrl);
        const result2 = await this.transBlobToBase64(blob);
        await this.writeNFTCacheFileData(fileName, blob);
        Logger.log(TAG, "Get data from net");
        resolve(result2);
      } catch (error) {
        Logger.error("Get NFT data error");
        reject(error);
      }
    });
  }

  async getTokenJsonData(fileName: string): Promise<FeedsData.TokenJson> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileBlob = await this.getTokenJsonFromCacheFile(fileName);
        if (fileBlob.size > 0) {
          const result = await this.transBlobToText(fileBlob);
          const jsonObj: FeedsData.TokenJson = JSON.parse(result);
          resolve(jsonObj);
          return;
        }
        resolve(null);
      } catch (error) {
        Logger.error('Get Token Json Data error', error);
        resolve(null);
      }
    });
  }

  writeNFTCacheFileData(fileName: string, data: Blob | string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let fileEntry = await this.getOrderFileEntry(fileName);
        let newEntry = await this.fileService.writeData(
          fileEntry,
          data,
          false
        );

        resolve(newEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  writeTokenJsonFileData(fileName: string, data: Blob | string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let fileEntry = await this.getTokenJsonFileEntry(fileName);
        let newEntry = await this.fileService.writeData(
          fileEntry,
          data,
          false
        );

        resolve(newEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  transType(type: string): string {
    switch (type) {
      case "jpg":
        return "data:image/jpg;base64,";
      case "jpeg":
        return "data:image/jpeg;base64,";
      case "png":
        return "data:image/png;base64,";
      case "gif":
        return "data:image/gif;base64,";
      default:
        return "data:image/png;base64,";
    }
  }

  transBlobToText(blob: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(blob);
      reader.onload = async event => {
        try {
          const result = event.target.result.toString();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    });
  }
}
