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
      columnId: '500000011'
    },
    {
      events: [
        {
          eventName: 'push'
        }
      ],
      branches: ['staging'],
      columnId: '500000009'
    },
    {
      events: [
        {
          eventName: 'pull_request_review',
          eventType: 'approved'
        }
      ],
      branches: ['feature/*', 'bug/*', 'chore/*'],
      columnId: '500000060'
    },
    {
      events: [
        {
          eventName: 'pull_request'
        }
      ],
      branches: ['feature/*', 'bug/*', 'chore/*'],
      columnId: '500001600'
    },
    {
      events: [
        {
          eventName: 'push'
        }
      ],
      branches: ['feature/*', 'bug/*', 'chore/*'],
      columnId: '500000006'
    }
  ]
}