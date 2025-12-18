import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
  last_login?: Date;
  status: 'Active' | 'Inactive';
}

export interface UserWithRole extends User {
  role_name: string;
  permissions: any;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  role_id: number;
  status?: 'Active' | 'Inactive';
  password?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role_id?: number;
  status?: 'Active' | 'Inactive';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3001/api/users';

  getAllUsers(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    role_id?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Observable<ApiResponse<PaginatedResponse<UserWithRole>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.role_id) {
      params = params.set('role_id', filters.role_id.toString());
    }
    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters?.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<ApiResponse<PaginatedResponse<UserWithRole>>>(
      this.apiUrl,
      { params }
    );
  }

  getUserById(id: number): Observable<ApiResponse<UserWithRole>> {
    return this.http.get<ApiResponse<UserWithRole>>(`${this.apiUrl}/${id}`);
  }

  createUser(userData: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, userData);
  }

  updateUser(id: number, userData: UpdateUserRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, userData);
  }

  deleteUser(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  getUsersByRole(roleId: number): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/role/${roleId}`);
  }

  getUsersWithFormulasCount(): Observable<ApiResponse<(UserWithRole & { formulas_count: number })[]>> {
    return this.http.get<ApiResponse<(UserWithRole & { formulas_count: number })[]>>(
      `${this.apiUrl}/analytics/formulas-count`
    );
  }
}
