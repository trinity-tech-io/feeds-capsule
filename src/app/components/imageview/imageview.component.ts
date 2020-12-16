import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from '../../services/FeedService';
@Component({
  selector: 'app-imageview',
  templateUrl: './imageview.component.html',
  styleUrls: ['./imageview.component.scss'],
})
export class ImageviewComponent implements OnInit {
  @Input() imageKeys =[];
  @Output() showBigImage = new EventEmitter();
  public styleObj:any = {height:""};
  constructor(
  private feedService:FeedService
  ) { }

  ngOnInit() {
    this.styleObj.height=(screen.width-72)/3+"px";
    this.handleImageKeys();
  }

  handleImageKeys(){
    let len = this.imageKeys.length;
    for(let index = 0;index<len;index++){
        let imgThumbKey = this.imageKeys[index]["imgThumbKey"];
        this.feedService.getData(imgThumbKey).then((image:string)=>{
            document.getElementById(imgThumbKey).setAttribute("src",image);
        }).catch((reason)=>{

        })
    }
  }

  showBigImg(item:any){
    this.showBigImage.emit({"imageIndex":item["index"]});
  }

}
