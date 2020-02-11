import { Injectable } from "@angular/core";

@Injectable()
export class FavoriteFeed {
  constructor(
      public name: string,
      public unread: number,
      public lastReceived: string = '') {}
}

export class MyFeed {
  constructor(
    public avatar: string,
    public name: string,
    public lastUpdated: string) {}
}

export class FeedService {
  private favorFeeds = [
    new FavoriteFeed('Carrier News', 24),
    new FavoriteFeed('Hive News', 35),
    new FavoriteFeed('Football', 4),
    new FavoriteFeed('Trinity News', 0, '12:00 Dec.12'),
    new FavoriteFeed('Hollywood Movies', 24),
    new FavoriteFeed('Cofee', 35),
    new FavoriteFeed('MacBook', 4),
    new FavoriteFeed('Rust development', 0, '12:00 Desc.12'),
    new FavoriteFeed('Golang', 8)
  ];

  private myFeeds = [
    new MyFeed('paper', 'Carrier News', '12:10 Dec. 12, 2019'),
    new MyFeed('paper', 'Hive News', '12:10 Dec.12, 2019'),
    new MyFeed('paper', 'Trinity News', '12:10 Dec.12, 2019'),
    new MyFeed('paper', 'DID News', '12:10 Dec.12, 2019'),
    new MyFeed('paper', 'DID SideChain News', '12:10 Dec.12, 2019'),
    new MyFeed('paper', 'Football News', '12:10 Dec.12, 2019'),
  ];

  private feedDescs = [
    {
      avatar: 'page',
      title: 'Carrier News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'Hive News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'Trinity News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'DID News',
      followState: 'follow'
    },
    {
      avatar: 'page',
      title: 'DMA News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'Football News',
      followState: 'follow'
    },
    {
      avatar: 'page',
      title: 'Trinity News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'DID News',
      followState: 'follow'
    },
    {
      avatar: 'page',
      title: 'DMA News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'Football News',
      followState: 'follow'
    },
    {
      avatar: 'page',
      title: 'Trinity News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'DID News',
      followState: 'follow'
    },
    {
      avatar: 'page',
      title: 'DMA News',
      followState: 'following'
    },
    {
      avatar: 'page',
      title: 'Football News',
      followState: 'follow'
    }
  ];

  feedIntro =  {
    description:
        `bb Keep close to Nature's heart... and break clear away, once in awhile,
        and climb a mountain or spend a week in the woods. Wash your spirit clean.`
  };

  feedEvents = [
    {
      timestamp: '12:00, December 10, 2019',
      message:
        `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    },
    {
      timestamp: '15:00, December 10, 2019',
      message:
        `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    },
    {
      timestamp: '15:00, December 12, 2019',
      message:
        `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    },
    {
      timestamp: '15:00, December 14, 2019',
      message:
        `Elastos Trinity DApp Store is your one-stop shop for finding the latest dApps available inside the Elastos ecosystem.
        The key difference between the applications available here and what you will find in any other app store is
        Elastos' guarantee of 100% security and privacy. All Elastos applications are decentralized, thus giving you
        the freedom to use the web as you should without the worries of data theft and third parties monetizing your data`
    }
  ];

  public constructor() {
  }

  public getFavorFeeds() {
      return this.favorFeeds;
  }

  public getAllFeeds() {
      return this.feedDescs;
  }

  public getFeedDescr(_name: string) {
      return this.feedIntro;
  }

  public getFeedEvents(_name: string) {
      return this.feedEvents;
  }

  public getMyFeeds() {
    return this.myFeeds;
  }
}
