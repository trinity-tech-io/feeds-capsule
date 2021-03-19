
import {Injectable} from '@angular/core';

@Injectable()
export class UtilService {
                 /**
   * 格式化日期
   * sFormat：日期格式:默认为yyyy-MM-dd     年：y，月：M，日：d，时：h，分：m，秒：s
   * @example  dateFormat(new Date(),'yyyy-MM-dd')   "2017-02-28"
   * @example  dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss')   "2017-02-28 09:24:00"
   * @example  dateFormat(new Date(),'hh:mm')   "09:24"
   * @param date 日期
   * @param sFormat 格式化后的日期字符串
   * @returns {String}
   */
private static oneminute = 60*1000;
private static oneHour = 60*60*1000;
public  static hour24 = 24*60*60*1000;
public  static hour48 = 48*60*60*1000;
public static dateFormat(date: Date, sFormat: String = 'yyyy-MM-dd'): string {
    let time = {
      Year: 0,
      TYear: '0',
      Month: 0,
      TMonth: '0',
      Day: 0,
      TDay: '0',
      Hour: 0,
      THour: '0',
      hour: 0,
      Thour: '0',
      Minute: 0,
      TMinute: '0',
      Second: 0,
      TSecond: '0',
      Millisecond: 0
    };
    time.Year = date.getFullYear();
    time.TYear = String(time.Year).substr(2);
    time.Month = date.getMonth() + 1;
    time.TMonth = time.Month < 10 ? "0" + time.Month : String(time.Month);
    time.Day = date.getDate();
    time.TDay = time.Day < 10 ? "0" + time.Day : String(time.Day);
    time.Hour = date.getHours();
    time.THour = time.Hour < 10 ? "0" + time.Hour : String(time.Hour);
    time.hour = time.Hour < 13 ? time.Hour : time.Hour - 12;
    time.Thour = time.hour < 10 ? "0" + time.hour : String(time.hour);
    time.Minute = date.getMinutes();
    time.TMinute = time.Minute < 10 ? "0" + time.Minute : String(time.Minute);
    time.Second = date.getSeconds();
    time.TSecond = time.Second < 10 ? "0" + time.Second : String(time.Second);
    time.Millisecond = date.getMilliseconds();

    return sFormat.replace(/yyyy/ig, String(time.Year))
      .replace(/yyy/ig, String(time.Year))
      .replace(/yy/ig, time.TYear)
      .replace(/y/ig, time.TYear)
      .replace(/MM/g, time.TMonth)
      .replace(/M/g, String(time.Month))
      .replace(/dd/ig, time.TDay)
      .replace(/d/ig, String(time.Day))
      .replace(/HH/g, time.THour)
      .replace(/H/g, String(time.Hour))
      .replace(/hh/g, time.Thour)
      .replace(/h/g, String(time.hour))
      .replace(/mm/g, time.TMinute)
      .replace(/m/g, String(time.Minute))
      .replace(/ss/ig, time.TSecond)
      .replace(/s/ig, String(time.Second))
      .replace(/fff/ig, String(time.Millisecond))
  }

  public static handleDisplayTime(createTime:number){
      let disPlayStr:any;
      let postDate = new Date(createTime);
      let curData = new Date();
      let curTime = curData.getTime();
      let postyear = postDate.getFullYear();
      let curyear = curData.getFullYear();
      let chazhi = curTime - createTime;

      if(chazhi>0&&chazhi<this.oneminute){
        return {content:"",type:"s"};
      }
      if(chazhi>=this.oneminute&&chazhi<this.oneHour){
           disPlayStr = Math.floor(chazhi/(1000*60));
           return {content:disPlayStr,type:"m"};
      }

      if(chazhi>=this.oneHour&&chazhi<this.hour24){
           disPlayStr = Math.floor(chazhi/(1000*60*60));
           return {content:disPlayStr,type:"h"};
      }

      if(chazhi>=this.hour24&&chazhi<(7*this.hour24)){
        disPlayStr = Math.floor(chazhi/(24*1000*60*60));
        return {content:disPlayStr,type:"day"};
      }

      if(chazhi>=(7*this.hour24)&&postyear===curyear){
        disPlayStr = this.dateFormat(new Date(createTime),"MM-dd");
        return  {content:disPlayStr,type:"d"};
      }
      disPlayStr = this.dateFormat(new Date(createTime),"MM-dd-yyyy");
      return  {content:disPlayStr,type:"y"};
  }

  public static moreNanme(name:string,num:number = 15){
     let feedsName = name || "";
     if(feedsName === ""){
       return feedsName;
     }
     let sizeNum = this.getSize(feedsName);
     if(sizeNum>num){
          return this.sb_substr(feedsName,0,num)+'...'
     }else{
          return feedsName;
     }
  }

  public static timeFilter(seconds:number) {
    let ss = parseInt(seconds+'')// 秒
    let mm = 0// 分
    let hh = 0// 小时
    if (ss > 60) {
      mm = parseInt((ss/60)+'')
      ss = parseInt((ss%60)+'')
    }
    if (mm > 60) {
      hh = parseInt((mm/60)+'')
      mm = parseInt((mm%60)+'')
    }
    var result = ('00' + parseInt(ss+'')).slice(-2)
    if (mm > 0) {
      result = ('00' + parseInt(mm+'')).slice(-2) + ':' + result
    } else {
      result = '00:' + result
    }
    if (hh > 0) {
      result = ('00' + parseInt(hh+'')).slice(-2) + ':' + result
    }
    return result
  }

  public static getSize(dataName:string) {
    let i = 0;
    let c = 0.0;
    let unicode = 0;
    let len = 0;
    if (dataName == null || dataName == "") {
     return 0;
    }
    len = dataName.length;
    for(i = 0; i < len; i++) {
      unicode = dataName.charCodeAt(i);
     if (unicode < 127) { //判断是单字符还是双字符
      c += 1;
     } else {  //chinese
      c += 2;
     }
    }
    return c;
    }

  //  public static async getSha256Hash(text:string){
  //     const hash = new Sha256();
  //     hash.update(text);
  //     let result = await hash.digest();
  //     return result;
  //  }

  /**
*
* Secure Hash Algorithm (SHA256)
* http://www.webtoolkit.info/
*
* Original code by Angel Marin, Paul Johnston.
*
**/
  public static SHA256(s:string){
    var chrsz = 8;
    var hexcase = 0;
    function safe_add (x, y) {
      var lsw = (x & 0xFFFF) + (y & 0xFFFF);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    }
    function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
    function R (X, n) { return ( X >>> n ); }
    function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
    function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
    function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
    function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
    function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
    function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
    function core_sha256 (m, l) {
      var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
      var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
      var W = new Array(64);
      var a, b, c, d, e, f, g, h, i, j;
      var T1, T2;
      m[l >> 5] |= 0x80 << (24 - l % 32);
      m[((l + 64 >> 9) << 4) + 15] = l;
      for (let i = 0; i<m.length; i+=16 ) {
        a = HASH[0];
        b = HASH[1];
        c = HASH[2];
        d = HASH[3];
        e = HASH[4];
        f = HASH[5];
        g = HASH[6];
        h = HASH[7];
        for (let j = 0; j<64; j++) {
          if (j < 16) W[j] = m[j + i];
          else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
          T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
          T2 = safe_add(Sigma0256(a), Maj(a, b, c));
          h = g;
          g = f;
          f = e;
          e = safe_add(d, T1);
          d = c;
          c = b;
          b = a;
          a = safe_add(T1, T2);
        }
        HASH[0] = safe_add(a, HASH[0]);
        HASH[1] = safe_add(b, HASH[1]);
        HASH[2] = safe_add(c, HASH[2]);
        HASH[3] = safe_add(d, HASH[3]);
        HASH[4] = safe_add(e, HASH[4]);
        HASH[5] = safe_add(f, HASH[5]);
        HASH[6] = safe_add(g, HASH[6]);
        HASH[7] = safe_add(h, HASH[7]);
      }
      return HASH;
    }
    function str2binb (str) {
      var bin = Array();
      var mask = (1 << chrsz) - 1;
      for(var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
      }
      return bin;
    }
    function Utf8Encode(string) {
      string = string.replace(/\r\n/g,"\n");
      var utftext = "";
      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }
    function binb2hex (binarray) {
      var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
      var str = "";
      for(var i = 0; i < binarray.length * 4; i++) {
        str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
        hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8 )) & 0xF);
      }
      return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
  }

  public static gethtmlId(page:string,type:string,nodeId:string,feedId:number,postId:number){
        return page+"-"+type+"-"+nodeId+"-"+feedId+"-"+postId;
  }

  //截取字符
  public static sb_substr(str:string, startp:number, endp:number) {
    let i=0;
    let c = 0;
    let rstr = '';
    var len = str.length;
    var sblen = this.getSize(str);
    if (startp < 0) {
        startp = sblen + startp;
    }
    if (endp < 1) {
        endp = sblen + endp;// - ((str.charCodeAt(len-1) < 127) ? 1 : 2);
    }
    // 寻找起点
    for(i = 0; i < len; i++) {
        if (c >= startp) {
            break;
        }
     let unicode = str.charCodeAt(i);
  if (unicode < 127) {
   c += 1;
  } else {
   c += 2;
  }
 }
 // 开始取
 for(i = i; i < len; i++) {
     let unicode = str.charCodeAt(i);
  if (unicode < 127) {
   c += 1;
  } else {
   c += 2;
  }
  rstr += str.charAt(i);
  if (c >= endp) {
      break;
  }
 }
 return rstr;
}


}

