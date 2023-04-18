export type EventName = 'push' | 'pull_request'
export type EventType = 'opened' | 'closed' | 'reopened' | 'synchronize'

export interface GitHubActionEvent {
  eventName: EventName
  branch: string
  eventType?: EventType | undefined
}

export interface GitHubPushEvent extends GitHubActionEvent {
  eventName: 'push'
}

export interface GitHubPullRequestEvent extends GitHubActionEvent {
  eventName: 'pull_request'
}

export interface ConfigFilePushEventAction {
  eventName: 'push'
}

export interface ConfigFilePullRequestAction {
  eventName: 'pull_request'
  eventTypes?: (EventType | undefined)[]
}

export interface ConfigFileEvent {
  events: ConfigFilePushEventAction[] | ConfigFilePullRequestAction[]
  branche: string[]
  columnId: string[]
}
export interface ConfigFile {
  validEvents: ConfigFileEvent[]
}
