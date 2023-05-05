import * as core from '@actions/core'
import * as github from '@actions/github'
import {ShortcutClient} from '@useshortcut/client'

import {getShortcutIdFromBranchName} from './helpers/shortcut'

import {
  validateConfigFile,
  getColumnIdAndColumnNameForAction,
  getEventType,
  getBranchBasedOnEventName,
  updatePRTitleWithShortcutId
} from './helpers/github-events'

import {
  getShortcutIdMessageFromSha,
  getShortcutIdFromPRCommits
} from './helpers/github-commits'
import {getShortcutIdsFromReleaseBody} from './helpers/github-releases'

import {
  GitHubActionEvent,
  ConfigFile,
  EventName,
  EventType,
  Branch
} from './types/actions'

const DEFAULT_BRANCH_PATTERN = /sc-(\d+)/
const DEFAULT_CONFIGURATION_FILE = '.github/shortcut_configuration.json'

const getConfiguration = async (
  repoConfigPath: string
): Promise<ConfigFile> => {
  const {owner, repo} = github.context.repo

  if (!repoConfigPath) throw new Error('No configuration path was found')

  const token = core.getInput('GITHUB_TOKEN')
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: repoConfigPath,
    ref: github.context.sha
  })

  return JSON.parse(
    // TS doesn't like this, but it's correct, so we'll ignore it ¯\_(ツ)_/¯
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Buffer.from(response.data.content, response.data.encoding).toString()
  )
}

async function run(): Promise<void> {
  try {
    const SHORTCUT_TOKEN = core.getInput('SHORTCUT_TOKEN')
    if (!SHORTCUT_TOKEN) throw new Error('SHORTCUT_TOKEN is required.')

    const BRANCH_PATTERN =
      core.getInput('branch_pattern') || DEFAULT_BRANCH_PATTERN

    const CONFIGURATION_FILE =
      core.getInput('configuration_file') || DEFAULT_CONFIGURATION_FILE
    if (!CONFIGURATION_FILE) throw new Error('configuration_file is required.')

    const CONFIGURATION: ConfigFile = await getConfiguration(CONFIGURATION_FILE)
    if (!CONFIGURATION) throw new Error('No configuration  was found')
    validateConfigFile(CONFIGURATION)

    const EVENT_NAME: EventName = github.context.eventName as EventName
    const EVENT_TYPE: EventType | undefined = getEventType(EVENT_NAME)
    const BRANCH: Branch = await getBranchBasedOnEventName(EVENT_NAME)

    core.info(`Event detected: ${EVENT_NAME}`)
    if (EVENT_TYPE) {
      core.info(`Event Type detected: ${EVENT_TYPE}`)
    }
    core.info(`Branch detected: ${BRANCH}`)

    const githubActionEvent: GitHubActionEvent = {
      eventName: EVENT_NAME,
      branch: BRANCH || ''
    }

    if (EVENT_TYPE) {
      githubActionEvent.eventType = EVENT_TYPE
    }

    const column = getColumnIdAndColumnNameForAction(
      githubActionEvent,
      CONFIGURATION
    )

    const shortcutStoryIdFromBranch = getShortcutIdFromBranchName(
      githubActionEvent.branch,
      BRANCH_PATTERN as RegExp
    )

    const shortcutIdFromSha = await getShortcutIdMessageFromSha(
      github.context.sha
    )

    const shortcutId = shortcutStoryIdFromBranch || shortcutIdFromSha || null

    if (
      shortcutId &&
      (EVENT_NAME === 'pull_request' ||
        EVENT_NAME === 'pull_request_review' ||
        EVENT_NAME === 'push')
    ) {
      const updated = await updatePRTitleWithShortcutId(shortcutId)
      if (updated) {
        core.info(`PR title updated with Shortcut story id ${shortcutId}`)
      }
    }

    let shortcutIds: number[] = []

    if (shortcutId) {
      shortcutIds = [shortcutId]
    }

    if (EVENT_NAME === 'release') {
      const shortcutIdsFromReleaseBody = await getShortcutIdsFromReleaseBody()
      if (shortcutIdsFromReleaseBody) {
        shortcutIds = [...shortcutIds, ...shortcutIdsFromReleaseBody]
      }
    }

    if (EVENT_NAME === 'push') {
      const shortcutIdsFromCommits = await getShortcutIdFromPRCommits()
      if (shortcutIdsFromCommits) {
        shortcutIds = [...shortcutIds, ...shortcutIdsFromCommits]
      }
    }

    const shortcut = new ShortcutClient(SHORTCUT_TOKEN)
    if (shortcutIds?.length > 0) {
      await Promise.all(
        shortcutIds.map(id => {
          if (id) {
            shortcut.updateStory(id, {
              workflow_state_id: column?.columnId
            })
            core.info(
              `Shortcut story ${id} updated, to ${
                column?.columnName || column?.columnId
              } ${column?.columnId}`
            )
          }
        })
      )
      return
    }

    core.info('No shortcut story found to update')
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
