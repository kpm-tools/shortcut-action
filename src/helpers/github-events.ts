import {
  GitHubPullRequestEvent,
  GitHubPushEvent,
  ConfigFile,
  ConfigFilePushEventAction,
  ConfigFilePullRequestAction
} from '../types/actions'

export const isEventValidForAction = (
  githubActionEvent: GitHubPushEvent | GitHubPullRequestEvent,
  configFile: ConfigFile
): boolean => {
  const isValidEvent =
    configFile.validEvents.filter(validEvent => {
      const eventsArray = validEvent.events

      if (
        eventsArray.some(
          (event: ConfigFilePushEventAction | ConfigFilePullRequestAction) => {
            if (
              event.eventName === 'push' &&
              event.eventName === githubActionEvent.eventName
            ) {
              return true
            }
            if (
              event.eventName === 'pull_request' &&
              event.eventName === githubActionEvent.eventName &&
              event?.eventTypes?.includes(githubActionEvent?.eventType)
            ) {
              return true
            }
          }
        )
      ) {
        return true
      }

      return false
    }).length > 0

  return isValidEvent
}
