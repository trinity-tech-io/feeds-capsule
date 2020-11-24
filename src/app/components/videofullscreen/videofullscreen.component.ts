import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-videofullscreen',
  templateUrl: './videofullscreen.component.html',
  styleUrls: ['./videofullscreen.component.scss'],
})
export class VideofullscreenComponent implements OnInit {
  @Input() public postImg = "";
  @Input() public videoSrc = "";
  constructor() { }

  ngOnInit() {
    this.palyVideo();
  }

 

  ionViewDidLeave(){
  
    let video:any =  document.getElementById("fullscreenvideo") || "";
    if(video!=""){
      video.removeAttribute('poster');
    }

    let fullscreensource:any =  document.getElementById("fullscreensource") || "";

    if(fullscreensource!=""){
      fullscreensource.removeAttribute("src");
    }
   

    if(video!=""){
       let sid=setTimeout(()=>{
            video.load();
            clearTimeout(sid);
    },10)
    }
  }

  
  palyVideo(){
    let video:any =  document.getElementById("fullscreenvideo");
    video.setAttribute("poster",this.postImg);
    document.getElementById("fullscreensource").setAttribute("src",this.videoSrc);
    let vgbuffering:any = document.getElementById("fullscreenvgbuffering");
    let vgoverlayplay:any = document.getElementById("fullscreenvgoverlayplay");
    let vgscrubbar:any = document.getElementById("fullscreenvgscrubbar");
 
     video.addEventListener('ended',()=>{
    vgbuffering.style.display ="none";
    vgoverlayplay.style.display = "block";
    vgscrubbar.style.display ="none";  
  });

  video.addEventListener('pause',()=>{
  vgbuffering.style.display ="none";
  vgoverlayplay.style.display = "block"; 
  vgscrubbar.style.display ="none";
  });

  video.addEventListener('play',()=>{
    vgscrubbar.style.display ="block"; 
   });


  video.addEventListener('canplay',()=>{
        vgbuffering.style.display ="none";
        video.play(); 
  });

video.load();
  }

}
