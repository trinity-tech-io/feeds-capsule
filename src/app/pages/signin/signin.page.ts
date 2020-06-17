import { Component, OnInit, NgZone } from '@angular/core';
declare let appManager: AppManagerPlugin.AppManager;
declare let didManager: DIDPlugin.DIDManager;
import { FeedService } from 'src/app/services/FeedService';
import { CarrierService } from 'src/app/services/CarrierService';
import { Router} from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
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
    // this.feedService.removeAllData();
  }

  signIn(){
    if (this.fakedata){
      this.saveData("did:elastos:iaP7GCmtcbf3Kiy7PX8zUVaWTzZQG3Kkka",
              "fakename",
              "fakeemail",
              "faketelephone",
              "fakelocation",
              "fakedescription");
      
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
        },
        description:{
          required: false,
          reason: "Maybe Feeds dapp need"
        }
      }
    }, {}, (response: any) => {
      if (response && response.result && response.result.presentation) {
        let data = response.result;
        console.log("result ==>"+JSON.stringify(response.result));

        console.log("presentation ==>"+JSON.stringify(response.result.presentation));

        // Create a real presentation object from json data
        didManager.VerifiablePresentationBuilder.fromJson(JSON.stringify(response.result.presentation), (presentation)=>{
          this.zone.run(()=>{
            let credentials = presentation.getCredentials();

            console.log("credentials ==>"+JSON.stringify(credentials));

            this.saveCredentialById(data.did,credentials, "name");

            this.saveData(
              data.did,
              this.findCredentialValueById(data.did, credentials, "name", "Not provided"),
              this.findCredentialValueById(data.did, credentials, "email", "Not provided"),
              this.findCredentialValueById(data.did, credentials, "telephone", "Not provided"),
              this.findCredentialValueById(data.did, credentials, "nation", "Not provided"),
              this.findCredentialValueById(data.did, credentials, "description", "Not provided")
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

  saveCredentialById(did: string, credentials: DIDPlugin.VerifiableCredential[], fragment: string) {
    let matchingCredential = credentials.find((c)=>{
      return c.getFragment() == fragment;
    });

    if (matchingCredential){
      this.feedService.saveCredential(JSON.stringify(matchingCredential));
    }
  }

  initApp(){
    this.carrierService.init();
    // this.router.navigate(['/favorite']);
    this.router.navigate(['/tabs']);
  }

  saveData(did: string, name: string, email: string, telephone: string, location: string, description: string){
    console.log("name = "+name);
    this.feedService.saveSignInData(did,name,email,telephone,location, description);
  }
}
