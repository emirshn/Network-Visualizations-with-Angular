import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IpServiceService {
  private ipDataSubject = new BehaviorSubject<any>(null);
  public ipData$ = this.ipDataSubject.asObservable();

  constructor() {}

  setIpData(data: any) {
    this.ipDataSubject.next(data);
  }
}
