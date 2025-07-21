# Calendar Sync Flow Diagrams

## 🔄 Overall Sync Architecture

```mermaid
graph TB
    subgraph "Frontend Application"
        UI[Calendar UI]
        CS[Calendar Service]
        TM[Token Manager]
        SQ[Sync Queue]
    end

    subgraph "Sync Engine"
        SM[Sync Manager]
        CR[Conflict Resolver]
        EC[Event Cache]
        OM[Operation Manager]
    end

    subgraph "Provider Adapters"
        GA[Google Adapter]
        MA[Microsoft Adapter]
        PM[Provider Manager]
    end

    subgraph "External Services"
        GC[Google Calendar API]
        MG[Microsoft Graph API]
    end

    subgraph "Storage"
        DB[(Local Database)]
        LS[Local Storage]
    end

    UI --> CS
    CS --> SM
    CS --> TM
    TM --> LS
    
    SM --> CR
    SM --> EC
    SM --> OM
    SM --> SQ
    
    OM --> PM
    PM --> GA
    PM --> MA
    
    GA --> GC
    MA --> MG
    
    SM --> DB
    EC --> DB
```

## 🔐 OAuth Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant AS as Auth Service
    participant G as Google/Microsoft
    participant TM as Token Manager
    participant DB as Database

    U->>A: Click "Connect Calendar"
    A->>AS: initiateOAuth(provider)
    AS->>AS: Generate state & PKCE
    AS->>G: Redirect to OAuth URL
    G->>U: Show consent screen
    U->>G: Grant permissions
    G->>A: Redirect with code
    A->>AS: handleCallback(code)
    AS->>G: Exchange code for tokens
    G->>AS: Return tokens
    AS->>TM: saveTokens(tokens)
    TM->>DB: Encrypt & store
    AS->>A: Success
    A->>U: Show connected status
```

## 📅 Event Sync Flow

```mermaid
sequenceDiagram
    participant SM as Sync Manager
    participant PA as Provider Adapter
    participant CR as Conflict Resolver
    participant DB as Local Database
    participant API as External API
    participant Q as Sync Queue

    SM->>DB: Get last sync token
    SM->>PA: listEvents(syncToken)
    PA->>API: GET /events?syncToken=xxx
    API->>PA: Return events + nextSyncToken
    PA->>SM: Transform events
    
    SM->>DB: Get local events
    SM->>SM: Compare events
    
    alt Conflict detected
        SM->>CR: resolveConflict(local, remote)
        CR->>SM: Return resolution
    end
    
    SM->>Q: Queue sync operations
    
    loop For each operation
        Q->>PA: Execute operation
        PA->>API: Create/Update/Delete
        API->>PA: Confirm
        PA->>Q: Mark complete
    end
    
    Q->>DB: Update local events
    Q->>DB: Save sync token
    Q->>SM: Sync complete
```

## 🔄 Real-time Update Flow

```mermaid
graph LR
    subgraph "External Provider"
        EC[Event Change]
        WH[Webhook Trigger]
    end

    subgraph "Application Server"
        WE[Webhook Endpoint]
        WV[Webhook Validator]
        QS[Queue Service]
    end

    subgraph "Client Application"
        WS[WebSocket]
        SM[Sync Manager]
        UI[UI Update]
    end

    EC --> WH
    WH --> WE
    WE --> WV
    WV --> QS
    QS --> WS
    WS --> SM
    SM --> UI
```

## ⚡ Conflict Resolution Flow

```mermaid
flowchart TD
    A[Detect Conflict] --> B{Resolution Strategy}
    
    B -->|Local Wins| C[Use Local Version]
    B -->|Remote Wins| D[Use Remote Version]
    B -->|Newest Wins| E{Compare Timestamps}
    B -->|Merge| F[Merge Changes]
    B -->|Manual| G[Queue for User]
    
    E -->|Local Newer| C
    E -->|Remote Newer| D
    
    F --> H[Apply Merge Rules]
    H --> I[Create Merged Event]
    
    C --> J[Update Remote]
    D --> K[Update Local]
    I --> L[Update Both]
    G --> M[Show Conflict UI]
    
    M --> N{User Decision}
    N -->|Keep Local| C
    N -->|Keep Remote| D
    N -->|Keep Both| O[Duplicate Events]
```

## 🗂️ Data Sync State Machine

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    
    Disconnected --> Authenticating : Connect
    Authenticating --> Connected : Success
    Authenticating --> Disconnected : Failed
    
    Connected --> Syncing : Trigger Sync
    Connected --> Disconnected : Disconnect
    
    Syncing --> Idle : Complete
    Syncing --> Error : Failed
    Syncing --> Syncing : Retry
    
    Idle --> Syncing : Auto/Manual Sync
    Idle --> Disconnected : Disconnect
    
    Error --> Syncing : Retry
    Error --> Disconnected : Give Up
    Error --> Idle : Recover
    
    state Connected {
        [*] --> Idle
        Idle --> CalendarSelection : Select Calendars
        CalendarSelection --> Idle : Save
    }
    
    state Syncing {
        [*] --> FetchingRemote
        FetchingRemote --> ComparingEvents
        ComparingEvents --> ResolvingConflicts
        ResolvingConflicts --> ApplyingChanges
        ApplyingChanges --> UpdatingMetadata
        UpdatingMetadata --> [*]
    }
```

## 🔄 Incremental Sync Strategy

```mermaid
graph TD
    A[Start Sync] --> B{Has Sync Token?}
    
    B -->|Yes| C[Incremental Sync]
    B -->|No| D[Full Sync]
    
    C --> E[Fetch Changes Since Token]
    D --> F[Fetch All Events]
    
    E --> G{Changes Found?}
    F --> H[Compare All Events]
    
    G -->|Yes| I[Process Changes]
    G -->|No| J[Update Timestamp]
    
    H --> I
    I --> K[Apply to Local]
    K --> L[Get New Sync Token]
    L --> M[Save Token]
    
    J --> M
    M --> N[Sync Complete]
```

## 📊 Performance Optimization Flow

```mermaid
graph TB
    subgraph "Caching Layer"
        MC[Memory Cache]
        IC[IndexedDB Cache]
    end

    subgraph "Batch Processing"
        BQ[Batch Queue]
        BP[Batch Processor]
    end

    subgraph "Optimization"
        DT[Delta Tracking]
        CP[Compression]
        PG[Pagination]
    end

    A[Sync Request] --> MC
    MC -->|Hit| B[Return Cached]
    MC -->|Miss| IC
    IC -->|Hit| B
    IC -->|Miss| C[Fetch from API]
    
    C --> DT
    DT --> BQ
    BQ --> BP
    BP --> PG
    PG --> CP
    CP --> D[Process Results]
    
    D --> MC
    D --> IC
    D --> E[Update UI]
```

## 🚨 Error Handling Flow

```mermaid
flowchart TD
    A[Operation] --> B{Success?}
    
    B -->|Yes| C[Complete]
    B -->|No| D{Error Type}
    
    D -->|Network| E[Retry with Backoff]
    D -->|Auth| F[Refresh Token]
    D -->|Rate Limit| G[Queue & Delay]
    D -->|Conflict| H[Resolve Conflict]
    D -->|Unknown| I[Log & Alert]
    
    E --> J{Max Retries?}
    J -->|No| A
    J -->|Yes| K[Mark Failed]
    
    F --> L{Token Valid?}
    L -->|Yes| A
    L -->|No| M[Re-authenticate]
    
    G --> N[Wait Period]
    N --> A
    
    H --> O[Apply Strategy]
    O --> A
    
    K --> P[Notify User]
    I --> P
    M --> P
```

## 📱 UI State Management

```mermaid
graph TD
    subgraph "Calendar Sync State"
        CS[Connected Status]
        SS[Sync Status]
        ES[Error State]
        PS[Progress State]
    end

    subgraph "UI Components"
        SB[Status Badge]
        PM[Progress Modal]
        EN[Error Notification]
        CL[Calendar List]
    end

    subgraph "User Actions"
        CO[Connect]
        DC[Disconnect]
        SY[Sync Now]
        RS[Resolve Conflict]
    end

    CS --> SB
    SS --> SB
    SS --> PM
    ES --> EN
    PS --> PM
    
    CO --> CS
    DC --> CS
    SY --> SS
    RS --> ES
    
    CL --> SS
```

These diagrams provide a comprehensive visual representation of the calendar integration architecture, showing how different components interact and how data flows through the system.