import {z} from 'zod'

export const zEventName = z.enum([
  'push',
  'pull_request',
  'pull_request_review',
  'release'
])

export type EventName = z.infer<typeof zEventName>

export const zPullRequestEventType = z.enum(['opened', 'closed', 'reopened'])
export const zPullRequestReviewEventType = z.enum(['approved'])
export const zReleaseEventType = z.enum(['published'])
export const zEventType = z.union([
  zPullRequestEventType,
  zPullRequestReviewEventType,
  zReleaseEventType
])

export type PullRequestEventType = z.infer<typeof zPullRequestEventType>
export type PullRequestReviewEventType = z.infer<
  typeof zPullRequestReviewEventType
>
export type ReleaseEventType = z.infer<typeof zReleaseEventType>
export type EventType = z.infer<typeof zEventType>

export type Branch = string
export type ColumnId = string

export interface GitHubActionEvent {
  eventName: EventName
  branch: Branch
  eventType?: EventType
}

export interface ConfigFileEvent {
  eventName: EventName
  eventType?: EventType
}

export interface ConfigFileItem {
  events: ConfigFileEvent[]
  branches: Branch[]
  columnId: ColumnId
}
export interface ConfigFile {
  validEvents: ConfigFileItem[]
}
