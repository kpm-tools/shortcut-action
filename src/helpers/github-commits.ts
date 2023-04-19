import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/action'
import {Branch} from '../types/actions'

export const getStoryIdsFromCommits = async (
  branch: Branch
): Promise<number[] | null> => {
  const octokit = new Octokit()

  const response = await octokit.repos.listCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch
  })

  // const storyIds = response.data.reduce((acc, commit) => {
  //
  // },[]

  const extractStoryIdFromString = (str: string): number | null => {
    const regex = /\[sc-(\d+)\]/
    const match = str.match(regex)
    if (match) {
      const numberString = match[1]
      const number = parseInt(numberString, 10)
      return number
    } else {
      return null
    }
  }

  core.info('hi')

  const storyIds = response.data.reduce((acc: number[], commit) => {
    const storyId = extractStoryIdFromString(commit.commit.message)
    if (storyId) {
      acc.push(storyId)
    }
    return acc
  }, [])

  if (storyIds.length === 0) return null

  core.info(`Found story ids: ${storyIds}`)

  return storyIds
}
