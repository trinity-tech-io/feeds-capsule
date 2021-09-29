import { Injectable } from '@angular/core';
import { FileService } from 'src/app/services/FileService';

const TAG: string = 'Feeds-FileHelperService';
const carrierPath: string = '/carrier/';
const nftPath: string = 'nft'
const orderPath: string = '/nft/order';
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
        let nftDirEntry = await this.fileService.getDirectory(
          rootDirEntry,
          nftPath,
          true
        );
        let orderDirEntry = await this.fileService.getDirectory(
          nftDirEntry,
          orderPath,
          true
        );

        console.log('orderDirEntry', orderDirEntry);
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
        let blob = this.fileService.getFileData(fileEntry);

        resolve(blob);
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

  writeFileToCache() {

  }

  getNFTCacheFileData() {

  }

  writeNFTCacheFileData(fileName: string, blob: Blob) {
    return new Promise(async (resolve, reject) => {
      try {
        let fileEntry = await this.getOrderFileEntry(fileName);
        let newEntry = await this.fileService.writeData(
          fileEntry,
          blob,
          false
        );

        resolve(newEntry);
      } catch (error) {
        reject(error);
      }
    });
  }
}
