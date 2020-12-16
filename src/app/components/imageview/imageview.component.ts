import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from '../../services/FeedService';
@Component({
  selector: 'app-imageview',
  templateUrl: './imageview.component.html',
  styleUrls: ['./imageview.component.scss'],
})
export class ImageviewComponent implements OnInit {
  @Input() imageKeys =[];
  @Input() post:any={};
  @Input() name="";
  @Input() imageHeight = 0;
  @Output() showBigImage = new EventEmitter();
  public styleObj:any = {height:""};
  constructor(
  private feedService:FeedService
  ) { }

  ngOnInit() {
    this.styleObj.height=this.imageHeight+"px";
    this.handleImageKeys();
  }

  handleImageKeys(){
    let len = this.imageKeys.length;
    let nodeId = this.post.nodeId;
    let channelId = this.post.channel_id;
    let postId = this.post.id;
    for(let index = 0;index<len;index++){
        let imgIndex = this.imageKeys[index].index;
        let imgThumbKey = this.feedService.getImgThumbKeyStrFromId(nodeId,channelId,postId,0,imgIndex);
        let id = nodeId+channelId+postId+this.name+"_"+imgIndex+"_postimg";
        this.feedService.getData(imgThumbKey).then((image:string)=>{
            document.getElementById(id).setAttribute("src",image);
        }).catch((reason)=>{

        })
    }
  }

  showBigImg(item:any){
    this.showBigImage.emit({"imageIndex":item["index"],"nodeId":this.post.nodeId,"channel_id":this.post.channel_id,"id":this.post.id});
  }

}
