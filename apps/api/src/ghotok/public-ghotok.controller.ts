import { Controller, Get, Param, Query } from "@nestjs/common";

import { GhotokService } from "./ghotok.service";

@Controller("public/ghotoks")
export class PublicGhotokController {
  constructor(private readonly ghotokService: GhotokService) {}

  @Get()
  listPublicGhotoks(
    @Query("q") q?: string,
    @Query("gender") gender?: string,
  ) {
    return this.ghotokService.listPublicGhotoks({ q, gender });
  }

  @Get(":slug")
  getPublicGhotokBySlug(@Param("slug") slug: string) {
    return this.ghotokService.getPublicGhotokBySlug(slug);
  }
}
