import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from '../../services/NativeService';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  private did: string = "";
  private name: string = "";
  private gender: string = "";
  private email: string = "";
  private telephone: string = "";
  private location: string = "";
  private ownChannelSourceDid: string = "";

  constructor(
    private event: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService: FeedService) {
      this.event.subscribe('feeds:bindServerFinish', (bindingServer)=>{
        this.ownChannelSourceDid = bindingServer.did;
      })

      let signInData = this.feedService.getSignInData();
      this.did = signInData.did;
      this.name = signInData.name;
      this.email = signInData.email;
      this.telephone = signInData.telephone;
      this.location = signInData.location;

      let bindingServer = this.feedService.getOwnChannelSource();
      if (bindingServer != null && bindingServer != undefined){
        this.ownChannelSourceDid = bindingServer.did;
        console.log("bindingServer ==>"+JSON.stringify(bindingServer));
      }
        

    }

  ngOnInit() {}
}
