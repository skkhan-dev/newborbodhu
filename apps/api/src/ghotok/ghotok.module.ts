import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { GhotokController } from "./ghotok.controller";
import { GhotokService } from "./ghotok.service";
import { PublicGhotokController } from "./public-ghotok.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GhotokController, PublicGhotokController],
  providers: [GhotokService],
  exports: [GhotokService],
})
export class GhotokModule {}
