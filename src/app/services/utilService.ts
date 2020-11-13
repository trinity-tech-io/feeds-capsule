
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
     if(feedsName != "" && feedsName.length>num){
          return feedsName.substring(0,num)+'...'
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
    let totalLength = 0;
    let charCode:number = 0;
    for (var i = 0; i < dataName.length; i++) {
    charCode = dataName.charCodeAt(i);
    if (charCode < 0x007f) {
    totalLength++;
    } else if ((0x0080 <= charCode) && (charCode <= 0x07ff)) {
    totalLength += 2;
    } else if ((0x0800 <= charCode) && (charCode <= 0xffff)) {
    totalLength += 3;
    } else {
    totalLength += 4;
    }
    }
    var totalLengthMax=Number(totalLength);
    return totalLengthMax;
    }
}

