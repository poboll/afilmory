import os from 'node:os'

import { defineBuilderConfig, githubRepoSyncPlugin } from '@afilmory/builder'

import { env } from './env.js'

export default defineBuilderConfig(() => ({
  storage: {
    provider: 'github',
    owner: 'poboll',
    repo: 'gallery-photos',
    branch: 'main',
    path: 'photos',
    useRawUrl: true,
  },
  system: {
    processing: {
      defaultConcurrency: 10,
      enableLivePhotoDetection: true,
      digestSuffixLength: 8,
      xmp: {
        keywords: true,
        regions: true,
      },
    },
    observability: {
      showProgress: true,
      showDetailedStats: true,
      logging: {
        verbose: false,
        level: 'info',
        outputToFile: false,
      },
      performance: {
        worker: {
          workerCount: os.cpus().length * 2,
          timeout: 30_000,
          useClusterMode: true,
          workerConcurrency: 2,
        },
      },
    },
  },
  plugins: [
    githubRepoSyncPlugin({
      repo: {
        enable: true,
        url: 'https://github.com/poboll/gallery-photos',
        token: env.GIT_TOKEN,
        branch: 'main',
      },
    }),
  ],
}))
