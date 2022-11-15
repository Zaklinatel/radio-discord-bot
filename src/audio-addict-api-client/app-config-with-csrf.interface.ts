import { IAppConfig } from './app-config.interface';

export interface IAppConfigWithCsrf {
	appConfig: IAppConfig;
	csrfToken: string;
}
