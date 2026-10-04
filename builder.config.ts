import { defineBuilderConfig, githubRepoSyncPlugin } from '@afilmory/builder'

export default defineBuilderConfig(() => ({
  storage: {
    provider: 'github',
    owner: 'poboll',
    repo: 'gallery-photos',
    branch: 'main',
    path: 'photos',
    useRawUrl: true,
  },
  plugins: [
    githubRepoSyncPlugin({
      repo: {
        enable: true,
        url: 'https://github.com/poboll/gallery-photos',
        token: process.env.GIT_TOKEN ?? '',
        branch: 'main',
      },
    }),
  ],
}))
