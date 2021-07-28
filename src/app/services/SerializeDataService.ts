import { Injectable } from '@angular/core';
var msgpack = require('@ygoe/msgpack');
@Injectable()
export class SerializeDataService {
  constructor() {}

  decodeData(data: any): string {
    if (data == null) return '';
    return msgpack.deserialize(data);
  }

  encodeData(object: any): Uint8Array {
    return msgpack.serialize(object);
  }
}
