import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-createnewpost',
  templateUrl: './createnewpost.page.html',
  styleUrls: ['./createnewpost.page.scss'],
})
export class CreatenewpostPage implements OnInit {

  private channelName;
  private subscribers;
  private newPost="";

  private nodeId: string;
  private channelId: number;
  constructor(
    private acRoute: ActivatedRoute,
    private navCtrl: NavController,
    private feedService: FeedService) {
      acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.channelId = data.channelId;

        let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId);

        this.channelName = channel.name;
        this.subscribers = channel.subscribers;

      });
    }

  ngOnInit() {
  }


  post(){
    if (this.newPost == ""){
      alert("Please input message!");
      return;
    }else{
      this.feedService.publishPost(
        this.nodeId,
        this.channelId,
        this.newPost);
  
      this.navCtrl.pop();
    }
  }
}
 