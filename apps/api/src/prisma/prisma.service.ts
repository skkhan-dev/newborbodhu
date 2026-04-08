import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    const closeApp = async () => {
      await app.close();
    };

    process.once("beforeExit", closeApp);
    process.once("SIGINT", closeApp);
    process.once("SIGTERM", closeApp);
  }
}
