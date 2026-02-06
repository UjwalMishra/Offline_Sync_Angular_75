import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, of, Subject } from 'rxjs';
import { map, startWith, filter, concatMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface MessageData {
  title: string;
  body: string;
  userId: number;
}



interface QueuedRequest {
  url: string;
  method: 'POST' | 'PUT';
  body: MessageData;
  id: string;
}


@Injectable({
  providedIn: 'root'
})



export class OfflineSyncService {


  private readonly STORAGE_KEY = 'offline_request_queue';

  private syncing$ = new BehaviorSubject<boolean>(false);
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);
  private queue$ = new BehaviorSubject<QueuedRequest[]>([]);
  private syncedMessages$ = new Subject<MessageData>();


  constructor(private http: HttpClient) {
    this.restoreQueueFromStorage();
    this.trackNetworkStatus();
    this.syncOnReconnect();

    this.queue$.subscribe(queue => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    });
  }
  private trackNetworkStatus() {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    )
      .pipe(startWith(navigator.onLine))
      .subscribe(status => {
        this.online$.next(status);
        console.log('Network:', status ? 'ONLINE' : 'OFFLINE');
      });
  }



  isOnline$() {
    return this.online$.asObservable();
  }

  private generateFingerprint(
    url: string,
    method: string,
    body: MessageData
  ): string {
    return btoa(
      JSON.stringify({ url, method, body })
    );
  }



  queueRequest(url: string, method: 'POST' | 'PUT', body: MessageData): boolean {
    const fingerprint = this.generateFingerprint(url, method, body);
    const queue = this.queue$.value;

    const isOnline = this.online$.value;

    if (!isOnline) {
      const alreadyInQueue = queue.some(req => req.id === fingerprint);
      if (alreadyInQueue) {
        console.log('Duplicate request ignored while offline');
        return false;
      }
    }

    this.queue$.next([
      ...queue,
      { url, method, body, id: fingerprint }
    ]);

    console.log('Queued:', url);

    if (isOnline) {
      this.syncQueue();
    }

    return true;
  }


  getQueue$() {
    return this.queue$.asObservable();
  }

  private removeFromQueue(id: string) {
    this.queue$.next(
      this.queue$.value.filter(req => req.id !== id)
    );
  }

  private syncOnReconnect() {
    this.online$
      .pipe(filter(Boolean))
      .subscribe(() => {
        console.log('Back online, syncing...');
        this.syncQueue();
      });
  }



  isSyncing$() {
    return this.syncing$.asObservable();
  }
  getSyncedMessages$() {
    return this.syncedMessages$.asObservable();
  }
  private syncQueue() {
    const queue = this.queue$.value;
    if (!queue.length) return;

    this.syncing$.next(true);

    of(...queue)
      .pipe(
        concatMap(req =>
          this.http.request(req.method, req.url, { body: req.body }).pipe(
            tap(() => {
              this.removeFromQueue(req.id);
              this.syncedMessages$.next(req.body);
            })
          )
        )
      )
      .subscribe({
        complete: () => {
          this.syncing$.next(false);
          console.log('All requests synced');
        },
        error: err => {
          this.syncing$.next(false);
          console.error('Sync failed', err);
        }
      });
  }

  private restoreQueueFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;

    try {
      this.queue$.next(JSON.parse(stored));
      console.log('Queue restored from storage');
    } catch {
      console.error('Failed to restore queue');
    }
  }
}
