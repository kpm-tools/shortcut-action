# @kpm-tools/shortcut-action

![Unit Tests](https://github.com/kpm-tools/shortcut-action/actions/workflows/tests.yml/badge.svg?branch=main)

# Setup

Example workflow config:

```
name: Shortcut Story Manager

on:
    pull_request:
        types:
            - opened
            - edited
            - reopened
            - synchronize
    pull_request_review:
        types:
            - submitted
    push:
        branches:
            - staging
            - feature/**
            - bug/**
            - chore/**
    release:

permissions: read-all

jobs:
    shortcut:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout Latest
              uses: actions/checkout@v3
            - name: Shortcut Action
              uses: kpm-tools/shortcut-action@v1
              with:
                  SHORTCUT_TOKEN: ${{ secrets.SHORTCUT_API_KEY}}
                  GITHUB_TOKEN: ${{ secrets.GH_TOKEN_FOXBOT}}
```

Example config file (hosted at .gitub/shortcut_configuration.json):

```
{
  "validEvents": [
    {
      "events": [
        {
          "eventName": "release",
          "eventType": "published"
        }
      ],
      "branches": ["main"],
      "columnId": "500000011",
      "columnName": "Released"
    },
    {
      "events": [
        {
          "eventName": "push"
        }
      ],
      "branches": ["staging"],
      "columnId": "500000009",
      "columnName": "Ready For Release"
    },
    {
      "events": [
        {
          "eventName": "pull_request_review",
          "eventType": "submitted"
        }
      ],
      "branches": ["feature/*", "bug/*", "chore/*"],
      "columnId": "500000060",
      "columnName": "QA"
    },
    {
      "events": [
        {
          "eventName": "pull_request"
        }
      ],
      "branches": ["feature/*", "bug/*", "chore/*"],
      "columnId": "500001600",
      "columnName": "In Review"
    },
    {
      "events": [
        {
          "eventName": "push"
        }
      ],
      "branches": ["feature/*", "bug/*", "chore/*"],
      "columnId": "500000006",
      "columnName": "In Progress"
    }
  ]
}
```

# Supported Actions

- push
- pull_request
- release

* If you would like support for another action type, please file an issue [https://github.com/kpm-tools/shortcut-action/issues](https://github.com/kpm-tools/shortcut-action/issues)

# Known Limitations

- For moving an individual story in a pull_request or push, the branch needs to contain a shortcut id ex: `sc-12345`
- The release action only supports movement of stories if the release body contains a shortcut id. This repo has a job that will automatically add the shortcut id to a PR title.
