import type { ReactNode } from 'react'

const DEFAULT_REPO = 'bazzalabs/ui'
const DEFAULT_REVALIDATE_SECONDS = 60 * 10

type GitHubRepositoryResponse = {
  stargazers_count?: number
}

type GitHubStarsProps = {
  children: (stars: number | null) => ReactNode
  repo?: `${string}/${string}`
  revalidate?: number
}

async function fetchGitHubStarCount({
  repo,
  revalidate,
}: {
  repo: `${string}/${string}`
  revalidate: number
}) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      next: {
        revalidate,
      },
    })

    if (!response.ok) {
      return null
    }

    const repository = (await response.json()) as GitHubRepositoryResponse

    if (typeof repository.stargazers_count !== 'number') {
      return null
    }

    return repository.stargazers_count
  } catch {
    return null
  }
}

export async function GitHubStars({
  children,
  repo = DEFAULT_REPO,
  revalidate = DEFAULT_REVALIDATE_SECONDS,
}: GitHubStarsProps) {
  const stars = await fetchGitHubStarCount({ repo, revalidate })

  return children(stars)
}
