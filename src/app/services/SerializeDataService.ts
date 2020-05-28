import { Injectable } from '@angular/core';
import { encode, decode } from "@msgpack/msgpack";

// const object = {
//   nil: null,
//   integer: 1,
//   float: Math.PI,
//   string: "Hello, world!",
//   binary: Uint8Array.from([1, 2, 3]),
//   array: [10, 20, 30],
//   map: { foo: "bar" },
//   timestampExt: new Date(),
// };

// const encoded: Uint8Array = encode(object);

// deepStrictEqual(decode(encoded), object);
@Injectable()
export class SerializeDataService {
    constructor() {
    }
    decodeData(data: any): unknown{
        return decode(data);
    }

    encodeData(object: any):Uint8Array{
        return encode(object);
    }
}
