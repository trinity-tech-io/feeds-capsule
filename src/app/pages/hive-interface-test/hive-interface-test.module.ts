import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HiveInterfaceTestPageRoutingModule } from './hive-interface-test-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { HiveInterfaceTestPage } from './hive-interface-test.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HiveInterfaceTestPageRoutingModule,
    ComponentsModule,
    TranslateModule
  ],
  declarations: [HiveInterfaceTestPage]
})
export class HiveInterfaceTestPageModule { }
