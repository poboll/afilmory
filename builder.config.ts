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
    customDomain: 'cdn.jsdelivr.net/gh/poboll/gallery-photos@main',
  },
  system: {
    processing: {
      defaultConcurrency: 2,
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
          workerCount: 1,
          timeout: 60_000,
          useClusterMode: false,
          workerConcurrency: 1,
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
