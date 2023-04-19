import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/action'
import {Branch} from '../types/actions'

export const getStoryIdsFromCommits = async (
  branch: Branch
): Promise<number[] | null> => {
  const octokit = new Octokit({token: core.getInput('GITHUB_TOKEN')})

  const response = await octokit.repos.listCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
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

  const storyIds = response.data.reduce((acc: number[], commit) => {
    core.info(`Commit message: ${commit.commit.message}`)
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

export const getShortcutIdMessageFromSha = async (
  sha: string
): Promise<number | null> => {
  const octokit = new Octokit({token: core.getInput('GITHUB_TOKEN')})

  const response = await octokit.repos.getCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    ref: sha
  })

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

  const commitMessage = extractStoryIdFromString(response.data.commit.message)

  return commitMessage
}

