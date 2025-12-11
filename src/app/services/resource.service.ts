import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Resource {
  resource_id: number;
  file_name: string;
  file_type: string;
  file_size: string;
  file_url: string;
  category: 'formulas' | 'quotes' | 'knowledge' | 'other';
  uploaded_by: number;
  uploaded_on: string;
  description?: string;
  uploader_name?: string;
}

export interface CreateResourceRequest {
  file_name: string;
  file_type: string;
  file_size: string;
  file_url: string;
  category: 'formulas' | 'quotes' | 'knowledge' | 'other';
  uploaded_by: number;
  description?: string;
}

export interface UpdateResourceRequest {
  file_name?: string;
  category?: 'formulas' | 'quotes' | 'knowledge' | 'other';
  description?: string;
}

interface ResourceResponse {
  success: boolean;
  data?: Resource | Resource[];
  count?: number;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/resources`;

  getAllResources(filters?: {
    category?: 'formulas' | 'quotes' | 'knowledge' | 'other';
    uploaded_by?: number;
    search?: string;
  }): Observable<ResourceResponse> {
    let params = new HttpParams();
    
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.uploaded_by) {
      params = params.set('uploaded_by', filters.uploaded_by.toString());
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<ResourceResponse>(this.apiUrl, { params });
  }

  getResourceById(id: number): Observable<ResourceResponse> {
    return this.http.get<ResourceResponse>(`${this.apiUrl}/${id}`);
  }

  createResource(data: CreateResourceRequest): Observable<ResourceResponse> {
    return this.http.post<ResourceResponse>(this.apiUrl, data);
  }

  updateResource(id: number, data: UpdateResourceRequest): Observable<ResourceResponse> {
    return this.http.put<ResourceResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteResource(id: number): Observable<ResourceResponse> {
    return this.http.delete<ResourceResponse>(`${this.apiUrl}/${id}`);
  }

  getResourceStats(): Observable<{
    success: boolean;
    data: {
      total: number;
      byCategory: { category: string; count: number }[];
    };
  }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  uploadResource(file: File, category: string, uploadedBy: number, description?: string): Observable<ResourceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('uploaded_by', uploadedBy.toString());
    if (description) {
      formData.append('description', description);
    }

    return this.http.post<ResourceResponse>(`${this.apiUrl}/upload`, formData);
  }

  downloadResource(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
