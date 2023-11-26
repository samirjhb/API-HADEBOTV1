import { HttpException, Injectable } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { hash, compare } from 'bcrypt';
import { AuthDocument, Auth } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
//import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name)
    private readonly authModel: Model<AuthDocument>,
    private jwtService: JwtService,
  ) {}

  //Register
  async register(userObject: RegisterAuthDto) {
    const { password } = userObject;
    const plainToHash = await hash(password, 10);
    userObject = { ...userObject, password: plainToHash };
    return this.authModel.create(userObject);
  }

  //Login
  // async login(userObjectLogin: LoginAuthDto) {
  //   const { email, password } = userObjectLogin; //http
  //   const findUser = await this.authModel.findOne({ email });
  //   if (!findUser) throw new HttpException('USER_NOT_FOUND', 404);

  //   const checkPassword = await compare(password, findUser.password);
  //   if (!checkPassword) throw new HttpException('PASSWORD_INCORRECT', 403);

  //   const payload = { id: findUser._id, name: findUser.name };
  //   const token = this.jwtService.sign(payload);

  //   const data = {
  //     user: findUser,
  //     token,
  //   };

  //   return data;
  // }

  async login(userObjectLogin: LoginAuthDto) {
    try {
      const { email, password } = userObjectLogin;

      // Verificar si se proporciona una dirección de correo electrónico y una contraseña
      if (!email || !password) {
        throw new HttpException('EMAIL_AND_PASSWORD_REQUIRED', 400);
      }

      // Buscar el usuario en la base de datos
      const findUser = await this.authModel.findOne({ email });

      // Verificar si se encontró el usuario y la contraseña es correcta
      if (!findUser || !(await compare(password, findUser.password))) {
        throw new HttpException('USER_NOT_FOUND_OR_INCORRECT_PASSWORD', 404);
      }

      // Generar token JWT
      const payload = { id: findUser._id, name: findUser.name };
      const token = this.jwtService.sign(payload);

      const data = {
        user: findUser,
        token,
      };

      return data;
    } catch (error) {
      throw new HttpException(
        `AUTH_ERROR: ${error.message}`,
        error.status || 500,
      );
    }
  }

  async loginWithGoogle(googleAccessToken: any) {
    try {
      // Verificar el token de acceso de Google
      const googleUser = await this.verifyGoogleAccessToken(googleAccessToken);

      // Buscar el usuario en la base de datos por la dirección de correo electrónico
      const findUser = await this.authModel.findOne({
        email: googleUser.email,
      });

      // Generar token JWT para el usuario encontrado
      const payload = { id: findUser._id, name: findUser.name };
      const token = this.jwtService.sign(payload);

      const data = {
        user: findUser,
        token,
      };

      return data;
    } catch (error) {
      throw new HttpException(
        `GOOGLE_AUTH_ERROR: ${error.message}`,
        error.status || 500,
      );
    }
  }
  // async verifyGoogleAccessToken(accessToken: string) {
  //   const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  //   try {
  //     const client = new OAuth2Client(CLIENT_ID);
  //     console.log('Token:', typeof accessToken);
  //     const ticket = await client.verifyIdToken({
  //       idToken: accessToken,
  //       audience: CLIENT_ID,
  //     });

  //     console.log('client', client);

  //     const payload = ticket.getPayload();
  //     if (!payload) {
  //       throw new Error('Invalid token payload');
  //     }

  //     return {
  //       email: payload.email,
  //       name: payload.name,
  //     };
  //   } catch (error) {
  //     throw new Error(`Failed to verify Google access token: ${error.message}`);
  //   }
  // }

  async verifyGoogleAccessToken(accessToken: string) {
    console.log('Verifying Token:', accessToken);

    try {
      const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

      // Verificar el token utilizando jsonwebtoken
      const decodedToken = jwt.verify(accessToken, CLIENT_ID, {
        algorithms: ['HS256'],
      }) as { email?: string; name?: string } | string;

      // Asegurarse de que el token tenga el formato esperado
      if (typeof decodedToken === 'string') {
        throw new Error('Invalid token format');
      }

      // Asegurarse de que el token tenga la información esperada
      if (!decodedToken.email || !decodedToken.name) {
        throw new Error('Invalid token payload');
      }

      return {
        email: decodedToken.email,
        name: decodedToken.name,
      };
    } catch (error) {
      console.error('Error during token verification:', error.message);
      throw new Error(`Failed to verify Google access token: ${error.message}`);
    }
  }
}
