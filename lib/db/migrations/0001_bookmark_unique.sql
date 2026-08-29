-- Add unique constraint to prevent duplicate bookmarks per user per question
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_question_id_unique" UNIQUE("user_id","question_id");
