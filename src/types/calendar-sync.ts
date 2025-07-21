// Calendar Sync Type Definitions

// OAuth and Authentication Types
export interface OAuthConfig {
  provider: CalendarProvider
  clientId: string
  clientSecret?: string
  redirectUri: string
  scopes: string[]
}

export interface AuthToken {
  id: string
  userId: string
  provider: CalendarProvider
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string[]
  createdAt: Date
  updatedAt: Date
}

export type CalendarProvider = 'google' | 'microsoft' | 'local'

// Calendar and Event Types
export interface ExternalCalendar {
  id: string
  externalId: string
  provider: CalendarProvider
  name: string
  description?: string
  color?: string
  timezone?: string
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader'
  primary?: boolean
  selected?: boolean
}

export interface CalendarSyncEvent {
  id: string
  externalId?: string
  provider?: CalendarProvider
  calendarId: string
  
  // Basic Information
  title: string
  description?: string
  location?: string
  htmlLink?: string
  
  // Time Information
  startDate: Date
  endDate: Date
  allDay: boolean
  timezone: string
  
  // Recurrence
  recurrence?: RecurrenceRule
  recurringEventId?: string
  isRecurringInstance?: boolean
  
  // Participants
  organizer?: Attendee
  attendees?: Attendee[]
  
  // Status and Visibility
  status: EventStatus
  visibility: EventVisibility
  transparency?: 'opaque' | 'transparent'
  
  // Reminders
  reminders?: Reminder[]
  useDefaultReminders?: boolean
  
  // Attachments
  attachments?: Attachment[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  syncedAt?: Date
  lastModifiedBy: 'local' | 'external'
  
  // Conflict Resolution
  version: number
  etag?: string
  conflictResolution?: ConflictResolution
  
  // Custom Properties
  extendedProperties?: Record<string, any>
  colorId?: string
  hangoutLink?: string
  conferenceData?: ConferenceData
}

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled'
export type EventVisibility = 'default' | 'public' | 'private' | 'confidential'
export type ConflictResolution = 'local' | 'remote' | 'manual' | 'merge'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  count?: number
  until?: Date
  byDay?: WeekDay[]
  byMonth?: number[]
  byMonthDay?: number[]
  bySetPos?: number[]
  weekStart?: WeekDay
  exceptions?: Date[]
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type WeekDay = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA'

export interface Attendee {
  id?: string
  email: string
  displayName?: string
  responseStatus: AttendeeResponse
  comment?: string
  optional: boolean
  organizer: boolean
  resource?: boolean
  additionalGuests?: number
  self?: boolean
}

export type AttendeeResponse = 'accepted' | 'declined' | 'tentative' | 'needsAction'

export interface Reminder {
  id?: string
  method: ReminderMethod
  minutes: number
}

export type ReminderMethod = 'email' | 'popup' | 'sms' | 'notification'

export interface Attachment {
  id: string
  fileId?: string
  fileUrl: string
  title: string
  mimeType: string
  iconLink?: string
  size?: number
}

export interface ConferenceData {
  conferenceId?: string
  conferenceSolution?: {
    key: { type: string }
    name: string
    iconUri?: string
  }
  entryPoints?: ConferenceEntryPoint[]
  notes?: string
}

export interface ConferenceEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more'
  uri?: string
  label?: string
  pin?: string
  accessCode?: string
  meetingCode?: string
  passcode?: string
}

// Sync Management Types
export interface SyncMetadata {
  id: string
  userId: string
  provider: CalendarProvider
  
  // Sync State
  lastSyncToken?: string
  lastSyncTime?: Date
  nextSyncTime?: Date
  syncStatus: SyncStatus
  errorMessage?: string
  errorCount: number
  
  // Calendar Mapping
  calendars: CalendarMapping[]
  
  // Sync Settings
  syncDirection: SyncDirection
  syncInterval: number // minutes
  conflictResolution: ConflictStrategy
  syncEnabled: boolean
  
  // Sync Statistics
  stats?: SyncStatistics
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'paused' | 'unauthorized'
export type SyncDirection = 'bidirectional' | 'pull' | 'push'
export type ConflictStrategy = 'local_wins' | 'remote_wins' | 'manual' | 'newest_wins' | 'merge'

export interface CalendarMapping {
  id: string
  localCalendarId: string
  externalCalendarId: string
  name: string
  color?: string
  syncEnabled: boolean
  lastSyncTime?: Date
  syncDirection?: SyncDirection
  filters?: SyncFilter[]
}

export interface SyncFilter {
  type: 'dateRange' | 'eventType' | 'keyword' | 'attendee'
  value: any
  include: boolean
}

export interface SyncStatistics {
  totalEvents: number
  syncedEvents: number
  failedEvents: number
  conflictedEvents: number
  lastSuccessfulSync?: Date
  averageSyncTime?: number
}

// Sync Operations
export interface SyncOperation {
  id: string
  userId: string
  operation: SyncOperationType
  eventId: string
  externalEventId?: string
  provider: CalendarProvider
  calendarId: string
  payload?: Partial<CalendarSyncEvent>
  retryCount: number
  maxRetries: number
  priority: SyncPriority
  createdAt: Date
  scheduledFor?: Date
  processedAt?: Date
  status: SyncOperationStatus
  error?: SyncError
}

export type SyncOperationType = 'create' | 'update' | 'delete' | 'fetch'
export type SyncPriority = 'high' | 'normal' | 'low'
export type SyncOperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface SyncError {
  code: string
  message: string
  details?: any
  retryable: boolean
  timestamp: Date
}

// Webhook Types
export interface WebhookPayload {
  id: string
  provider: CalendarProvider
  resourceId: string
  resourceUri: string
  channelId: string
  channelExpiration?: Date
  eventType: WebhookEventType
  eventData?: any
  timestamp: Date
}

export type WebhookEventType = 
  | 'calendar.created'
  | 'calendar.updated'
  | 'calendar.deleted'
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'sync.requested'

export interface WebhookSubscription {
  id: string
  userId: string
  provider: CalendarProvider
  calendarId: string
  channelId: string
  resourceId: string
  expiration: Date
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Provider Interfaces
export interface CalendarProviderAdapter {
  // Authentication
  getAuthUrl(state?: string): string
  exchangeCodeForTokens(code: string): Promise<AuthToken>
  refreshAccessToken(refreshToken: string): Promise<AuthToken>
  revokeAccess(token: string): Promise<void>
  
  // Calendar Operations
  listCalendars(authToken: AuthToken): Promise<ExternalCalendar[]>
  getCalendar(authToken: AuthToken, calendarId: string): Promise<ExternalCalendar>
  
  // Event Operations
  listEvents(
    authToken: AuthToken,
    calendarId: string,
    options?: ListEventsOptions
  ): Promise<ListEventsResponse>
  
  getEvent(
    authToken: AuthToken,
    calendarId: string,
    eventId: string
  ): Promise<CalendarSyncEvent>
  
  createEvent(
    authToken: AuthToken,
    calendarId: string,
    event: Partial<CalendarSyncEvent>
  ): Promise<CalendarSyncEvent>
  
  updateEvent(
    authToken: AuthToken,
    calendarId: string,
    eventId: string,
    event: Partial<CalendarSyncEvent>
  ): Promise<CalendarSyncEvent>
  
  deleteEvent(
    authToken: AuthToken,
    calendarId: string,
    eventId: string
  ): Promise<void>
  
  // Batch Operations
  batchGetEvents?(
    authToken: AuthToken,
    calendarId: string,
    eventIds: string[]
  ): Promise<CalendarSyncEvent[]>
  
  batchCreateEvents?(
    authToken: AuthToken,
    calendarId: string,
    events: Partial<CalendarSyncEvent>[]
  ): Promise<CalendarSyncEvent[]>
  
  // Webhook Operations
  subscribeToCalendar?(
    authToken: AuthToken,
    calendarId: string,
    webhookUrl: string
  ): Promise<WebhookSubscription>
  
  unsubscribeFromCalendar?(
    authToken: AuthToken,
    subscriptionId: string
  ): Promise<void>
  
  // Utility Methods
  validateWebhookPayload?(payload: any, signature?: string): boolean
  transformToProviderEvent(event: CalendarSyncEvent): any
  transformFromProviderEvent(providerEvent: any): CalendarSyncEvent
}

export interface ListEventsOptions {
  syncToken?: string
  pageToken?: string
  maxResults?: number
  timeMin?: Date
  timeMax?: Date
  updatedMin?: Date
  singleEvents?: boolean
  orderBy?: 'startTime' | 'updated'
  showDeleted?: boolean
  q?: string // Search query
}

export interface ListEventsResponse {
  events: CalendarSyncEvent[]
  nextPageToken?: string
  nextSyncToken?: string
  summary?: string
  description?: string
  updated?: Date
}

// Context and Hook Types
export interface CalendarSyncContextType {
  // State
  providers: CalendarProviderStatus[]
  syncMetadata: SyncMetadata[]
  syncOperations: SyncOperation[]
  isSyncing: boolean
  
  // Authentication
  connectProvider: (provider: CalendarProvider) => Promise<void>
  disconnectProvider: (provider: CalendarProvider) => Promise<void>
  isProviderConnected: (provider: CalendarProvider) => boolean
  
  // Calendar Management
  listCalendars: (provider: CalendarProvider) => Promise<ExternalCalendar[]>
  selectCalendars: (
    provider: CalendarProvider,
    calendarIds: string[]
  ) => Promise<void>
  
  // Sync Operations
  triggerSync: (provider?: CalendarProvider) => Promise<void>
  pauseSync: (provider: CalendarProvider) => void
  resumeSync: (provider: CalendarProvider) => void
  
  // Settings
  updateSyncSettings: (
    provider: CalendarProvider,
    settings: Partial<SyncMetadata>
  ) => Promise<void>
  
  // Event Operations (with sync)
  createEvent: (event: Partial<CalendarSyncEvent>) => Promise<CalendarSyncEvent>
  updateEvent: (
    eventId: string,
    updates: Partial<CalendarSyncEvent>
  ) => Promise<CalendarSyncEvent>
  deleteEvent: (eventId: string) => Promise<void>
  
  // Conflict Resolution
  resolveConflict: (
    eventId: string,
    resolution: ConflictResolution
  ) => Promise<void>
  
  // Error Handling
  clearErrors: (provider?: CalendarProvider) => void
  retryFailedOperations: (provider?: CalendarProvider) => Promise<void>
}

export interface CalendarProviderStatus {
  provider: CalendarProvider
  connected: boolean
  syncing: boolean
  lastSync?: Date
  nextSync?: Date
  error?: string
  calendars: number
  events: number
}