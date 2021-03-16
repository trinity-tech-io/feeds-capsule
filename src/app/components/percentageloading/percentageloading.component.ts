import { Component, OnInit,Input} from '@angular/core';

@Component({
  selector: 'app-percentageloading',
  templateUrl: './percentageloading.component.html',
  styleUrls: ['./percentageloading.component.scss'],
})
export class PercentageloadingComponent implements OnInit {
  @Input() public percent:number = 0;
  @Input() public rotateNum:any ={};
  constructor() { }

  ngOnInit() {}

}
