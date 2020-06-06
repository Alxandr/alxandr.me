import { AsyncApiHandler, createNowCompleteHandler } from 'netlify-cms-oauth-provider-node';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

const { ORIGIN } = process.env;

const authHandler = (() => {
  let handler: AsyncApiHandler;

  return (req: NextApiRequest, res: NextApiResponse) => {
    if (!handler) handler = createNowCompleteHandler({}, { useEnv: true });

    return handler(req, res);
  };
})();

const handler: NextApiHandler = async (req, res) => {
  if (!ORIGIN /* || origin != host */) {
    res.status(421).json({ error: 'this environment cannot handle authorization requests' });
    return;
  }

  await authHandler(req, res);
};

export default handler;
