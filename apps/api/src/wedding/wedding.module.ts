import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { WeddingController } from "./wedding.controller";
import { WeddingService } from "./wedding.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WeddingController],
  providers: [WeddingService],
})
export class WeddingModule {}
