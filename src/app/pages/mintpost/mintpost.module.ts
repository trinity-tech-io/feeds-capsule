import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { MintpostPageRoutingModule } from './mintpost-routing.module';

import { MintpostPage } from './mintpost.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    MintpostPageRoutingModule,
    ComponentsModule
  ],
  declarations: [MintpostPage]
})
export class MintpostPageModule {}
