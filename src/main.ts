import * as core from '@actions/core'
import {ShortcutClient} from '@useshortcut/client'
import {Octokit} from '@octokit/core'

import path from 'path'
import fs from 'fs'
import util from 'util'
const readFileAsync = util.promisify(fs.readFile)

import {getShortcutIdFromBranchName} from './helpers/shortcut'
import {isEventValidForAction} from './helpers/github-events'

import * as dotenv from 'dotenv'
import {GitHubPushEvent} from './types/actions'
dotenv.config()

// TODO: TEMPORARY, DELETE THIS
const GITHUB_BRANCH = 'bug/sc-22205-user-browsing-as-guest-user-adds-items-to'
const BRANCH_PATTERN = /sc-(\d+)/

const test_event: GitHubPushEvent = {
  eventName: 'push',
  branch: 'main'
}

async function run(): Promise<void> {
  try {
    const SHORTCUT_TOKEN =
      core.getInput('SHORTCUT_TOKEN') || process.env.SHORTCUT_TOKEN

    const GITHUB_TOKEN =
      core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN

    const configuration_file =
      core.getInput('configuration_file') || process.env.CONFIGURATION_FILE

    if (!SHORTCUT_TOKEN) throw new Error('SHORTCUT_TOKEN is required.')
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required.')
    if (!configuration_file) throw new Error('configuration_file is required.')

    const buffer = await readFileAsync(path.join(__dirname, configuration_file))
    // TODO: validate config file
    const json = JSON.parse(buffer.toString())

    const result = isEventValidForAction(test_event, json)
    console.log(result)

    const ShortcutStoryId = getShortcutIdFromBranchName(
      GITHUB_BRANCH,
      BRANCH_PATTERN
    )

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
