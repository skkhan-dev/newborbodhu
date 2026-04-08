import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AnalyticsService } from "./analytics.service";
import { GetAnalyticsSummaryDto } from "./dto/get-analytics-summary.dto";
import { TrackProductEventDto } from "./dto/track-product-event.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("events")
  trackEvent(
    @Headers("authorization") authorization: string | undefined,
    @Body() dto: TrackProductEventDto,
  ) {
    return this.analyticsService.trackEvent(authorization, dto);
  }

  @Get("summary")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.SUPER_ADMIN)
  getSummary(@Query() query: GetAnalyticsSummaryDto) {
    return this.analyticsService.getSummary(query.days);
  }
}
