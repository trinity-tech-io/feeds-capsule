import { Component, OnInit, NgZone } from '@angular/core';
import { Events } from '@ionic/angular';
import { CarrierService } from 'src/app/services/CarrierService';
import { JsonRPCService } from 'src/app/services/JsonRPCService';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  private imgUrl: string = "../../../assets/images/avatar.svg";

  constructor(
    private jsonRPC: JsonRPCService,
    private zone: NgZone,
    private actionSheetController:ActionSheetController) {
  }

  ngOnInit() {
  }

  async openCamera(){

  }

  test(){
    let params = {};
      params["topic"] = "ttt";
      params["desc"] = "ddd";
    console.log( this.jsonRPC.request("meth","mynodeid",params,null,null));
    // {"jsonrpc":"2.0","method":"create_topic","params":{"topic":"news","desc":"daily"},"id":null}
    // let response = '{"jsonrpc": "2.0","result": null,"id": "0"}';//create topic //post event //subscribe //unsubscribe
    // let response = '{"jsonrpc": "2.0","result": [{"name": "topic名称(string)", "desc": "topic描述(string)"}],"id": "id(JSON-RPC conformed type)"}'; //list owned topics //explore topics //list subscribed topics
    // let response = '{"jsonrpc": "2.0","result": [{"seqno": "序列号（以升序返回）(number)", "event": "事件内容(string)","ts": "事件发布时的时间戳（UNIX Epoch格式）(number)"}],"id": "id(JSON-RPC conformed type)"}';//fetch unreceived events
    // let response = '{"jsonrpc": "2.0","method": "new_event","params": {"topic": "topic名称(string)","event": "事件内容(string)","seqno": "序列号(number)","ts": "时间戳(number)"}}';
    // console.log(this.jsonRPC.response("123",response));
  }
}
