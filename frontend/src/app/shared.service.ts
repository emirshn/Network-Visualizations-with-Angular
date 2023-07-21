import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private dataSubject = new Subject<Map<string, string[]>>();
  data$ = this.dataSubject.asObservable();

  sendData(data: Map<string, string[]>): void {
    if (data) {
      this.dataSubject.next(data);
    }
  }
  
}
