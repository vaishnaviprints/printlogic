import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customer-print-portal',
  templateUrl: './customer-print-portal.component.html',
  styleUrls: ['./customer-print-portal.component.scss']
})
export class CustomerPrintPortalComponent {
  selectedFiles: File[] = [];
  uploadedFiles: any[] = [];

  constructor(public router: Router) {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.processFiles();
    }
  }

  processFiles(): void {
    this.selectedFiles.forEach(file => {
      this.uploadedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    });
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}