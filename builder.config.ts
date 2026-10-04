import { defineBuilderConfig } from '@afilmory/builder'

export default defineBuilderConfig(() => ({
  storage: {
    provider: 'github',
    owner: 'poboll',
    repo: 'gallery-photos',
    branch: 'main',
    path: 'photos',
    useRawUrl: true,
  },
}))
