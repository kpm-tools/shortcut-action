import * as core from '@actions/core'
import * as github from '@actions/github'

export const getShortcutIdsFromReleaseBody = async (): Promise<
  number[] | null
> => {
  const extractStoryIdsFromReleaseBody = (
    releaseBody: string
  ): number[] | null => {
    const regex = /\[sc-(\d+)\]/g
    const matches = releaseBody.matchAll(regex)
    const numbers = Array.from(matches, match => parseInt(match[1], 10))
    return numbers.length > 0 ? numbers : null
  }

  const token = core.getInput('GITHUB_TOKEN')
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.repos.getLatestRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  })

  const releaseBody = response.data.body

  if (releaseBody) {
    const storyIds = extractStoryIdsFromReleaseBody(releaseBody)

    return storyIds
  }

  return null
}
