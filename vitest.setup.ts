
import { firebaseClient, FirestoreService } from '@digitalaidseattle/firebase';
import { vi } from 'vitest';

vi.mock('@digitalaidseattle/firebase', () => {
  return {
    firebaseClient: {},
    FirestoreService: class {
      tableName = '';

      constructor(tableName: string) {
        this.tableName = tableName;
      }
    }
  };
});