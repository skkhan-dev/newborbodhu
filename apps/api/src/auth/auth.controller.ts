import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterMemberDto } from "./dto/register-member.dto";
import { RegisterVendorDto } from "./dto/register-vendor.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { SocialLoginDto } from "./dto/social-login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register/member")
  registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Post("register/vendor")
  registerVendor(@Body() dto: RegisterVendorDto) {
    return this.authService.registerVendor(dto);
  }

  @Get("verify-email")
  verifyEmailByToken(@Query("token") token: string) {
    return this.authService.verifyEmailByToken(token);
  }

  @Post("resend-verification")
  @UseGuards(AuthGuard)
  resendVerificationLink(@CurrentActor("userId") userId: string) {
    return this.authService.resendVerificationLink(userId);
  }

  @Post("verify-email")
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("social-login")
  socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto);
  }

  @Post("password-reset/request")
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post("password-reset/confirm")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  getMe(@CurrentActor("userId") userId: string) {
    return this.authService.getMe(userId);
  }
}
