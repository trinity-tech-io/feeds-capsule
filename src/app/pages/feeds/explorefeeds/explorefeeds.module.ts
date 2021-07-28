import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { ComponentsModule } from 'src/app/components/components.module';
import { ExplorefeedsPage } from './explorefeeds.page';

const routes: Routes = [
  {
    path: '',
    component: ExplorefeedsPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ComponentsModule,
    TranslateModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [ExplorefeedsPage],
})
export class ExplorefeedsPageModule {}
