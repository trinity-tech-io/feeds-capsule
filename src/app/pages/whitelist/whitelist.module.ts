import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';

import { WhitelistPageRoutingModule } from './whitelist-routing.module';

import { WhitelistPage } from './whitelist.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    ComponentsModule,
    WhitelistPageRoutingModule
  ],
  declarations: [WhitelistPage]
})
export class WhitelistPageModule {}
