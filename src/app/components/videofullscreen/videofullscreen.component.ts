import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-videofullscreen',
  templateUrl: './videofullscreen.component.html',
  styleUrls: ['./videofullscreen.component.scss'],
})
export class VideofullscreenComponent implements OnInit {
  @Input() public postImg = '';
  @Input() public videoSrc = '';
  constructor(public modalController: ModalController) {}

  ngOnInit() {
    this.palyVideo();
  }

  ionViewDidLeave() {
    let video: any = document.getElementById('fullscreenvideo') || '';
    if (video != '') {
      video.removeAttribute('poster');
    }

    let fullscreensource: any =
      document.getElementById('fullscreensource') || '';

    if (fullscreensource != '') {
      fullscreensource.removeAttribute('src');
    }

    if (video != '') {
      let sid = setTimeout(() => {
        video.load();
        clearTimeout(sid);
      }, 10);
    }
  }

  palyVideo() {
    let video: any = document.getElementById('fullscreenvideo');
    video.setAttribute('poster', this.postImg);
    document
      .getElementById('fullscreensource')
      .setAttribute('src', this.videoSrc);
    let vgbuffering: any = document.getElementById('fullscreenvgbuffering');
    let vgoverlayplay: any = document.getElementById('fullscreenvgoverlayplay');
    let vgscrubbar: any = document.getElementById('fullscreenvgscrubbar');

    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgbuffering.style.display = 'none';
      vgscrubbar.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgscrubbar.style.display = 'block';
      vgbuffering.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgscrubbar.style.display = 'none';
    });

    video.addEventListener('canplay', () => {
      vgbuffering.style.display = 'none';
      video.play();
    });
    video.load();
  }

  tcFullScreen() {
    this.modalController.dismiss();
  }
}
