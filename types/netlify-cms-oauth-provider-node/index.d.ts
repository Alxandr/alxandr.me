declare module 'netlify-cms-oauth-provider-node' {
  import { IncomingMessage, ServerResponse } from 'http';

  export type Config = {
    /**
     * Required. The HTTP origin of the host of the netlify-cms admin panel using
     * this OAuth provider. Multiple origin domains can be provided as an array of
     * strings or a single comma-separated string. You can provide only the domain
     * part ('example.com') which implies any protocol on any port or you can
     * explicitly specify a protocol and/or port ('https://example.com' or
     * 'http://example.com:8080').
     */
    origin: string | string[];

    /**
     * Required. The URL (specified during the OAuth 2.0 authorization flow) that
     * the complete handler is hosted at.
     */
    completeUrl: string;

    /**
     * Required. The OAuth 2.0 Client ID received from the OAuth provider.
     */
    oauthClientID: string;

    /**
     * Required. The OAuth 2.0 Client secret received from the OAuth provider.
     */
    oauthClientSecret: string;

    /**
     * Default: `process.env.NODE_ENV === 'development'`. Enabled more verbose
     * errors in the generated HTML UI, etc.
     */
    dev?: boolean;

    /**
     * Default: ''. The URL of the admin panel to link the user back to in case
     * something goes horribly wrong.
     */
    adminPanelUrl?: string;

    /**
     * Default: 'github'. The Git service / OAuth provider to use.
     */
    oauthProvider?: string;

    /**
     * Default: ''. The OAuth 2.0 token host URI for the OAuth provider.
     * If not provided, this will be guessed based on the provider.
     */
    oauthTokenHost?: string;

    /**
     * Default: ''. The relative URI to the OAuth 2.0 token endpoint for the
     * OAuth provider. If not provided, this will be guessed based on the provider.
     */
    oauthTokenPath?: string;

    /**
     * Default: ''. The relative URI to the OAuth 2.0 authorization endpoint for
     * the OAuth provider. If not provided, this will be guessed based on the provider.
     */
    oauthAuthorizePath?: string;

    /**
     * Default: ''. The scopes to claim during the OAuth 2.0 authorization request
     * with the OAuth provider. If not provided, this will be guessed based on the
     * provider with the goal to ensure the user has read/write access to repositories.
     */
    oauthScopes?: string;
  };

  export type CreateConfigOptions = {
    /**
     * Default: false (for security and predictability). Set to true to load config from process.env.
     */
    useEnv?: boolean;

    /**
     * Default: false (for security and predictability). Set to true to load config from process.argv.
     */
    useArgs?: boolean;
  };

  type AuthFillConfig = { useEnv: true } | { useArgs: true };
  export type AsyncApiHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

  export const createBeginHandler: {
    (config: Config, options: CreateConfigOptions): BeginHandler;
    (config: Partial<Config>, options: CreateConfigOptions & AuthFillConfig): BeginHandler;
  };

  export const createCompleteHandler: {
    (config: Config, options: CreateConfigOptions): CompleteHandler;
    (config: Partial<Config>, options: CreateConfigOptions & AuthFillConfig): CompleteHandler;
  };

  export const createHandlers: {
    (config: Config, options: CreateConfigOptions): {
      readonly begin: BeginHandler;
      readonly complete: CompleteHandler;
    };
    (config: Partial<Config>, options: CreateConfigOptions & AuthFillConfig): {
      readonly begin: BeginHandler;
      readonly complete: CompleteHandler;
    };
  };

  export const createNowBeginHandler: {
    (config: Config, options: CreateConfigOptions): AsyncApiHandler;
    (config: Partial<Config>, options: CreateConfigOptions & AuthFillConfig): AsyncApiHandler;
  };

  export const createNowCompleteHandler: {
    (config: Config, options: CreateConfigOptions): AsyncApiHandler;
    (config: Partial<Config>, options: CreateConfigOptions & AuthFillConfig): AsyncApiHandler;
  };

  export const createNowHandlers: {
    (config: Config, options: CreateConfigOptions): {
      readonly begin: AsyncApiHandler;
      readonly complete: AsyncApiHandler;
    };
    (config: Partial<Config>, options: CreateConfigOptions & AuthFillConfig): {
      readonly begin: AsyncApiHandler;
      readonly complete: AsyncApiHandler;
    };
  };
}
