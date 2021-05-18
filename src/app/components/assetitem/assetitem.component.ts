import { Component, OnInit,Input,Output,EventEmitter} from '@angular/core';
@Component({
  selector: 'app-assetitem',
  templateUrl: './assetitem.component.html',
  styleUrls: ['./assetitem.component.scss'],
})
export class AssetitemComponent implements OnInit {
  @Input () assetItem:any = null;
  @Output() clickAssetItem = new EventEmitter();
  constructor() { }

  ngOnInit() {}

  clickItem(){
    this.clickAssetItem.emit(this.assetItem);
  }

}
