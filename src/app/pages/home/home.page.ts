import { Component, OnInit, NgZone } from '@angular/core';
declare let appManager: AppManagerPlugin.AppManager;
declare let didManager: DIDPlugin.DIDManager;
import { FeedService } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Router} from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private fakedata:boolean = false;
  public signedIn: boolean = false;
  public did: string = "";
  public userName: string = "";
  public emailAddress: string = "";

  constructor(
    private zone: NgZone,
    private feedService: FeedService,
    private router: Router,
    public loadingController: LoadingController,
    private carrierService:CarrierService) { }

  ngOnInit() {
  }

  signIn(){
    if (this.fakedata){
      this.saveData("did:elastos:ifakedid",
                    "fakename",
                    "fakeemail",
                    "faketelephone",
                    "fakelocation");
      this.feedService.updateSignInDataExpTimeTo(this.feedService.getSignInData(),0);
      this.initApp();
      return;
    }

    this.zone.run(()=>{
      this.presentLoading();
    });
    appManager.sendIntent("credaccess", {
      claims: {
        name: true, 
        email: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        gender: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        telephone: {
          required: false,
          reason: "Maybe Feeds dapp need"
        },
        nation: {
          required: false,
          reason: "Maybe Feeds dapp need"
        }
      }
    }, {}, (response: any) => {
      console.log("Credential access response received", response)

      if (response && response.result && response.result.presentation) {
        console.log("Received a presentation, so we are now signed in.");
        let data = response.result;

        // Create a real presentation object from json data
        didManager.VerifiablePresentationBuilder.fromJson(JSON.stringify(response.result.presentation), (presentation)=>{
          this.zone.run(()=>{
            let credentials = presentation.getCredentials();
            this.saveData(
              data.did,
              this.findCredentialValueById(this.did, credentials, "name", "Not provided"),
              this.findCredentialValueById(this.did, credentials, "email", "Not provided"),
              this.findCredentialValueById(this.did, credentials, "telephone", "Not provided"),
              this.findCredentialValueById(this.did, credentials, "nation", "Not provided")
              );
            this.initApp();
          });
        });
      }
    });
    
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 2000
    });
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
    console.log('Loading dismissed!');
  }
  findCredentialValueById(did: string, credentials: DIDPlugin.VerifiableCredential[], fragment: string, defaultValue: string) {
    let matchingCredential = credentials.find((c)=>{
      return c.getFragment() == fragment;
    });

    if (!matchingCredential)
      return defaultValue;
    else
      return matchingCredential.getSubject()[fragment];
  }

  initApp(){
    this.carrierService.init();
    this.router.navigate(['/favorite']);
  }

  saveData(did: string, name: string, email: string, telephone: string, location: string){
    this.feedService.saveSignInData(did,name,email,telephone,location);
  }
}
