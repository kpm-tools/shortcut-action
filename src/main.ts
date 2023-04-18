import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/action'
import {ShortcutClient} from '@useshortcut/client'

import {getShortcutIdFromBranchName} from './helpers/shortcut'
import {validateConfigFile, getColumnIdForAction} from './helpers/github-events'

import * as dotenv from 'dotenv'
import {
  GitHubActionEvent,
  ConfigFile,
  EventName,
  EventType,
  Branch
} from './types/actions'

dotenv.config()

// TODO: TEMPORARY, DELETE THIS
const DEFAULT_BRANCH_PATTERN = /sc-(\d+)/
const DEFAULT_CONFIGURATION_FILE = '.github/shortcut_configuration.json'

const [owner, repo] = process.env.GITHUB_REPOSITORY?.split('/') || []

const octokit = new Octokit()

const getConfigurationFile = async (
  repoConfigPath: string
): Promise<ConfigFile> => {
  if (!repoConfigPath) throw new Error('No configuration path was found')

  const response = await octokit.repos.getContent({
    owner,
    repo,
    path: repoConfigPath,
    ref: github.context.sha
  })

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Buffer.from(response.data.content, response.data.encoding).toString()
}

async function run(): Promise<void> {
  try {
    const SHORTCUT_TOKEN =
      core.getInput('SHORTCUT_TOKEN') || process.env.SHORTCUT_TOKEN

    const GITHUB_TOKEN =
      core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN

    const configuration_file =
      core.getInput('configuration_file') || DEFAULT_CONFIGURATION_FILE

    const CONFIGURATION: ConfigFile = await getConfigurationFile(
      configuration_file
    )

    if (!SHORTCUT_TOKEN) throw new Error('SHORTCUT_TOKEN is required.')
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required.')
    if (!configuration_file) throw new Error('configuration_file is required.')
    if (!CONFIGURATION) throw new Error('No configuration  was found')

    // const buffer = await readFileAsync(path.join(__dirname, configuration_file))
    // const json = JSON.parse(buffer.toString())

    validateConfigFile(CONFIGURATION)

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

    const columnId = getColumnIdForAction(githubActionEvent, CONFIGURATION)

    const shortcutStoryId = getShortcutIdFromBranchName(
      githubActionEvent.branch,
      DEFAULT_BRANCH_PATTERN
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
