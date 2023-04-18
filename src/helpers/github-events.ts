import * as github from '@actions/github'
import {
  ConfigFile,
  GitHubActionEvent,
  EventType,
  EventName,
  Branch
} from '../types/actions'

export const getColumnIdForAction = (
  githubActionEvent: GitHubActionEvent,
  configFile: ConfigFile
): number | undefined => {
  const isRegexMatch = (branches: string[], currentBranch: string): boolean => {
    for (const branch of branches) {
      const regexString = `${branch}`

      if (currentBranch.match(regexString)) {
        return true
      }
    }
    return false
  }

  for (const validEvent of configFile.validEvents) {
    const matchingEvent: boolean = validEvent.events.some(
      event =>
        event.eventName === githubActionEvent.eventName &&
        (!event.eventTypes ||
          !githubActionEvent.eventType ||
          event.eventTypes.includes(githubActionEvent.eventType))
    )
    if (
      (matchingEvent &&
        validEvent.branches.includes(githubActionEvent.branch)) ||
      isRegexMatch(validEvent.branches, githubActionEvent.branch)
    ) {
      return parseInt(validEvent.columnId)
    }
  }
  return undefined
}

export const validateConfigFile = (configFile: ConfigFile): void => {
  const doMatchingValuesExist = <ArrayType>({
    sourceArray,
    matcherArray
  }: {
    sourceArray: ArrayType[]
    matcherArray: ArrayType[]
  }): boolean => {
    if (!sourceArray || !matcherArray) {
      return false
    }
    return sourceArray.some(sourceValue => {
      return matcherArray.includes(sourceValue)
    })
  }

  const areAllMatchesTruthy = (matches: boolean[]): boolean => {
    return matches.every(match => match)
  }

  const matchingEvents = configFile.validEvents.filter((validEvent, index) => {
    const otherEventsArray = [...configFile.validEvents]
    otherEventsArray.splice(index, 1)

    const matchingName = otherEventsArray.some(otherEvents => {
      return validEvent.events.some(event => {
        return otherEvents.events.some(otherEvent => {
          return doMatchingValuesExist<EventName>({
            sourceArray: [event.eventName],
            matcherArray: [otherEvent.eventName]
          })
        })
      })
    })

    const matchingEventTypes = otherEventsArray.some(otherEvents => {
      return otherEvents.events.some(otherEvent => {
        return validEvent.events.some(event => {
          return (
            !event.eventTypes ||
            !otherEvent?.eventTypes ||
            doMatchingValuesExist<EventType>({
              sourceArray: event.eventTypes,
              matcherArray: otherEvent.eventTypes
            })
          )
        })
      })
    })

    const matchingBranches = otherEventsArray.some(otherEvents => {
      return doMatchingValuesExist<Branch>({
        sourceArray: validEvent.branches,
        matcherArray: otherEvents.branches
      })
    })

    const matchingColumnId = otherEventsArray.some(otherEvents => {
      return otherEvents.columnId === validEvent.columnId
    })

    const matched = areAllMatchesTruthy([
      matchingName,
      matchingEventTypes,
      matchingBranches,
      matchingColumnId
    ])

    return matched
  })

  if (matchingEvents.length > 0) {
    throw new Error(
      JSON.stringify(matchingEvents) +
        "Duplicative config found. Make sure that your actions don't apply on the same event and the same columnId as another one"
    )
  }
}

export const getEventType = (eventName: EventName): EventType | undefined => {
  if (eventName === 'push') return undefined

  if (eventName === 'pull_request_review' || eventName === 'pull_request') {
    const pullRequestReviewType = github.context.action as EventType
    return pullRequestReviewType
  }
}
