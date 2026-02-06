import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OfflineSyncService } from "./services/offline-sync"

interface MessageDisplay {
  title: string;
}



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html'
})


export class AppComponent {



  offlineSync = inject(OfflineSyncService);

  online$ = this.offlineSync.isOnline$();
  queue$ = this.offlineSync.getQueue$();
  syncing$ = this.offlineSync.isSyncing$();

  messages: MessageDisplay[] = [];
  isDuplicate = false;



  constructor() {
    this.offlineSync.getSyncedMessages$().subscribe(msg => {
      this.messages.unshift({ title: msg.title });
    });
  }


  addFakeRequest(text: string) {
    if (!text.trim()) return;

    this.isDuplicate = false;
    const wasAdded = this.offlineSync.queueRequest(
      'https://jsonplaceholder.typicode.com/posts',
      'POST',
      { title: text, body: text, userId: 1 }
    );


    if (!wasAdded) {
      this.isDuplicate = true;
    }
  }
}
