import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-profileimage',
  templateUrl: './profileimage.page.html',
  styleUrls: ['./profileimage.page.scss'],
})
export class ProfileimagePage implements OnInit {
  private select: number = 1;
  constructor() { }

  ngOnInit() {
  }

  selectIndex(index: number){
    this.select = index;
  }

}
