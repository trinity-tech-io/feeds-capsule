import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-channelcard',
  templateUrl: './channelcard.component.html',
  styleUrls: ['./channelcard.component.scss'],
})
export class ChannelcardComponent implements OnInit {
  @Input() channelItem: any = null;
  @Output() clickChannelItem = new EventEmitter();
  constructor(private feedService: FeedService) {}

  ngOnInit() {}

  parseChannelAvatar(avatar: string): string {
    return this.feedService.parseChannelAvatar(avatar);
  }

  clickChannel() {
    this.clickChannelItem.emit(this.channelItem);
  }
}
