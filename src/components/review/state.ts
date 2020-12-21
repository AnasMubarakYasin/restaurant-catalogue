import {ReviewerSession} from '../reviewer/state';

export interface ReviewDataState {
  success: boolean;
  response: Array<ReviewerSession>;
  session: ReviewSession;
}

export interface ReviewSession {
  id: string;
  name: string;
  review: string;
}

export interface ReviewActionState {
  LOADED: 0;
  SEND_PRESSED: 1;
  SENDING: 2;
  LOADING: 3;
}

