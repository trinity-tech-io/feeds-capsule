import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PostfromComponent } from './postfrom.component';
import { ComponentsModule } from '../components.module'

const routes: Routes = [
  {
    path: '',
    component: PostfromComponent
  }
];

@NgModule({
  declarations: [PostfromComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]

})
export class PostfromComponentPageModule {}
