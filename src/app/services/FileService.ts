import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';

let TAG: string = 'Feeds-FileService';
@Injectable()
export class FileService {
  constructor(private logUtils: LogUtils) {}

  resolveLocalFileSystemURL(): Promise<DirectoryEntry> {
    return new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        cordova.file.dataDirectory,
        (dirEntry: DirectoryEntry) => {
          resolve(dirEntry);
        },
        (error: FileError) => {
          this.logUtils.loge(
            'Rresolve localFileSystemURL error ' + JSON.stringify(error),
            TAG,
          );
          reject(error);
        },
      );
    });
  }

  listFiles(dirEntry: DirectoryEntry): Promise<Entry[]> {
    return new Promise((resolve, reject) => {
      let dirReader: DirectoryReader = dirEntry.createReader();
      dirReader.readEntries(
        (entries: Entry[]) => {
          resolve(entries);
        },
        (error: FileError) => {
          this.logUtils.loge('List files error ' + JSON.stringify(error), TAG);
          reject(error);
        },
      );
    });
  }

  //@param path: Either an absolute path or a relative path from this DirectoryEntry
  getDirectory(
    dirEntry: DirectoryEntry,
    path: string,
    createDir: boolean = false,
  ): Promise<DirectoryEntry> {
    return new Promise((resolve, reject) => {
      // create: Used to indicate that the user wants to create a file or directory if it was not previously there.
      // exclusive: By itself, exclusive must have no effect. Used with create, it must cause getFile and getDirectory to fail if the target path already exists.
      let options: Flags = { create: createDir, exclusive: false };
      dirEntry.getDirectory(
        path,
        options,
        (subDirEntry: DirectoryEntry) => {
          resolve(subDirEntry);
        },
        error => {
          this.logUtils.logd(
            'Get directory error ' + JSON.stringify(error),
            TAG,
          );
          reject(error);
        },
      );
    });
  }

  //@param path: Either an absolute path or a relative path from this DirectoryEntry
  getFile(
    dirEntry: DirectoryEntry,
    path: string,
    isCreate: boolean,
  ): Promise<FileEntry> {
    return new Promise((resolve, reject) => {
      // create: Used to indicate that the user wants to create a file or directory if it was not previously there.
      // exclusive: By itself, exclusive must have no effect. Used with create, it must cause getFile and getDirectory to fail if the target path already exists.
      let options: Flags = { create: isCreate, exclusive: false };
      dirEntry.getFile(
        path,
        options,
        (fileEntry: FileEntry) => {
          resolve(fileEntry);
        },
        error => {
          this.logUtils.loge('Get file error ' + JSON.stringify(error), TAG);
          reject(error);
        },
      );
    });
  }

  //@param parent  The directory to which to move the entry.
  moveTo(
    entry: Entry,
    parent: DirectoryEntry,
    newName: string,
  ): Promise<Entry> {
    return new Promise((resolve, reject) => {
      entry.moveTo(
        parent,
        newName,
        (entry: Entry) => {
          resolve(entry);
        },
        error => {
          this.logUtils.loge('Moving file error ' + JSON.stringify(error), TAG);
          reject(error);
        },
      );
    });
  }

  writeData(entry: FileEntry, data: Blob | string, isAppend: boolean) {
    return new Promise(async (resolve, reject) => {
      let startPos = 0;
      if (isAppend) {
        let file: File = await this.getFileData(entry);
        startPos = file.size;
      }

      entry.createWriter(
        (writer: FileWriter) => {
          try {
            if (isAppend) writer.seek(startPos);
            writer.write(data);
          } catch (error) {
            reject(error);
          }
        },
        error => {
          reject(error);
        },
      );
    });
  }

  getFileData(entry: FileEntry): Promise<File> {
    return new Promise((resolve, reject) => {
      entry.file(
        (file: File) => {
          resolve(file);
        },
        (error: FileError) => {
          reject(error);
        },
      );
    });
  }

  // readFileData(entry: CordovaFilePlugin.FileEntry): Promise<String>{
  //     return new Promise(async (resolve, reject) =>{
  //         let file = await this.getFileData(entry);
  //         file.text().then((text)=>{
  //             resolve(text);
  //         }).catch((error)=>{
  //             reject(error);
  //         });
  //     });
  // }

  removeFile(entry: Entry): Promise<boolean> {
    return new Promise((resolve, reject) => {
      entry.remove(
        () => {
          resolve(true);
        },
        error => {
          reject(error);
        },
      );
    });
  }

  transError(errorCode: number): string {
    switch (errorCode) {
      case FileError.NOT_FOUND_ERR:
        return 'NOT_FOUND_ERR';
      case FileError.SECURITY_ERR:
        return 'SECURITY_ERR';
      case FileError.ABORT_ERR:
        return 'ABORT_ERR';
      case FileError.NOT_READABLE_ERR:
        return 'NOT_READABLE_ERR';
      case FileError.ENCODING_ERR:
        return 'ENCODING_ERR';
      case FileError.NO_MODIFICATION_ALLOWED_ERR:
        return 'NO_MODIFICATION_ALLOWED_ERR';
      case FileError.INVALID_STATE_ERR:
        return 'INVALID_STATE_ERR';
      case FileError.SYNTAX_ERR:
        return 'SYNTAX_ERR';
      case FileError.INVALID_MODIFICATION_ERR:
        return 'INVALID_MODIFICATION_ERR';
      case FileError.QUOTA_EXCEEDED_ERR:
        return 'QUOTA_EXCEEDED_ERR';
      case FileError.TYPE_MISMATCH_ERR:
        return 'TYPE_MISMATCH_ERR';
      case FileError.PATH_EXISTS_ERR:
        return 'PATH_EXISTS_ERR';
    }
  }
}
