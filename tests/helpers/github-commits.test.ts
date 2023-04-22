import {jest, afterEach, expect, test} from '@jest/globals'

const octokit = {
  rest: {
    repos: {
      getCommit: jest.fn()
    }
  }
}

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockImplementation(() => octokit),
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

test('passing a valid sha returns a shortcut id', async () => {
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
