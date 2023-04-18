import * as os from 'os'
import {
  ConfigFile,
  ConfigFileItem,
  GitHubActionEvent,
  EventType,
  EventName,
  Branch
} from '../types/actions'

export const getColumnIdForAction = (
  githubActionEvent: GitHubActionEvent,
  configFile: ConfigFile
): string | null => {
  for (const validEvent of configFile.validEvents) {
    const matchingEvent: boolean = validEvent.events.some(
      event =>
        event.eventName === githubActionEvent.eventName &&
        (!event.eventTypes ||
          !githubActionEvent.eventType ||
          event.eventTypes.includes(githubActionEvent.eventType))
    )
    if (
      matchingEvent &&
      validEvent.branches.includes(githubActionEvent.branch)
    ) {
      return validEvent.columnId
    }
  }
  return null
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

    const matchingName = otherEventsArray.filter(otherEvents => {
      return validEvent.events.some(event => {
        return otherEvents.events.some(otherEvent => {
          return doMatchingValuesExist<EventName>({
            sourceArray: [event.eventName],
            matcherArray: [otherEvent.eventName]
          })
        })
      })
    })

    const matchingEventTypes = otherEventsArray.filter(otherEvents => {
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

    const matchingBranches = otherEventsArray.filter(otherEvents => {
      return doMatchingValuesExist<Branch>({
        sourceArray: validEvent.branches,
        matcherArray: otherEvents.branches
      })
    })

    const matchingColumnId = otherEventsArray.filter(otherEvents => {
      return otherEvents.columnId === validEvent.columnId
    })

    const matched = areAllMatchesTruthy([
      !!matchingName,
      !!matchingEventTypes,
      !!matchingBranches,
      !!matchingColumnId
    ])

    const errorFormatter = (matchingArray: ConfigFileItem[]): string => {
      return matchingArray
        .map(matchingItem => {
          return JSON.stringify(matchingItem)
        })
        .join(os.EOL)
    }

    if (matched) {
      const errorMesssageContent =
        matchingName ||
        matchingEventTypes ||
        matchingBranches ||
        matchingColumnId

      const errorMessage = `Duplicate config found:${os.EOL}${errorFormatter(
        errorMesssageContent
      )}`

      throw new Error(errorMessage)
    }
  })
}
