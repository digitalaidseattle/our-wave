
import { Entity, FirestoreService } from "@digitalaidseattle/firebase";


export type GrantRequest = Entity & {
  
  title?: string;
  description?: string;
  requestedBy?: string;
  createdAt: Date;
  status?: "pending" | "approved" | "rejected";
};

class GrantRequestService extends FirestoreService<GrantRequest> {
  constructor() {
    //We have to create "grant-request" collection
    super("grant-request");
  }

  empty(): GrantRequest {
    return {
      id: undefined,
      title: "",
      description: "",
      requestedBy: "",
      createdAt: new Date(),
      status: "pending"
    };
  }


}

export const grantRequestService = new GrantRequestService();
