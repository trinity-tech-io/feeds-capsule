import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectIpfsNetPageRoutingModule } from './select-ipfs-net-routing.module';

import { SelectIpfsNetPage } from './select-ipfs-net.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectIpfsNetPageRoutingModule,
    ComponentsModule
  ],
  declarations: [SelectIpfsNetPage]
})
export class SelectIpfsNetPageModule {}

