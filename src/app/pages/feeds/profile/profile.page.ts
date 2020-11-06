import { Component, OnInit, NgZone ,ViewChild,Output,EventEmitter} from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService, Avatar } from 'src/app/services/FeedService';
import { ThemeService } from 'src/app/services/theme.service';
import { IonInfiniteScroll} from '@ionic/angular';
import { MenuService } from 'src/app/services/MenuService';
import { NativeService } from 'src/app/services/NativeService';
import { VgFullscreenAPI} from 'ngx-videogular';
import { AppService } from 'src/app/services/AppService';
import { TranslateService } from "@ngx-translate/core";
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
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
  public onlineStatus = null; 

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

  public cacheGetBinaryRequestKey:string="";
  public cachedMediaType = "";

  constructor(
    private feedService: FeedService,
    public theme:ThemeService,
    private events: Events,
    private zone: NgZone,
    public menuService:MenuService,
    public native:NativeService,
    public appService:AppService,
    public vgFullscreenAPI:VgFullscreenAPI,
    private translate:TranslateService,

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

  this.events.subscribe('stream:getBinaryResponse', () => {
    this.zone.run(() => {
    });
  });

  this.events.subscribe('stream:getBinarySuccess', (nodeId, key: string, value:string) => {
    this.zone.run(() => {
      this.feedService.closeSession(nodeId);
      if (key.indexOf("img")>-1){
        this.cacheGetBinaryRequestKey = "";
        //console.log("result======>"+value.substring(0,50));
        this.native.hideLoading();
        this.native.openViewer(value,"common.image","FeedsPage.tabTitle1",this.appService);
      } else if (key.indexOf("video")>-1){
        let arr = this.cacheGetBinaryRequestKey.split("-");
        let nodeId =arr[0];
        let channelId:any = arr[1];
        let postId:any = arr[2];
        let id = nodeId+channelId+postId;
        this.cacheGetBinaryRequestKey = "";
        this.loadVideo(id,value);
      }
      
    });
  });

  this.events.subscribe('stream:error', (nodeId, response) => {
    this.zone.run(() => {

      if (response.code == -107){
      }
      this.native.hideLoading();
    });
  });
 
  this.events.subscribe('stream:onStateChangedCallback', (nodeId, state) => {
    this.zone.run(() => {
      if (this.cacheGetBinaryRequestKey == "")
        return;

      if (state === 4){
        this.feedService.getBinary(this.nodeId, this.cacheGetBinaryRequestKey,this.cachedMediaType);
      }
    });
  }); this.events.subscribe('stream:getBinaryResponse', () => {
    this.zone.run(() => {
    });
  });

  this.events.subscribe('stream:error', (nodeId, response) => {
    this.zone.run(() => {

      if (response.code == -107){
      }

      this.native.hideLoading();

    });
  });
 
  this.events.subscribe('stream:onStateChangedCallback', (nodeId, state) => {
    this.zone.run(() => {

      if (this.cacheGetBinaryRequestKey == "")
        return;

      if (state === 4){
        this.feedService.getBinary(nodeId, this.cacheGetBinaryRequestKey,this.cachedMediaType);
      }
    });
  });

  this.events.subscribe('rpcResponse:error', () => {
    this.zone.run(() => {
      this.native.hideLoading();
    });
  });

 this.events.subscribe('rpcRequest:success', () => {
  this.zone.run(() => {

    this.likeList = this.feedService.getLikeList() || [];
    if (this.likeList.length - this.pageNumber > this.pageNumber){
      this.likeList = this.likeList.slice(0,(this.startIndex)*this.pageNumber);
      this.infiniteScroll.disabled =false;
     } else {
       //this.likeList =  this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.isLoadimage ={};
    this.isLoadVideoiamge ={};
    this.refreshImage();
    this.initnodeStatus(this.likeList);
    this.hideComponent(null);
    this.native.hideLoading();
    this.native.toast_trans("CommentPage.tipMsg1");
  });
 });

 this.events.subscribe("feeds:openRightMenu",()=>{
      this.pauseAllVideo();
 });


 this.events.subscribe("feeds:tabsendpost",()=>{
  this.pauseAllVideo();
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

    this.events.unsubscribe("stream:getBinaryResponse");
    this.events.unsubscribe("stream:getBinarySuccess");
    this.events.unsubscribe("stream:error");
    this.events.unsubscribe("stream:onStateChangedCallback");

    this.events.unsubscribe("rpcResponse:error");
    this.events.unsubscribe("rpcRequest:success");

    this.events.unsubscribe("feeds:updateTitles");
    this.events.unsubscribe("feeds:openRightMenu");
    this.events.unsubscribe("feeds:tabsendpost");
    this.removeImages();
    this.removeAllVideo();
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
         this.refreshImage();
         this.initnodeStatus(arr);
       
         event.target.complete();
        }else{
         arr = this.totalLikeList.slice(this.startIndex*this.pageNumber,this.totalLikeList.length);
         this.zone.run(()=>{
             this.likeList = this.likeList.concat(arr);
         });
         this.refreshImage();
         this.infiniteScroll.disabled =true;
         this.initnodeStatus(arr);
         
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
    this.postId = commentParams.postId;
    this.channelId = commentParams.channelId;
    this.nodeId = commentParams.nodeId;
    this.onlineStatus = commentParams.onlineStatus;
    this.channelAvatar = commentParams.channelAvatar;
    this.channelName = commentParams.channelName;
    this.hideComment = false;
  }

  hideComponent(event) {
    this.postId = null;
    this.channelId = null;
    this.nodeId = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.hideComment = true;
    this.onlineStatus = null;
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
      let srcId = postgridList[postgridindex].getAttribute("id") || '';
      if(srcId!=""){
        let arr = srcId.split("-");
        let nodeId = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let mediaType = arr[3];
        let id = nodeId+channelId+postId;
        //postImg
        if(mediaType === '1'){
          this.handlePsotImg(id,srcId,postgridindex);
        }
         if(mediaType === '2'){
          //video
          this.hanldVideo(id,srcId,postgridindex);
          } 
      }
   
    }

  }


  handlePsotImg(id:string,srcId:string,rowindex:number){
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || "";
    let rpostImage = document.getElementById(id+"likerow");
    let postImage:any = document.getElementById(id+"postimglike") || "";
    try {
      if(id!=''&&postImage.getBoundingClientRect().top>=-this.clientHeight&&postImage.getBoundingClientRect().top<=this.clientHeight){
        //console.log("====进入==="+rowindex+"-"+postImage.getBoundingClientRect().top+"-"+id+"");
        if(isload===""){
          rpostImage.style.display = "none";
        this.isLoadimage[id] = "11";
        let arr = srcId.split("-");
        let nodeId =arr[0];
        let channelId:any = arr[1];
        let postId:any = arr[2];
        let key = this.feedService.getImgThumbKeyStrFromId(nodeId,channelId,postId,0,0);
       this.feedService.getData(key).then((imagedata)=>{
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
            rpostImage.style.display = 'none'; 
            console.log("getImageError");
          })
        }
      }else{
        //console.log("=====ss=="+rowindex+"-"+postImage+"-"+postImage.getBoundingClientRect().top);
        let postImageSrc = postImage.getAttribute("src") || "";
        if(postImage.getBoundingClientRect().top<-this.clientHeight&&this.isLoadimage[id]==="13"&&postImageSrc!=""){ 
          //console.log("======="+rowindex);  
          this.isLoadimage[id] = "";
          postImage.removeAttribute("src");
        }
      }
    } catch (error) {
    
    }
  }

  hanldVideo(id:string,srcId:string,rowindex:number){

    let  isloadVideoImg  = this.isLoadVideoiamge[id] || "";
    let  vgplayer = document.getElementById(id+"vgplayerlike");
    let  video:any = document.getElementById(id+"videolike");
    let  source:any = document.getElementById(id+"sourcelike") || "";

    if(id!=""&&source!=""){
      this.pauseVideo(id);
   }
    try {
      if(id!=''&&video.getBoundingClientRect().top>=-this.clientHeight&&video.getBoundingClientRect().top<=this.clientHeight){
        //console.log("========="+rowindex+"==="+video.getBoundingClientRect().top);
        if(isloadVideoImg===""){
          this.isLoadVideoiamge[id] = "11";
          vgplayer.style.display = "none";
          let arr = srcId.split("-");
          let nodeId =arr[0];
          let channelId:any = arr[1];
          let postId:any = arr[2];
          let key = this.feedService.getVideoThumbStrFromId(nodeId,channelId,postId,0);
          this.feedService.getData(key).then((imagedata)=>{
              let image = imagedata || "";
              if(image!=""){
                this.isLoadVideoiamge[id] = "13";
                vgplayer.style.display = "block";
                video.setAttribute("poster",image);
                this.setFullScreen(id);
                this.setOverPlay(id,srcId);
              }else{
                this.isLoadVideoiamge[id] = "12";
                video.style.display='none';
                vgplayer.style.display = 'none'; 
              }
            }).catch(()=>{
              vgplayer.style.display = 'none'; 
              console.log("getImageError");
            });
        }
      }else{
        let postSrc =  video.getAttribute("poster") || "";
        if(video.getBoundingClientRect().top<-this.clientHeight&&this.isLoadVideoiamge[id]==="13"&&postSrc!=""){
          video.removeAttribute("poster");
          let sourcesrc =  source.getAttribute("src") || "";
          if(sourcesrc  != ""){
            video.pause();
            source.removeAttribute("src");
          }
          this.isLoadVideoiamge[id]="";
        }
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

  removeAllVideo(){
    let videoids = this.isLoadVideoiamge;
    for(let id  in videoids){
      let value = videoids[id] || "";
      if(value === "13"){
        let videoElement:any = document.getElementById(id+'videolike') || "";
        let source:any = document.getElementById(id+'sourcelike') || "";
        videoElement.removeAttribute('poster'); // empty source
        if(source!=""){
          source.removeAttribute('src'); // empty source
          videoElement.load();
        }
      }
    }
  }

  setFullScreen(id:string){
    let vgfullscreen = document.getElementById(id+"vgfullscreelike");
    vgfullscreen.onclick=()=>{
    let isFullScreen = this.vgFullscreenAPI.isFullscreen;
    if(isFullScreen){
      this.native.setTitleBarBackKeyShown(false);
      titleBarManager.setTitle(this.translate.instant("FeedsPage.tabTitle2"));
      this.appService.addright();
    }else{
      this.native.setTitleBarBackKeyShown(false);
      titleBarManager.setTitle(this.translate.instant("common.video"));
      this.appService.hideright();
     
    }

    this.vgFullscreenAPI.toggleFullscreen(vgfullscreen);
   
 }
 }

 removeImages(){
  let iamgseids = this.isLoadimage;
  for(let id  in iamgseids){
    let value = iamgseids[id] || "";
    if(value === "13"){
      let imgElement:any = document.getElementById(id+'postimglike') || "";
      if(imgElement!=""){
          imgElement.removeAttribute('src'); // empty source
      }
      }
    }
  }


  setOverPlay(id:string,srcId:string){
    let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaylike") || "";
    let source:any = document.getElementById(id+"sourcelike") || "";

    if(vgoverlayplay!=""){
     vgoverlayplay.onclick = ()=>{
      this.zone.run(()=>{
         let sourceSrc = source.getAttribute("src") || "";
         if(sourceSrc === ""){
          this.getVideo(id,srcId);
         }
      });
     }
    }
  }

  getVideo(id:string,srcId:string){
    let arr = srcId.split("-");
    let nodeId =arr[0];
    let channelId:any = arr[1];
    let postId:any = arr[2];
    let key = this.feedService.getVideoKey(nodeId,channelId,postId,0,0);
    this.feedService.getData(key).then((videoResult:string)=>{
          this.zone.run(()=>{
            let videodata = videoResult || "";
            if (videodata == ""){
              this.cacheGetBinaryRequestKey = key;
              this.cachedMediaType = "video";
              if (this.feedService.restoreSession(nodeId)){
                this.feedService.getBinary(nodeId, key, this.cachedMediaType);
              }
              return;
            }
            this.loadVideo(id,videodata);
          }) 
        }); 
   }

   loadVideo(id:string,videodata:string){
    let source:any = document.getElementById(id+"sourcelike") || "";
    if(source === ""){
      return;
    }
    source.setAttribute("src",videodata);
    let vgbuffering:any = document.getElementById(id+"vgbufferinglike") || "";
        vgbuffering.style.display ="none";
    let video:any = document.getElementById(id+"videolike");
    video.addEventListener('ended',()=>{
        let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaylike"); 
        vgbuffering.style.display ="none";
        vgoverlayplay.style.display = "block";  
    });

    video.addEventListener('pause',()=>{
      let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaylike");
      vgoverlayplay.style.display = "block";  
  });
    video.load();
    video.play();
   }

  showBigImage(item:any){
    this.pauseAllVideo();
    this.zone.run(()=>{
      this.native.showLoading("common.waitMoment").then(()=>{
        let contentVersion = this.feedService.getContentVersion(item.nodeId,item.channelId,item.postId,0);
        let thumbkey= this.feedService.getImgThumbKeyStrFromId(item.nodeId,item.channelId,item.postId,0,0);
        let key = this.feedService.getImageKey(item.nodeId,item.channelId,item.postId,0,0);
        if(contentVersion == "0"){
             key = thumbkey;
        }  
        this.feedService.getData(key).then((realImg)=>{
          let img = realImg || "";
          if(img!=""){
            this.native.hideLoading();
            this.native.openViewer(realImg,"common.image","FeedsPage.tabTitle2",this.appService);
          }else{
            this.cacheGetBinaryRequestKey = key;
            this.cachedMediaType ="img";
            if (this.feedService.restoreSession(item.nodeId)){
              this.feedService.getBinary(item.nodeId, key,this.cachedMediaType);
            }
          }
        });
      }).catch(()=>{
        this.native.hideLoading();
      });
    });
  }

}
