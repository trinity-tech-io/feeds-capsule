import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'html',
})
export class HtmlPipe implements PipeTransform {
  transform(str: string): string {
    let text = this.replaceSrc(str);
    return text;
  }

  replaceSrc(txt: string) {
    let reg = /(((http[s]?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/gi;
    let result = txt.replace(reg, function(item) {
      return "<span class='httpSpan'>" + item + '</span>';
    });
    return result;
  }
}
