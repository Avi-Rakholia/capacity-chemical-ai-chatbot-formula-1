import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private apiUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  getChatSessionStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat-sessions/statistics`);
  }

  getChatTimeline(period: string = '30days', groupBy: string = 'day'): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/chat-sessions/timeline?period=${period}&groupBy=${groupBy}`
    );
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }
}

