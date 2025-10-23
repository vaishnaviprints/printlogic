import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = `${environment.backendUrl}/api`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || 
                  localStorage.getItem('vendor_token') || 
                  localStorage.getItem('auth_token');
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() });
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    const token = localStorage.getItem('admin_token') || 
                  localStorage.getItem('vendor_token') || 
                  localStorage.getItem('auth_token');
    
    const headers = new HttpHeaders({
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
    
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData, { headers });
  }
}
