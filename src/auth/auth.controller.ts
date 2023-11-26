import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  handleRegister(@Body() registerBody: RegisterAuthDto) {
    try {
      //console.log(registerBody);
      return this.authService.register(registerBody);
    } catch (error) {
      console.log('Error en Registar usuario', error);
    }
  }

  @Post('login')
  handleLogin(@Body() loginBody: LoginAuthDto) {
    try {
      // Verifica que loginBody contenga una propiedad 'email'
      if (!loginBody.email) {
        throw new HttpException('EMAIL_NOT_PROVIDED', 400);
      }
      const result = this.authService.login(loginBody);
      return result;
    } catch (error) {
      return { statusCode: error.status || 500, message: error.message };
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async callback(@Req() req, @Res() res) {
    try {
      console.log('User data from Google:', req.user);
      const jwt = await this.authService.loginWithGoogle(req.user.token);

      // Logs adicionales para depuración
      console.log('User data from Google:', req.user);
      console.log('JWT Token:', jwt.token);

      res.set('authorization', jwt.token);
      res.status(200);
      return res.json(req.user);
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ statusCode: error.status || 500, message: error.message });
    }
  }
}
