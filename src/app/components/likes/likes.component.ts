import { Component, OnInit, NgZone } from '@angular/core';
import { FeedService } from '../../services/FeedService';
import { Events } from '@ionic/angular';


@Component({
  selector: 'app-likes',
  templateUrl: './likes.component.html',
  styleUrls: ['./likes.component.scss'],
})
export class LikesComponent implements OnInit {
  private likeList;
  constructor(
    private feedService :FeedService,
    private zone: NgZone,
    private events: Events) {
    
    this.likeList = this.feedService.getLikeList();
    console.log("likelist==>"+JSON.stringify(this.likeList));
    
    this.events.subscribe('feeds:updateLikeList', (list) => {
      this.zone.run(() => {
        this.likeList = list;
      });
    });

    
  }

  ngOnInit() {}

  getChannel(nodeId, channelId):any{
    return this.feedService.getChannelFromId(nodeId,channelId);
  }

  like(nodeId, channelId, postId){
    this.feedService.postLike(nodeId,Number(channelId),Number(postId),null);
  }

  comment(){
    alert("TODO")
  }
}
