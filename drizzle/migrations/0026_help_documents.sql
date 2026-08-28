CREATE TYPE "public"."help_document_slug" AS ENUM('overview', 'parties', 'mediator', 'admin');
--> statement-breakpoint
CREATE TABLE "help_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" "help_document_slug" NOT NULL,
	"locale" "preferred_locale" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "help_documents_slug_locale_unique" UNIQUE("slug","locale")
);
--> statement-breakpoint
SELECT public.psylex_lockdown_table('public.help_documents');
