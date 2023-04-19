import * as core from '@actions/core'
import * as github from '@actions/github'

export const getShortcutIdMessageFromSha = async (
  sha: string
): Promise<number | null> => {
  const token = core.getInput('GITHUB_TOKEN')
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.repos.getCommit({
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
