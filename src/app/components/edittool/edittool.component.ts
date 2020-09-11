import { Component, OnInit } from '@angular/core';
import { PopoverController,NavParams} from '@ionic/angular';
import { ThemeService } from 'src/app/services/theme.service';
import { NativeService } from 'src/app/services/NativeService';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-edittool',
  templateUrl: './edittool.component.html',
  styleUrls: ['./edittool.component.scss'],
})
export class EdittoolComponent implements OnInit {
  public nodeId:string ="";
  public channelId:number =0;
  public postId:number = 0;
  public commentById:Number = 0;
  public commentId:number = 0;
  public  content:string = "";
  constructor(
    public theme:ThemeService,
    private navParams: NavParams,
    private popover: PopoverController, 
    private native:NativeService,
    private feedService: FeedService,
  ) { }

  ngOnInit() {
    this.nodeId = this.navParams.get('nodeId')||"";
    this.channelId = this.navParams.get('channelId')|| 0;
    this.postId = this.navParams.get('postId')|| 0;
    this.commentById = this.navParams.get('commentById')|| 0;
    this.commentId = this.navParams.get('commentId')|| 0;
    this.content = this.navParams.get('content')|| "";
  }

  edit(){
    this.popover.dismiss();
    this.native.go("editcomment",{
      nodeId:this.nodeId,
      channelId:this.channelId,
      postId:this.postId,
      commentById:this.commentById,
      commentId:this.commentId,
      content:this.content
    });
  }

  remove(){
    this.popover.dismiss();
    this.native.showLoading("common.waitMoment",50000).then(()=>{
      this.feedService.deleteComment(this.nodeId,Number(this.channelId),Number(this.postId),Number(this.commentId));
    }).catch(()=>{

    })
  }

}
