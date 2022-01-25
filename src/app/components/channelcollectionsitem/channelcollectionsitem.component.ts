import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-channelcollectionsitem',
  templateUrl: './channelcollectionsitem.component.html',
  styleUrls: ['./channelcollectionsitem.component.scss'],
})
export class ChannelcollectionsitemComponent implements OnInit {
  @Input() channelCollection: FeedsData.ChannelCollections;
  @Output() clickMore = new EventEmitter();
  public channelCollectionAvatar: string = "./assets/icon/reserve.svg";
  public channelCollectionAvatarId: string = "";
  public statusDes = "";
  constructor(
    public theme: ThemeService
  ) { }

  ngOnInit() {
    this.getChannelAvatarId();
    this.getStatusDes();
  }

  getStatusDes() {
    let channelStatus = this.channelCollection.status || "0";
    if(channelStatus === "0"){
      this.statusDes = "common.unpublished"
    }else{
      this.statusDes = "common.published"
    }
  }

  menuMore(){
    let obj = { channelItem: this.channelCollection};
    this.clickMore.emit(obj);
  }

  getChannelAvatarId() {
    let channelAvatar = this.channelCollection.avatar.image;
    let channelAvatarUri = "";
    if (channelAvatar.indexOf('feeds:imgage:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:imgage:', '');
      this.channelCollectionAvatarId = channelAvatarUri;
    } else if (channelAvatar.indexOf('feeds:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('feeds:image:', '');
    } else if (channelAvatar.indexOf('pasar:image:') > -1) {
      channelAvatarUri = channelAvatar.replace('pasar:image:', '');
    }
    this.channelCollectionAvatarId = "channelCollectionsPage-avatar-"+channelAvatarUri;
  }

}
