import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
//import { NgxIonicImageViewerModule } from 'ngx-ionic-image-viewer';
import { PostdetailPage } from './postdetail.page';

const routes: Routes = [
  {
    path: '',
    component: PostdetailPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    RouterModule.forChild(routes),
    //NgxIonicImageViewerModule,
  ],
  declarations: [PostdetailPage]
})
export class PostdetailPageModule {}
