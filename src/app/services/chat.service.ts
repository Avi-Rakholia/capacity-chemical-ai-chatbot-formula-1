import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatSession {
  chat_session_id: number;
  user_id: number;
  session_title: string;
  start_time: Date;
  end_time?: Date;
  status: 'Active' | 'Completed' | 'Pending_Approval' | 'Approved' | 'Rejected' | 'Archived';
  linked_formula_id?: number;
  summary?: string;
  metadata?: any;
}

export interface ChatMessage {
  interaction_id?: number;
  chat_session_id: number;
  prompt: string;
  response?: string;
  model_name?: string;
  tokens_used?: number;
  response_time_ms?: number;
  created_on?: Date;
  attachments?: ChatAttachment[];
  isUser: boolean;
  isStreaming?: boolean;
}

export interface ChatAttachment {
  attachment_id?: number;
  interaction_id?: number;
  attachment_type: 'local_file' | 'resource_reference' | 'quote' | 'knowledge_base' | 'template';
  file_name?: string;
  file_url?: string;
  resource_id?: number;
  file_size?: string;
  mime_type?: string;
  uploaded_on?: Date;
}

export interface ChatTemplate {
  template_id: string;
  title: string;
  description: string;
  icon: string;
  prompt_template: string;
  category: 'formula' | 'quote' | 'search' | 'general';
}

export interface StreamEvent {
  chunk?: string;
  interaction_id?: number;
  done?: boolean;
  full_response?: string;
  error?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/chat`;

  /**
   * Create a new chat session
   */
  createSession(data: { session_title?: string; linked_formula_id?: number; user_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/sessions`, data);
  }

  /**
   * Get all sessions for current user
   */
  getUserSessions(userId: number, status?: string): Observable<any> {
    let url = `${this.apiUrl}/sessions?user_id=${userId}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get(url);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sessions/${sessionId}`);
  }

  /**
   * Update session
   */
  updateSession(sessionId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sessions/${sessionId}`, data);
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sessions/${sessionId}`);
  }

  /**
   * Get chat templates
   */
  getTemplates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates`);
  }

  /**
   * Stream chat message with SSE
   * Returns a Subject that emits streaming chunks
   */
  streamMessage(
    sessionId: number,
    message: string,
    userId: number,
    attachments?: ChatAttachment[]
  ): Subject<StreamEvent> {
    const subject = new Subject<StreamEvent>();
    const url = `${this.apiUrl}/stream`;

    // Create EventSource with POST data
    // Note: EventSource doesn't support POST directly, so we use fetch with SSE
    this.streamWithFetch(url, {
      session_id: sessionId,
      message: message,
      user_id: userId,
      attachments: attachments || []
    }, subject);

    return subject;
  }

  /**
   * Internal method to handle SSE streaming with fetch
   */
  private async streamWithFetch(url: string, body: any, subject: Subject<StreamEvent>) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          subject.complete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const parsed: StreamEvent = JSON.parse(data);
                subject.next(parsed);

                if (parsed.done || parsed.error) {
                  subject.complete();
                  return;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Stream error:', error);
      subject.error(error);
    }
  }
}
