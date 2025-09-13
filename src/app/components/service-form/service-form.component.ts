import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DependencyService } from '../../services/dependency.service';
import { Service, ServiceType, ServiceStatus } from '../../models/service.model';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent implements OnInit, OnDestroy {
  serviceForm: FormGroup;
  isEditMode = false;
  serviceId: string | null = null;
  serviceTypes = Object.values(ServiceType);
  serviceStatuses = Object.values(ServiceStatus);
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dependencyService: DependencyService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.serviceForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.serviceId = params['id'];
      this.isEditMode = !!this.serviceId;
      
      if (this.isEditMode && this.serviceId) {
        this.loadService(this.serviceId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required],
      description: [''],
      url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      port: ['', [Validators.min(1), Validators.max(65535)]],
      environment: ['production', Validators.required],
      team: [''],
      status: [ServiceStatus.ACTIVE, Validators.required],
      tags: [''],
      metadata: ['']
    });
  }

  private loadService(serviceId: string): void {
    const service = this.dependencyService.getServiceById(serviceId);
    if (service) {
      this.serviceForm.patchValue({
        ...service,
        tags: service.tags.join(', '),
        metadata: JSON.stringify(service.metadata, null, 2)
      });
    }
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      const formValue = this.serviceForm.value;
      const service: Service = {
        id: this.serviceId || this.generateId(),
        name: formValue.name,
        type: formValue.type,
        description: formValue.description,
        url: formValue.url,
        port: formValue.port ? parseInt(formValue.port) : undefined,
        environment: formValue.environment,
        team: formValue.team,
        lastSeen: new Date(),
        status: formValue.status,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
        metadata: this.parseMetadata(formValue.metadata)
      };

      if (this.isEditMode) {
        this.dependencyService.updateService(service);
      } else {
        this.dependencyService.addService(service);
      }

      this.router.navigate(['/dashboard']);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  private generateId(): string {
    return 'service_' + Math.random().toString(36).substr(2, 9);
  }

  private parseMetadata(metadataString: string): Record<string, any> {
    try {
      return metadataString ? JSON.parse(metadataString) : {};
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {};
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.serviceForm.controls).forEach(key => {
      const control = this.serviceForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.serviceForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        return `${this.getFieldLabel(fieldName)} has an invalid format`;
      }
      if (control.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `${this.getFieldLabel(fieldName)} must be at most ${control.errors['max'].max}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Name',
      'type': 'Type',
      'description': 'Description',
      'url': 'URL',
      'port': 'Port',
      'environment': 'Environment',
      'team': 'Team',
      'status': 'Status',
      'tags': 'Tags',
      'metadata': 'Metadata'
    };
    return labels[fieldName] || fieldName;
  }

  getServiceTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getServiceStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.serviceForm.get(fieldName);
    return !!(control?.invalid && control.touched);
  }
}
