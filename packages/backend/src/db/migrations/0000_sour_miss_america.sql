CREATE TABLE "legal_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"image" varchar,
	"type" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"oked" varchar(20) NOT NULL,
	"bin" varchar(12) NOT NULL,
	"registration_date" timestamp NOT NULL,
	"ugd" varchar(100) NOT NULL,
	"banks" jsonb DEFAULT '[]' NOT NULL,
	"employees" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_status" (
	"user_id" uuid NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"current_step" varchar(50) DEFAULT 'profile' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"image" varchar,
	"email" varchar(256) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_entities" ADD CONSTRAINT "legal_entities_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_status" ADD CONSTRAINT "onboarding_status_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;