import { Component, OnInit, NgZone ,ViewChild,Output,EventEmitter} from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { IonInfiniteScroll} from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;

  public nodeStatus = {}; //friends status; 
  public channels = []; //myFeeds page
  public followingList = []; // following page
  public totalLikeList = [];
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public likeList = []; //like page
  public connectionStatus = 1;
  public selectType: string = "ProfilePage.myFeeds"; 
  public followers = 0;

  // Sign in data
  public name: string = "";
  public avatar: Avatar = null;
  public description: string = "";

  public hideComment = true;

  // For comment component
  public postId = null;
  public nodeId = null;
  public channelId = null
  public channelAvatar = null;
  public channelName = null;


  slideOpts = {
    initialSlide: 0,
    speed: 100,
    slidesPerView: 3,
  };

  public curItem:any = {};

  public clientHeight:number = 0;
  public isLoadimage:any ={};
  public isLoadVideoiamge:any = {};
  public videoIamges:any ={};

  constructor(
    private feedService: FeedService,
    public theme:ThemeService,
    private events: Events,
    private zone: NgZone,
    public menuService:MenuService,
    public native:NativeService
  ) {
  }

  ngOnInit() {
  }

  initMyFeeds(){
    this.channels = this.feedService.getMyChannelList();
    this.initnodeStatus(this.channels);
  }

  initFolling(){
    this.followingList = this.feedService.getFollowedChannelList();
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
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
      this.startIndex++;
      this.infiniteScroll.disabled =false;
    }else{
      
      this.likeList = this.totalLikeList.slice(0,this.totalLikeList.length);
      this.isLoadimage ={};
      this.isLoadVideoiamge ={};
      this.refreshImage();
      this.infiniteScroll.disabled =true;
    }
  }

  ionViewWillEnter() {
    this.clientHeight =screen.availHeight;
    this.curItem = {};
    this.changeType(this.selectType);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  
    let signInData = this.feedService.getSignInData() || {};

    this.name =  signInData["nickname"] || signInData["name"] || "";
    this.avatar = signInData["avatar"] || null;
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

    this.events.subscribe('feeds:editPostFinish',()=>{
      this.initLike();
    });

  this.events.subscribe('feeds:deletePostFinish',()=>{
      this.initLike();
  });

  this.events.subscribe("feeds:updateTitle",()=>{
    if(this.menuService.postDetail!=null){
      this.menuService.hideActionSheet();
      this.showMenuMore(this.curItem);
    }
  });
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:refreshSubscribedChannels");
    this.events.unsubscribe("feeds:updateLikeList");
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:channelsDataUpdate");
    this.events.unsubscribe('feeds:refreshPage');

    this.events.unsubscribe("feeds:editPostFinish");
    this.events.unsubscribe("feeds:deletePostFinish");

    this.events.unsubscribe("feeds:updateTitles");
    this.isLoadimage ={};
    this.isLoadVideoiamge ={};
    this.curItem = {};
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
         this.refreshImage();
         event.target.complete();
        }else{
         arr = this.totalLikeList.slice(this.startIndex*this.pageNumber,this.totalLikeList.length);
         this.zone.run(()=>{
             this.likeList = this.likeList.concat(arr);
         });
         this.infiniteScroll.disabled =true;
         this.initnodeStatus(arr);
         this.refreshImage();
         event.target.complete();
         clearTimeout(sId);
        }
      },500);
      break;

    }
  }

  handleImages(){
    if(this.avatar === null){
       return 'assets/images/default-contact.svg';
    }
    let contentType = this.avatar['contentType'] || this.avatar['content-type'] || "";
    let cdata = this.avatar['data'] || "";
    if(contentType === "" || cdata === ""){
      return 'assets/images/default-contact.svg';
    }
    
    return 'data:'+this.avatar.contentType+';base64,'+this.avatar.data
  }

  showMenuMore(item:any){
    this.pauseAllVideo();
    this.curItem = item;
    switch(item['tabType']){
      case 'myfeeds':
        this.menuService.showShareMenu(item.nodeId,item.channelId,item.channelName,item.postId);
        break;
      case 'myfollow':
        this.menuService.showChannelMenu(item.nodeId, item.channelId,item.channelName);
        break;
      case 'mylike':
          this.menuService.showChannelMenu(item.nodeId, item.channelId,item.channelName);
          break;  
    }
  }

  showComment(commentParams) {
    console.log(commentParams);
    this.postId = commentParams.postId;
    this.channelId = commentParams.channelId;
    this.nodeId = commentParams.nodeId;
    this.channelAvatar = commentParams.channelAvatar;
    this.channelName = commentParams.channelName;
    this.hideComment = false;
  }

  hideComponent(event) {
    console.log('Hide comment component?', event);
    this.postId = null;
    this.channelId = null;
    this.nodeId = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
  }

  ionScroll(){

    if(this.selectType === 'ProfilePage.myLikes'){
      this.native.throttle(this.setVisibleareaImage(),200,this,true);
    }
  }

  setVisibleareaImage(){

    let postgridList = document.getElementsByClassName("postgridlike");
    let postgridNum = document.getElementsByClassName("postgridlike").length;
    for(let postgridindex =0;postgridindex<postgridNum;postgridindex++){ 
      let id = postgridList[postgridindex].getAttribute("id") || '';
      //postImg
      this.handlePsotImg(id,postgridindex);

      //video
      this.hanldVideo(id,postgridindex);
   
    }

  }


  handlePsotImg(id:string,rowindex:number){
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || "";
    let rpostImage = document.getElementById(id+"likerow");
    let postImage:any = document.getElementById(id+"postimglike") || "";
    try {
      if(id!=''&&postImage!=""&&isload===""&&postImage.getBoundingClientRect().bottom>=0&&postImage.getBoundingClientRect().top<=this.clientHeight){
        console.log("====进入==="+rowindex+"-"+postImage.getBoundingClientRect().top+"-"+id+"");
        rpostImage.style.display = "none";
        this.isLoadimage[id] = "11";
       this.feedService.loadPostContentImg(id).then((imagedata)=>{
            let image = imagedata || "";
            //console.log("=====ssssssimage"+image);
            if(image!=""){
              this.isLoadimage[id] ="13";
              rpostImage.style.display = "block";
              //this.images[id] = this.images;
              this.zone.run(()=>{
                postImage.setAttribute("src",image);
                //this.images[id] = this.images;
              });
            
              //rpostImage.style.display = "none";
            }else{
              this.zone.run(()=>{
                //console.log("=====ssssss");
                this.isLoadimage[id] ="12";
                rpostImage.style.display = 'none';   
              })
            }
          }).catch(()=>{
            console.log("=====ss=="+rowindex+"-"+postImage+"-"+postImage.getBoundingClientRect().top);

            rpostImage.style.display = 'none'; 
            console.log("getImageError");
          })
      }else{
        //console.log("=====ss=="+rowindex+"-"+postImage+"-"+postImage.getBoundingClientRect().top);
        // let postImageSrc = postImage.getAttribute("src") || "";
        // if(postImage.getBoundingClientRect().top<-100&&this.isLoadimage[id]==="13"&&postImageSrc!=""){ 
        //   //console.log("======="+rowindex);  
        //   this.isLoadimage[id] = "";
        //   postImage.removeAttribute("src");
        // }
      }
    } catch (error) {
    
    }
  }

  hanldVideo(id:string,rowindex:number){

    let  isloadVideoImg  = this.isLoadVideoiamge[id] || "";
    let  vgplayer = document.getElementById(id+"vgplayerlike");
    let  video:any = document.getElementById(id+"videolike");
    let  source:any = document.getElementById(id+"sourcelike") || "";

    if(id!=""&&source!=""){
      this.pauseVideo(id);
   }
    try {
      if(id!=''&&isloadVideoImg===""&&video.getBoundingClientRect().bottom>=0&&video.getBoundingClientRect().top<=this.clientHeight){
        //console.log("========="+rowindex+"==="+video.getBoundingClientRect().top);
        this.isLoadVideoiamge[id] = "11";
        vgplayer.style.display = "none";
        this.feedService.loadVideoPosterImg(id).then((imagedata)=>{
            let image = imagedata || "";
            if(image!=""){
              this.isLoadVideoiamge[id] = "13";
              vgplayer.style.display = "block";
              video.setAttribute("poster",image);
                this.feedService.loadVideo(id).then((data:string)=>{
                  this.zone.run(()=>{
                   source.setAttribute("src",data);
                   video.load();
                  });
               
               }).catch((err)=>{
                this.isLoadVideoiamge[id] = "12";
               })
              //}
            }else{

              video.style.display='none';
              vgplayer.style.display = 'none'; 
            }
          }).catch(()=>{
            vgplayer.style.display = 'none'; 
            console.log("getImageError");
          });
      }else{
        // let postSrc =  video.getAttribute("poster") || "";
        // if(video.getBoundingClientRect().top<-100&&this.isLoadVideoiamge[id]==="13"&&postSrc!=""){
        //   video.pause();
        //   video.removeAttribute("poster");
        //   source.removeAttribute("src");
        //   this.isLoadVideoiamge[id]="";
        // }
      }
    } catch (error) {
    
    }
  }

  refreshImage(){
    let sid = setTimeout(()=>{
        //this.isLoadimage ={};
        //this.isLoadVideoiamge ={};
        this.setVisibleareaImage();
      clearTimeout(sid);
    },0);
  }


  pauseVideo(id:string){

    let videoElement:any = document.getElementById(id+'videolike') || "";
    let source:any = document.getElementById(id+'sourcelike') || "";
    if(source!=""){
      videoElement.pause();
      //videoElement.removeAttribute('src'); // empty source
      //videoElement.load();
    }
  }
  
  pauseAllVideo(){
    let videoids = this.isLoadVideoiamge;
    for(let id  in videoids){
      let value = videoids[id] || "";
      if(value === "13"){
        this.pauseVideo(id);
      }
    }
  }

}
