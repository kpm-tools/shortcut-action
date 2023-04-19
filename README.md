# @kpm-tools/shortcut-action

> This is in alpha testing, please use at your own risk.

# Setup

Example workflow config:

```
on:
  push:
  pull_request:
  pull_request_review:

permissions: read-all

jobs:
  shortcut:
    runs-on: ubuntu-latest
    name: Shortcut
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Shortcut
        uses: ./
        with:
          SHORTCUT_TOKEN: ${{ secrets.SHORTCUT_TOKEN}}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN}}
```

Example config file (hosted at .gitub/shortcut_configuration.json):

```
{
  "validEvents": [
    {
      "events": [
        {
          "eventName": "push"
        }
      ],
      "branches": ["main"],
      "columnId": "500000011"
    },
    {
      "events": [
        {
          "eventName": "push"
        }
      ],
      "branches": ["staging"],
      "columnId": "500000009"
    },
    {
      "events": [
        {
          "eventName": "pull_request_review",
          "eventType": "approved"
        }
      ],
      "branches": ["feature/*", "bug/*", "chore/*"],
      "columnId": "500000060"
    },
    {
      "events": [
        {
          "eventName": "pull_request"
        }
      ],
      "branches": ["feature/*", "bug/*", "chore/*"],
      "columnId": "500001600"
    },
    {
      "events": [
        {
          "eventName": "push"
        }
      ],
      "branches": ["feature/*", "bug/*", "chore/*"],
      "columnId": "500000006"
    }
  ]
}

```
