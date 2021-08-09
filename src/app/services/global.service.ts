import { Injectable } from '@angular/core';

@Injectable()
export class GlobalService {
  constructor(
  ) {
  }

  restartApp() {
    window.location.href = "/";
  }
}
