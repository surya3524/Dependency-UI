import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Service, Dependency, UsageAnalytics, ServiceType, ServiceStatus, CriticalityLevel, DependencyType } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class DependencyService {
  private servicesSubject = new BehaviorSubject<Service[]>([]);
  private dependenciesSubject = new BehaviorSubject<Dependency[]>([]);
  private analyticsSubject = new BehaviorSubject<UsageAnalytics[]>([]);

  public services$ = this.servicesSubject.asObservable();
  public dependencies$ = this.dependenciesSubject.asObservable();
  public analytics$ = this.analyticsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  // Service Management
  addService(service: Service): void {
    const currentServices = this.servicesSubject.value;
    this.servicesSubject.next([...currentServices, service]);
  }

  updateService(service: Service): void {
    const currentServices = this.servicesSubject.value;
    const index = currentServices.findIndex(s => s.id === service.id);
    if (index !== -1) {
      currentServices[index] = service;
      this.servicesSubject.next([...currentServices]);
    }
  }

  deleteService(serviceId: string): void {
    const currentServices = this.servicesSubject.value;
    const filteredServices = currentServices.filter(s => s.id !== serviceId);
    this.servicesSubject.next(filteredServices);
    
    // Remove related dependencies
    const currentDependencies = this.dependenciesSubject.value;
    const filteredDependencies = currentDependencies.filter(
      d => d.sourceServiceId !== serviceId && d.targetServiceId !== serviceId
    );
    this.dependenciesSubject.next(filteredDependencies);
  }

  getServiceById(id: string): Service | undefined {
    return this.servicesSubject.value.find(s => s.id === id);
  }

  // Dependency Management
  addDependency(dependency: Dependency): void {
    const currentDependencies = this.dependenciesSubject.value;
    this.dependenciesSubject.next([...currentDependencies, dependency]);
  }

  updateDependency(dependency: Dependency): void {
    const currentDependencies = this.dependenciesSubject.value;
    const index = currentDependencies.findIndex(d => d.id === dependency.id);
    if (index !== -1) {
      currentDependencies[index] = dependency;
      this.dependenciesSubject.next([...currentDependencies]);
    }
  }

  deleteDependency(dependencyId: string): void {
    const currentDependencies = this.dependenciesSubject.value;
    const filteredDependencies = currentDependencies.filter(d => d.id !== dependencyId);
    this.dependenciesSubject.next(filteredDependencies);
  }

  getDependenciesForService(serviceId: string): Dependency[] {
    return this.dependenciesSubject.value.filter(
      d => d.sourceServiceId === serviceId || d.targetServiceId === serviceId
    );
  }

  // Analytics
  updateUsageAnalytics(analytics: UsageAnalytics): void {
    const currentAnalytics = this.analyticsSubject.value;
    const index = currentAnalytics.findIndex(a => a.serviceId === analytics.serviceId);
    if (index !== -1) {
      currentAnalytics[index] = analytics;
    } else {
      currentAnalytics.push(analytics);
    }
    this.analyticsSubject.next([...currentAnalytics]);
  }

  getAnalyticsForService(serviceId: string): UsageAnalytics | undefined {
    return this.analyticsSubject.value.find(a => a.serviceId === serviceId);
  }

  // Search and Filter
  searchServices(query: string): Service[] {
    const services = this.servicesSubject.value;
    const lowerQuery = query.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(lowerQuery) ||
      service.description?.toLowerCase().includes(lowerQuery) ||
      service.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getServicesByType(type: string): Service[] {
    return this.servicesSubject.value.filter(service => service.type === type);
  }

  getServicesByStatus(status: string): Service[] {
    return this.servicesSubject.value.filter(service => service.status === status);
  }

  private loadInitialData(): void {
    // Use fixed, named applications with 6-7 dependencies each (no localStorage)
    this.loadNamedApplications();
  }
  private generateMockApplications(numApps: number, depsPerApp: number): void {
    const services: Service[] = [];
    const dependencies: Dependency[] = [];

    // Create primary applications
    for (let i = 1; i <= numApps; i++) {
      services.push({
        id: `app-${i}`,
        name: `Application ${i}`,
        type: ServiceType.MICROSERVICE,
        description: `Generated application ${i}`,
        environment: 'production',
        team: 'Team ' + ((i % 5) + 1),
        owner: 'Owner ' + ((i % 3) + 1),
        version: `v${(i % 4) + 1}.0.${(i % 10)}`,
        lastSeen: new Date(),
        status: ServiceStatus.ACTIVE,
        criticality: [CriticalityLevel.CRITICAL, CriticalityLevel.HIGH, CriticalityLevel.MEDIUM, CriticalityLevel.LOW][i % 4],
        uptime: 99 + Math.random(),
        responseTime: Math.floor(50 + Math.random() * 150),
        errorRate: parseFloat((Math.random() * 1).toFixed(2)),
        tags: ['generated', 'app'],
        metadata: { language: ['Java', 'Node', 'Python'][i % 3] }
      });
    }

    // Create a pool of additional applications to depend on
    const extraPoolSize = Math.max(depsPerApp + 5, 25);
    for (let j = 1; j <= extraPoolSize; j++) {
      services.push({
        id: `svc-${j}`,
        name: `Service ${j}`,
        type: ServiceType.MICROSERVICE,
        description: `Support service ${j}`,
        environment: 'production',
        team: 'Shared Services',
        owner: 'Platform',
        version: `v${(j % 3) + 1}.${(j % 9)}`,
        lastSeen: new Date(),
        status: ServiceStatus.ACTIVE,
        criticality: [CriticalityLevel.HIGH, CriticalityLevel.MEDIUM, CriticalityLevel.LOW][j % 3],
        uptime: 99 + Math.random(),
        responseTime: Math.floor(20 + Math.random() * 100),
        errorRate: parseFloat((Math.random() * 1).toFixed(2)),
        tags: ['generated', 'support'],
        metadata: {}
      });
    }

    // Build dependencies: each primary app depends on depsPerApp distinct services from pool
    const poolIds = services.filter(s => s.id.startsWith('svc-')).map(s => s.id);
    const depTypes = [
      DependencyType.API_CALL,
      DependencyType.GRPC_CALL,
      DependencyType.REST_API,
      DependencyType.WEBSOCKET,
      DependencyType.DIRECT_DEPENDENCY
    ];

    for (let i = 1; i <= numApps; i++) {
      const sourceId = `app-${i}`;
      const chosen = new Set<string>();
      while (chosen.size < depsPerApp) {
        const target = poolIds[Math.floor(Math.random() * poolIds.length)];
        if (!chosen.has(target) && target !== sourceId) {
          chosen.add(target);
        }
      }
      Array.from(chosen).forEach((targetId, idx) => {
        const t = depTypes[idx % depTypes.length];
        dependencies.push({
          id: `dep-${sourceId}-${idx}`,
          sourceServiceId: sourceId,
          targetServiceId: targetId,
          dependencyType: t,
          usageCount: Math.floor(1000 + Math.random() * 100000),
          lastUsed: new Date(),
          description: `${sourceId} -> ${targetId}`,
          isActive: true,
          weight: Math.max(1, Math.floor(Math.random() * 10)),
          frequency: ['HIGH', 'MEDIUM', 'LOW'][idx % 3] as 'HIGH' | 'MEDIUM' | 'LOW',
          isCritical: Math.random() < 0.4,
          failureImpact: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)] as 'HIGH' | 'MEDIUM' | 'LOW',
          latency: Math.floor(5 + Math.random() * 200),
          errorRate: parseFloat((Math.random() * 2).toFixed(2)),
          metadata: {}
        });
      });
    }

    this.servicesSubject.next(services);
    this.dependenciesSubject.next(dependencies);
  }

  private loadNamedApplications(): void {
    const apps: Service[] = [
      { id: 'app-1', name: 'FA advisor', type: ServiceType.MICROSERVICE, description: 'FA advisor', environment: 'production', team: 'FA', owner: 'FA', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 90, errorRate: 0.1, tags: ['fa'], metadata: {} },
      { id: 'app-2', name: 'FA compensation', type: ServiceType.MICROSERVICE, description: 'FA compensation', environment: 'production', team: 'FA', owner: 'FA', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.CRITICAL, uptime: 99.9, responseTime: 100, errorRate: 0.12, tags: ['fa'], metadata: {} },
      { id: 'app-3', name: 'FA Report tracker', type: ServiceType.MICROSERVICE, description: 'FA report tracker', environment: 'production', team: 'FA', owner: 'FA', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.8, responseTime: 110, errorRate: 0.15, tags: ['fa'], metadata: {} },
      { id: 'app-4', name: 'FA audit', type: ServiceType.MICROSERVICE, description: 'FA audit', environment: 'production', team: 'FA', owner: 'FA', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.9, responseTime: 80, errorRate: 0.08, tags: ['fa'], metadata: {} },
      { id: 'app-5', name: 'Branch Expense', type: ServiceType.MICROSERVICE, description: 'Branch expenses', environment: 'production', team: 'Branch', owner: 'Finance', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.7, responseTime: 120, errorRate: 0.2, tags: ['branch'], metadata: {} },
      { id: 'app-6', name: 'Employee CRM', type: ServiceType.MICROSERVICE, description: 'Employee CRM', environment: 'production', team: 'HR', owner: 'HR', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.9, responseTime: 85, errorRate: 0.1, tags: ['crm'], metadata: {} },
      { id: 'app-7', name: 'Workday', type: ServiceType.MICROSERVICE, description: 'Workday integrations', environment: 'production', team: 'HR', owner: 'HR', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.95, responseTime: 70, errorRate: 0.05, tags: ['workday'], metadata: {} },
      { id: 'app-8', name: 'AWS Resource Monitor', type: ServiceType.MICROSERVICE, description: 'AWS resource monitoring', environment: 'production', team: 'Cloud', owner: 'Platform', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.9, responseTime: 75, errorRate: 0.07, tags: ['aws'], metadata: {} },
      { id: 'app-9', name: 'NASH', type: ServiceType.MICROSERVICE, description: 'NASH system', environment: 'production', team: 'Core', owner: 'Core', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.CRITICAL, uptime: 99.95, responseTime: 65, errorRate: 0.04, tags: ['nash'], metadata: {} },
      { id: 'app-10', name: 'Azure Resource Exploer', type: ServiceType.MICROSERVICE, description: 'Azure resource explorer', environment: 'production', team: 'Cloud', owner: 'Platform', version: '1.0.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.9, responseTime: 70, errorRate: 0.06, tags: ['azure'], metadata: {} }
    ];

    const infra: Service[] = [
      { id: 'itp', name: 'HP NonStop ITP', type: ServiceType.EXTERNAL_SERVICE, description: 'ITP server', environment: 'production', team: 'Mainframe', owner: 'Mainframe', version: 'v1', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.CRITICAL, uptime: 99.99, responseTime: 40, errorRate: 0.02, tags: ['itp'], metadata: {} },
      { id: 'mq-ibm', name: 'IBM MQ', type: ServiceType.QUEUE, description: 'IBM MQ', environment: 'production', team: 'Middleware', owner: 'Platform', version: '9.3', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.99, responseTime: 5, errorRate: 0.01, tags: ['mq'], metadata: {} },
      { id: 'mq-kafka', name: 'Kafka Broker', type: ServiceType.MESSAGE_BROKER, description: 'Kafka', environment: 'production', team: 'Data', owner: 'Platform', version: '3.6', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 4, errorRate: 0.02, tags: ['kafka'], metadata: {} },
      { id: 'db-oracle', name: 'Oracle DB', type: ServiceType.DATABASE, description: 'Oracle', environment: 'production', team: 'DBA', owner: 'Data', version: '19c', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.CRITICAL, uptime: 99.95, responseTime: 7, errorRate: 0.03, tags: ['oracle'], metadata: {} },
      { id: 'db-pg', name: 'PostgreSQL DB', type: ServiceType.DATABASE, description: 'PostgreSQL', environment: 'production', team: 'DBA', owner: 'Data', version: '14', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 6, errorRate: 0.02, tags: ['postgres'], metadata: {} },
      { id: 'db-db2', name: 'DB2 Ledger', type: ServiceType.DATABASE, description: 'DB2', environment: 'production', team: 'DBA', owner: 'Finance', version: '11.5', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 9, errorRate: 0.05, tags: ['db2'], metadata: {} },
      { id: 'db-mysql-analytics', name: 'MySQL Analytics', type: ServiceType.DATABASE, description: 'MySQL for analytics', environment: 'production', team: 'Analytics', owner: 'BI', version: '8.0', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.8, responseTime: 10, errorRate: 0.03, tags: ['mysql'], metadata: {} },
      { id: 'dw-snowflake', name: 'Snowflake DW', type: ServiceType.DATABASE, description: 'Snowflake', environment: 'production', team: 'Data', owner: 'Data', version: '2025.1', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 20, errorRate: 0.02, tags: ['snowflake'], metadata: {} },
      { id: 'lake-s3', name: 'S3 Data Lake', type: ServiceType.DATABASE, description: 'S3 lake', environment: 'production', team: 'Data', owner: 'Data', version: 's3', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.99, responseTime: 30, errorRate: 0.01, tags: ['s3'], metadata: {} },
      { id: 'mdm-hub', name: 'MDM Hub', type: ServiceType.DATABASE, description: 'Master Data Hub', environment: 'production', team: 'Data', owner: 'Data Gov', version: '12.1', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 15, errorRate: 0.02, tags: ['mdm'], metadata: {} },
      { id: 'cache-redis', name: 'Redis Cache', type: ServiceType.CACHE, description: 'Redis', environment: 'production', team: 'Platform', owner: 'Platform', version: '7', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.99, responseTime: 1, errorRate: 0.01, tags: ['redis'], metadata: {} },
      { id: 'api-credit-bureau', name: 'Credit Bureau API', type: ServiceType.EXTERNAL_SERVICE, description: 'Credit checks', environment: 'production', team: 'External', owner: 'Vendor', version: 'v2', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.HIGH, uptime: 99.9, responseTime: 200, errorRate: 0.5, tags: ['credit'], metadata: {} },
      { id: 'api-fx', name: 'FX Rates API', type: ServiceType.EXTERNAL_SERVICE, description: 'FX rates', environment: 'production', team: 'External', owner: 'Vendor', version: 'v1', lastSeen: new Date(), status: ServiceStatus.ACTIVE, criticality: CriticalityLevel.MEDIUM, uptime: 99.9, responseTime: 120, errorRate: 0.3, tags: ['fx'], metadata: {} }
    ];

    const services: Service[] = [...apps, ...infra];

    const dep = (
      i: number,
      src: string,
      tgt: string,
      type: DependencyType,
      weight = 7,
      freq: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
    ): Dependency => ({
      id: `dep-${src}-${i}`,
      sourceServiceId: src,
      targetServiceId: tgt,
      dependencyType: type,
      usageCount: 10000 + Math.floor(Math.random() * 90000),
      lastUsed: new Date(),
      description: `${src} -> ${tgt}`,
      isActive: true,
      weight,
      frequency: freq,
      isCritical: weight >= 7,
      failureImpact: weight >= 8 ? 'HIGH' : weight >= 6 ? 'MEDIUM' : 'LOW',
      latency: 5 + Math.floor(Math.random() * 100),
      errorRate: parseFloat((Math.random() * 1).toFixed(2)),
      metadata: {}
    });

    const dependencies: Dependency[] = [
      dep(1, 'app-1', 'db-oracle', DependencyType.DATABASE_QUERY, 9),
      dep(2, 'app-1', 'db-pg', DependencyType.DATABASE_QUERY, 7, 'MEDIUM'),
      dep(3, 'app-1', 'mq-ibm', DependencyType.MESSAGE_QUEUE, 7),
      dep(4, 'app-1', 'dw-snowflake', DependencyType.DATABASE_QUERY, 8),
      dep(5, 'app-1', 'api-credit-bureau', DependencyType.API_CALL, 6, 'LOW'),
      dep(6, 'app-1', 'cache-redis', DependencyType.CACHE_ACCESS, 6, 'HIGH'),

      dep(1, 'app-2', 'db-oracle', DependencyType.DATABASE_QUERY, 9),
      dep(2, 'app-2', 'db-db2', DependencyType.DATABASE_QUERY, 8),
      dep(3, 'app-2', 'mq-ibm', DependencyType.MESSAGE_QUEUE, 7),
      dep(4, 'app-2', 'mq-kafka', DependencyType.EVENT_STREAM, 6, 'MEDIUM'),
      dep(5, 'app-2', 'lake-s3', DependencyType.FILE_SYSTEM, 6, 'LOW'),
      dep(6, 'app-2', 'mdm-hub', DependencyType.DATABASE_QUERY, 7),
      dep(7, 'app-2', 'itp', DependencyType.API_CALL, 8),

      dep(1, 'app-3', 'dw-snowflake', DependencyType.DATABASE_QUERY, 8),
      dep(2, 'app-3', 'lake-s3', DependencyType.FILE_SYSTEM, 6, 'MEDIUM'),
      dep(3, 'app-3', 'db-mysql-analytics', DependencyType.DATABASE_QUERY, 6),
      dep(4, 'app-3', 'mq-kafka', DependencyType.EVENT_STREAM, 6),
      dep(5, 'app-3', 'mdm-hub', DependencyType.DATABASE_QUERY, 7),
      dep(6, 'app-3', 'db-pg', DependencyType.DATABASE_QUERY, 6),

      dep(1, 'app-4', 'db-db2', DependencyType.DATABASE_QUERY, 8),
      dep(2, 'app-4', 'dw-snowflake', DependencyType.DATABASE_QUERY, 7),
      dep(3, 'app-4', 'lake-s3', DependencyType.FILE_SYSTEM, 6),
      dep(4, 'app-4', 'mq-kafka', DependencyType.EVENT_STREAM, 6, 'MEDIUM'),
      dep(5, 'app-4', 'itp', DependencyType.API_CALL, 7),
      dep(6, 'app-4', 'cache-redis', DependencyType.CACHE_ACCESS, 6),

      dep(1, 'app-5', 'db-oracle', DependencyType.DATABASE_QUERY, 9),
      dep(2, 'app-5', 'db-mysql-analytics', DependencyType.DATABASE_QUERY, 6, 'MEDIUM'),
      dep(3, 'app-5', 'cache-redis', DependencyType.CACHE_ACCESS, 6),
      dep(4, 'app-5', 'mq-ibm', DependencyType.MESSAGE_QUEUE, 7),
      dep(5, 'app-5', 'api-credit-bureau', DependencyType.API_CALL, 6, 'LOW'),
      dep(6, 'app-5', 'api-fx', DependencyType.API_CALL, 6, 'LOW'),

      dep(1, 'app-6', 'db-pg', DependencyType.DATABASE_QUERY, 8),
      dep(2, 'app-6', 'cache-redis', DependencyType.CACHE_ACCESS, 6),
      dep(3, 'app-6', 'mq-kafka', DependencyType.EVENT_STREAM, 6),
      dep(4, 'app-6', 'mdm-hub', DependencyType.DATABASE_QUERY, 7),
      dep(5, 'app-6', 'api-fx', DependencyType.API_CALL, 5, 'LOW'),
      dep(6, 'app-6', 'mq-ibm', DependencyType.MESSAGE_QUEUE, 6),

      dep(1, 'app-7', 'mdm-hub', DependencyType.DATABASE_QUERY, 7),
      dep(2, 'app-7', 'db-oracle', DependencyType.DATABASE_QUERY, 8),
      dep(3, 'app-7', 'mq-kafka', DependencyType.EVENT_STREAM, 6),
      dep(4, 'app-7', 'lake-s3', DependencyType.FILE_SYSTEM, 6),
      dep(5, 'app-7', 'dw-snowflake', DependencyType.DATABASE_QUERY, 7),
      dep(6, 'app-7', 'mq-ibm', DependencyType.MESSAGE_QUEUE, 6),

      dep(1, 'app-8', 'lake-s3', DependencyType.FILE_SYSTEM, 7),
      dep(2, 'app-8', 'mq-kafka', DependencyType.EVENT_STREAM, 6),
      dep(3, 'app-8', 'cache-redis', DependencyType.CACHE_ACCESS, 6),
      dep(4, 'app-8', 'dw-snowflake', DependencyType.DATABASE_QUERY, 6),
      dep(5, 'app-8', 'api-fx', DependencyType.API_CALL, 5, 'LOW'),
      dep(6, 'app-8', 'db-mysql-analytics', DependencyType.DATABASE_QUERY, 6),

      dep(1, 'app-9', 'db-db2', DependencyType.DATABASE_QUERY, 9),
      dep(2, 'app-9', 'db-oracle', DependencyType.DATABASE_QUERY, 8),
      dep(3, 'app-9', 'mq-ibm', DependencyType.MESSAGE_QUEUE, 7),
      dep(4, 'app-9', 'itp', DependencyType.API_CALL, 8),
      dep(5, 'app-9', 'cache-redis', DependencyType.CACHE_ACCESS, 6),
      dep(6, 'app-9', 'db-pg', DependencyType.DATABASE_QUERY, 7),
      dep(7, 'app-9', 'mq-kafka', DependencyType.EVENT_STREAM, 6, 'MEDIUM'),

      dep(1, 'app-10', 'dw-snowflake', DependencyType.DATABASE_QUERY, 7),
      dep(2, 'app-10', 'lake-s3', DependencyType.FILE_SYSTEM, 6),
      dep(3, 'app-10', 'cache-redis', DependencyType.CACHE_ACCESS, 6),
      dep(4, 'app-10', 'db-mysql-analytics', DependencyType.DATABASE_QUERY, 6, 'MEDIUM'),
      dep(5, 'app-10', 'mq-kafka', DependencyType.EVENT_STREAM, 6),
      dep(6, 'app-10', 'api-fx', DependencyType.API_CALL, 5, 'LOW')
    ];

    this.servicesSubject.next(services);
    this.dependenciesSubject.next(dependencies);
  }

  // Export/Import
  exportData(): string {
    return JSON.stringify({
      services: this.servicesSubject.value,
      dependencies: this.dependenciesSubject.value,
      analytics: this.analyticsSubject.value,
      exportDate: new Date().toISOString()
    });
  }

  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.services) {
        this.servicesSubject.next(parsed.services);
      }
      if (parsed.dependencies) {
        this.dependenciesSubject.next(parsed.dependencies);
      }
      if (parsed.analytics) {
        this.analyticsSubject.next(parsed.analytics);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}
