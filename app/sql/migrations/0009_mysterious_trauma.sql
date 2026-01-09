ALTER TABLE "certifications" ALTER COLUMN "issuer" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certifications" ALTER COLUMN "acquisition_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "experiences" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "experiences" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "language_tests" ALTER COLUMN "score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "language_tests" ALTER COLUMN "test_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "side_projects" ALTER COLUMN "start_date" DROP NOT NULL;