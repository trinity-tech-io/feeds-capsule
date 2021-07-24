import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { ThemeService } from 'src/app/services/theme.service';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-elastosapiprovider',
  templateUrl: './elastosapiprovider.page.html',
  styleUrls: ['./elastosapiprovider.page.scss'],
})
export class ElastosapiproviderPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private defaltProviderName = "elastos.io";
  public curApiProviderName = "elastos.io";
  public apiProviders:any = [
    {
        key: "elastosio",
        name: "elastos.io",
        description: this.translate.instant('SettingsPage.elastos-io-des'),
        endpoints: {
          MainNet: {
            eidChainRPC: 'https://api.elastos.io/eid',
          }
        }
        // endpoints: {
        //     "MainNet": {
        //         mainChainRPC: 'https://api.elastos.io/ela',
        //         idChainRPC: 'https://api.elastos.io/did',
        //         eidChainRPC: 'https://api.elastos.io/eid',
        //         eidMiscRPC: 'https://api.elastos.io/eid-misc',
        //         eidOracleRPC: 'https://api.elastos.io/eid-oracle',
        //         escRPC: 'https://api.elastos.io/eth',
        //         escMiscRPC: 'https://api.elastos.io/misc',
        //         escOracleRPC: 'https://api.elastos.io/oracle',
        //         escBrowserRPC: 'https://eth.elastos.io',
        //         crRPC: 'https://api.cyberrepublic.org'
        //     },
        //     "TestNet": {
        //         // TODO - testnet endpoints
        //         mainChainRPC: 'https://api.elastos.io/ela',
        //         idChainRPC: 'https://api.elastos.io/did',
        //         eidChainRPC: 'https://api.elastos.io/eid',
        //         eidMiscRPC: 'https://api-testnet.elastos.io/eid-misc',
        //         eidOracleRPC: 'https://api-testnet.elastos.io/eid-oracle',
        //         escRPC: 'https://api.elastos.io/eth',
        //         escOracleRPC: 'https://api.elastos.io/oracle',
        //         escMiscRPC: 'https://api.elastos.io/misc',
        //         escBrowserRPC: 'https://eth-testnet.elastos.io',
        //         crRPC: 'https://api.cyberrepublic.org'
        //     },
        //     "LRW": {
        //       mainChainRPC: 'http://crc1rpc.longrunweather.com:18080',
        //       idChainRPC: 'http://did1rpc.longrunweather.com:18080',
        //       eidChainRPC: 'http://eid02.longrunweather.com:18080',
        //       eidMiscRPC:'',
        //       eidOracleRPC: '',
        //       escRPC:'',
        //       escOracleRPC: '',
        //       escMiscRPC: '',
        //       escBrowserRPC: '',
        //       crRPC: 'http://crapi.longrunweather.com:18080',
        //   },
        // }
    },
    {
        key: "ttechcn",
        name: "trinity-tech.cn",
        description: this.translate.instant('SettingsPage.trinity-tech-cn-des'),
        endpoints: {
          MainNet: {
            eidChainRPC: 'https://api.trinity-tech.cn/eid',
          }
        }
        // endpoints: {
        //     "MainNet": {
        //         mainChainRPC: 'https://api.trinity-tech.cn/ela',
        //         idChainRPC: 'https://api.trinity-tech.cn/did',
        //         eidChainRPC: 'https://api.trinity-tech.cn/eid',
        //         eidMiscRPC: 'https://api.trinity-tech.cn/eid-misc',
        //         eidOracleRPC: 'https://api.trinity-tech.cn/eid-oracle',
        //         escRPC: 'https://api.trinity-tech.cn/eth',
        //         escOracleRPC: 'https://api.trinity-tech.cn/eth-oracle',
        //         escMiscRPC: 'https://api.trinity-tech.cn/eth-misc',
        //         escBrowserRPC: 'https://eth.elastos.io', // TODO
        //         crRPC: 'https://api.cyberrepublic.org'
        //     },
        //     "TestNet": {
        //         mainChainRPC: 'https://api-testnet.trinity-tech.cn/ela',
        //         idChainRPC: 'https://api-testnet.trinity-tech.cn/did',
        //         eidChainRPC: 'https://api-testnet.trinity-tech.cn/eid',
        //         eidMiscRPC: 'https://api-testnet.trinity-tech.cn/eid-misc',
        //         eidOracleRPC: 'https://api-testnet.trinity-tech.cn/eid-oracle',
        //         escRPC: 'https://api-testnet.trinity-tech.cn/eth',
        //         escOracleRPC: 'https://api-testnet.trinity-tech.cn/eth-oracle',
        //         escMiscRPC: 'https://api-testnet.trinity-tech.cn/eth-misc',
        //         escBrowserRPC: 'https://eth-testnet.elastos.io',
        //         crRPC: 'https://api.cyberrepublic.org'
        //     },
        //     "LRW": {
        //       mainChainRPC: 'http://crc1rpc.longrunweather.com:18080',
        //       idChainRPC: 'http://did1rpc.longrunweather.com:18080',
        //       eidChainRPC: 'http://eid02.longrunweather.com:18080',
        //       eidMiscRPC:'',
        //       eidOracleRPC: '',
        //       escRPC:'',
        //       escOracleRPC: '',
        //       escMiscRPC: '',
        //       escBrowserRPC: '',
        //       crRPC: 'http://crapi.longrunweather.com:18080',
        //   },
        // }
        /*
        {
            type: 'settings.lrw-net',
            code: 'LrwNet',
            mainChainRPCApi: 'http://crc1rpc.longrunweather.com:18080',
            idChainRPCApi: 'http://did1rpc.longrunweather.com:18080',
            eidRPCApi: 'http://eid02.longrunweather.com:18080',
            ethscRPCApi: '',
            ethscApiMisc: '',
            ethscOracle: '',
            ethscBrowserApiUrl: '',
            crRPCApi: 'http://crapi.longrunweather.com:18080',
            icon: '/assets/icon/priv.svg'
        },
        {
            type: 'settings.priv-net',
            code: 'PrvNet',
            mainChainRPCApi: 'http://api.elastos.io:22336',
            idChainRPCApi: 'http://api.elastos.io:22606',
            eidRPCApi: 'https://api.elastos.io/eid',
            ethscRPCApi: 'http://api.elastos.io:22636',
            ethscApiMisc: 'http://api.elastos.io:22634',
            ethscOracle: 'http://api.elastos.io:22632',
            ethscBrowserApiUrl: 'https://eth.elastos.io',
            crRPCApi: 'https://api.cyberrepublic.org',
            icon: '/assets/icon/priv.svg'
        }
        */
    }
  ];
  constructor(
    private titleBarService: TitleBarService,
    private translate:TranslateService,
    public theme:ThemeService,
    private feedsService: FeedService
  ) { 
  }

  ngOnInit() {
    this.curApiProviderName = localStorage.getItem("feeds:apiprovidername") || this.defaltProviderName;
  }

  ionViewWillEnter() {
    this.initTitle();
  }

  initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant('SettingsPage.elastosapiprovider'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  useProvider(provider:any){
    console.log(provider.endpoints.MainNet.eidChainRPC);
    if (this.curApiProviderName != provider.name){
      this.curApiProviderName = provider.name;
      localStorage.setItem("feeds:apiprovidername",provider.name);
      this.feedsService.setEidURL(provider.endpoints.MainNet.eidChainRPC);
    }
    
  }


}
