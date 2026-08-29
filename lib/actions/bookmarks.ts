'use server'

import { db } from '@/lib/db'
import { bookmark } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/** Add a bookmark. Returns the new bookmark id, or existing id if already bookmarked. */
export async function addBookmark(questionId: number): Promise<{ bookmarkId: number }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  // Use INSERT … ON CONFLICT DO NOTHING and then fetch the row
  const [inserted] = await db
    .insert(bookmark)
    .values({ userId: session.user.id, questionId })
    .onConflictDoNothing()
    .returning({ id: bookmark.id })

  if (inserted) {
    revalidatePath('/bookmarks')
    return { bookmarkId: inserted.id }
  }

  // Already existed — fetch its id
  const [existing] = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(and(eq(bookmark.userId, session.user.id), eq(bookmark.questionId, questionId)))
    .limit(1)

  return { bookmarkId: existing!.id }
}

/** Remove a bookmark by question id. Safe to call even if not bookmarked. */
export async function removeBookmark(questionId: number): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  await db
    .delete(bookmark)
    .where(and(eq(bookmark.userId, session.user.id), eq(bookmark.questionId, questionId)))

  revalidatePath('/bookmarks')
}

/** Toggle bookmark state. Returns the new state. */
export async function toggleBookmark(
  questionId: number,
  currentlyBookmarked: boolean
): Promise<{ bookmarked: boolean }> {
  if (currentlyBookmarked) {
    await removeBookmark(questionId)
    return { bookmarked: false }
  } else {
    await addBookmark(questionId)
    return { bookmarked: true }
  }
}
