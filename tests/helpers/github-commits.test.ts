import {octokit, getOctokit} from './global.mock'

import {jest, afterEach, expect, test, describe} from '@jest/globals'
import * as github from '@actions/github'

jest.mock('@actions/github', () => ({
  getOctokit,
  context: {
    repo: {
      owner: 'owner',
      repo: 'repo'
    }
  }
}))

jest.mock('@actions/core')

afterEach(() => {
  jest.clearAllMocks()
})
describe('getShortcutIdMessageFromSha', () => {
  test('a commit message with a shortct id returns the shortcut id', async () => {
    const sha = '1234567890'
    octokit.rest.repos.getCommit.mockReturnValueOnce({
      data: {
        owner: 'owner',
        repo: 'repo',
        sha,
        commit: {
          message: 'The best commit there ever was [sc-1234567890]'
        }
      }
    } as never)
    const {getShortcutIdMessageFromSha} = await import(
      '../../src/helpers/github-commits'
    )
    const shortcutId = await getShortcutIdMessageFromSha(sha)

    expect(shortcutId).toEqual(1234567890)
  })

  test('a commit message with no shorcut id returns null', async () => {
    const sha = '1234567890'
    octokit.rest.repos.getCommit.mockReturnValueOnce({
      data: {
        owner: 'owner',
        repo: 'repo',
        sha,
        commit: {
          message: 'Bad bad bad commit'
        }
      }
    } as never)
    const {getShortcutIdMessageFromSha} = await import(
      '../../src/helpers/github-commits'
    )

    const shortcutId = await getShortcutIdMessageFromSha(sha)

    expect(shortcutId).toEqual(null)
  })
})
describe('getShortcutIdFromPRCommits', () => {
  test('a commit sha with a PR returns a shortcut id', async () => {
    const commit_sha = '1234567890'
    github.context.sha = commit_sha

    octokit.request.mockReturnValueOnce({
      data: [
        {
          number: 1
        }
      ]
    } as never)
    octokit.request.mockReturnValueOnce({
      data: [
        {
          commit: {
            message: 'The best commit there ever was [sc-1234567890]'
          }
        }
      ]
    } as never)
    const {getShortcutIdFromPRCommits} = await import(
      '../../src/helpers/github-commits'
    )

    const shortcutIds = await getShortcutIdFromPRCommits()

    expect(shortcutIds).toEqual([1234567890])
  })
  test('a commit sha with a PR that has mulitiple commits returns shortcut ids', async () => {
    const commit_sha = '1234567890'
    github.context.sha = commit_sha

    octokit.request.mockReturnValueOnce({
      data: [
        {
          number: 1
        }
      ]
    } as never)
    octokit.request.mockReturnValueOnce({
      data: [
        {
          commit: {
            message: 'The best commit there ever was [sc-1234567890]'
          }
        },
        {
          commit: {
            message: 'The best commit there ever was [sc-123456789]'
          }
        }
      ]
    } as never)
    const {getShortcutIdFromPRCommits} = await import(
      '../../src/helpers/github-commits'
    )

    const shortcutIds = await getShortcutIdFromPRCommits()

    expect(shortcutIds).toEqual([1234567890, 123456789])
  })
  test('a commit sha with multiples PR that has mulitiple commits returns shortcut ids', async () => {
    const commit_sha = '1234567890'
    github.context.sha = commit_sha

    octokit.request.mockReturnValueOnce({
      data: [
        {
          number: 1
        },
        {
          number: 4
        }
      ]
    } as never)
    octokit.request.mockReturnValue({
      data: [
        {
          commit: {
            message: 'The best commit there ever was [sc-1234567890]'
          }
        },
        {
          commit: {
            message: 'The best commit there ever was [sc-123456789]'
          }
        }
      ]
    } as never)
    const {getShortcutIdFromPRCommits} = await import(
      '../../src/helpers/github-commits'
    )

    const shortcutIds = await getShortcutIdFromPRCommits()

    expect(shortcutIds).toEqual([1234567890, 123456789, 1234567890, 123456789])
  })
  test('a commit without PRs returns undefined', async () => {
    const commit_sha = '1234567890'
    github.context.sha = commit_sha

    octokit.request.mockReturnValueOnce({
      data: []
    } as never)
    const {getShortcutIdFromPRCommits} = await import(
      '../../src/helpers/github-commits'
    )

    const shortcutIds = await getShortcutIdFromPRCommits()

    expect(shortcutIds).toEqual(undefined)
  })
})
