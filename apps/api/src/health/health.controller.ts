import { Controller, Get } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth() {
    let database = "unknown";

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "error";
    }

    return {
      status: "ok",
      database,
      service: "borbodhu-api",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
    };
  }
}
