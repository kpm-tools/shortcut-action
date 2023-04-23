import {jest, afterEach, expect, test, describe} from '@jest/globals'
import {octokit, getOctokit} from './global.mock'

import * as core from '@actions/core'
import * as github from '@actions/github'

import type {EventName, EventType} from '../../src/types/actions'
import {validConfigJson} from './gitub-events.mock'

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
      }
    }
  }
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('getColumnIdForAction', () => {
  test('passing a matching event name, event type, and branch produces a column id', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    const columnId = getColumnIdForAction(
      {
        eventName: 'pull_request_review',
        eventType: 'approved',
        branch: 'feature/sc-12345-ai-feature'
      },
      validConfigJson
    )

    expect(columnId).toEqual(500000060)
  })
  test('passing a matching event name and branch  produces a column id', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    const columnId = getColumnIdForAction(
      {
        eventName: 'push',
        branch: 'staging'
      },
      validConfigJson
    )

    expect(columnId).toEqual(500000009)
  })
  test('passing an invalid event name returns undefined', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    const columnId = getColumnIdForAction(
      {
        // @ts-ignore
        eventName: 'invalid_event_name',
        branch: 'staging'
      },
      validConfigJson
    )

    expect(columnId).toBeUndefined()
  })

  test('passing a valid eventName and invalid eventType returns undefined', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    const columnId = getColumnIdForAction(
      {
        eventName: 'pull_request',
        // @ts-ignore
        eventType: 'invalid_event_type',
        branch: 'staging'
      },
      validConfigJson
    )

    expect(columnId).toBeUndefined()
  })
  test('passing a valid eventName and eventType, and an invalid branch returns undefined', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    const columnId = getColumnIdForAction(
      {
        eventName: 'pull_request_review',
        eventType: 'approved',
        branch: 'invalid_branch'
      },
      validConfigJson
    )

    expect(columnId).toBeUndefined()
  })
  test('passing no branch name triggers a core.error', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    getColumnIdForAction(
      // @ts-ignore
      {
        eventName: 'pull_request_review',
        eventType: 'approved'
      },
      validConfigJson
    )

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })
  test('passing no event name triggers a core.error', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    getColumnIdForAction(
      // @ts-ignore
      {
        eventType: 'approved'
      },
      validConfigJson
    )

    const coreErrorMock = jest.spyOn(core, 'error')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
  })

  test('passing no githubActionEvent triggers a core.error', async () => {
    const {getColumnIdForAction} = await import(
      '../../src/helpers/github-events'
    )
    getColumnIdForAction(
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
  test('event that as eventType returns it', async () => {
    github.context.payload.action = 'opened'

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
    github.context.payload.action = 'published'
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

    octokit.rest.pulls.get.mockReturnValueOnce({
      data: {
        head: {
          ref: undefined
        }
      }
    })

    const branch = await getBranchBasedOnEventName('pull_request')

    expect(branch).toBe('')
  })
  test('an invalid evenetName is passed and triggers a core.error and returns undefined', async () => {
    const {getBranchBasedOnEventName} = await import(
      '../../src/helpers/github-events'
    )

    const coreErrorMock = jest.spyOn(core, 'error')
    // @ts-ignore
    const branch = await getBranchBasedOnEventName('invalid_event_name')

    expect(coreErrorMock).toHaveBeenCalledTimes(1)
    expect(branch).toBe('')
  })
})
