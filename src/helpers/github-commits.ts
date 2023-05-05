import * as core from '@actions/core'
import * as github from '@actions/github'

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

  const shortcutId = extractStoryIdFromString(response.data.commit.message)

  return shortcutId
}

export const getShortcutIdFromPRCommits = async (): Promise<
  number[] | undefined
> => {
  const token = core.getInput('GITHUB_TOKEN')
  const octokit = github.getOctokit(token)

  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const commit_sha = github.context.sha

  const prsInCommit = await octokit.request(
    `GET /repos/${owner}/${repo}/commits/${commit_sha}/pulls`,
    {
      owner,
      repo,
      commit_sha,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  )

  const commitsInPrs = await Promise.all(
    prsInCommit.data.map(async ({number}: {number: number}) => {
      return octokit.request(
        `GET /repos/${owner}/${repo}/pulls/${number}/commits`,
        {
          owner,
          repo,
          pull_number: number,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )
    })
  )

  const commitMessage = commitsInPrs.map(
    ({data}: {data: {commit: {message: string}}[]}) => {
      return data.map(
        (commit: {commit: {message: string}}) => commit.commit.message
      )
    }
  )

  const rawShortcutIds = commitMessage.map((message: string[]) => {
    return message.map((msg: string) => extractStoryIdFromString(msg))
  })

  if (rawShortcutIds.length === 0) return undefined
  const flattenedShortcutIds = rawShortcutIds.flat()
  const shortcutIds = flattenedShortcutIds.filter(id => id !== null) as number[]

  return shortcutIds
}
