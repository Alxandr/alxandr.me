import { findDrafts, postsDirectory } from '../lib/blog';

import { promises as fs } from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

const main = async () => {
  const drafts = await findDrafts();
  for (const draft of drafts) {
    const webPath = draft.releaseWebPath;
    if (!webPath) continue;

    const newPath = path.resolve(postsDirectory, webPath + '.md');
    console.log(`moving '${draft.relPath}' => '${webPath}'`);
    await mkdirp(path.dirname(newPath));
    await fs.rename(draft.fullPath, newPath);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
