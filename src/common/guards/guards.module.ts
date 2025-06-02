import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/users.schema';
import { UserRepository } from 'src/database/repository/user.repository';

@Global() // Đánh dấu module là global
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // Cung cấp schema cho UserRepository
  ],
  providers: [
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    },
  ],
  exports: [
    'UserRepositoryInterface',
  ], // Xuất ApiKeyGuard để các module khác sử dụng
})
export class GuardsModule {}
