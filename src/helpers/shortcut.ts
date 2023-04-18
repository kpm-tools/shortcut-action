export const getShortcutIdFromBranchName = (
  branchName: string,
  branchPattern: RegExp
) => {
  const match = branchName.match(branchPattern)

  if (!match) throw new Error('Branch name does not match pattern.')

  const SHORTCUT_STORY_ID = match[1]

  return SHORTCUT_STORY_ID
}
