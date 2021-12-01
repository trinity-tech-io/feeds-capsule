import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { DatastoragePageRoutingModule } from './datastorage-routing.module';
import { DatastoragePage } from './datastorage.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    DatastoragePageRoutingModule
  ],
  declarations: [DatastoragePage]
})
export class DatastoragePageModule { }
