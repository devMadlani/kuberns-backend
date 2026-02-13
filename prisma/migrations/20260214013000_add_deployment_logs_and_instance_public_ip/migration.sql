ALTER TABLE "Instance" ADD COLUMN "publicIp" TEXT;

CREATE TABLE "DeploymentLog" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeploymentLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeploymentLog_deploymentId_idx" ON "DeploymentLog"("deploymentId");

ALTER TABLE "DeploymentLog"
ADD CONSTRAINT "DeploymentLog_deploymentId_fkey"
FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
