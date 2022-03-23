import { Injectable } from '@angular/core';
import { FileService } from 'src/app/services/FileService';
import { Logger } from './logger';
import { UtilService } from './utilService';
import { DataHelper } from './DataHelper';

const TAG: string = 'Feeds-FileHelperService';
const carrierPath: string = '/carrier/';
// const nftPath: string = 'nft'
const orderPath: string = '/data/';
const postDataPath: string = '/postData/';
const v3DataPath: string = '/v3Data/';
const tokenJsonPath: string = '/tokenJson/';
@Injectable()
export class FileHelperService {
  constructor(
    private fileService: FileService,
    private dataHelper: DataHelper,
  ) { }

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

  getV3Entry(fileName: string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
        let orderDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          v3DataPath,
          true
        );

        let fileEntry = await this.fileService.getFile(orderDirEntry, fileName, true);
        resolve(fileEntry);
      } catch (error) {
        reject(error);
      }
    });
  }

  getPostFileEntry(fileName: string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        let rootDirEntry = await this.fileService.resolveLocalFileSystemURL();
        let orderDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          postDataPath,
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

  getBlobFromCacheFile(fileEntry: FileEntry): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
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

  transBlobToBase64(blob: Blob, progressCallback?: (loaded: number, total: number) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async event => {
        try {
          const result = event.target.result.toString();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      if (progressCallback) {
        reader.onprogress = (progressEvent: ProgressEvent) => {
          progressCallback(progressEvent.loaded, progressEvent.total);
        };
      }
    });
  }

  getPostData(fileUrl: string, fileName: string, type: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileEntry = await this.getPostFileEntry(fileName);
        const result = await this.getData(fileUrl, type, fileEntry);
        resolve(result);
      } catch (error) {
        Logger.error("Get NFT data error");
        reject(error);
      }
    });
  }

  savePostData(fileName: string, data: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileEntry = await this.getPostFileEntry(fileName);
        await this.writeCacheFileData(fileEntry, data);
        resolve('Success');
      } catch (error) {
        Logger.error("Get NFT data error");
        reject(error);
      }
    });
  }

  getNFTData(fileUrl: string, fileName: string, type: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileEntry = await this.getOrderFileEntry(fileName);
        const result = await this.getData(fileUrl, type, fileEntry);
        resolve(result);
      } catch (error) {
        Logger.error("Get NFT data error");
        reject(error);
      }
    });
  }

  getV3Data(fileName: string, type: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileEntry = await this.getV3Entry(fileName);
        const fileBlob = await this.getBlobFromCacheFile(fileEntry);
        if (fileBlob.size > 0) {
          const result = await this.transBlobToText(fileBlob);
          resolve(result);
          return;
        }
        resolve('');
      } catch (error) {
        Logger.error(TAG, 'ResolveCacheData error', error);
        reject(error);
      }
    });
  }

  saveV3Data(fileName: string, data: Blob | string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileEntry = await this.getV3Entry(fileName);
        const newEntry = await this.writeCacheFileData(fileEntry, data);
        resolve(newEntry);
      } catch (error) {
        Logger.error(TAG, 'Save v3 data error', error);
        reject(error);
      }
    });
  }


  getData(fileUrl: string, type: string, fileEntry: FileEntry): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const base64Type: string = this.transType(type);
        const fileBlob = await this.getBlobFromCacheFile(fileEntry);
        if (fileBlob.size > 0) {
          const result = await this.transBlobToBase64(fileBlob);
          let finalresult = result;
          if (result.startsWith('data:null;base64,'))
            finalresult = result.replace("data:null;base64,", base64Type);

          if (result.startsWith('unsafe:data:*/*;base64,'))
            finalresult = result.replace("unsafe:data:*/*", base64Type);

          if (result.startsWith('data:*/*;base64,'))
            finalresult = result.replace("data:*/*;base64,", base64Type);
          Logger.log(TAG, "Get data from local");
          resolve(finalresult);
          return;
        }
        const result = this.dataHelper.getDownloadingUrl(fileUrl);

        if (!result || result && result.length > 0) {
          resolve('');
          return;
        }
        this.dataHelper.addDownloadingUrl(fileUrl);
        let blob = await UtilService.downloadFileFromUrl(fileUrl);

        const result2 = await this.transBlobToBase64(blob);
        await this.writeCacheFileData(fileEntry, blob);
        this.dataHelper.deleteDownloadingUrl(fileUrl);
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

  writeCacheFileData(fileEntry: FileEntry, data: Blob | string): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
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
      case "svg+xml":
        return "data:image/svg+xml;base64,";
      default:
        return "data:image/png;base64,";
    }
  }

  transBlobToText(blob: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(blob);
      reader.onloadend = async event => {
        try {
          const result = event.target.result.toString();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  getUserDirEntry(dirPath: string): Promise<DirectoryEntry> {
    return this.fileService.resolveUserFileSystemUrl(dirPath);
  }

  getUserFileEntry(dirPath: string, fileName: string, options: Flags = { create: true, exclusive: false }): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        const dirEntry = await this.getUserDirEntry(dirPath);
        if (!dirEntry) {
          const error = 'User dir entry is null';
          Logger.error(TAG, error);
          reject(error);
          return;
        }
        dirEntry.getFile(fileName, options,
          (fileEntry: FileEntry) => {
            if (!fileEntry) {
              const error = 'User file entry is null';
              Logger.error(TAG, error);
              reject(error);
              return;
            }
            resolve(fileEntry);
          }, (error: FileError) => {
            const errorMsg = 'Get user file entry is error';
            Logger.error(TAG, errorMsg, error);
            reject(error);
          })
      } catch (error) {
        const errorMsg = 'Get user file entry error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }

  getUserFile(dirPath: string, fileName: string): Promise<File> {
    return new Promise(async (resolve, reject) => {
      try {
        let fileEntry = await this.getUserFileEntry(dirPath, fileName);
        let file = await this.fileService.getFileData(fileEntry);
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  getUserFileBase64Data(dirPath: string, fileName: string, progressCallback?: (loaded: number, total: number) => void): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const file = await this.getUserFile(dirPath, fileName);
        const result = await this.transBlobToBase64(file, progressCallback);
        if (!result) {
          const error = 'Get user file base64 data null';
          Logger.error(TAG, error);
          reject(error);
          return;
        }
        resolve(result);
      } catch (error) {
        const errorMsg = 'Get user file base64 data error';
        Logger.error(TAG, errorMsg, error);
        reject(error);
      }
    });
  }
}
