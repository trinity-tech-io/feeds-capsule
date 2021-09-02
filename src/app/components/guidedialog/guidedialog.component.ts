import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
@Component({
  selector: 'app-guidedialog',
  templateUrl: './guidedialog.component.html',
  styleUrls: ['./guidedialog.component.scss'],
})
export class GuidedialogComponent implements OnInit {

  constructor(public theme: ThemeService) { }

  ngOnInit() {}

}
