import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { NativeService } from '../../services/NativeService';
import { FeedService } from '../../services/FeedService';
import { UtilService } from '../../services/utilService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from 'src/app/services/DataHelper';
@Component({
  selector: 'app-switchfeed',
  templateUrl: './switchfeed.component.html',
  styleUrls: ['./switchfeed.component.scss'],
})
export class SwitchfeedComponent implements OnInit {
  @Input() public channelList = [];
  @Output() hideComment = new EventEmitter();
  public currentFeed: any = {};
  public avatarList: any = {};
  constructor(
    public theme: ThemeService,
    public native: NativeService,
    private dataHelper: DataHelper,
    private hiveVaultController: HiveVaultController
  ) {}

  ngOnInit() {
    this.currentFeed = this.dataHelper.getCurrentChannel();
    this.getAllAvatarList();
  }

  async getAllAvatarList(){
      for(let channel of this.channelList){
        let avatarUri  = channel.avatar || "";
        if(avatarUri != ""){
        let destDid = channel.destDid;
        this.avatarList[avatarUri] = "./assets/icon/reserve.svg";
        let avatar =  await this.parseAvatar(avatarUri,destDid) || './assets/icon/reserve.svg';
        this.avatarList[avatarUri] = avatar;
        }else{
        this.avatarList[avatarUri] = './assets/icon/reserve.svg';
        }
      }
  }

  async parseAvatar(avatarUri: string,destDid: string):Promise<string> {

    let avatar = await this.handleChannelAvatar(avatarUri,destDid);


    return avatar;
  }

  handleChannelAvatar(channelAvatarUri: string,destDid: string): Promise<string>{
    return new Promise(async (resolve, reject) => {
      try {
        let fileName:string = channelAvatarUri.split("@")[0];
        this.hiveVaultController.getV3Data(destDid,channelAvatarUri,fileName,"0")
        .then((result)=>{
           let channelAvatar = result || '';
           resolve(channelAvatar);
        }).catch((err)=>{
          resolve('');
        })
      }catch(err){
        resolve('');
      }
    });

  }

  moreName(name: string) {
    return UtilService.moreNanme(name, 25);
  }

  clickItem(feed: any) {
    this.hideComment.emit(feed);
  }
}
