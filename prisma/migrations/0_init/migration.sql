-- CreateTable
CREATE TABLE "stats" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" VARCHAR(255) NOT NULL,
    "post_id" VARCHAR(255) NOT NULL,
    "clicks" INTEGER DEFAULT 0,
    "keypresses" INTEGER DEFAULT 0,
    "mousemovements" INTEGER DEFAULT 0,
    "scrolls" INTEGER DEFAULT 0,
    "totaltime" INTEGER DEFAULT 0,
    "location" VARCHAR(255),

    CONSTRAINT "stats_pkey" PRIMARY KEY ("id")
);
