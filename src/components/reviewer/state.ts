export interface ReviewerDataState {
  reviewer: Array<ReviewerSession>;
}
export interface ReviewerActionState {
  LOADING: 1;
  LOADED: 2;
}
export type ReviewerSession = {
  name: string;
  review: string;
  date: string;
}
