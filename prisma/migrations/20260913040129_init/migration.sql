-- CreateTable
CREATE TABLE "User" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Complaint" (
    "complaint_id" TEXT NOT NULL PRIMARY KEY,
    "ward" TEXT NOT NULL,
    "complaint_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "severity_score" INTEGER NOT NULL DEFAULT 50,
    "severity_reason" TEXT NOT NULL DEFAULT '',
    "sla_due_at" DATETIME,
    "department" TEXT,
    "gcc_ticket_ref" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'Unverified',
    "verification_note" TEXT,
    "assigned_to" TEXT,
    "resolution_note" TEXT,
    "after_photo" TEXT,
    "citizen_satisfaction" INTEGER,
    "community_verification_score" INTEGER,
    "reopened_count" INTEGER NOT NULL DEFAULT 0,
    "trust_points" INTEGER NOT NULL DEFAULT 0,
    "date_reported" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_resolved" DATETIME,
    "date_closed" DATETIME,
    "escalated_at" DATETIME,
    "acked_at" DATETIME,
    "verified_at" DATETIME,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "Complaint_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("email") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaint_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL DEFAULT 'system',
    "message" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplaintEvent_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("complaint_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipient" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "complaint_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("complaint_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL DEFAULT '{}',
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_ward_idx" ON "Complaint"("ward");

-- CreateIndex
CREATE INDEX "Complaint_created_by_idx" ON "Complaint"("created_by");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "ComplaintEvent_complaint_id_idx" ON "ComplaintEvent"("complaint_id");

-- CreateIndex
CREATE INDEX "ComplaintEvent_createdAt_idx" ON "ComplaintEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipient_read_idx" ON "Notification"("recipient", "read");

-- CreateIndex
CREATE INDEX "Notification_recipient_createdAt_idx" ON "Notification"("recipient", "createdAt");
