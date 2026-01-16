import { 
  Component, 
  ChangeDetectionStrategy,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-questionnaire-input',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="questionnaire-container">
      @if (questionType() === 'text') {
        <div class="text-input-container">
          <input 
            type="text" 
            [(ngModel)]="textAnswer"
            (keydown.enter)="submitTextAnswer()"
            [placeholder]="placeholder()"
            class="text-input"
          />
          <button 
            type="button"
            (click)="submitTextAnswer()"
            class="submit-btn"
            [disabled]="!textAnswer()"
          >
            Submit
          </button>
        </div>
      }

      @if (questionType() === 'radio') {
        <div class="radio-container">
          @for (option of options(); track option) {
            <label class="radio-option">
              <input 
                type="radio" 
                [name]="'radio-' + timestamp"
                [value]="option"
                [(ngModel)]="selectedRadio"
              />
              <span>{{ option }}</span>
            </label>
          }
          <button 
            type="button"
            (click)="submitRadioAnswer()"
            class="submit-btn"
            [disabled]="!selectedRadio()"
          >
            Submit
          </button>
        </div>
      }

      @if (questionType() === 'checkbox') {
        <div class="checkbox-container">
          @for (option of options(); track option) {
            <label class="checkbox-option">
              <input 
                type="checkbox" 
                [value]="option"
                [checked]="isChecked(option)"
                (change)="toggleCheckbox(option)"
              />
              <span>{{ option }}</span>
            </label>
          }
          <button 
            type="button"
            (click)="submitCheckboxAnswer()"
            class="submit-btn"
            [disabled]="selectedCheckboxes().length === 0"
          >
            Submit
          </button>
        </div>
      }

      @if (questionType() === 'dropdown') {
        <div class="dropdown-container">
          <select 
            [(ngModel)]="selectedDropdown"
            class="dropdown-select"
          >
            <option value="" disabled>Select an option...</option>
            @for (option of options(); track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
          <button 
            type="button"
            (click)="submitDropdownAnswer()"
            class="submit-btn"
            [disabled]="!selectedDropdown()"
          >
            Submit
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .questionnaire-container {
      margin-top: 12px;
      width: 100%;
    }

    .text-input-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .text-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    .text-input:focus {
      border-color: #4a90e2;
    }

    .radio-container,
    .checkbox-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .radio-option,
    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .radio-option:hover,
    .checkbox-option:hover {
      background-color: #f8f9fa;
      border-color: #4a90e2;
    }

    .radio-option input[type="radio"],
    .checkbox-option input[type="checkbox"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }

    .dropdown-container {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .dropdown-select {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      background-color: white;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
    }

    .dropdown-select:focus {
      border-color: #4a90e2;
    }

    .submit-btn {
      padding: 10px 20px;
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .submit-btn:hover:not(:disabled) {
      background-color: #357abd;
    }

    .submit-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionnaireInputComponent {
  questionType = input<'text' | 'radio' | 'checkbox' | 'dropdown' | null>(null);
  options = input<string[]>([]);
  placeholder = input<string>('Type your answer...');
  
  answerSubmitted = output<string | string[]>();

  // State for different input types
  textAnswer = signal('');
  selectedRadio = signal('');
  selectedCheckboxes = signal<string[]>([]);
  selectedDropdown = signal('');
  
  timestamp = Date.now();

  submitTextAnswer(): void {
    const answer = this.textAnswer().trim();
    if (answer) {
      this.answerSubmitted.emit(answer);
      this.textAnswer.set('');
    }
  }

  submitRadioAnswer(): void {
    const answer = this.selectedRadio();
    if (answer) {
      this.answerSubmitted.emit(answer);
      this.selectedRadio.set('');
    }
  }

  submitCheckboxAnswer(): void {
    const answers = this.selectedCheckboxes();
    if (answers.length > 0) {
      this.answerSubmitted.emit(answers);
      this.selectedCheckboxes.set([]);
    }
  }

  submitDropdownAnswer(): void {
    const answer = this.selectedDropdown();
    if (answer) {
      this.answerSubmitted.emit(answer);
      this.selectedDropdown.set('');
    }
  }

  toggleCheckbox(option: string): void {
    const current = this.selectedCheckboxes();
    if (current.includes(option)) {
      this.selectedCheckboxes.set(current.filter(o => o !== option));
    } else {
      this.selectedCheckboxes.set([...current, option]);
    }
  }

  isChecked(option: string): boolean {
    return this.selectedCheckboxes().includes(option);
  }
}
