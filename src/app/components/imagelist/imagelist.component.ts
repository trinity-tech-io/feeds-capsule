import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-imagelist',
  templateUrl: './imagelist.component.html',
  styleUrls: ['./imagelist.component.scss'],
})
export class ImagelistComponent implements OnInit {
  @Input() isShowDelete:boolean=false;
  @Input() imagelist:any =[];
  @Output() deleteImage = new EventEmitter();
  @Output() showBigImage = new EventEmitter();
  public styleObj:any = {height:""};
  constructor() { }

  ngOnInit() {
    this.styleObj.height=(screen.width-72)/3+"px";
  }

  delimg(index:number){
    this.deleteImage.emit({"imageIndex":index});
  }

  showBigImg(index:number){
    this.showBigImage.emit({"imageIndex":index});
  }

}
