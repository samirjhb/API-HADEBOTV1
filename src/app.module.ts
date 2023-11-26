import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(), // variables de entorno
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_TEST), //Conection mongodb
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
