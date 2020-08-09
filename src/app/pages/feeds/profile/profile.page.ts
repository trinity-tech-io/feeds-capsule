import { Component, OnInit, NgZone ,ViewChild} from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  //@ViewChild('footer',{static:true}) footerChild:any; // 在父组件的控制器中引用子组件
  public  nodeStatus = {}; //friends status; 
  public  channels = []; //myFeeds page
  public  followingList = []; // following page
  public  likeList = []; //like page
  private connectionStatus = 1;
  private selectType: string = "ProfilePage.myFeeds"; 
  private description: string = "";
  private name: string = "";
  private followers = 0;
  private avatar = "";
  slideOpts = {
    initialSlide: 0,
    speed: 100,
    slidesPerView: 3,
  };

  constructor(
    private feedService: FeedService,
    public theme:ThemeService,
    private events: Events,
    private zone: NgZone) {
  
  }

  ngOnInit() {
  }

  initMyFeeds(){
    this.channels = this.feedService.getMyChannelList();
    this.initnodeStatus(this.channels);
  }

  initFolling(){
    this.followingList = this.feedService.refreshLocalSubscribedChannels();
    this.initnodeStatus(this.followingList);
    this.feedService.refreshSubscribedChannels();
  }

  initLike(){
    this.likeList = this.feedService.getLikeList();
    this.initnodeStatus(this.likeList);
  }

  ionViewWillEnter() {
    this.changeType(this.selectType);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
    let signInData = this.feedService.getSignInData() || {};
    this.name = signInData["name"] || "";

    this.description = signInData["description"] || "";


    this.events.subscribe('feeds:refreshSubscribedChannels', list => {
      this.zone.run(() => {
          this.followingList = list;
          this.initnodeStatus(this.followingList);
      });
    });


    this.events.subscribe('feeds:updateLikeList', (list) => {
      this.zone.run(() => {
        this.likeList = list;
        this.initnodeStatus(this.likeList);
      });
     });

     this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
     });

     this.events.subscribe('feeds:channelsDataUpdate', () =>{
      this.channels = this.feedService.getMyChannelList();
      this.initnodeStatus(this.channels);
    });

    this.events.subscribe('feeds:refreshPage',()=>{
      this.zone.run(() => {
          this.initMyFeeds();
          this.initFolling();
          this.initLike();
      });
      });
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:refreshSubscribedChannels");
    this.events.unsubscribe("feeds:updateLikeList");
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:channelsDataUpdate");
    this.events.unsubscribe('feeds:refreshPage');
  }

  changeType(type:string){
    this.selectType = type;
    switch(type){
      case 'ProfilePage.myFeeds':
          this.initMyFeeds();
        break;
      case 'ProfilePage.following':
        this.initFolling();
        break;
      case 'ProfilePage.myLikes':
         this.initLike();
          break;
    }
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(list:any){
     for(let index =0 ;index<list.length;index++){
            let nodeId = list[index]['nodeId'];
            let status = this.checkServerStatus(nodeId);
            this.nodeStatus[nodeId] = status;
     }
  }

}
