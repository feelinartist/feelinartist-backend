import { Module } from '@nestjs/common';
import { PublicConfigController } from './public-config.controller';
import { CatalogsController } from './catalogs.controller';

@Module({
    controllers: [PublicConfigController, CatalogsController],
})
export class PublicConfigModule { }
