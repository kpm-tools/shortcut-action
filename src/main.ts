import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/action'
import {ShortcutClient} from '@useshortcut/client'

import {getShortcutIdFromBranchName} from './helpers/shortcut'
import {
  validateConfigFile,
  getColumnIdForAction,
  getEventType
} from './helpers/github-events'

import path from 'path'
import fs from 'fs'
import util from 'util'

import * as dotenv from 'dotenv'
import {
  GitHubActionEvent,
  ConfigFile,
  EventName,
  EventType,
  Branch
} from './types/actions'

const readFileAsync = util.promisify(fs.readFile)
dotenv.config()

// TODO: TEMPORARY, DELETE THIS
const DEFAULT_BRANCH_PATTERN = /sc-(\d+)/
const DEFAULT_CONFIGURATION_FILE = '.github/shortcut_configuration.json'

const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') || []

const getConfiguration = async (
  repoConfigPath: string
): Promise<ConfigFile> => {
  if (process.env.CONFIGURATION_FILE) {
    const buffer = await readFileAsync(
      path.join(__dirname, process.env.CONFIGURATION_FILE)
    )
    const json = JSON.parse(buffer.toString())
    return json
  }

  if (!repoConfigPath) throw new Error('No configuration path was found')

  const octokit = new Octokit()
  const response = await octokit.repos.getContent({
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
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')

    const CONFIGURATION_FILE =
      core.getInput('configuration_file') || DEFAULT_CONFIGURATION_FILE

    if (!CONFIGURATION_FILE) throw new Error('configuration_file is required.')

    if (!SHORTCUT_TOKEN) throw new Error('SHORTCUT_TOKEN is required.')
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required.')

    const CONFIGURATION: ConfigFile = await getConfiguration(CONFIGURATION_FILE)

    if (!CONFIGURATION) throw new Error('No configuration  was found')

    validateConfigFile(CONFIGURATION)

    const EVENT_NAME: EventName = core.getInput(
      'GITHUB_EVENT_NAME'
    ) as EventName

    const EVENT_TYPE: EventType | undefined = getEventType(EVENT_NAME)

    const BRANCH: Branch = core.getInput('GITHUB_REF_NAME')

    const BRANCH_REF: string = core.getInput('GITHUB_REF_TYPE')

    if (!BRANCH || BRANCH_REF === 'tag') {
      throw new Error('Branch not found, or tag was used')
    }

    const githubActionEvent: GitHubActionEvent = {
      eventName: EVENT_NAME,
      branch: BRANCH
    }

    if (EVENT_TYPE) {
      githubActionEvent.eventType = EVENT_TYPE
    }

    const columnId = getColumnIdForAction(githubActionEvent, CONFIGURATION)

    const shortcutStoryIdFromBranch = getShortcutIdFromBranchName(
      githubActionEvent.branch,
      DEFAULT_BRANCH_PATTERN
    )

    const shortcut = new ShortcutClient(SHORTCUT_TOKEN)

    shortcut.updateStory(shortcutStoryIdFromBranch, {
      workflow_state_id: columnId
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
