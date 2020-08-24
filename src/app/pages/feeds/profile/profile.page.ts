import { Component, OnInit, NgZone ,ViewChild} from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { IonInfiniteScroll} from '@ionic/angular';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public  nodeStatus = {}; //friends status; 
  public  channels = []; //myFeeds page
  public  followingList = []; // following page
  public  totalLikeList = [];
  public isBottom:boolean = false;
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public  likeList = []; //like page
  public connectionStatus = 1;
  public selectType: string = "ProfilePage.myFeeds"; 
  public description: string = "";
  public name: string = "";
  public followers = 0;
  public avatar = "";
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
    this.startIndex = 0;
    this.initRefresh();
    this.initnodeStatus(this.likeList);
  }

  initRefresh(){
    this.totalLikeList = this.feedService.getLikeList() || [];
    if(this.totalLikeList.length-this.pageNumber > this.pageNumber){
      
      this.likeList  = this.totalLikeList.slice(this.startIndex,this.pageNumber);
     
      this.startIndex++;
      this.isBottom = false;
      this.infiniteScroll.disabled =false;
    }else{
      
      this.likeList = this.totalLikeList.slice(0,this.totalLikeList.length);
      this.isBottom =true;
      this.infiniteScroll.disabled =true;
    }
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
        this.totalLikeList = list;
        this.initLike();
        //this.initnodeStatus(this.likeList);
      });
     });

     this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
     });

     this.events.subscribe('feeds:channelsDataUpdate', () =>{
      this.zone.run(()=>{
        this.channels = this.feedService.getMyChannelList();
        this.initnodeStatus(this.channels);
      });
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
         this.startIndex = 0;
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

  doRefresh(event:any){
    switch(this.selectType){
      case 'ProfilePage.myFeeds':
        let sId1 =  setTimeout(() => {
          this.initMyFeeds();
          event.target.complete();
          clearTimeout(sId1);
        },500);
        break;
      case 'ProfilePage.following':
        let sId2 =  setTimeout(() => {
          this.initFolling();
          event.target.complete();
          clearTimeout(sId2);
        },500);
        break;
      case 'ProfilePage.myLikes':
      let sId =  setTimeout(() => {
        this.startIndex = 0;
        this.initLike();
        event.target.complete();
        clearTimeout(sId);
      },500);
      break;
    }
  
  }

  loadData(event:any){
    switch(this.selectType){
    case 'ProfilePage.myFeeds':
        event.target.complete();
      break;
    case 'ProfilePage.following':
      event.target.complete();
      break;
      case 'ProfilePage.myLikes':
      let sId = setTimeout(() => {
        let arr = [];        
        if(this.totalLikeList.length - this.pageNumber*this.startIndex>this.pageNumber){
         arr = this.totalLikeList.slice(this.startIndex*this.pageNumber,(this.startIndex+1)*this.pageNumber);
         this.startIndex++;
         this.zone.run(()=>{
         this.likeList = this.likeList.concat(arr);
         });
         this.initnodeStatus(arr);
         event.target.complete();
        }else{
         arr = this.totalLikeList.slice(this.startIndex*this.pageNumber,this.totalLikeList.length);
         this.zone.run(()=>{
             this.likeList = this.likeList.concat(arr);
         });
         this.isBottom = true;
         this.infiniteScroll.disabled =true;
         this.initnodeStatus(arr);
         event.target.complete();
         clearTimeout(sId);
        }
      },500);
      break;

    }
  }

}
