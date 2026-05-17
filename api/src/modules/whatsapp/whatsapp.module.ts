import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule } from '../clients/clients.module';
import { ProjectsModule } from '../projects/projects.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WHATSAPP_PROVIDER, WhatsappProvider } from './providers/whatsapp-provider';
import { MetaWhatsappProvider } from './providers/meta-whatsapp.provider';
import { ConsoleWhatsappProvider } from './providers/console-whatsapp.provider';

/**
 * Provider selection: Meta when credentials are present, Console otherwise.
 * Log the choice at boot so it's obvious what's wired.
 */
const providerFactory = {
  provide: WHATSAPP_PROVIDER,
  useFactory: (config: ConfigService): WhatsappProvider => {
    const hasMeta =
      !!config.get<string>('WHATSAPP_ACCESS_TOKEN') &&
      !!config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const provider = hasMeta
      ? new MetaWhatsappProvider(config)
      : new ConsoleWhatsappProvider();
    new Logger('WhatsappModule').log(`Using WhatsApp provider: ${provider.name}`);
    return provider;
  },
  inject: [ConfigService],
};

@Module({
  imports: [ClientsModule, ProjectsModule, BudgetsModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, providerFactory],
})
export class WhatsappModule {}
