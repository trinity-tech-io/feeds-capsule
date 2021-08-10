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
    let reg=/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
    let result = txt.replace(reg, function(item) {
      return "<span class='httpSpan'>" + item + '</span>';
    });
    return result;
  }
}
