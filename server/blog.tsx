import { AbstractPostFile, findPost, findPosts } from './blog/fs';
import { Post, PostCollection, Tag, TagCollection } from './blog/collection';

import { TagMeta } from './blog/tags';
import _ from 'lodash';
import { readPostMeta } from './blog/process';

export { findDrafts, postsDirectory } from './blog/fs';
export { Post, PostCollection } from './blog/collection';

const append = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  let list = map.get(key);
  if (!list) {
    list = [];
    map.set(key, list);
  }

  list.push(value);
};

const mapMap = <K, V, U>(map: Map<K, V>, mapper: (value: V) => U) => {
  const result = new Map<K, U>();
  for (const [key, value] of map.entries()) {
    result.set(key, mapper(value));
  }

  return result;
};

export const getPosts = async () => {
  const allFiles = await findPosts();
  const allPosts = await Promise.all(allFiles.map(readPost));

  return new Blog(allPosts);
};

export const getPost = async (year: string, month: string, day: string, slug: string) => {
  const file = await findPost(year, month, day, slug);
  return await readPost(file);
};

const readPost = async (file: AbstractPostFile): Promise<Post> => {
  const content = await file.read();
  const meta = readPostMeta(content, file.webPath);

  return new Post(file, meta.meta, meta.content);
};

class Blog extends PostCollection {
  private readonly _tags: TagCollection;
  private readonly _series: Map<string, PostCollection>;

  constructor(posts: readonly Post[]) {
    const sortedPosts = _.orderBy(posts, (post) => post.date, 'desc');
    const seriesBuilder = new Map<string, Post[]>();
    const tagsBuilder = new Map<string, Post[]>();
    const tags = new Map<string, TagMeta>();

    for (const post of sortedPosts) {
      if (post.series) {
        append(seriesBuilder, post.series, post);
      }

      for (const tag of post.tags) {
        append(tagsBuilder, tag.id, post);
        tags.set(tag.id, tag);
      }
    }

    super(sortedPosts);
    this._series = mapMap(seriesBuilder, PostCollection.from);
    this._tags = new TagCollection(
      [...tags.values()].map((meta) => new Tag(meta, PostCollection.from(tagsBuilder.get(meta.id)!))),
    );
  }

  get tags(): TagCollection {
    return this._tags;
  }
}
