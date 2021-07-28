import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-roundloading',
  templateUrl: './roundloading.component.html',
  styleUrls: ['./roundloading.component.scss'],
})
export class RoundloadingComponent implements OnInit {
  constructor(public theme: ThemeService) {}

  ngOnInit() {}
}
