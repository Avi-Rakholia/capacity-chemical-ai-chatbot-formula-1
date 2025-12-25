import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Enhanced markdown to HTML converter with better formatting
// Handles: tables, headers, lists, code blocks, bold, italic, links
@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }

    let html = value;

    // Tables: Enhanced table rendering
    html = this.convertTablesToHtml(html);

    // Headers: # -> <h3>, ## -> <h4>, etc.
    html = html.replace(/^### (.*?)$/gm, '<h4 class="markdown-h4">$1</h4>');
    html = html.replace(/^## (.*?)$/gm, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^# (.*?)$/gm, '<h2 class="markdown-h2">$1</h2>');

    // Code blocks: ```code``` -> <pre><code>
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="markdown-code"><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code: `code` -> <code> (but not inside code blocks)
    html = html.replace(/(?<!`)(`[^`]+`)(?!`)/g, (match) => {
      return `<code class="markdown-inline-code">${this.escapeHtml(match.slice(1, -1))}</code>`;
    });

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-strong">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="markdown-strong">$1</strong>');

    // Italic: *text* or _text_ (but not in bold/code)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="markdown-em">$1</em>');
    html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em class="markdown-em">$1</em>');

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link" target="_blank" rel="noopener">$1</a>');

    // Unordered lists: - or * at start of line
    html = this.convertListsToHtml(html);

    // Blockquotes: > text
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="markdown-blockquote">$1</blockquote>');

    // Horizontal rule: ---, ***, ___
    html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr class="markdown-hr" />');

    // Line breaks and paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs around block elements
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<pre|<ul|<ol|<blockquote|<hr|<h[2-4])/g, '$1');
    html = html.replace(/(<\/pre>|<\/ul>|<\/ol>|<\/blockquote>|<\/h[2-4]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<li>)/g, '<ul><$2');
    html = html.replace(/(<\/li>)<\/p>/g, '$1</ul>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private convertTablesToHtml(html: string): string {
    // Match markdown table patterns
    const tablePattern = /\|(.+)\n\s*\|[\s\-|:]+\n((?:\|.+\n?)*)/g;

    return html.replace(tablePattern, (_match: string, headerRow: string, bodyRows: string) => {
      try {
        const table = document.createElement('table');
        table.className = 'markdown-table';

        // Process header
        const thead = document.createElement('thead');
        const headerCells = this.parseCells(headerRow);
        const headerTr = document.createElement('tr');
        headerCells.forEach((cell: string) => {
          const th = document.createElement('th');
          th.textContent = cell.trim();
          headerTr.appendChild(th);
        });
        thead.appendChild(headerTr);
        table.appendChild(thead);

        // Process body rows
        const tbody = document.createElement('tbody');
        const rows = bodyRows.trim().split('\n');
        rows.forEach((row: string) => {
          if (row.trim() && row.includes('|')) {
            const cells = this.parseCells(row);
            const tr = document.createElement('tr');
            cells.forEach((cell: string) => {
              const td = document.createElement('td');
              td.textContent = cell.trim();
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          }
        });
        table.appendChild(tbody);

        return table.outerHTML;
      } catch (e) {
        console.error('Table parsing error:', e);
        return _match; // Return original if parsing fails
      }
    });
  }

  private convertListsToHtml(html: string): string {
    // Unordered lists
    const ulPattern = /(?:^|\n)((?:[-*] .+\n?)+)/gm;
    html = html.replace(ulPattern, (_match: string, items: string) => {
      const ul = document.createElement('ul');
      ul.className = 'markdown-list';
      items.split('\n').forEach((item: string) => {
        if (item.trim().match(/^[-*]\s+/)) {
          const li = document.createElement('li');
          li.textContent = item.trim().replace(/^[-*]\s+/, '');
          ul.appendChild(li);
        }
      });
      return '\n' + ul.outerHTML + '\n';
    });

    // Ordered lists
    const olPattern = /(?:^|\n)((?:\d+\. .+\n?)+)/gm;
    html = html.replace(olPattern, (_match: string, items: string) => {
      const ol = document.createElement('ol');
      ol.className = 'markdown-list-ordered';
      items.split('\n').forEach((item: string) => {
        if (item.trim().match(/^\d+\./)) {
          const li = document.createElement('li');
          li.textContent = item.trim().replace(/^\d+\.\s+/, '');
          ol.appendChild(li);
        }
      });
      return '\n' + ol.outerHTML + '\n';
    });

    return html;
  }

  private parseCells(row: string): string[] {
    return row
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0 && !cell.match(/^[-:\s]+$/));
  }
}
