-- Study Groups schema
--> statement-breakpoint
CREATE TABLE "study_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"exam_id" integer REFERENCES "exam"("id") ON DELETE SET NULL,
	"owner_id" text NOT NULL REFERENCES "user"("id") ON DELETE NO ACTION,
	"privacy" varchar(10) DEFAULT 'public' NOT NULL,
	"goal" text,
	"invite_token" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_group_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "study_group_subject" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL REFERENCES "study_group"("id") ON DELETE CASCADE,
	"subject_id" integer NOT NULL REFERENCES "subject"("id") ON DELETE CASCADE,
	CONSTRAINT "study_group_subject_group_subject_unique" UNIQUE("group_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "group_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL REFERENCES "study_group"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"role" varchar(10) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_membership_group_user_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "group_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL REFERENCES "study_group"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"content" text NOT NULL,
	"question_id" integer REFERENCES "question"("id") ON DELETE SET NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL REFERENCES "group_post"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_challenge" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL REFERENCES "study_group"("id") ON DELETE CASCADE,
	"title" varchar(200) NOT NULL,
	"description" text,
	"subject_id" integer REFERENCES "subject"("id") ON DELETE SET NULL,
	"exam_id" integer REFERENCES "exam"("id") ON DELETE SET NULL,
	"question_count" integer DEFAULT 10 NOT NULL,
	"time_limit_mins" integer DEFAULT 15 NOT NULL,
	"created_by" text NOT NULL REFERENCES "user"("id") ON DELETE NO ACTION,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_question" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL REFERENCES "group_challenge"("id") ON DELETE CASCADE,
	"question_id" integer NOT NULL REFERENCES "question"("id") ON DELETE CASCADE,
	"order_index" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "challenge_question_challenge_question_unique" UNIQUE("challenge_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "challenge_attempt" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL REFERENCES "group_challenge"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"score" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"accuracy" integer DEFAULT 0 NOT NULL,
	"time_taken_ms" integer,
	"completed_at" timestamp,
	"started_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_attempt_challenge_user_unique" UNIQUE("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "challenge_answer" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL REFERENCES "challenge_attempt"("id") ON DELETE CASCADE,
	"question_id" integer NOT NULL REFERENCES "question"("id") ON DELETE CASCADE,
	"selected_option_id" integer REFERENCES "option"("id") ON DELETE SET NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"post_id" integer REFERENCES "group_post"("id") ON DELETE SET NULL,
	"comment_id" integer REFERENCES "group_comment"("id") ON DELETE SET NULL,
	"reason" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_group_membership_group_id" ON "group_membership"("group_id");
--> statement-breakpoint
CREATE INDEX "idx_group_membership_user_id" ON "group_membership"("user_id");
--> statement-breakpoint
CREATE INDEX "idx_group_post_group_id" ON "group_post"("group_id");
--> statement-breakpoint
CREATE INDEX "idx_group_post_created_at" ON "group_post"("created_at");
--> statement-breakpoint
CREATE INDEX "idx_group_comment_post_id" ON "group_comment"("post_id");
--> statement-breakpoint
CREATE INDEX "idx_challenge_question_challenge_id" ON "challenge_question"("challenge_id");
--> statement-breakpoint
CREATE INDEX "idx_challenge_attempt_challenge_id" ON "challenge_attempt"("challenge_id");
--> statement-breakpoint
CREATE INDEX "idx_challenge_attempt_user_id" ON "challenge_attempt"("user_id");
--> statement-breakpoint
CREATE INDEX "idx_challenge_answer_attempt_id" ON "challenge_answer"("attempt_id");
