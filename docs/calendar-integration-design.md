# Google/Microsoft Calendar Integration Architecture Design

## 📋 Overview

This document outlines the architecture and implementation design for integrating Google Calendar and Microsoft Calendar (Outlook) with our Todo List application. The design enables bidirectional synchronization while maintaining data integrity and user privacy.

## 🎯 Goals & Requirements

### Primary Goals
1. **Seamless Integration**: Users can connect their Google/Microsoft calendars without leaving the app
2. **Bidirectional Sync**: Changes in either system are reflected in both
3. **Real-time Updates**: Near real-time synchronization of events
4. **Conflict Resolution**: Smart handling of conflicting changes
5. **Privacy First**: Secure handling of user credentials and calendar data

### Functional Requirements
- OAuth 2.0 authentication for both providers
- Create, read, update, delete (CRUD) operations on calendar events
- Recurring event support
- Timezone handling
- Attachment and attendee management
- Offline capability with sync queue
- Multi-calendar support per provider

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                    Calendar Integration Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Calendar   │  │    Sync      │  │   Auth       │         │
│  │   Service    │  │   Manager    │  │   Manager    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────────────────────────┤
│                      API Gateway Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Google     │  │  Microsoft   │  │   WebHook    │         │
│  │   Adapter    │  │   Adapter    │  │   Handler    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├─────────────────────────────────────────────────────────────────┤
│                     External Services                            │
│  ┌──────────────┐                    ┌──────────────┐         │
│  │   Google     │                    │  Microsoft   │         │
│  │  Calendar    │                    │    Graph     │         │
│  │    API       │                    │     API      │         │
│  └──────────────┘                    └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Architecture

### OAuth 2.0 Flow

```typescript
interface OAuthConfig {
  provider: 'google' | 'microsoft'
  clientId: string
  clientSecret?: string // For server-side flow
  redirectUri: string
  scopes: string[]
}

interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  provider: 'google' | 'microsoft'
  scope: string[]
}
```

### Google OAuth Configuration
```typescript
const googleOAuthConfig: OAuthConfig = {
  provider: 'google',
  clientId: process.env.GOOGLE_CLIENT_ID!,
  redirectUri: `${APP_URL}/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
}
```

### Microsoft OAuth Configuration
```typescript
const microsoftOAuthConfig: OAuthConfig = {
  provider: 'microsoft',
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  redirectUri: `${APP_URL}/auth/microsoft/callback`,
  scopes: [
    'User.Read',
    'Calendars.ReadWrite',
    'Calendars.ReadWrite.Shared',
    'offline_access'
  ]
}
```

## 📊 Data Models

### Unified Calendar Event Model
```typescript
interface CalendarEvent {
  id: string
  externalId?: string // Google/Microsoft event ID
  provider?: 'google' | 'microsoft'
  
  // Basic Information
  title: string
  description?: string
  location?: string
  
  // Time Information
  startDate: Date
  endDate: Date
  allDay: boolean
  timezone: string
  
  // Recurrence
  recurrence?: RecurrenceRule
  recurringEventId?: string // Parent event for instances
  
  // Participants
  organizer?: Attendee
  attendees?: Attendee[]
  
  // Status
  status: 'confirmed' | 'tentative' | 'cancelled'
  visibility: 'public' | 'private' | 'confidential'
  
  // Reminders
  reminders?: Reminder[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  syncedAt?: Date
  lastModifiedBy: 'local' | 'external'
  
  // Conflict Resolution
  version: number
  conflictResolution?: 'local' | 'remote' | 'manual'
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  count?: number
  until?: Date
  byDay?: string[] // ['MO', 'TU', 'WE', ...]
  byMonth?: number[]
  byMonthDay?: number[]
}

interface Attendee {
  email: string
  displayName?: string
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction'
  optional: boolean
  organizer: boolean
}

interface Reminder {
  method: 'email' | 'popup' | 'sms'
  minutes: number
}
```

### Sync Metadata Model
```typescript
interface SyncMetadata {
  id: string
  userId: string
  provider: 'google' | 'microsoft'
  
  // Sync State
  lastSyncToken?: string // For incremental sync
  lastSyncTime?: Date
  syncStatus: 'idle' | 'syncing' | 'error'
  errorMessage?: string
  
  // Calendar Mapping
  calendars: CalendarMapping[]
  
  // Sync Settings
  syncDirection: 'bidirectional' | 'pull' | 'push'
  syncInterval: number // minutes
  conflictResolution: 'local' | 'remote' | 'manual' | 'newest'
}

interface CalendarMapping {
  localCalendarId: string
  externalCalendarId: string
  name: string
  color?: string
  syncEnabled: boolean
  lastSyncTime?: Date
}
```

## 🔄 Synchronization Architecture

### Sync Manager
```typescript
class CalendarSyncManager {
  private syncQueue: SyncOperation[] = []
  private syncInProgress = false
  
  async performSync(userId: string, provider: 'google' | 'microsoft') {
    // 1. Check authentication
    // 2. Get sync metadata
    // 3. Perform incremental sync
    // 4. Handle conflicts
    // 5. Update local database
    // 6. Update sync metadata
  }
  
  async handleWebhook(payload: WebhookPayload) {
    // Real-time update from provider
  }
  
  private async resolveConflict(
    localEvent: CalendarEvent,
    remoteEvent: CalendarEvent
  ): Promise<CalendarEvent> {
    // Implement conflict resolution strategy
  }
}
```

### Sync Operation Queue
```typescript
interface SyncOperation {
  id: string
  operation: 'create' | 'update' | 'delete'
  eventId: string
  provider: 'google' | 'microsoft'
  payload: Partial<CalendarEvent>
  retryCount: number
  createdAt: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
```

## 🔌 Provider Adapters

### Google Calendar Adapter
```typescript
class GoogleCalendarAdapter implements CalendarProvider {
  async authenticate(code: string): Promise<AuthToken> {
    // Exchange code for tokens
  }
  
  async listCalendars(authToken: AuthToken): Promise<ExternalCalendar[]> {
    // Get user's calendars
  }
  
  async getEvents(
    authToken: AuthToken,
    calendarId: string,
    syncToken?: string
  ): Promise<{ events: CalendarEvent[], nextSyncToken: string }> {
    // Incremental sync using syncToken
  }
  
  async createEvent(
    authToken: AuthToken,
    calendarId: string,
    event: CalendarEvent
  ): Promise<CalendarEvent> {
    // Create event in Google Calendar
  }
  
  async updateEvent(
    authToken: AuthToken,
    calendarId: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    // Update event in Google Calendar
  }
  
  async deleteEvent(
    authToken: AuthToken,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    // Delete event from Google Calendar
  }
  
  // Convert between our model and Google's
  private toGoogleEvent(event: CalendarEvent): any { }
  private fromGoogleEvent(googleEvent: any): CalendarEvent { }
}
```

### Microsoft Calendar Adapter
```typescript
class MicrosoftCalendarAdapter implements CalendarProvider {
  // Similar implementation for Microsoft Graph API
  // Key differences:
  // - Uses Microsoft Graph endpoints
  // - Different event model mapping
  // - Different authentication flow
}
```

## 🎛️ UI Components Design

### Calendar Settings Component
```typescript
interface CalendarSettingsProps {
  userId: string
  onConnect: (provider: 'google' | 'microsoft') => void
  onDisconnect: (provider: 'google' | 'microsoft') => void
}

const CalendarSettings: React.FC<CalendarSettingsProps> = () => {
  return (
    <div className="calendar-settings">
      <h3>外部行事曆整合</h3>
      
      <div className="provider-card">
        <img src="/google-calendar-icon.png" alt="Google Calendar" />
        <h4>Google Calendar</h4>
        <p>連接您的 Google 行事曆以同步事件</p>
        <MagicButton onClick={() => onConnect('google')}>
          連接 Google Calendar
        </MagicButton>
      </div>
      
      <div className="provider-card">
        <img src="/outlook-icon.png" alt="Microsoft Outlook" />
        <h4>Microsoft Outlook</h4>
        <p>連接您的 Outlook 行事曆以同步事件</p>
        <MagicButton onClick={() => onConnect('microsoft')}>
          連接 Outlook
        </MagicButton>
      </div>
    </div>
  )
}
```

### Calendar Sync Status Component
```typescript
const CalendarSyncStatus: React.FC = () => {
  const { syncStatus, lastSyncTime, syncErrors } = useCalendarSync()
  
  return (
    <div className="sync-status">
      <div className="sync-status__indicator">
        {syncStatus === 'syncing' && <Spinner />}
        {syncStatus === 'idle' && <CheckIcon />}
        {syncStatus === 'error' && <ErrorIcon />}
      </div>
      
      <div className="sync-status__info">
        <p>上次同步: {formatRelativeTime(lastSyncTime)}</p>
        {syncErrors.length > 0 && (
          <p className="sync-error">同步錯誤: {syncErrors[0].message}</p>
        )}
      </div>
      
      <MagicButton onClick={triggerSync} size="small">
        立即同步
      </MagicButton>
    </div>
  )
}
```

## 🛡️ Security Considerations

### Token Storage
- Store refresh tokens encrypted in secure storage
- Access tokens in memory only
- Implement token rotation

### API Security
- Use HTTPS for all communications
- Implement rate limiting
- Validate webhook signatures
- Sanitize all external data

### Privacy
- Allow selective calendar sync
- Provide data export/delete options
- Clear privacy policy for data usage

## 📈 Performance Optimization

### Caching Strategy
```typescript
class CalendarCache {
  private cache: Map<string, CachedData> = new Map()
  
  async get(key: string): Promise<any> {
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > new Date()) {
      return cached.data
    }
    return null
  }
  
  async set(key: string, data: any, ttl: number) {
    this.cache.set(key, {
      data,
      expiresAt: new Date(Date.now() + ttl)
    })
  }
}
```

### Batch Operations
- Group API calls when possible
- Use batch endpoints for bulk operations
- Implement request debouncing

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] OAuth 2.0 implementation for both providers
- [ ] Basic authentication UI
- [ ] Token management system

### Phase 2: Core Sync (Week 3-4)
- [ ] Event CRUD operations
- [ ] Basic bidirectional sync
- [ ] Conflict detection

### Phase 3: Advanced Features (Week 5-6)
- [ ] Recurring events
- [ ] Attendee management
- [ ] Webhook integration
- [ ] Offline sync queue

### Phase 4: Polish (Week 7-8)
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Comprehensive testing
- [ ] Documentation

## 📝 API Endpoints

### Authentication Endpoints
```
GET  /api/auth/google/authorize
GET  /api/auth/google/callback
GET  /api/auth/microsoft/authorize
GET  /api/auth/microsoft/callback
POST /api/auth/disconnect
```

### Calendar Endpoints
```
GET    /api/calendars
GET    /api/calendars/:id/events
POST   /api/calendars/:id/events
PUT    /api/calendars/:id/events/:eventId
DELETE /api/calendars/:id/events/:eventId
POST   /api/calendars/sync
```

### Webhook Endpoints
```
POST /api/webhooks/google
POST /api/webhooks/microsoft
```

## 🧪 Testing Strategy

### Unit Tests
- Provider adapter methods
- Event transformation logic
- Conflict resolution algorithms

### Integration Tests
- OAuth flow completion
- API communication
- Sync scenarios

### E2E Tests
- Complete sync workflow
- Error recovery
- Multi-provider scenarios

## 📚 Dependencies

```json
{
  "dependencies": {
    "googleapis": "^118.0.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.0"
  }
}
```

## 🎯 Success Metrics

1. **Sync Reliability**: >99.5% successful sync operations
2. **Performance**: <2s average sync time
3. **User Adoption**: >60% of users connect at least one calendar
4. **Error Rate**: <0.1% sync errors
5. **Conflict Resolution**: <5% manual intervention required

## 🔮 Future Enhancements

1. **Additional Providers**: Apple Calendar, Yahoo Calendar
2. **Smart Scheduling**: AI-powered meeting suggestions
3. **Calendar Analytics**: Insights on time usage
4. **Team Calendars**: Shared calendar support
5. **Mobile Notifications**: Push notifications for calendar events