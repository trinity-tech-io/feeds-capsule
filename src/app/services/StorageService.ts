import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { NativeService } from 'src/app/services/NativeService';

@Injectable()
export class StorageService {
  constructor(private native: NativeService, private storage: Storage) { }

  ready(): Promise<LocalForage> {
    return this.storage.ready();
  }

  set(key: string, value: any): Promise<any> {
    return this.storage.set(key, value);
  }

  getSync(key: string) {
    return this.storage.get(key);
  }
  get(key: string): Promise<any> {
    return this.storage.get(key);
  }
  public remove(key: string): Promise<any> {
    return this.storage.remove(key);
  }

  setInfo() { }

  clearAll(): Promise<any> {
    return this.storage.clear();
  }
}
