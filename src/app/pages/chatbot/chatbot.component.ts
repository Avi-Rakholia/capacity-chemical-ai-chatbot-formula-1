import { 
  Component, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  signal,
  computed,
  inject,
  effect,
  OnInit,
  OnDestroy
} from '@angular/core';



import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatTemplate, ChatAttachment, StreamEvent } from '../../services/chat.service';
import { ResourceService } from '../../services/resource.service';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { QuestionnaireInputComponent } from '../../components/questionnaire-input/questionnaire-input.component';
import { Subscription } from 'rxjs';



// Interfaces for attachment modal
interface Quote {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
}

interface KnowledgeBaseItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
}

interface Template {
  template_id: string;
  title: string;
  description?: string;
}

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule, MarkdownPipe, QuestionnaireInputComponent],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onClickOutside($event)'
  }
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private chatService = inject(ChatService);
  private resourceService = inject(ResourceService);
  private authService = inject(SupabaseAuthService);
  private cdr = inject(ChangeDetectorRef);

  // State signals
  messages = signal<ChatMessage[]>([]);
  userMessage = signal('');
  menuOpen = signal(false);
  showTemplates = signal(true);
  templates = signal<ChatTemplate[]>([]);
  currentSessionId = signal<number | null>(null);
  conversationId = signal<string | null>(null); // Python AI service conversation ID
  isStreaming = signal(false);
  // History UI
  showHistory = signal(false);
  userSessions = signal<any[]>([]);
  // Explicit mode selected via the cards: 'search' | 'create' | 'quote' | null
  selectedMode = signal<'search' | 'create' | 'quote' | null>(null);
  
  // File attachment state
  selectedFiles = signal<File[]>([]);
  selectedResources = signal<any[]>([]);
  showResourcePicker = signal(false);
  availableResources = signal<any[]>([]);
  
  // Attachment modal state
  showAttachmentModal = signal(false);
  activeTab = signal<'knowledgeBase' | 'quotes' | 'templates' | 'files'>('knowledgeBase');
  availableQuotes = signal<any[]>([]);
  availableKnowledgeBase = signal<any[]>([]);
  availableTemplates = signal<any[]>([]);
  selectedQuotes = signal<any[]>([]);
  selectedKnowledgeBase = signal<any[]>([]);
  selectedTemplates = signal<any[]>([]);

  private streamSubscription?: Subscription;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chatWindow') chatWindow!: ElementRef<HTMLDivElement>;


  ngOnInit() {
    this.loadTemplates();
    this.loadResources();
    // Don't create session automatically - wait until user sends first message
    // ✅ AUTO SCROLL LIKE CHATGPT
  effect(() => {
    const msgs = this.messages(); // track messages signal
    if (!msgs.length) return;

    requestAnimationFrame(() => {
      const el = this.chatWindow?.nativeElement;
      if (!el) return;

      el.scrollTop = el.scrollHeight;
    });
  });
 }

  ngOnDestroy() {
    this.streamSubscription?.unsubscribe();
  }

  loadTemplates() {
    this.chatService.getTemplates().subscribe({
      next: (response) => {
        if (response.success) {
          this.templates.set(response.data);
          this.cdr.markForCheck();
        }
      },
      error: (error) => console.error('Error loading templates:', error)
    });
  }

  loadResources() {
    this.resourceService.getAllResources().subscribe({
      next: (response: any) => {
        if (response.success) {
          // Filter approved resources only
          const approved = response.data.filter((r: any) => r.approval_status === 'Approved');
          this.availableResources.set(approved);
          this.cdr.markForCheck();
        }
      },
      error: (error: any) => {
        console.error('Error loading resources:', error);
      }
    });
  }

  createNewSession() {
    const userId = this.authService.getUserId();
    
    if (!userId) {
      console.error('User not authenticated');
      return;
    }
    
    this.chatService.createSession({ 
      session_title: 'New Chat',
      user_id: userId 
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentSessionId.set(response.data.chat_session_id);
          // Store conversation_id from the session if available
          if (response.data.conversation_id) {
            this.conversationId.set(response.data.conversation_id);
          }
          this.messages.set([]);
          this.showTemplates.set(true);
          this.cdr.markForCheck();
        }
      },
      error: (error) => console.error('Error creating session:', error)
    });
  }

  // Toggle menu
  toggleMenu() {
    this.menuOpen.update(open => !open);
    this.cdr.markForCheck();
  }

  // Send message with SSE streaming
  sendMessage() {
    const message = this.userMessage().trim();
    if (!message) return;

    const sessionId = this.currentSessionId();
    
    // Create session if it doesn't exist yet (lazy creation on first message)
    if (!sessionId) {
      const userId = this.authService.getUserId();
      if (!userId) {
        console.error('User not authenticated');
        return;
      }
      
      // Create session first, then send message
      this.chatService.createSession({ 
        session_title: 'New Chat',
        user_id: userId 
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.currentSessionId.set(response.data.chat_session_id);
            if (response.data.conversation_id) {
              this.conversationId.set(response.data.conversation_id);
            }
            // Use non-streaming for questionnaire
            this.sendMessageNonStreaming(message, response.data.chat_session_id);
          }
        },
        error: (error) => {
          console.error('Error creating session:', error);
        }
      });
      return;
    }

    // Session exists, send message with non-streaming
    this.sendMessageNonStreaming(message, sessionId);
  }

  // Helper method to send message with an existing session (non-streaming)
  private sendMessageNonStreaming(message: string, sessionId: number) {
    // Hide templates when first message is sent
    if (this.showTemplates()) {
      this.showTemplates.set(false);
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      chat_session_id: sessionId,
      prompt: message,
      isUser: true,
      attachments: this.buildAttachments()
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Clear input and attachments
    this.userMessage.set('');
    this.clearAllSelections();

    // Add placeholder for AI response
    const aiMsg: ChatMessage = {
      chat_session_id: sessionId,
      prompt: '',
      response: 'Thinking...',
      isUser: false,
      isStreaming: false
    };
    this.messages.update(msgs => [...msgs, aiMsg]);

    const aiMsgIndex = this.messages().length - 1;
    const userId = this.authService.getUserId();

    if (!userId) {
      console.error('User not authenticated');
      this.messages.update(msgs => {
        const updated = [...msgs];
        updated[aiMsgIndex] = {
          ...updated[aiMsgIndex],
          response: 'Error: User not authenticated. Please log in again.',
          isStreaming: false
        };
        return updated;
      });
      this.cdr.markForCheck();
      return;
    }

    // Send non-streaming request
    this.chatService.sendChatMessage(
      sessionId,
      message,
      userId,
      userMsg.attachments,
      this.selectedMode(),
      this.conversationId()
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          const data = response.data;
          
          this.messages.update(msgs => {
            const updated = [...msgs];
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              response: data.response || data.message || '',
              interaction_id: data.interaction_id,
              questionType: data.questionType || null,
              questionOptions: data.questionOptions || [],
              awaitingAnswer: data.questionType ? true : false,
              isStreaming: false
            };
            return updated;
          });

          // Store conversation_id if received
          if (data.conversation_id) {
            this.conversationId.set(data.conversation_id);
            console.log('Stored conversation_id:', data.conversation_id);
          }

          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Chat error:', error);
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiMsgIndex] = {
            ...updated[aiMsgIndex],
            response: 'Error: Failed to get response from AI service.',
            isStreaming: false
          };
          return updated;
        });
        this.cdr.markForCheck();
      }
    });
  }

  // Helper method to send message with an existing session
  private sendMessageWithSession(message: string, sessionId: number) {

    // Hide templates when first message is sent
    if (this.showTemplates()) {
      this.showTemplates.set(false);
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      chat_session_id: sessionId,
      prompt: message,
      isUser: true,
      attachments: this.buildAttachments()
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Clear input and attachments
    this.userMessage.set('');
    this.clearAllSelections();

    // Add placeholder for AI response
    const aiMsg: ChatMessage = {
      chat_session_id: sessionId,
      prompt: '',
      response: '',
      isUser: false,
      isStreaming: true
    };
    this.messages.update(msgs => [...msgs, aiMsg]);
    this.isStreaming.set(true);

    const aiMsgIndex = this.messages().length - 1;
    const userId = this.authService.getUserId();
    let lastUpdateTime = Date.now();
    const updateThrottleMs = 50;

    if (!userId) {
      console.error('User not authenticated');
      this.messages.update(msgs => {
        const updated = [...msgs];
        updated[aiMsgIndex] = {
          ...updated[aiMsgIndex],
          response: 'Error: User not authenticated. Please log in again.',
          isStreaming: false
        };
        return updated;
      });
      this.isStreaming.set(false);
      this.cdr.markForCheck();
      return;
    }

    // Start streaming
    this.streamSubscription = this.chatService.streamMessage(
      sessionId,
      message,
      userId,
      userMsg.attachments,
      this.selectedMode(),
      this.conversationId()
    ).subscribe({
      next: (event: StreamEvent) => {
        if (event.chunk) {
          this.messages.update(msgs => {
            const updated = [...msgs];
            const currentRawResponse = (updated[aiMsgIndex].response || '') + event.chunk;
            
            let displayResponse = currentRawResponse;
            if (currentRawResponse.includes('{') && currentRawResponse.includes('}')) {
              try {
                const jsonMatch = currentRawResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed && typeof parsed === 'object') {
                    displayResponse = parsed.response || parsed.message || parsed.answer || parsed.result || currentRawResponse;
                  }
                }
              } catch (e) {
                displayResponse = currentRawResponse;
              }
            }
            
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              response: displayResponse
            };
            return updated;
          });
          
          const now = Date.now();
          if (now - lastUpdateTime >= updateThrottleMs) {
            this.cdr.markForCheck();
            lastUpdateTime = now;
          }
        }

        if (event.done) {
          this.messages.update(msgs => {
            const updated = [...msgs];
            let finalResponse = event.full_response || updated[aiMsgIndex].response;
            
            try {
              const jsonMatch = finalResponse.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed && typeof parsed === 'object') {
                  finalResponse = parsed.response || parsed.message || parsed.answer || parsed.result || finalResponse;
                }
              }
            } catch (e) {
              // Use response as-is
            }
            
            updated[aiMsgIndex] = {
              ...updated[aiMsgIndex],
              isStreaming: false,
              interaction_id: event.interaction_id,
              response: finalResponse,
              questionType: event.questionType || null,
              questionOptions: event.questionOptions || [],
              awaitingAnswer: event.questionType ? true : false
            };
            return updated;
          });
          
          // Store conversation_id if received from server
          if (event.conversation_id) {
            this.conversationId.set(event.conversation_id);
            console.log('Stored conversation_id:', event.conversation_id);
          }
          
          this.isStreaming.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Streaming error:', error);
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiMsgIndex] = {
            ...updated[aiMsgIndex],
            isStreaming: false,
            response: 'Error: Failed to get response from AI service.'
          };
          return updated;
        });
        this.isStreaming.set(false);
        this.cdr.markForCheck();
      }
    });
  } // end sendMessageWithSession

  // Toggle attachment modal
  toggleAttachmentModal(): void {
    this.showAttachmentModal.set(!this.showAttachmentModal());
    if (this.showAttachmentModal()) {
      this.loadAvailableItems();
    }
  }

  // Close attachment modal
  closeAttachmentModal(): void {
    this.showAttachmentModal.set(false);
  }

  // Get total selected count for all attachment types
  getTotalSelectedCount(): number {
    return this.selectedFiles().length + 
           this.selectedResources().length + 
           this.selectedQuotes().length + 
           this.selectedKnowledgeBase().length + 
           this.selectedTemplates().length;
  }

  // Load available items for the modal
  private loadAvailableItems(): void {
    const resources = this.availableResources();
    
    const knowledgeResources = resources.filter(r => r.category === 'knowledge');
    const quoteResources = resources.filter(r => r.category === 'quotes');
    
    this.availableKnowledgeBase.set(knowledgeResources.map(resource => ({
      id: resource.resource_id.toString(),
      title: resource.file_name,
      description: resource.description || `Knowledge resource: ${resource.file_name}`,
      url: resource.file_url
    })));
    
    this.availableQuotes.set(quoteResources.map(resource => ({
      id: resource.resource_id.toString(),
      title: resource.file_name,
      description: resource.description || `Quote resource: ${resource.file_name}`,
      url: resource.file_url
    })));
    
    const templates = this.templates();
    this.availableTemplates.set(templates.map((template: any) => ({
      template_id: template.template_id,
      title: template.title,
      description: template.description || (template.content ? template.content.substring(0, 100) + '...' : 'Template content')
    })));
  }

  // File drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFileSelection(Array.from(files));
    }
  }

  private handleFileSelection(files: File[]): void {
    const currentFiles = this.selectedFiles();
    const newFiles = [...currentFiles, ...files];
    this.selectedFiles.set(newFiles);
  }

  clearAllSelections(): void {
    this.selectedFiles.set([]);
    this.selectedResources.set([]);
    this.selectedQuotes.set([]);
    this.selectedKnowledgeBase.set([]);
    this.selectedTemplates.set([]);
    this.showAttachmentModal.set(false);
  }

  private buildAttachments(): ChatAttachment[] {
    const attachments: ChatAttachment[] = [];

    this.selectedFiles().forEach(file => {
      attachments.push({
        attachment_type: 'local_file',
        file_name: file.name,
        file_size: this.formatFileSize(file.size),
        mime_type: file.type
      });
    });

    this.selectedResources().forEach(resource => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: resource.resource_id,
        file_name: resource.file_name,
        file_url: resource.file_url
      });
    });

    this.selectedQuotes().forEach(quote => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: quote.id,
        file_name: `Quote: ${quote.title || quote.name}`,
        file_url: quote.url || ''
      });
    });

    this.selectedKnowledgeBase().forEach(kb => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: kb.id,
        file_name: `KB: ${kb.title || kb.name}`,
        file_url: kb.url || ''
      });
    });

    this.selectedTemplates().forEach(template => {
      attachments.push({
        attachment_type: 'resource_reference',
        resource_id: template.template_id,
        file_name: `Template: ${template.title}`,
        file_url: ''
      });
    });

    return attachments;
  }
  async copyMessage(text: string) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      
      const blob = new Blob([text], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([tempDiv.textContent || text], { type: 'text/plain' })
      });
      
      await navigator.clipboard.write([clipboardItem]);
      console.log('Message copied with formatting');
    } catch (err) {
      console.error('Rich copy failed, using plain text:', err);
      navigator.clipboard.writeText(text);
    }
  }

  async copyMessageWithFormatting(element: HTMLElement) {
    try {
      const clone = element.cloneNode(true) as HTMLElement;
      
      const cursor = clone.querySelector('.streaming-cursor');
      if (cursor) {
        cursor.remove();
      }
      
      const htmlContent = clone.innerHTML;
      const textContent = clone.textContent || '';
      
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      
      const clipboardItem = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      });
      
      await navigator.clipboard.write([clipboardItem]);
      console.log('Message copied with formatting');
    } catch (err) {
      console.error('Rich copy failed, using plain text:', err);
      const textContent = element.textContent || '';
      navigator.clipboard.writeText(textContent);
    }
  }

  shareMessage(text: string) {
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Message copied for sharing');
    }
  }


  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // ---------------------------------------
  // FILE ATTACHMENT HANDLING
  // ---------------------------------------
  @ViewChild('chatInput') chatInput!: ElementRef<HTMLInputElement>;

  triggerFileInput() {
    this.showAttachmentModal.set(true);
    this.loadAttachmentOptions();
    this.cdr.markForCheck();
  }

  loadAttachmentOptions() {
    // Load quotes (you'll need to implement the quotes service)
    // this.quotesService.getQuotes().subscribe(quotes => this.availableQuotes.set(quotes));
    
    // Load knowledge base items (you'll need to implement this service)
    // this.knowledgeBaseService.getItems().subscribe(items => this.availableKnowledgeBase.set(items));
    
    // Templates are already loaded in loadTemplates()
    const templates = this.templates();
    this.availableTemplates.set(templates.map((template: any) => ({
      template_id: template.template_id,
      title: template.title,
      description: template.description || (template.content ? template.content.substring(0, 100) + '...' : 'Template content')
    })));
  }

  triggerDirectFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      console.error("fileInput ViewChild not found!");
    }
  }
  
  onClickOutside(event: Event) {
    const menuButton = document.querySelector('.menu-btn');
    const dropdown = document.querySelector('.dropdown');

    if (menuButton?.contains(event.target as Node) ||
        dropdown?.contains(event.target as Node)) {
      return;
    }

    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.cdr.markForCheck();
    }
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      this.handleFileSelection(Array.from(files));
      input.value = '';
    }
  }

  removeFile(file: File) {
    this.selectedFiles.update(files => files.filter(f => f !== file));
  }

  removeResource(resource: any) {
    this.selectedResources.update(resources => resources.filter(r => r !== resource));
  }

  toggleQuoteSelection(quote: any) {
    const currentQuotes = this.selectedQuotes();
    const isSelected = currentQuotes.find(q => q.id === quote.id);
    
    if (isSelected) {
      this.selectedQuotes.update(quotes => quotes.filter(q => q.id !== quote.id));
    } else {
      this.selectedQuotes.update(quotes => [...quotes, quote]);
    }
  }

  toggleKnowledgeBaseSelection(item: any) {
    const currentItems = this.selectedKnowledgeBase();
    const isSelected = currentItems.find(kb => kb.id === item.id);
    
    if (isSelected) {
      this.selectedKnowledgeBase.update(items => items.filter(kb => kb.id !== item.id));
    } else {
      this.selectedKnowledgeBase.update(items => [...items, item]);
    }
  }

  toggleTemplateSelection(template: any) {
    const currentTemplates = this.selectedTemplates();
    const isSelected = currentTemplates.find(t => t.template_id === template.template_id);
    
    if (isSelected) {
      this.selectedTemplates.update(templates => templates.filter(t => t.template_id !== template.template_id));
    } else {
      this.selectedTemplates.update(templates => [...templates, template]);
    }
  }

  removeQuote(index: number) {
    this.selectedQuotes.update(quotes => quotes.filter((_, i) => i !== index));
  }

  removeKnowledgeBaseItem(index: number) {
    this.selectedKnowledgeBase.update(items => items.filter((_, i) => i !== index));
  }

  removeTemplate(index: number) {
    this.selectedTemplates.update(templates => templates.filter((_, i) => i !== index));
  }

  // Toggle resource picker
  toggleResourcePicker() {
    this.showResourcePicker.update(show => !show);
  }

  // Select a resource
  selectResource(resource: any) {
    if (!this.selectedResources().find(r => r.resource_id === resource.resource_id)) {
      this.selectedResources.update(resources => [...resources, resource]);
    }
  }

  // Handle questionnaire answer submission
  handleQuestionnaireAnswer(answer: string | string[], messageIndex: number): void {
    const messages = this.messages();
    const aiMessage = messages[messageIndex];
    
    if (!aiMessage || aiMessage.isUser) {
      return;
    }

    // Update the AI message to store the user's answer
    this.messages.update(msgs => {
      const updated = [...msgs];
      updated[messageIndex] = {
        ...updated[messageIndex],
        userAnswer: answer,
        awaitingAnswer: false
      };
      return updated;
    });

    // Send the answer as the next user message
    const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
    this.userMessage.set(answerText);
    this.sendMessage();
  }

  // Card actions
  onSearchFormula() {
    // Select explicit mode and update UI
    this.selectedMode.set('search');
    this.showTemplates.set(false);
    this.userMessage.set('Find formulas for ');
    this.cdr.markForCheck();
  }

  onCreateFormula() {
    this.selectedMode.set('create');
    this.showTemplates.set(false);
    this.userMessage.set('Create a new formula for ');
    this.cdr.markForCheck();
  }

  onGenerateQuote() {
    this.selectedMode.set('quote');
    this.showTemplates.set(false);
    this.userMessage.set('Generate a quote for ');
    this.cdr.markForCheck();
  }

  // Dropdown actions (three-dot menu)
  handleNewChat() {
    this.menuOpen.set(false);
    this.createNewSession();
  }

  handleSearch() {
    this.menuOpen.set(false);
    // Open templates/search mode and focus input
    this.selectedMode.set('search');
    this.showTemplates.set(false);
    // focus input after change detection
    setTimeout(() => {
      try { this.chatInput.nativeElement.focus(); } catch (e) { /* ignore */ }
    }, 50);
    this.cdr.markForCheck();
  }

  handleHistory() {
    this.menuOpen.set(false);
    // ensure attachment modal is closed when opening history
    this.showAttachmentModal.set(false);
    this.loadHistory();
  }

  loadHistory() {
    const userId = this.authService.getUserId();
    if (!userId) return;
    this.showHistory.set(true);
    this.chatService.getUserSessions(userId).subscribe({
      next: (res: any) => {
        if (res.success) {
          console.log('Loaded user sessions count:', (res.data || []).length);
          this.userSessions.set(res.data || []);
          // also ensure attachment modal off
          this.showAttachmentModal.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error loading sessions', err)
    });
  }

  closeHistory() {
    this.showHistory.set(false);
  }

  openSession(sessionId: number) {
    this.chatService.getSession(sessionId).subscribe({
      next: (res: any) => {
        if (res.success) {
          const data = res.data;
          this.currentSessionId.set(data.chat_session_id || sessionId);
          this.conversationId.set(data.conversation_id || null);
          // Map interactions to messages
          const interactions = (data.interactions || []).map((i: any) => ({
            interaction_id: i.interaction_id,
            chat_session_id: i.chat_session_id,
            prompt: i.prompt,
            response: i.response,
            isUser: false
          } as ChatMessage));
          // Combine user prompts and AI responses into message stream
          const msgs: ChatMessage[] = [];
          interactions.forEach((it: any) => {
            msgs.push({ chat_session_id: it.chat_session_id, prompt: it.prompt, isUser: true } as ChatMessage);
            msgs.push({ chat_session_id: it.chat_session_id, response: it.response, isUser: false } as ChatMessage);
          });
          this.messages.set(msgs);
          this.showTemplates.set(false);
          this.showHistory.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error opening session', err)
    });
  }
}