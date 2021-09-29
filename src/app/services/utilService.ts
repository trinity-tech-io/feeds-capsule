import { Injectable } from '@angular/core';
import { FileHelperService } from 'src/app/services/FileHelperService';

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
  private static oneminute = 60 * 1000;
  private static oneHour = 60 * 60 * 1000;
  public static hour24 = 24 * 60 * 60 * 1000;
  public static hour48 = 48 * 60 * 60 * 1000;
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
      Millisecond: 0,
    };
    time.Year = date.getFullYear();
    time.TYear = String(time.Year).substr(2);
    time.Month = date.getMonth() + 1;
    time.TMonth = time.Month < 10 ? '0' + time.Month : String(time.Month);
    time.Day = date.getDate();
    time.TDay = time.Day < 10 ? '0' + time.Day : String(time.Day);
    time.Hour = date.getHours();
    time.THour = time.Hour < 10 ? '0' + time.Hour : String(time.Hour);
    time.hour = time.Hour < 13 ? time.Hour : time.Hour - 12;
    time.Thour = time.hour < 10 ? '0' + time.hour : String(time.hour);
    time.Minute = date.getMinutes();
    time.TMinute = time.Minute < 10 ? '0' + time.Minute : String(time.Minute);
    time.Second = date.getSeconds();
    time.TSecond = time.Second < 10 ? '0' + time.Second : String(time.Second);
    time.Millisecond = date.getMilliseconds();

    return sFormat
      .replace(/yyyy/gi, String(time.Year))
      .replace(/yyy/gi, String(time.Year))
      .replace(/yy/gi, time.TYear)
      .replace(/y/gi, time.TYear)
      .replace(/MM/g, time.TMonth)
      .replace(/M/g, String(time.Month))
      .replace(/dd/gi, time.TDay)
      .replace(/d/gi, String(time.Day))
      .replace(/HH/g, time.THour)
      .replace(/H/g, String(time.Hour))
      .replace(/hh/g, time.Thour)
      .replace(/h/g, String(time.hour))
      .replace(/mm/g, time.TMinute)
      .replace(/m/g, String(time.Minute))
      .replace(/ss/gi, time.TSecond)
      .replace(/s/gi, String(time.Second))
      .replace(/fff/gi, String(time.Millisecond));
  }

  public static handleDisplayTime(createTime: number) {
    let disPlayStr: any;
    let postDate = new Date(createTime);
    let curData = new Date();
    let curTime = curData.getTime();
    let postyear = postDate.getFullYear();
    let curyear = curData.getFullYear();
    let chazhi = curTime - createTime;

    if (chazhi > 0 && chazhi < this.oneminute) {
      return { content: '', type: 's' };
    }
    if (chazhi >= this.oneminute && chazhi < this.oneHour) {
      disPlayStr = Math.floor(chazhi / (1000 * 60));
      return { content: disPlayStr, type: 'm' };
    }

    if (chazhi >= this.oneHour && chazhi < this.hour24) {
      disPlayStr = Math.floor(chazhi / (1000 * 60 * 60));
      return { content: disPlayStr, type: 'h' };
    }

    if (chazhi >= this.hour24 && chazhi < 7 * this.hour24) {
      disPlayStr = Math.floor(chazhi / (24 * 1000 * 60 * 60));
      return { content: disPlayStr, type: 'day' };
    }

    if (chazhi >= 7 * this.hour24 && postyear === curyear) {
      disPlayStr = this.dateFormat(new Date(createTime), 'MM-dd');
      return { content: disPlayStr, type: 'd' };
    }
    disPlayStr = this.dateFormat(new Date(createTime), 'yyyy-MM-dd');
    return { content: disPlayStr, type: 'y' };
  }

  public static moreNanme(name: string, num: number = 15) {
    let feedsName = name || '';
    if (feedsName === '') {
      return feedsName;
    }
    let sizeNum = this.getSize(feedsName);
    if (sizeNum > num) {
      return this.sb_substr(feedsName, 0, num) + '...';
    } else {
      return feedsName;
    }
  }

  public static briefText(text: string, num: number = 30) {
    let briefText = text || '';
    if (briefText === '')
      return briefText;
    let sizeNum = this.getSize(briefText);
    if (sizeNum > num)
      return this.sb_substr(briefText, 0, num);
    return briefText;
  }

  public static timeFilter(seconds: number) {
    let ss = parseInt(seconds + ''); // 秒
    let mm = 0; // 分
    let hh = 0; // 小时
    if (ss > 60) {
      mm = parseInt(ss / 60 + '');
      ss = parseInt((ss % 60) + '');
    }
    if (mm > 60) {
      hh = parseInt(mm / 60 + '');
      mm = parseInt((mm % 60) + '');
    }
    var result = ('00' + parseInt(ss + '')).slice(-2);
    if (mm > 0) {
      result = ('00' + parseInt(mm + '')).slice(-2) + ':' + result;
    } else {
      result = '00:' + result;
    }
    if (hh > 0) {
      result = ('00' + parseInt(hh + '')).slice(-2) + ':' + result;
    }
    return result;
  }

  public static getSize(dataName: string) {
    let i = 0;
    let c = 0.0;
    let unicode = 0;
    let len = 0;
    if (dataName == null || dataName == '') {
      return 0;
    }
    len = dataName.length;
    for (i = 0; i < len; i++) {
      unicode = dataName.charCodeAt(i);
      if (unicode < 127) {
        //判断是单字符还是双字符
        c += 1;
      } else {
        //chinese
        c += 2;
      }
    }
    return c;
  }

  /**
   *
   * Secure Hash Algorithm (SHA256)
   * http://www.webtoolkit.info/
   *
   * Original code by Angel Marin, Paul Johnston.
   *
   **/
  public static SHA256(s: string) {
    var chrsz = 8;
    var hexcase = 0;
    function safe_add(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }
    function S(X, n) {
      return (X >>> n) | (X << (32 - n));
    }
    function R(X, n) {
      return X >>> n;
    }
    function Ch(x, y, z) {
      return (x & y) ^ (~x & z);
    }
    function Maj(x, y, z) {
      return (x & y) ^ (x & z) ^ (y & z);
    }
    function Sigma0256(x) {
      return S(x, 2) ^ S(x, 13) ^ S(x, 22);
    }
    function Sigma1256(x) {
      return S(x, 6) ^ S(x, 11) ^ S(x, 25);
    }
    function Gamma0256(x) {
      return S(x, 7) ^ S(x, 18) ^ R(x, 3);
    }
    function Gamma1256(x) {
      return S(x, 17) ^ S(x, 19) ^ R(x, 10);
    }
    function core_sha256(m, l) {
      var K = new Array(
        0x428a2f98,
        0x71374491,
        0xb5c0fbcf,
        0xe9b5dba5,
        0x3956c25b,
        0x59f111f1,
        0x923f82a4,
        0xab1c5ed5,
        0xd807aa98,
        0x12835b01,
        0x243185be,
        0x550c7dc3,
        0x72be5d74,
        0x80deb1fe,
        0x9bdc06a7,
        0xc19bf174,
        0xe49b69c1,
        0xefbe4786,
        0xfc19dc6,
        0x240ca1cc,
        0x2de92c6f,
        0x4a7484aa,
        0x5cb0a9dc,
        0x76f988da,
        0x983e5152,
        0xa831c66d,
        0xb00327c8,
        0xbf597fc7,
        0xc6e00bf3,
        0xd5a79147,
        0x6ca6351,
        0x14292967,
        0x27b70a85,
        0x2e1b2138,
        0x4d2c6dfc,
        0x53380d13,
        0x650a7354,
        0x766a0abb,
        0x81c2c92e,
        0x92722c85,
        0xa2bfe8a1,
        0xa81a664b,
        0xc24b8b70,
        0xc76c51a3,
        0xd192e819,
        0xd6990624,
        0xf40e3585,
        0x106aa070,
        0x19a4c116,
        0x1e376c08,
        0x2748774c,
        0x34b0bcb5,
        0x391c0cb3,
        0x4ed8aa4a,
        0x5b9cca4f,
        0x682e6ff3,
        0x748f82ee,
        0x78a5636f,
        0x84c87814,
        0x8cc70208,
        0x90befffa,
        0xa4506ceb,
        0xbef9a3f7,
        0xc67178f2,
      );
      var HASH = new Array(
        0x6a09e667,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
      );
      var W = new Array(64);
      var a, b, c, d, e, f, g, h, i, j;
      var T1, T2;
      m[l >> 5] |= 0x80 << (24 - (l % 32));
      m[(((l + 64) >> 9) << 4) + 15] = l;
      for (let i = 0; i < m.length; i += 16) {
        a = HASH[0];
        b = HASH[1];
        c = HASH[2];
        d = HASH[3];
        e = HASH[4];
        f = HASH[5];
        g = HASH[6];
        h = HASH[7];
        for (let j = 0; j < 64; j++) {
          if (j < 16) W[j] = m[j + i];
          else
            W[j] = safe_add(
              safe_add(
                safe_add(Gamma1256(W[j - 2]), W[j - 7]),
                Gamma0256(W[j - 15]),
              ),
              W[j - 16],
            );
          T1 = safe_add(
            safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]),
            W[j],
          );
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
    function str2binb(str) {
      var bin = Array();
      var mask = (1 << chrsz) - 1;
      for (var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - (i % 32));
      }
      return bin;
    }
    function Utf8Encode(string) {
      string = string.replace(/\r\n/g, '\n');
      var utftext = '';
      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if (c > 127 && c < 2048) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }
    function binb2hex(binarray) {
      var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
      var str = '';
      for (var i = 0; i < binarray.length * 4; i++) {
        str +=
          hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf) +
          hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf);
      }
      return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
  }

  public static gethtmlId(
    page: string,
    type: string,
    nodeId: string,
    feedId: number,
    postId: number,
  ) {
    return page + '-' + type + '-' + nodeId + '-' + feedId + '-' + postId;
  }

  //截取字符
  public static sb_substr(str: string, startp: number, endp: number) {
    let i = 0;
    let c = 0;
    let rstr = '';
    var len = str.length;
    var sblen = this.getSize(str);
    if (startp < 0) {
      startp = sblen + startp;
    }
    if (endp < 1) {
      endp = sblen + endp; // - ((str.charCodeAt(len-1) < 127) ? 1 : 2);
    }
    // 寻找起点
    for (i = 0; i < len; i++) {
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
    for (i = i; i < len; i++) {
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

  //加法函数，用来得到精确的加法结果
  public static accAdd(arg1: any, arg2: any) {
    let r1: any, r2: any, m: any;
    try {
      r1 = arg1.toString().split('.')[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split('.')[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
  }

  //减法函数，用来得到精确的加法结果
  public static accSub(arg1: any, arg2: any) {
    let r1: any, r2: any, m: any, n: any;
    try {
      r1 = arg1.toString().split('.')[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split('.')[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    //last modify by deeka
    //动态控制精度长度
    n = r1 >= r2 ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m).toFixed(n);
  }

  //乘法函数，用来得到精确的乘法结果
  //说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
  //调用：accMul(arg1,arg2)
  //返回值：arg1乘以arg2的精确结果
  public static accMul(arg1: any, arg2: any) {
    let m = 0,
      s1 = arg1.toString(),
      s2 = arg2.toString();
    try {
      m += s1.split('.')[1].length;
    } catch (e) {}
    try {
      m += s2.split('.')[1].length;
    } catch (e) {}
    return (
      (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) /
      Math.pow(10, m)
    );
  }

  //除法函数
  public static accDiv(arg1: any, arg2: any) {
    var t1 = 0,
      t2 = 0,
      r1: any,
      r2: any;
    try {
      t1 = arg1.toString().split('.')[1].length;
    } catch (e) {}
    try {
      t2 = arg2.toString().split('.')[1].length;
    } catch (e) {}
    r1 = Number(arg1.toString().replace('.', ''));
    r2 = Number(arg2.toString().replace('.', ''));
    return (r1 / r2) * Math.pow(10, t2 - t1);
  }

  public static resolveAddress(address: string) {
    if (!address) return '';
    let len = address.length;
    return address.substring(0, 6) + '...' + address.substring(len - 4, len);
  }


  /**
 * 计算缩放宽高
 * @param imgWidth 图片宽
 * @param imgHeight 图片高
 * @param maxWidth 期望的最大宽
 * @param maxHeight 期望的最大高
 * @returns [number,number] 宽高
 */
public static  zoomImgSize(imgWidth:any, imgHeight:any, maxWidth:any, maxHeight:any){
  let newWidth = imgWidth,
      newHeight = imgHeight;
  if (imgWidth / imgHeight >= maxWidth / maxHeight) {
      if (imgWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = (imgHeight * maxWidth) / imgWidth;
      }
  } else {
      if (imgHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = (imgWidth * maxHeight) / imgHeight;
      }
  }
  if (newWidth > maxWidth || newHeight > maxHeight) {
      //不满足预期,递归再次计算
      return this.zoomImgSize(newWidth, newHeight, maxWidth, maxHeight);
  }
  return [newWidth, newHeight];
 };

 /**
 * 压缩图片
 * @param img img对象
 * @param maxWidth 最大宽
 * @param maxHeight 最大高
 * @param quality 压缩质量
 * @returns {string|*} 返回base64
 */
 public static resizeImg(img:any, maxWidth:any, maxHeight:any, quality = 1):any{
    const imageData = img.src;
    if (imageData.length < maxWidth * maxHeight) {
        return imageData;
    }
    const imgWidth = img.width;
    const imgHeight = img.height;
    if (imgWidth <= 0 || imgHeight <= 0) {
        return imageData;
    }
    const canvasSize = this.zoomImgSize(imgWidth, imgHeight, maxWidth, maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize[0];
    canvas.height = canvasSize[1];
    canvas.getContext('2d')
        .drawImage(img, 0, 0, canvas.width,
            canvas.height);
    return canvas.toDataURL('image/*', quality);
  };

  public static downloadFileFromUrl(url: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const downloadRes = async () => {
        let response = await fetch(url);
        let blob = await response.blob();

        resolve(blob);
      }
      downloadRes();
    });
  }

}
