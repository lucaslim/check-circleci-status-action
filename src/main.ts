import * as core from '@actions/core'
import * as github from '@actions/github'
import axios from 'axios'
import pWaitFor from 'p-wait-for'

async function run(): Promise<void> {
  const pipelineId = core.getInput('pipelineId', {required: true})
  const token = core.getInput('token', {required: true})
  const interval = Number(core.getInput('interval'))
  const timeout = Number(core.getInput('timeout'))

  core.debug(`pipelineId: ${pipelineId}`)
  core.debug(`interval: ${interval}`)
  core.debug(`timeout: ${timeout}`)

  try {
    await pWaitFor(
      async () => {
        const response = await axios.get(
          `https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`,
          {
            headers: {
              'x-attribution-login': github.context.actor,
              'x-attribution-actor-id': github.context.actor,
              'Circle-Token': token
            }
          }
        )

        if (response.data.items.length === 0) {
          return false
        }

        const status = response.data.items[0].status

        if (status === 'running') {
          return false
        } else {
          const circleciResponse = {
            pipelineId: response.data.items[0].pipeline_id,
            pipelineNumber: response.data.items[0].pipeline_number,
            status: response.data.items[0].status
          }
          core.debug(`response: ${JSON.stringify(circleciResponse)}`)
          core.setOutput('response', circleciResponse)

          return true
        }
      },
      {
        interval,
        timeout
      }
    )
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
