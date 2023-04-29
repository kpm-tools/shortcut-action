import {jest, afterEach, expect, test, describe} from '@jest/globals'
import {octokit, getOctokit} from './global.mock'

import * as core from '@actions/core'

import type {EventName, EventType} from '../../src/types/actions'
import {validConfigJson} from './gitub-events.mock'
import * as github from '@actions/github'

jest.mock('@actions/core')
jest.mock('@actions/github', () => ({
  getOctokit,
  context: {
    repo: {
      owner: 'owner',
      repo: 'repo'
    },
    payload: {
      pull_request: {
        number: 12345
      },
      action: 'opened'
    }
  }
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('getColumnIdAndColumnNameForAction', () => {
  test('passing a matching event name, event type, and branch produces a column id', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    const column = getColumnIdAndColumnNameForAction(
      {
        eventName: 'pull_request_review',
        eventType: 'submitted',
        branch: 'feature/sc-12345-ai-feature'
      },
      validConfigJson
    )

    expect(column?.columnId).toEqual(500000060)
  })
  test('passing a matching event name and branch  produces a column id', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    const column = getColumnIdAndColumnNameForAction(
      {
        eventName: 'push',
        branch: 'staging'
      },
      validConfigJson
    )

    expect(column?.columnId).toEqual(500000009)
  })
  test('passing an invalid event name returns undefined', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    const column = getColumnIdAndColumnNameForAction(
      {
        // @ts-ignore
        eventName: 'invalid_event_name',
        branch: 'staging'
      },
      validConfigJson
    )

    expect(column?.columnId).toBeUndefined()
  })

  test('passing a valid eventName and invalid eventType returns undefined', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    const column = getColumnIdAndColumnNameForAction(
      {
        eventName: 'pull_request',
        // @ts-ignore
        eventType: 'invalid_event_type',
        branch: 'staging'
      },
      validConfigJson
    )

    expect(column?.columnId).toBeUndefined()
  })
  test('passing a valid eventName and eventType, and an invalid branch returns undefined', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    const column = getColumnIdAndColumnNameForAction(
      {
        eventName: 'pull_request_review',
        eventType: 'submitted',
        branch: 'invalid_branch'
      },
      validConfigJson
    )

    expect(column?.columnId).toBeUndefined()
  })
  test('passing no branch name triggers a core.error', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    getColumnIdAndColumnNameForAction(
      // @ts-ignore
      {
        eventName: 'pull_request_review',
        eventType: 'submitted'
      },
      validConfigJson
    )

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing no event name triggers a core.error', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    getColumnIdAndColumnNameForAction(
      // @ts-ignore
      {
        eventType: 'submitted'
      },
      validConfigJson
    )

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })

  test('passing no githubActionEvent triggers a core.error', async () => {
    const {getColumnIdAndColumnNameForAction} = await import(
      '../../src/helpers/github-events'
    )
    getColumnIdAndColumnNameForAction(
      // @ts-ignore
      null,
      validConfigJson
    )

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
})

describe('validateConfigFile', () => {
  test(`passing a valid configFile succeeds`, async () => {
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(validConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(0)
  })
  test(`passing a configFile with a fully matching event triggers a core.error`, async () => {
    const invalidConfigJson = {
      validEvents: [
        validConfigJson.validEvents[0],
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test(`passing a configFile with a matching event triggers a core.error`, async () => {
    const invalidConfigJson = {
      validEvents: [
        validConfigJson.validEvents[0],
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test(`passing no configFile triggers a core.error`, async () => {
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    // @ts-ignore
    validateConfigFile()

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing a configFile with one matching event in the events array triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          events: [
            validConfigJson.validEvents[0].events[0],
            validConfigJson.validEvents[0].events[0]
          ]
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing a configFile with events that have matching parameters mixed in on an event triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          events: [
            {
              eventName: 'pull_request' as EventName,
              eventType: 'opened' as EventType
            },
            {
              eventName: 'push' as EventName
            }
          ],
          branches: ['not_used_branch', 'feature/*'],
          columnId: validConfigJson.validEvents[1].columnId
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })

  test('passing an event with an empty eventName triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          eventName: ''
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing an event with an empty eventType triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          eventType: ''
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing an event with two matching branches triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          branches: [
            validConfigJson.validEvents[0].branches[0],
            validConfigJson.validEvents[0].branches[0]
          ]
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing an event without a branches array triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          branches: undefined
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')

    // @ts-ignore
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing an event with branches array that has an empty string triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          branches: ['main', '']
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')

    // @ts-ignore
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing an event with an empty branches array triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          branches: []
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')

    // @ts-ignore
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing an event without a columnId triggers a core.error', async () => {
    const invalidConfigJson = {
      validEvents: [
        {
          ...validConfigJson.validEvents[0],
          columnId: undefined
        },
        ...validConfigJson.validEvents
      ]
    }
    const {validateConfigFile} = await import('../../src/helpers/github-events')

    // @ts-ignore
    validateConfigFile(invalidConfigJson)

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
})

describe('getEventType', () => {
  test('push event returns undefined', async () => {
    const {getEventType} = await import('../../src/helpers/github-events')
    const eventType = getEventType('push')

    expect(eventType).toBeUndefined()
  })
  test('event that has eventType returns it', async () => {
    const {getEventType} = await import('../../src/helpers/github-events')
    const eventType = getEventType('pull_request')

    expect(eventType).toBe('opened')
  })

  test(`eventName that isn't supported triggers a core.error`, async () => {
    const {getEventType} = await import('../../src/helpers/github-events')

    const coreErrorMock = jest.spyOn(core, 'error')
    // @ts-ignore
    getEventType('unsupoorted_event_name')

    expect(coreErrorMock).toHaveBeenCalledTimes(2)
  })
  test(`eventType that isn't supported but is supported by another eventName triggers a core.error`, async () => {
    //
    github.context.payload.action = 'published'
    //
    const {getEventType} = await import('../../src/helpers/github-events')

    const coreErrorMock = jest.spyOn(core, 'error')
    getEventType('pull_request')

    expect(coreErrorMock).toHaveBeenCalledTimes(2)
  })
})
describe('getBranchBasedOnEventName', () => {
  test(`push event that has a branch and returns it`, async () => {
    github.context.ref = 'refs/heads/main'
    const {getBranchBasedOnEventName} = await import(
      '../../src/helpers/github-events'
    )

    const branch = await getBranchBasedOnEventName('push')

    expect(branch).toBe('main')
  })
  test('push event that has no branch and returns undefined', async () => {
    // @ts-ignore
    github.context.ref = undefined
    const {getBranchBasedOnEventName} = await import(
      '../../src/helpers/github-events'
    )

    const branch = await getBranchBasedOnEventName('push')

    expect(branch).toBe('')
  })
  test('pull_request event that has a branch and returns it', async () => {
    if (github.context.payload.pull_request !== undefined) {
      github.context.payload.pull_request.number = 12345
    }

    const {getBranchBasedOnEventName} = await import(
      '../../src/helpers/github-events'
    )

    octokit.rest.pulls.get.mockReturnValueOnce({
      data: {
        head: {
          ref: 'main'
        }
      }
    })

    const branch = await getBranchBasedOnEventName('pull_request')

    expect(branch).toBe('main')
  })
  test('pull_request event that has no branch and returns undefined', async () => {
    github.context.payload.pull_request = undefined
    const {getBranchBasedOnEventName} = await import(
      '../../src/helpers/github-events'
    )
    const branch = await getBranchBasedOnEventName('pull_request')

    expect(branch).toBe('')
  })
  test('pull_request event that has a branch but fails to get it returns undefined', async () => {
    if (github.context.payload.pull_request !== undefined) {
      github.context.payload.pull_request.number = 12345
    }
    const {getBranchBasedOnEventName} = await import(
      '../../src/helpers/github-events'
    )

    const branch = await getBranchBasedOnEventName('pull_request')

    expect(branch).toBe('')
  })
  test('an invalid event name is passed, triggers a core.error and returns an empty string', async () => {
    const {
      getBranchBasedOnEventName
    } = require('../../src/helpers/github-events')

    const coreErrorMock = jest.spyOn(core, 'error')
    const branch = await getBranchBasedOnEventName('invalid_event_name')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
    expect(branch).toBe('')
  })
})
describe('updatePRTitleWithShortcutId', () => {
  test('pull request title is updated with shortcut id', async () => {
    const title = 'My PR title'
    const shortcutId = 12345
    const number = 12345

    octokit.rest.pulls.get.mockReturnValue({
      data: {
        title
      }
    })

    octokit.rest.pulls.update.mockReturnValueOnce({
      status: 200
    })

    github.context.payload = {
      pull_request: {
        number,
        title
      }
    }

    const {updatePRTitleWithShortcutId} = await import(
      '../../src/helpers/github-events'
    )

    const coreInfoMock = jest.spyOn(core, 'info')
    const coreWarningMock = jest.spyOn(core, 'warning')

    await updatePRTitleWithShortcutId(shortcutId)

    expect(coreWarningMock).toHaveBeenCalledTimes(0)
    expect(coreInfoMock).toHaveBeenCalledTimes(1)

    expect(octokit.rest.pulls.update).toHaveBeenCalledTimes(1)
    expect(octokit.rest.pulls.update).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 12345,
      title: `My PR title [sc-${shortcutId}]`
    })
  })
  test('pull request title containing shortcut id is not updated', async () => {
    const shortcutId = 12345
    const title = `My PR title [sc-${shortcutId}]`
    const number = 12345

    octokit.rest.pulls.get.mockReturnValue({
      data: {
        title
      }
    })

    octokit.rest.pulls.update.mockReturnValueOnce({
      status: 404
    })

    github.context.payload = {
      pull_request: {
        number,
        title
      }
    }

    const {updatePRTitleWithShortcutId} = await import(
      '../../src/helpers/github-events'
    )

    const coreWarningMock = jest.spyOn(core, 'warning')

    await updatePRTitleWithShortcutId(shortcutId)

    expect(coreWarningMock).toHaveBeenCalledTimes(0)

    expect(octokit.rest.pulls.update).not.toHaveBeenCalled()
    expect(octokit.rest.pulls.update).not.toHaveBeenCalled()
  })
})
