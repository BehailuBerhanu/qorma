import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBookmarkedQuestions } from '@/lib/db/queries/bookmarks'
import BookmarksView from '@/components/bookmarks/bookmarks-view'

export const metadata = { title: 'Bookmarks — Qorma' }

export default async function BookmarksPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const bookmarks = await getBookmarkedQuestions(session.user.id).catch(() => [])

  return <BookmarksView bookmarks={bookmarks} />
}
