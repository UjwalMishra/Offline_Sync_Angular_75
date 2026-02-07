# Offline Sync Feature

A robust, reactive offline synchronization system for Angular applications. This feature allows users to perform data operations (POST/PUT) while offline, queuing them for automatic background synchronization when a network connection is restored.

## Key Features

- **Network Monitoring**: Real-time tracking of online/offline status using RxJS `fromEvent`.
- **Request Queuing**: Captures outgoing requests while offline and stores them locally.
- **Persistence**: Uses `localStorage` to ensure the sync queue survives browser restarts.
- **Deduplication**: Fingerprints requests to prevent duplicate entries in the queue while offline.
- **Auto-Sync**: Automatically detects reconnection and begins sequential processing of the queue.
- **Reactive State**: Provides Observables for network status (`isOnline$`), queue size (`getQueue$`), and syncing progress (`isSyncing$`).

## Architecture

### 1. Storage Mechanism
The queue is persisted in `localStorage` under the key `offline_request_queue`. This ensures that any pending operations are not lost if the user closes the tab or refreshes the page.

### 2. Request Fingerprinting
To prevent the same operation from being queued multiple times while offline, each request generates a unique ID (fingerprint) based on its URL, method, and body:
```typescript
private generateFingerprint(url: string, method: string, body: MessageData): string {
    return btoa(JSON.stringify({ url, method, body }));
}
```

### 3. Sync Strategy
When online, the queue is processed sequentially using `concatMap` to preserve the order of operations:
```typescript
of(...queue).pipe(
    concatMap(req => this.http.request(req.method, req.url, { body: req.body }))
)
```

## Usage

### Injecting the Service
```typescript
constructor(private offlineSync: OfflineSyncService) {}
```

### Queuing a Request
Use `queueRequest` to safely handle operations. If the user is online, it attempts to sync immediately; if offline, it adds to the persistent queue.
```typescript
this.offlineSync.queueRequest(
  'https://api.example.com/data',
  'POST',
  { title: 'New Item', body: 'Content', userId: 1 }
);
```

### Monitoring State
Subscribe to status updates to improve User Experience:
```typescript
// Network Status
this.offlineSync.isOnline$().subscribe(status => console.log('Online:', status));

// Queue Count
this.offlineSync.getQueue$().map(q => q.length);

// Syncing Process
this.offlineSync.isSyncing$();
```

## Configuration

- **Target API**: Currently demonstrated using `jsonplaceholder.typicode.com`.
- **Storage Key**: Managed internally via `STORAGE_KEY`.




Video ==> https://github.com/user-attachments/assets/cc2c15b3-5367-4a5a-903e-96df4a8bec29

