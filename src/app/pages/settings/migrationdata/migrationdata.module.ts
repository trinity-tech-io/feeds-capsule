import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MigrationdataPageRoutingModule } from './migrationdata-routing.module';

import { MigrationdataPage } from './migrationdata.page';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    MigrationdataPageRoutingModule
  ],
  declarations: [MigrationdataPage]
})
export class MigrationdataPageModule { }
