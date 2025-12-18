import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Approval {
  approval_id: number;
  entity_type: 'Formula' | 'Quote' | 'Resource';
  entity_id: number;
  approver_id: number;
  decision: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  decision_date: string;
  comments?: string;
  approver_name?: string;
  entity_name?: string;
  request_date?: string;
  resource_category?: string;
  requester_name?: string;
}

export interface CreateApprovalRequest {
  entity_type: 'Formula' | 'Quote' | 'Resource';
  entity_id: number;
  approver_id: number;
  decision?: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  comments?: string;
}

export interface UpdateApprovalRequest {
  decision: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  comments?: string;
}

interface ApprovalResponse {
  success: boolean;
  data?: Approval | Approval[];
  count?: number;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/approvals`;

  getAllApprovals(filters?: {
    entity_type?: 'Formula' | 'Quote' | 'Resource';
    decision?: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
    approver_id?: number;
  }): Observable<ApprovalResponse> {
    let params = new HttpParams();
    
    if (filters?.entity_type) {
      params = params.set('entity_type', filters.entity_type);
    }
    if (filters?.decision) {
      params = params.set('decision', filters.decision);
    }
    if (filters?.approver_id) {
      params = params.set('approver_id', filters.approver_id.toString());
    }

    return this.http.get<ApprovalResponse>(this.apiUrl, { params });
  }

  getApprovalById(id: number): Observable<ApprovalResponse> {
    return this.http.get<ApprovalResponse>(`${this.apiUrl}/${id}`);
  }

  createApproval(data: CreateApprovalRequest): Observable<ApprovalResponse> {
    return this.http.post<ApprovalResponse>(this.apiUrl, data);
  }

  updateApproval(id: number, data: UpdateApprovalRequest): Observable<ApprovalResponse> {
    return this.http.put<ApprovalResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteApproval(id: number): Observable<ApprovalResponse> {
    return this.http.delete<ApprovalResponse>(`${this.apiUrl}/${id}`);
  }

  getPendingCount(): Observable<{ success: boolean; data: { pending_count: number } }> {
    return this.http.get<{ success: boolean; data: { pending_count: number } }>(
      `${this.apiUrl}/stats/pending`
    );
  }
}
