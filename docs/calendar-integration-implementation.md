# Calendar Integration Implementation Plan

## 📋 Implementation Overview

This document provides a detailed implementation plan for integrating Google Calendar and Microsoft Calendar into our Todo List application.

## 🚀 Implementation Phases

### Phase 1: Foundation Setup (3-4 days)

#### 1.1 Environment Configuration
```bash
# .env.local
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
VITE_MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000
```

#### 1.2 OAuth Setup Tasks
- [ ] Register app with Google Cloud Console
- [ ] Register app with Azure AD
- [ ] Configure OAuth redirect URIs
- [ ] Set up required API permissions

#### 1.3 Dependencies Installation
```json
{
  "dependencies": {
    "@react-oauth/google": "^0.11.1",
    "@azure/msal-browser": "^3.10.0",
    "@microsoft/microsoft-graph-client": "^3.0.7",
    "googleapis": "^126.0.1",
    "date-fns": "^2.30.0",
    "date-fns-tz": "^2.0.0",
    "rrule": "^2.7.2"
  }
}
```

### Phase 2: Authentication Layer (3-4 days)

#### 2.1 Create Auth Service
```typescript
// src/services/auth/CalendarAuthService.ts
export class CalendarAuthService {
  private googleOAuth: GoogleOAuthClient
  private microsoftAuth: PublicClientApplication
  
  async initiateGoogleAuth(): Promise<void> {
    // Implementation
  }
  
  async initiateMicrosoftAuth(): Promise<void> {
    // Implementation
  }
  
  async handleAuthCallback(
    provider: CalendarProvider,
    code: string
  ): Promise<AuthToken> {
    // Implementation
  }
}
```

#### 2.2 Token Management
```typescript
// src/services/auth/TokenManager.ts
export class TokenManager {
  private tokenStore: Map<string, AuthToken> = new Map()
  
  async saveToken(token: AuthToken): Promise<void> {
    // Encrypt and store in localStorage/IndexedDB
  }
  
  async getToken(provider: CalendarProvider): Promise<AuthToken | null> {
    // Retrieve and decrypt token
  }
  
  async refreshToken(provider: CalendarProvider): Promise<AuthToken> {
    // Refresh expired token
  }
}
```

#### 2.3 Auth UI Components
- [ ] Create OAuth button components
- [ ] Create auth callback handler pages
- [ ] Create connected accounts management UI
- [ ] Add disconnect functionality

### Phase 3: Calendar Provider Adapters (5-6 days)

#### 3.1 Google Calendar Adapter
```typescript
// src/services/calendar/GoogleCalendarAdapter.ts
import { google } from 'googleapis'

export class GoogleCalendarAdapter implements CalendarProviderAdapter {
  private calendar: any
  
  constructor(private auth: OAuth2Client) {
    this.calendar = google.calendar({ version: 'v3', auth })
  }
  
  async listCalendars(): Promise<ExternalCalendar[]> {
    const response = await this.calendar.calendarList.list()
    return this.transformCalendars(response.data.items)
  }
  
  async listEvents(calendarId: string, options?: ListEventsOptions) {
    const response = await this.calendar.events.list({
      calendarId,
      ...this.buildQueryParams(options)
    })
    return this.transformEvents(response.data)
  }
  
  // Additional methods...
}
```

#### 3.2 Microsoft Calendar Adapter
```typescript
// src/services/calendar/MicrosoftCalendarAdapter.ts
import { Client } from '@microsoft/microsoft-graph-client'

export class MicrosoftCalendarAdapter implements CalendarProviderAdapter {
  private client: Client
  
  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => done(null, accessToken)
    })
  }
  
  async listCalendars(): Promise<ExternalCalendar[]> {
    const response = await this.client
      .api('/me/calendars')
      .get()
    return this.transformCalendars(response.value)
  }
  
  // Additional methods...
}
```

### Phase 4: Sync Engine (5-6 days)

#### 4.1 Sync Manager Implementation
```typescript
// src/services/sync/CalendarSyncManager.ts
export class CalendarSyncManager {
  private syncQueue: SyncQueue
  private conflictResolver: ConflictResolver
  private eventCache: EventCache
  
  async performFullSync(userId: string, provider: CalendarProvider) {
    try {
      // 1. Get auth token
      const token = await this.tokenManager.getToken(provider)
      
      // 2. Create provider adapter
      const adapter = this.createAdapter(provider, token)
      
      // 3. Get sync metadata
      const metadata = await this.getSyncMetadata(userId, provider)
      
      // 4. Fetch remote events
      const remoteEvents = await this.fetchRemoteEvents(adapter, metadata)
      
      // 5. Fetch local events
      const localEvents = await this.fetchLocalEvents(userId, provider)
      
      // 6. Perform sync
      const syncResult = await this.syncEvents(
        localEvents,
        remoteEvents,
        metadata
      )
      
      // 7. Update sync metadata
      await this.updateSyncMetadata(metadata, syncResult)
      
    } catch (error) {
      await this.handleSyncError(error, userId, provider)
    }
  }
  
  private async syncEvents(
    local: CalendarSyncEvent[],
    remote: CalendarSyncEvent[],
    metadata: SyncMetadata
  ): Promise<SyncResult> {
    const operations: SyncOperation[] = []
    
    // Detect changes
    const changes = this.detectChanges(local, remote, metadata)
    
    // Resolve conflicts
    const resolved = await this.resolveConflicts(changes, metadata)
    
    // Create sync operations
    operations.push(...this.createSyncOperations(resolved))
    
    // Execute operations
    return await this.executeSyncOperations(operations)
  }
}
```

#### 4.2 Conflict Resolution
```typescript
// src/services/sync/ConflictResolver.ts
export class ConflictResolver {
  async resolveConflict(
    local: CalendarSyncEvent,
    remote: CalendarSyncEvent,
    strategy: ConflictStrategy
  ): Promise<ConflictResolution> {
    switch (strategy) {
      case 'local_wins':
        return { winner: local, loser: remote, action: 'overwrite_remote' }
      
      case 'remote_wins':
        return { winner: remote, loser: local, action: 'overwrite_local' }
      
      case 'newest_wins':
        return local.updatedAt > remote.updatedAt
          ? { winner: local, loser: remote, action: 'overwrite_remote' }
          : { winner: remote, loser: local, action: 'overwrite_local' }
      
      case 'merge':
        return await this.mergeEvents(local, remote)
      
      case 'manual':
        return { winner: null, loser: null, action: 'request_user_input' }
    }
  }
  
  private async mergeEvents(
    local: CalendarSyncEvent,
    remote: CalendarSyncEvent
  ): Promise<ConflictResolution> {
    // Implement intelligent merging logic
    const merged: CalendarSyncEvent = {
      ...local,
      // Merge logic here
    }
    
    return {
      winner: merged,
      loser: null,
      action: 'merge'
    }
  }
}
```

### Phase 5: UI Implementation (4-5 days)

#### 5.1 Calendar Settings Page
```typescript
// src/components/settings/CalendarSettings.tsx
export const CalendarSettings: React.FC = () => {
  const {
    providers,
    connectProvider,
    disconnectProvider,
    updateSyncSettings
  } = useCalendarSync()
  
  return (
    <div className="calendar-settings">
      <h2>行事曆整合設定</h2>
      
      {/* Provider Connection Cards */}
      <div className="provider-cards">
        <GoogleCalendarCard
          connected={providers.google?.connected}
          onConnect={() => connectProvider('google')}
          onDisconnect={() => disconnectProvider('google')}
        />
        
        <MicrosoftCalendarCard
          connected={providers.microsoft?.connected}
          onConnect={() => connectProvider('microsoft')}
          onDisconnect={() => disconnectProvider('microsoft')}
        />
      </div>
      
      {/* Sync Settings */}
      {providers.some(p => p.connected) && (
        <SyncSettingsPanel
          providers={providers}
          onUpdateSettings={updateSyncSettings}
        />
      )}
    </div>
  )
}
```

#### 5.2 Calendar Selection Modal
```typescript
// src/components/calendar/CalendarSelectionModal.tsx
export const CalendarSelectionModal: React.FC<Props> = ({
  provider,
  calendars,
  selectedCalendars,
  onSelect,
  onClose
}) => {
  return (
    <Modal isOpen onClose={onClose}>
      <div className="calendar-selection">
        <h3>選擇要同步的行事曆</h3>
        
        <div className="calendar-list">
          {calendars.map(calendar => (
            <label key={calendar.id} className="calendar-item">
              <input
                type="checkbox"
                checked={selectedCalendars.includes(calendar.id)}
                onChange={(e) => onSelect(calendar.id, e.target.checked)}
              />
              <div className="calendar-info">
                <span className="calendar-color" 
                      style={{ backgroundColor: calendar.color }} />
                <span className="calendar-name">{calendar.name}</span>
                <span className="calendar-access">{calendar.accessRole}</span>
              </div>
            </label>
          ))}
        </div>
        
        <div className="modal-actions">
          <MagicButton onClick={onClose} variant="secondary">
            取消
          </MagicButton>
          <MagicButton onClick={handleSave} variant="primary">
            儲存選擇
          </MagicButton>
        </div>
      </div>
    </Modal>
  )
}
```

#### 5.3 Sync Status Component
```typescript
// src/components/calendar/SyncStatusIndicator.tsx
export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSync, errors } = useCalendarSync()
  
  return (
    <div className="sync-status-indicator">
      <div className={`sync-icon ${syncStatus}`}>
        {syncStatus === 'syncing' && <SpinnerIcon />}
        {syncStatus === 'idle' && <CheckIcon />}
        {syncStatus === 'error' && <ErrorIcon />}
      </div>
      
      <div className="sync-info">
        <span className="sync-label">
          {syncStatus === 'syncing' && '同步中...'}
          {syncStatus === 'idle' && `上次同步: ${formatTime(lastSync)}`}
          {syncStatus === 'error' && '同步錯誤'}
        </span>
        
        {errors.length > 0 && (
          <div className="sync-errors">
            {errors.map(error => (
              <div key={error.id} className="error-item">
                {error.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Phase 6: Real-time Updates (3-4 days)

#### 6.1 Webhook Handler
```typescript
// src/services/webhook/CalendarWebhookHandler.ts
export class CalendarWebhookHandler {
  async handleGoogleWebhook(payload: any, headers: any): Promise<void> {
    // Verify webhook signature
    if (!this.verifyGoogleSignature(payload, headers)) {
      throw new Error('Invalid webhook signature')
    }
    
    // Parse notification
    const notification = this.parseGoogleNotification(payload)
    
    // Queue sync for affected calendar
    await this.queueSync(notification.calendarId, 'google')
  }
  
  async handleMicrosoftWebhook(payload: any): Promise<void> {
    // Microsoft webhook handling
  }
}
```

#### 6.2 Real-time Sync Trigger
```typescript
// src/hooks/useRealtimeSync.ts
export function useRealtimeSync() {
  const { triggerSync } = useCalendarSync()
  
  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(process.env.VITE_WS_URL)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'calendar_update') {
        triggerSync(data.provider, data.calendarId)
      }
    }
    
    return () => ws.close()
  }, [triggerSync])
}
```

### Phase 7: Testing & Polish (3-4 days)

#### 7.1 Unit Tests
```typescript
// src/services/sync/__tests__/CalendarSyncManager.test.ts
describe('CalendarSyncManager', () => {
  it('should perform full sync successfully', async () => {
    // Test implementation
  })
  
  it('should handle conflicts according to strategy', async () => {
    // Test implementation
  })
  
  it('should recover from sync errors', async () => {
    // Test implementation
  })
})
```

#### 7.2 Integration Tests
- Test OAuth flow for both providers
- Test event CRUD operations
- Test sync scenarios
- Test conflict resolution
- Test error recovery

#### 7.3 E2E Tests
- Complete user journey from connection to sync
- Multi-provider scenarios
- Offline/online transitions
- Performance under load

## 📊 Database Schema Updates

```sql
-- OAuth tokens table
CREATE TABLE calendar_auth_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(20) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  scope TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sync metadata table
CREATE TABLE calendar_sync_metadata (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(20) NOT NULL,
  last_sync_token TEXT,
  last_sync_time TIMESTAMP,
  sync_status VARCHAR(20),
  sync_direction VARCHAR(20),
  conflict_resolution VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calendar mappings table
CREATE TABLE calendar_mappings (
  id UUID PRIMARY KEY,
  sync_metadata_id UUID REFERENCES calendar_sync_metadata(id),
  local_calendar_id UUID,
  external_calendar_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color VARCHAR(7),
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_time TIMESTAMP
);

-- Sync operations queue
CREATE TABLE sync_operations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  operation VARCHAR(20) NOT NULL,
  event_id UUID,
  external_event_id TEXT,
  provider VARCHAR(20) NOT NULL,
  calendar_id UUID,
  payload JSONB,
  retry_count INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  error JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Add external ID to events table
ALTER TABLE calendar_events 
ADD COLUMN external_id TEXT,
ADD COLUMN provider VARCHAR(20),
ADD COLUMN last_modified_by VARCHAR(20),
ADD COLUMN sync_version INTEGER DEFAULT 1;
```

## 🎯 Success Criteria

1. **Authentication**: Users can connect/disconnect both providers
2. **Calendar Selection**: Users can choose which calendars to sync
3. **Bidirectional Sync**: Changes propagate both ways
4. **Conflict Resolution**: Conflicts are handled according to user preference
5. **Performance**: Sync completes within 5 seconds for <1000 events
6. **Reliability**: 99%+ sync success rate
7. **User Experience**: Clear feedback and error handling

## 📅 Timeline

- **Week 1-2**: Foundation + Authentication
- **Week 3**: Provider Adapters
- **Week 4**: Sync Engine
- **Week 5**: UI Implementation
- **Week 6**: Real-time Updates + Testing

Total estimated time: 6 weeks for full implementation