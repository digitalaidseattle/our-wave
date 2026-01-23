/**
 * DateUtils.ts
 * 
 * @copyright 2025 Digital Aid Seattle
*/
import dayjs from 'dayjs';
import { Timestamp } from "../types";

const DATE_TIME_FORMAT = "MM/DD/YYYY hh:mm a";
export class DateUtils {

    static formatDateTime(dateTime: Timestamp | Date): string {
        if (!dateTime) {
            return "";
        }
        // Firestore Timestamp
        if (dateTime.hasOwnProperty('seconds')) {
            return dayjs(new Date((dateTime as any).seconds * 1000)).format(DATE_TIME_FORMAT);
        }

        // JS Date / ISO string / etc
        return dayjs(dateTime as Date).format(DATE_TIME_FORMAT);
    }

    static formatTimestamp(timestamp: Timestamp): string {
        return dayjs(new Date((timestamp as any).seconds * 1000)).format(DATE_TIME_FORMAT);
    }

    static formatDate(date: Date): string {
        return dayjs(date).format(DATE_TIME_FORMAT);
    }

    private constructor() {
    }
}