import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SelectNetPageRoutingModule } from './select-net-routing.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { SelectNetPage } from './select-net.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonicModule,
    SelectNetPageRoutingModule,
    ComponentsModule
  ],
  declarations: [SelectNetPage]
})
export class SelectNetPageModule {}
