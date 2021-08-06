import { Injectable } from '@angular/core';
import { DataHelper } from 'src/app/services/DataHelper';

@Injectable()
export class NFTPersistenceHelper {
  private collectiblesListKey = 'feed.nft.own.collectibles.list';
  private devCollectiblesListKey = 'feed.nft.own.collectibles.list.dev';
  private pasarListKey = 'feed.nft.pasarList';
  private devPasarListKey = 'feed.nft.pasarList.dev';

  private activeCollecitblesKey = this.devCollectiblesListKey;
  private activePasarKey = this.devPasarListKey;

  private collectiblesMap: { [address: string]: any };
  private pasarList: [];

  constructor(
    private dataHelper: DataHelper
  ) {
  }

  async loadPasarList(key: string) {
    this.pasarList = await this.dataHelper.loadNFTPasarList(key);
  }

  setPasarList(pasarList: any) {
    this.pasarList = pasarList;
    this.dataHelper.saveNFTPasarList(this.activePasarKey, this.pasarList);
  }

  getPasarList() {
    if (!this.pasarList || this.pasarList.length == 0)
      return [];
    return this.pasarList;
  }

  async loadCollectiblesMap(key: string) {
    this.collectiblesMap = await this.dataHelper.loadNFTCollectibleMap(key);
  }

  setCollectiblesMap(collectiblesList: any) {
    this.collectiblesMap = collectiblesList;
    this.dataHelper.saveNFTCollectibleList(this.activeCollecitblesKey, this.collectiblesMap);
  }

  getCollectiblesMap() {
    return this.collectiblesMap;
  }

  addItemToCollectible(key: string, value: any) {
    if (!this.collectiblesMap || !this.collectiblesMap[key] || this.collectiblesMap[key].length == 0)
      this.collectiblesMap[key] = [];
    this.collectiblesMap[key].push(value);
    this.setCollectiblesMap(this.collectiblesMap);
  }

  async setDevelopMode(developMode: boolean) {
    if (developMode) {
      this.activeCollecitblesKey = this.devCollectiblesListKey;
      this.activePasarKey = this.devPasarListKey;
    } else {
      this.activeCollecitblesKey = this.collectiblesListKey;
      this.activePasarKey = this.pasarListKey;
    }

    await this.loadPasarList(this.activePasarKey);
    await this.loadCollectiblesMap(this.activeCollecitblesKey);
  }
}
