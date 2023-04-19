import * as core from '@actions/core'
import * as github from '@actions/github'
import {ShortcutClient} from '@useshortcut/client'

import {getShortcutIdFromBranchName} from './helpers/shortcut'

import {
  validateConfigFile,
  getColumnIdForAction,
  getEventType,
  getBranchBasedOnEventName,
  updatePRTitleWithShortcutId
} from './helpers/github-events'

import {getShortcutIdMessageFromSha} from './helpers/github-commits'
import {getShortcutIdsFromReleaseBody} from './helpers/github-releases'

import {
  GitHubActionEvent,
  ConfigFile,
  EventName,
  EventType,
  Branch
} from './types/actions'

// TODO: TEMPORARY, DELETE THIS
const DEFAULT_BRANCH_PATTERN = /sc-(\d+)/
const DEFAULT_CONFIGURATION_FILE = '.github/shortcut_configuration.json'

const getConfiguration = async (
  repoConfigPath: string
): Promise<ConfigFile> => {
  // if (process.env.CONFIGURATION_FILE) {
  //   const buffer = await readFileAsync(
  //     path.join(__dirname, process.env.CONFIGURATION_FILE)
  //   )
  //   const json = JSON.parse(buffer.toString())
  //   return json
  // }

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Buffer.from(response.data.content, response.data.encoding).toString()
  )
}

async function run(): Promise<void> {
  try {
    const SHORTCUT_TOKEN = core.getInput('SHORTCUT_TOKEN')
    if (!SHORTCUT_TOKEN) throw new Error('SHORTCUT_TOKEN is required.')

    const CONFIGURATION_FILE =
      core.getInput('configuration_file') || DEFAULT_CONFIGURATION_FILE
    if (!CONFIGURATION_FILE) throw new Error('configuration_file is required.')

    const CONFIGURATION: ConfigFile = await getConfiguration(CONFIGURATION_FILE)
    if (!CONFIGURATION) throw new Error('No configuration  was found')
    validateConfigFile(CONFIGURATION)

    const EVENT_NAME: EventName = github.context.eventName as EventName
    const EVENT_TYPE: EventType | undefined = getEventType(EVENT_NAME)
    const BRANCH = await getBranchBasedOnEventName(EVENT_NAME)

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

    const columnId = getColumnIdForAction(githubActionEvent, CONFIGURATION)

    const shortcutStoryIdFromBranch = getShortcutIdFromBranchName(
      githubActionEvent.branch,
      DEFAULT_BRANCH_PATTERN
    )

    const shortcutIdFromSha = await getShortcutIdMessageFromSha(
      github.context.sha
    )

    const shortcutId = shortcutStoryIdFromBranch || shortcutIdFromSha || null

    if (
      shortcutId &&
      (EVENT_NAME === 'pull_request' || EVENT_NAME === 'pull_request_review')
    ) {
      updatePRTitleWithShortcutId(shortcutId)
    }

    let shortcutIds = null

    if (shortcutId) {
      shortcutIds = [shortcutId]
    }

    if (EVENT_NAME === 'release') {
      const shortcutIdsFromReleaseBody = await getShortcutIdsFromReleaseBody()
      if (shortcutIdsFromReleaseBody) {
        shortcutIds = shortcutIdsFromReleaseBody
      }
    }

    const shortcut = new ShortcutClient(SHORTCUT_TOKEN)
    if (shortcutIds) {
      await Promise.all(
        shortcutIds.map(id => {
          if (id) {
            shortcut.updateStory(id, {
              workflow_state_id: columnId
            })
            core.info(`Shortcut story ${id} updated, to columnId ${columnId}`)
          }
        })
      )
      return
    }

    core.info('No shortcut story found to update')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
