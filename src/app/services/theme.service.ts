import { Injectable} from '@angular/core';
import { Platform } from '@ionic/angular';
import { ThemeDetection,ThemeDetectionResponse} from '@ionic-native/theme-detection';
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public darkMode = true;
  constructor(
    private platform: Platform) {
    this.platform.ready().then(() => {
      this.getTheme();
    });
  }

  getTheme() {
    let isDrakMode = localStorage.getItem('org.elastos.dapp.feeds.isDrakMode') || "";
    if(isDrakMode === ""){
      this.getSystemMode();
     return;
    }
    this.setTheme(JSON.parse(isDrakMode));
  }

  getSystemMode(){
    ThemeDetection.isAvailable().then((res: ThemeDetectionResponse) => {
      if(res.value) {
        ThemeDetection.isDarkModeEnabled().then((darkModeRes: ThemeDetectionResponse) => {
              if(darkModeRes.value){
               this.darkMode = true;
               this.setTheme(this.darkMode);
              }else{
               this.darkMode = false;
               this.setTheme(this.darkMode);
             }
        })
        .catch(() =>{
         this.darkMode = false;
         this.setTheme(this.darkMode);
        }
       );
      }else{
       this.darkMode = false;
       this.setTheme(this.darkMode);
      }
   }).catch(
     (error: any) => {
      this.darkMode = false;
      this.setTheme(this.darkMode);
     }
   );
  }

  setTheme(dark:boolean) {
    this.darkMode = dark;
    if (this.darkMode) {
      // Set dark mode globally
      document.body.classList.add("dark");
    } else {
      // Remove dark mode globally
      document.body.classList.remove("dark");
    }

    localStorage.setItem("org.elastos.dapp.feeds.isDrakMode",JSON.stringify(this.darkMode));
  }
}
