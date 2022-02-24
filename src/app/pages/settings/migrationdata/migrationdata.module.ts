import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MigrationdataPageRoutingModule } from './migrationdata-routing.module';

import { MigrationdataPage } from './migrationdata.page';
import { TranslateModule } from '@ngx-translate/core';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    MigrationdataPageRoutingModule
  ],
  declarations: [MigrationdataPage]
})
export class MigrationdataPageModule { }
