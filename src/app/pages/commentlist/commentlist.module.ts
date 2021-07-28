import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { CommentlistPage } from './commentlist.page';
import { ComponentsModule } from 'src/app/components/components.module';
import { ShareModule } from 'src/app/share/share.module';

const routes: Routes = [
  {
    path: '',
    component: CommentlistPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    ShareModule,
    RouterModule.forChild(routes),
  ],
  declarations: [CommentlistPage],
})
export class CommentlistPageModule {}
