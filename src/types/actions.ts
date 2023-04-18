export type EventName = 'push' | 'pull_request' | 'pull_request_review'
export type PullRequestEventType =
  | 'opened'
  | 'closed'
  | 'reopened'
  | 'synchronize'
export type PullRequestReviewEventType = 'approved'
export type EventType = PullRequestEventType | PullRequestReviewEventType
export type Branch = string
export type ColumnId = string

export interface GitHubActionEvent {
  eventName: EventName
  branch: Branch
  eventType?: EventType
}

export interface ConfigFileEvent {
  eventName: EventName
  eventTypes?: EventType[]
}

export interface ConfigFileItem {
  events: ConfigFileEvent[]
  branches: Branch[]
  columnId: ColumnId
}
export interface ConfigFile {
  validEvents: ConfigFileItem[]
}
