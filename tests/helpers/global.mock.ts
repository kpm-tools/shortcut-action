import {jest} from '@jest/globals'

export const octokit = {
  rest: {
    repos: {
      getCommit: jest.fn(),
      getLatestRelease: jest.fn()
    },
    pulls: {
      get: jest.fn(),
      update: jest.fn()
    }
  },
  request: jest.fn()
}

export const getOctokit = jest.fn().mockImplementation(() => octokit)
