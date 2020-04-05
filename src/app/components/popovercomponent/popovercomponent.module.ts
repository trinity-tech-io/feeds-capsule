import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PopovercomponentPage } from './popovercomponent.page';

const routes: Routes = [
  {
    path: '',
    component: PopovercomponentPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PopovercomponentPage]
})
export class PopovercomponentPageModule {}
