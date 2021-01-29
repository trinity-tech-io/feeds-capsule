import { Injectable } from '@angular/core';
import { LogUtils } from 'src/app/services/LogUtils';


let TAG: string = "Feeds-FileService";
@Injectable()
export class FileService {
    constructor(private logUtils: LogUtils) {
    }

    resolveLocalFileSystemURL(): Promise<CordovaFilePlugin.DirectoryEntry>{
        return new Promise((resolve, reject) =>{
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, 
                (dirEntry: CordovaFilePlugin.DirectoryEntry) =>{
                    resolve(dirEntry);
                },
                (error: CordovaFilePlugin.FileError)=>{
                    this.logUtils.loge("resolveLocalFileSystemURL error "+JSON.stringify(error),TAG);
                    reject(error);
                }
            );
        });
    }

    listFiles(dirEntry: CordovaFilePlugin.DirectoryEntry): Promise<CordovaFilePlugin.Entry[]>{
        return new Promise((resolve, reject) =>{
            let dirReader: CordovaFilePlugin.DirectoryReader = dirEntry.createReader();
            dirReader.readEntries(
                (entries: CordovaFilePlugin.Entry[])=>{
                    resolve(entries);
                },
                (error: CordovaFilePlugin.FileError)=>{
                this.logUtils.loge("listFiles error "+JSON.stringify(error),TAG);
                    reject(error);
                }
            );
        });
    }

    //@param path: Either an absolute path or a relative path from this DirectoryEntry
    getDirectory(dirEntry: CordovaFilePlugin.DirectoryEntry, path: string, createDir: boolean = false): Promise<CordovaFilePlugin.DirectoryEntry>{
        return new Promise((resolve, reject) =>{
            // create: Used to indicate that the user wants to create a file or directory if it was not previously there.
            // exclusive: By itself, exclusive must have no effect. Used with create, it must cause getFile and getDirectory to fail if the target path already exists.
            let options: CordovaFilePlugin.Flags = {create: createDir, exclusive: false};
            dirEntry.getDirectory(path, options,
                (subDirEntry: CordovaFilePlugin.DirectoryEntry)=>{
                    resolve(subDirEntry);
                },
                (error)=>{
                    this.logUtils.loge("getDirectory error "+JSON.stringify(error),TAG);
                    reject(error);
                }
            );
        });
    }

    //@param path: Either an absolute path or a relative path from this DirectoryEntry
    getFile(dirEntry: CordovaFilePlugin.DirectoryEntry, path: string): Promise<CordovaFilePlugin.FileEntry>{
        return new Promise((resolve, reject) =>{
            // create: Used to indicate that the user wants to create a file or directory if it was not previously there.
            // exclusive: By itself, exclusive must have no effect. Used with create, it must cause getFile and getDirectory to fail if the target path already exists.
            let options: CordovaFilePlugin.Flags = {create: false, exclusive: false};
            dirEntry.getFile(path, options,
                (fileEntry: CordovaFilePlugin.FileEntry)=>{
                    resolve(fileEntry);
                },
                (error)=>{
                    this.logUtils.loge("getFile error "+JSON.stringify(error),TAG);
                    reject(error);
                }
            );
        });
    }

    //@param parent  The directory to which to move the entry.
    moveTo(entry: CordovaFilePlugin.Entry, parent: CordovaFilePlugin.DirectoryEntry, newName: string): Promise<CordovaFilePlugin.Entry>{
        return new Promise((resolve, reject) =>{
            entry.moveTo(parent, newName, 
                (entry: CordovaFilePlugin.Entry)=>{
                    resolve(entry);
                },
                (error)=>{
                    this.logUtils.loge("moveTo error "+JSON.stringify(error),TAG);
                    reject(error);
                }
            );
        });
    }

    transError(errorCode: number): string{
        switch(errorCode){
            case CordovaFilePlugin.FileError.NOT_FOUND_ERR: 
                return "NOT_FOUND_ERR";
            case CordovaFilePlugin.FileError.SECURITY_ERR:
                return "SECURITY_ERR";
            case CordovaFilePlugin.FileError.ABORT_ERR:
                return "ABORT_ERR";
            case CordovaFilePlugin.FileError.NOT_READABLE_ERR:
                return "NOT_READABLE_ERR";
            case CordovaFilePlugin.FileError.ENCODING_ERR:
                return "ENCODING_ERR";
            case CordovaFilePlugin.FileError.NO_MODIFICATION_ALLOWED_ERR:
                return "NO_MODIFICATION_ALLOWED_ERR";
            case CordovaFilePlugin.FileError.INVALID_STATE_ERR:
                return "INVALID_STATE_ERR";
            case CordovaFilePlugin.FileError.SYNTAX_ERR:
                return "SYNTAX_ERR";
            case CordovaFilePlugin.FileError.INVALID_MODIFICATION_ERR:
                return "INVALID_MODIFICATION_ERR";
            case CordovaFilePlugin.FileError.QUOTA_EXCEEDED_ERR:
                return "QUOTA_EXCEEDED_ERR";
            case CordovaFilePlugin.FileError.TYPE_MISMATCH_ERR:
                return "TYPE_MISMATCH_ERR";
            case CordovaFilePlugin.FileError.PATH_EXISTS_ERR:
                return "PATH_EXISTS_ERR";
        }
    }
    
}
