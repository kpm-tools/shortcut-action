import {
  jest,
  beforeEach,
  afterEach,
  expect,
  test,
  describe
} from '@jest/globals'
import {octokit, getOctokit} from './global.mock'

import * as core from '@actions/core'
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

describe('getShortcutIdsFromReleaseBody', () => {
  test('an array of ids is returned when there are multiple ids', async () => {
    octokit.rest.repos.getLatestRelease.mockReturnValueOnce({
      // @ts-ignore
      data: {
        body: `
        Title

        Some story [sc-12345]
        Another piece of work
        This really cool story [sc-54321]
        `
      }
    })

    const {getShortcutIdsFromReleaseBody} = await import(
      '../../src/helpers/github-releases'
    )

    const result = await getShortcutIdsFromReleaseBody()
    expect(result).toEqual([12345, 54321])
  })
  test('no ids are returned it there are none', async () => {
    octokit.rest.repos.getLatestRelease.mockReturnValueOnce({
      // @ts-ignore
      data: {
        body: `
        Title

        Some story
        Another piece of work
        This really cool story
        `
      }
    })

    const {getShortcutIdsFromReleaseBody} = await import(
      '../../src/helpers/github-releases'
    )

    const result = await getShortcutIdsFromReleaseBody()
    expect(result).toEqual(null)
  })
  test('null is returned when there is no release body', async () => {
    octokit.rest.repos.getLatestRelease.mockReturnValueOnce({
      // @ts-ignore
      data: {}
    })

    const {getShortcutIdsFromReleaseBody} = await import(
      '../../src/helpers/github-releases'
    )

    const result = await getShortcutIdsFromReleaseBody()
    expect(result).toEqual(null)
  })
})
