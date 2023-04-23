import {jest} from '@jest/globals'

export const octokit = {
  rest: {
    repos: {
      getCommit: jest.fn()
    },
    pulls: {
      get: jest.fn()
    }
  }
}

export const getOctokit = jest.fn().mockImplementation(() => octokit)
