/**
 * settingsService.ts
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import { firebaseClient } from "@digitalaidseattle/firebase";
import {
  addDoc,
  collection,
  doc,
  Firestore, getDoc,
  getFirestore, setDoc
} from "firebase/firestore";

import { FIRESTORE_COLLECTIONS } from "../constants/firestoreCollections";

export type Settings = {
  outputTemplate: string;
  lowerBoundPercentage: number;
  updatedAt: Date;
};


export class SettingsService {
  static DEFAULT_OUTPUT_TEMPLATE = ` Where {{#each outputs}}{{#unless @first}} and{{/unless}} the output "{{name}}" length  must be between {{lowerBound}} and {{upperBound}} {{unit}} {{/each}}.`;
  static DEFAULT_LOWER_BOUND_PERCENTAGE = 0.8;
  private static instance: SettingsService;

  static getInstance() {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }
  collectionName: string;
  db: Firestore;

  constructor() {
    this.collectionName = FIRESTORE_COLLECTIONS.settings;
    this.db = getFirestore(firebaseClient);
  }

  async getSettings(): Promise<Settings> {
    try {
      const docRef = await getDoc(doc(this.db, this.collectionName, 'default'));

      if (docRef.exists()) {
        return docRef.data() as Settings;
      } throw new Error("No settings document found.");
    } catch (e) {
      console.error("Error fetching settings: ", e);
      // Use default values
      const defaultSettings: Settings = {
        outputTemplate: SettingsService.DEFAULT_OUTPUT_TEMPLATE,
        lowerBoundPercentage: SettingsService.DEFAULT_LOWER_BOUND_PERCENTAGE,
        updatedAt: new Date(),
      };
      return defaultSettings;
    }

  }

  async setSettings(settings: Settings): Promise<Settings> {
    try {
      const docRef = await addDoc(collection(this.db, this.collectionName), settings);
      return {
        ...docRef.toJSON(),
      } as Settings;
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  }


}