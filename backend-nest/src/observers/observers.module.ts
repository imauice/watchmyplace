import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ObserversController } from './observers.controller';
import { ObserversService } from './observers.service';
import { Observer, ObserverSchema } from './schemas/observer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Observer.name, schema: ObserverSchema },
    ]),
  ],
  controllers: [ObserversController],
  providers: [ObserversService],
  exports: [ObserversService, MongooseModule],
})
export class ObserversModule implements OnModuleInit {
  constructor(private readonly observersService: ObserversService) {}

  async onModuleInit() {
    await this.observersService.ensureDefaultObservers();
  }
}
