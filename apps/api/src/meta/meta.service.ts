import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import {
  COMMERCIAL_SETTINGS_KEY,
  normalizeCommercialSettings,
  toPublicCommercialConfig,
} from "../config/commercial-settings";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MetaService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicConfig() {
    const settings = await this.prisma.platformSetting.findUnique({
      where: {
        key: COMMERCIAL_SETTINGS_KEY,
      },
      select: {
        valueJson: true,
      },
    });

    return toPublicCommercialConfig(
      normalizeCommercialSettings(
        (settings?.valueJson as Prisma.JsonObject | null | undefined) ?? null,
      ),
    );
  }
}
