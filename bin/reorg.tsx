import { getPosts, postsDirectory } from '../server/blog';
import { postWebPath, slugify } from '../server/blog/fs';

import { promises as fs } from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';

const main = async () => {
  const posts = await getPosts();
  for (const post of posts) {
    const webPath = postWebPath(post.date, slugify(post.title));
    if (webPath + '.md' === post.relPath) continue;

    const newPath = path.resolve(postsDirectory, webPath + '.md');
    console.log(`moving '${post.relPath}' => '${webPath}.md'`);
    await mkdirp(path.dirname(newPath));
    await fs.rename(post.fullPath, newPath);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
