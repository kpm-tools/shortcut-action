import * as core from '@actions/core'
import {ShortcutClient} from '@useshortcut/client'
import {Octokit} from '@octokit/core'

import path from 'path'
import fs from 'fs'
import util from 'util'

import {getShortcutIdFromBranchName} from './helpers/shortcut'
import {validateConfigFile, getColumnIdForAction} from './helpers/github-events'

import * as dotenv from 'dotenv'
import {GitHubActionEvent, EventName, EventType, Branch} from './types/actions'

const readFileAsync = util.promisify(fs.readFile)
dotenv.config()

// TODO: TEMPORARY, DELETE THIS
const BRANCH_PATTERN = /sc-(\d+)/

const DEFAULT_CONFIGURATION_FILE = path.join(
  __dirname,
  'shorcut_configuration.json'
)

async function run(): Promise<void> {
  try {
    const SHORTCUT_TOKEN =
      core.getInput('SHORTCUT_TOKEN') || process.env.SHORTCUT_TOKEN

    const GITHUB_TOKEN =
      core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN

    const configuration_file =
      core.getInput('configuration_file') ||
      process.env.CONFIGURATION_FILE ||
      DEFAULT_CONFIGURATION_FILE

    console.log(DEFAULT_CONFIGURATION_FILE)

    if (!SHORTCUT_TOKEN) throw new Error('SHORTCUT_TOKEN is required.')
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required.')
    if (!configuration_file) throw new Error('configuration_file is required.')

    const buffer = await readFileAsync(path.join(__dirname, configuration_file))
    const json = JSON.parse(buffer.toString())
    validateConfigFile(json)

    const EVENT_NAME: EventName = core.getInput(
      'GITHUB_EVENT_NAME'
    ) as EventName

    const BRANCH: Branch = core.getInput('GITHUB_REF_NAME')
    const BRANCH_REF: string = core.getInput('GITHUB_REF_TYPE')

    if (
      EVENT_NAME !== ('push' as EventName) ||
      EVENT_NAME !== ('pull_request' as EventName)
    ) {
      throw new Error('Unsupported action trigger')
    }

    if (!BRANCH || BRANCH_REF === 'tag') {
      throw new Error('Branch not found, or tag was used')
    }

    const githubActionEvent: GitHubActionEvent = {
      eventName: EVENT_NAME,
      branch: BRANCH
    }

    const columnId = getColumnIdForAction(githubActionEvent, json)

    const shortcutStoryId = getShortcutIdFromBranchName(
      githubActionEvent.branch,
      BRANCH_PATTERN
    )

    console.log(columnId, shortcutStoryId)

    // const shortcut = new ShortcutClient(SHORTCUT_TOKEN)
    //
    // shortcut
    //   .getCurrentMemberInfo()
    //   .then(response => console.log(response?.data))
    //
    // shortcut.listProjects().then(response => console.log(response?.data))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
