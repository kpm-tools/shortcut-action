export const getShortcutIdFromBranchName = (
  branchName: string,
  branchPattern: RegExp
): number | null => {
  const match = branchName.match(branchPattern)

  if (!match) return null

  const SHORTCUT_STORY_ID = match[1]

  return parseInt(SHORTCUT_STORY_ID)
}
