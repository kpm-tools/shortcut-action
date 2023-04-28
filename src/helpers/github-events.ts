import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  ConfigFile,
  ConfigFileEvent,
  GitHubActionEvent,
  EventType,
  EventName,
  Branch,
  zEventName,
  zPullRequestEventType,
  zPullRequestReviewEventType,
  zReleaseEventType
} from '../types/actions'
import {warn} from 'console'

export const getColumnIdForAction = (
  githubActionEvent: GitHubActionEvent,
  configFile: ConfigFile
): number | undefined => {
  if (!githubActionEvent?.branch) {
    core.error('A branch name is required')
    return undefined
  }
  if (!githubActionEvent?.eventName) {
    core.error('An event name is required')
    return undefined
  }

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
    const matchingEvent: ConfigFileEvent[] = validEvent.events.filter(event => {
      if (
        event.eventName === githubActionEvent?.eventName &&
        (!githubActionEvent?.eventType ||
          event.eventType === githubActionEvent.eventType)
      ) {
        return true
      }
      return false
    })

    if (
      matchingEvent.length > 0 &&
      (validEvent.branches.includes(githubActionEvent.branch) ||
        isRegexMatch(validEvent.branches, githubActionEvent.branch))
    ) {
      return parseInt(validEvent.columnId)
    }
  }
  return undefined
}

export const validateConfigFile = (configFile: ConfigFile): void => {
  if (!configFile) {
    return core.error('No config file was passed')
  }
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

    const matchingEventType = otherEventsArray.some(otherEvents => {
      return validEvent.events.some(event => {
        return otherEvents.events.some(otherEvent => {
          return (
            !event?.eventType ||
            !otherEvent?.eventType ||
            doMatchingValuesExist<EventType>({
              sourceArray: [event.eventType],
              matcherArray: [otherEvent.eventType]
            })
          )
        })
      })
    })

    const matchingBranches = otherEventsArray.some(otherEvent => {
      return (
        !validEvent?.branches ||
        validEvent?.branches?.length > 0 ||
        doMatchingValuesExist<Branch>({
          sourceArray: validEvent.branches,
          matcherArray: otherEvent.branches
        })
      )
    })

    const matchingColumnId = otherEventsArray.some(otherEvent => {
      return (
        !validEvent?.columnId ||
        !otherEvent?.columnId ||
        otherEvent.columnId === validEvent.columnId
      )
    })

    const matched = areAllMatchesTruthy([
      matchingName,
      matchingEventType,
      matchingBranches,
      matchingColumnId
    ])

    return matched
  })

  if (matchingEvents.length > 0) {
    core.error(
      "Duplicative config found. Make sure that your actions don't apply on the same event and the same columnId as another one"
    )
  }
}

export const getEventType = (eventName: EventName): EventType | undefined => {
  const eventNameHandlers = [
    {
      eventName: 'push',
      eventTypeHandler: undefined
    },
    {
      eventName: 'pull_request',
      eventTypeHandler: zPullRequestEventType
    },
    {
      eventName: 'pull_request_review',
      eventTypeHandler: zPullRequestReviewEventType
    },
    {
      eventName: 'release',
      eventTypeHandler: zReleaseEventType
    }
  ]

  const getEventTypeParseErrorHandler = (
    options: (EventType | EventName)[],
    eventType?: EventType | string
  ): undefined => {
    core.error(
      `${
        eventType ? `The type ${eventType} on ${eventName}` : eventName
      } is not supported, please file an issue at https://github.com/kpm-tools/shortcut-action/issues if you would like to see support for this event`
    )
    core.error(`Valid events are: ${options}`)

    return undefined
  }

  const zEventNameResults = zEventName.safeParse(eventName)

  if (!zEventNameResults.success) {
    return getEventTypeParseErrorHandler(zEventName.options, undefined)
  }

  const eventNameHandler = eventNameHandlers.find(
    event => event.eventName === eventName
  )

  if (!eventNameHandler?.eventTypeHandler) return undefined

  const eventType = github.context.payload.action as EventType
  const zParseResults = eventNameHandler.eventTypeHandler.safeParse(eventType)

  if (!zParseResults.success) {
    return getEventTypeParseErrorHandler(
      eventNameHandler.eventTypeHandler.options,
      eventType
    )
  }

  return eventType
}

export const getBranchBasedOnEventName = async (
  eventName: EventName
): Promise<Branch> => {
  if (eventName === 'push') {
    if (!github.context.ref) {
      return ''
    }
    return github.context.ref.replace('refs/heads/', '')
  }

  if (eventName === 'pull_request' || eventName === 'pull_request_review') {
    const token = core.getInput('GITHUB_TOKEN')
    const octokit = github.getOctokit(token)

    if (!github.context.payload.pull_request?.number) return ''
    const response = await octokit.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request.number
    })

    const branch = response.data.head.ref

    return branch
  }
  core.error(`${eventName} is not supported`)
  return ''
}

export const updatePRTitleWithShortcutId = async (
  shortcutId: number
): Promise<void> => {
  const token = core.getInput('GITHUB_TOKEN')
  const octokit = github.getOctokit(token)

  if (github.context.payload.pull_request?.number) {
    const getResponse = await octokit.rest.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request.number
    })

    if (getResponse.data.title.includes(`[sc-${shortcutId}]`)) return

    const title = `${getResponse.data.title} [sc-${shortcutId}]`

    const updateResponse = await octokit.rest.pulls.update({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: github.context.payload.pull_request.number,
      title
    })

    if (updateResponse.status !== 200) {
      core.warning('PR title could not be updated')
      return
    }

    core.info(`PR title updated to: ${title}`)
  }
}
