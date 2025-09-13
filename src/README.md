# System Dependency Mapping Tool

A comprehensive Angular application for visualizing and managing dependencies between IT systems, services, databases, APIs, and other infrastructure components.

## 🚀 Features

### 📊 Interactive Dashboard
- **Real-time Statistics**: View total services, active services, dependencies, and team distribution
- **Advanced Filtering**: Filter by service type, status, criticality, team, environment, and date range
- **Multiple View Modes**: Grid, list, and table views for different use cases
- **Quick Actions**: Export/import data, refresh, and alert management
- **Service Distribution Charts**: Visual breakdown of services by type

### 🕸️ Dependency Graph Visualization
- **Cytoscape.js Integration**: Powerful graph visualization with multiple layout algorithms
- **Interactive Controls**: Zoom, pan, fit-to-screen, and layout switching
- **Real-time Filtering**: Filter nodes and edges by various criteria
- **Hover Effects**: Highlight connected dependencies on hover
- **Export Capabilities**: Export graphs as PNG images or data as JSON
- **Multiple Layouts**: Force-directed, hierarchical, constraint-based, circular, and layered layouts

### 🔧 Service Management
- **Comprehensive Forms**: Add/edit services with detailed metadata
- **Performance Metrics**: Track uptime, response time, and error rates
- **Criticality Levels**: Categorize services by business criticality
- **Team Ownership**: Assign services to teams and individual owners
- **Version Tracking**: Monitor service versions and deployment dates

### 📈 Analytics & Monitoring
- **Usage Analytics**: Track dependency usage counts and patterns
- **Performance Metrics**: Monitor service health and performance
- **Criticality Assessment**: Identify high-risk dependencies
- **Team Insights**: Understand service ownership and team distribution

## 🛠️ Technology Stack

- **Frontend**: Angular 17+ with standalone components
- **Visualization**: Cytoscape.js with multiple layout extensions
- **Styling**: SCSS with modern CSS Grid and Flexbox
- **State Management**: RxJS Observables and BehaviorSubjects
- **Data Persistence**: LocalStorage for demo purposes
- **TypeScript**: Full type safety throughout the application

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dependency-mapping-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

## 🏗️ Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/           # Main dashboard component
│   │   ├── dependency-graph/    # Cytoscape.js graph visualization
│   │   └── service-form/        # Service creation/editing forms
│   ├── models/
│   │   └── service.model.ts     # TypeScript interfaces and enums
│   ├── services/
│   │   └── dependency.service.ts # Data management service
│   ├── app.component.ts         # Root component
│   ├── app.routes.ts           # Application routing
│   └── main.ts                 # Application bootstrap
├── styles.scss                 # Global styles
└── index.html                  # Main HTML file
```

## 🎯 Key Components

### Dashboard Component
- **Location**: `app/components/dashboard/`
- **Purpose**: Main application interface with statistics and service overview
- **Features**: 
  - Real-time statistics cards
  - Advanced filtering system
  - Multiple view modes (grid/list/table)
  - Service distribution charts
  - Quick action buttons

### Dependency Graph Component
- **Location**: `app/components/dependency-graph/`
- **Purpose**: Interactive graph visualization using Cytoscape.js
- **Features**:
  - Multiple layout algorithms (force-directed, hierarchical, etc.)
  - Interactive node and edge selection
  - Real-time filtering and search
  - Export capabilities (PNG/JSON)
  - Hover effects and highlighting

### Service Form Component
- **Location**: `app/components/service-form/`
- **Purpose**: Create and edit service configurations
- **Features**:
  - Comprehensive form validation
  - Performance metrics input
  - Criticality level assignment
  - Team and ownership tracking
  - Metadata configuration

## 📊 Data Models

### Service Interface
```typescript
interface Service {
  id: string;
  name: string;
  type: ServiceType;
  description?: string;
  url?: string;
  port?: number;
  environment: string;
  team?: string;
  owner?: string;
  version?: string;
  lastSeen: Date;
  status: ServiceStatus;
  criticality: CriticalityLevel;
  uptime?: number;
  responseTime?: number;
  errorRate?: number;
  tags: string[];
  metadata: Record<string, any>;
}
```

### Dependency Interface
```typescript
interface Dependency {
  id: string;
  sourceServiceId: string;
  targetServiceId: string;
  dependencyType: DependencyType;
  usageCount: number;
  lastUsed: Date;
  description?: string;
  isActive: boolean;
  weight: number;
  frequency: 'HIGH' | 'MEDIUM' | 'LOW';
  isCritical: boolean;
  failureImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  latency?: number;
  errorRate?: number;
  metadata: Record<string, any>;
}
```

## 🎨 UI/UX Features

### Modern Design
- **Clean Interface**: Minimalist design with focus on usability
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **Color-coded Elements**: Status indicators, criticality levels, and service types
- **Interactive Elements**: Hover effects, smooth transitions, and visual feedback

### Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Clear visual distinction between elements
- **Focus Management**: Logical tab order and focus indicators

## 🔧 Configuration

### Service Types
- Java Applications
- .NET Applications
- Angular Applications
- React Applications
- Vue Applications
- Node.js Applications
- Python Applications
- Databases
- APIs
- Message Queues
- External Services
- Microservices
- Monoliths

### Dependency Types
- HTTP Requests
- Database Queries
- Message Queues
- File System Access
- API Calls
- Direct Dependencies
- gRPC Calls
- WebSockets
- REST APIs
- GraphQL
- SOAP
- Event Streams
- Cache Access
- Service Discovery

## 📈 Usage Examples

### Adding a New Service
1. Navigate to the dashboard
2. Click "Add Service" button
3. Fill in the service details form
4. Set criticality level and performance metrics
5. Add tags and metadata
6. Save the service

### Visualizing Dependencies
1. Go to the Graph view
2. Use the layout selector to choose a visualization style
3. Apply filters to focus on specific services
4. Click on nodes to see detailed information
5. Use zoom and pan controls to navigate the graph

### Filtering and Search
1. Use the search bar to find specific services
2. Apply filters by type, status, or criticality
3. Use advanced filters for more specific criteria
4. Clear filters to reset the view

## 🚀 Future Enhancements

- **Real-time Data Integration**: Connect to monitoring systems
- **Alert Management**: Set up alerts for service health issues
- **Collaboration Features**: Team-based service management
- **API Integration**: Connect to external service registries
- **Advanced Analytics**: Machine learning insights and predictions
- **Mobile App**: Native mobile application
- **Cloud Deployment**: Docker and Kubernetes support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🙏 Acknowledgments

- **Cytoscape.js** for powerful graph visualization
- **Angular Team** for the excellent framework
- **Open Source Community** for inspiration and tools

---

**System Dependency Mapping Tool** - Making IT infrastructure dependencies visible and manageable.
