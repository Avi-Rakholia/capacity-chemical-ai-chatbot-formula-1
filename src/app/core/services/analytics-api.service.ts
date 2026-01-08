import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {

  constructor(private http: HttpClient) {}

  getChatSessionStats(): Observable<any> {
    return this.http.get(
      'http://localhost:3001/api/analytics/chat-sessions/statistics'
    );
  }

  getChatTimeline(period: string = '30days', groupBy: string = 'day'): Observable<any> {
    return this.http.get(
      `http://localhost:3001/api/analytics/chat-sessions/timeline?period=${period}&groupBy=${groupBy}`
    );
  }

  getDashboard(): Observable<any> {
    return this.http.get(
      'http://localhost:3001/api/analytics/dashboard'
    );
  }
}

