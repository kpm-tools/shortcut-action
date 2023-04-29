import type {ConfigFile} from '../../src/types/actions'

export const validConfigJson: ConfigFile = {
  validEvents: [
    {
      events: [
        {
          eventName: 'release',
          eventType: 'published'
        }
      ],
      branches: ['main'],
      columnId: '500000011',
      columnName: 'Released'
    },
    {
      events: [
        {
          eventName: 'push'
        }
      ],
      branches: ['staging'],
      columnId: '500000009',
      columnName: 'Ready For Release'
    },
    {
      events: [
        {
          eventName: 'pull_request_review',
          eventType: 'submitted'
        }
      ],
      branches: ['feature/*', 'bug/*', 'chore/*'],
      columnId: '500000060',
      columnName: 'QA'
    },
    {
      events: [
        {
          eventName: 'pull_request'
        }
      ],
      branches: ['feature/*', 'bug/*', 'chore/*'],
      columnId: '500001600',
      columnName: 'In Review'
    },
    {
      events: [
        {
          eventName: 'push'
        }
      ],
      branches: ['feature/*', 'bug/*', 'chore/*'],
      columnId: '500000006',
      columnName: 'In Progress'
    }
  ]
}
