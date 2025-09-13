export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description?: string;
  url?: string;
  port?: number;
  environment: string;
  team?: string;
  lastSeen: Date;
  status: ServiceStatus;
  tags: string[];
  metadata: Record<string, any>;
}

export enum ServiceType {
  JAVA_APP = 'JAVA_APP',
  DOTNET_APP = 'DOTNET_APP',
  ANGULAR_APP = 'ANGULAR_APP',
  DATABASE = 'DATABASE',
  API = 'API',
  QUEUE = 'QUEUE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE'
}

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DEPRECATED = 'DEPRECATED',
  UNKNOWN = 'UNKNOWN'
}

export interface Dependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  dependencyType: DependencyType;
  usageCount: number;
  lastUsed: Date;
  description?: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export enum DependencyType {
  HTTP_REQUEST = 'HTTP_REQUEST',
  DATABASE_QUERY = 'DATABASE_QUERY',
  MESSAGE_QUEUE = 'MESSAGE_QUEUE',
  FILE_SYSTEM = 'FILE_SYSTEM',
  API_CALL = 'API_CALL',
  DIRECT_DEPENDENCY = 'DIRECT_DEPENDENCY'
}

export interface UsageAnalytics {
  serviceId: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastActivity: Date;
  peakUsageTime: Date;
  dependencies: DependencyUsage[];
}

export interface DependencyUsage {
  dependencyId: string;
  usageCount: number;
  lastUsed: Date;
  averageResponseTime: number;
  errorCount: number;
}
