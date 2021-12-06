import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-channelcollectionsitem',
  templateUrl: './channelcollectionsitem.component.html',
  styleUrls: ['./channelcollectionsitem.component.scss'],
})
export class ChannelcollectionsitemComponent implements OnInit {
  @Input() channelCollectionList: FeedsData.ChannelCollections [] = [];
  @Output() clickMore = new EventEmitter();
  constructor(
    public theme: ThemeService
  ) { }

  ngOnInit() {}

  menuMore(channelItem: FeedsData.ChannelCollections){
    let obj = { channelItem: channelItem};
    console.log("=====obj=====",obj);
    this.clickMore.emit(obj);
  }

  parseAvatar(avatar: string) {
    avatar = avatar || "";
    if(avatar === ""){
      avatar = "./assets/icon/reserve.svg"
    }
    return avatar;
  }


}
