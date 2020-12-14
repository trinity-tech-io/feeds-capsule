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
  constructor() { }

  ngOnInit() {}

  delimg(index:number){
    this.deleteImage.emit({"imageIndex":index});
  }

  showBigImg(index:number){
    this.showBigImage.emit({"imageIndex":index});
  }

}
