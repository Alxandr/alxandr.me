import { AbstractPostFile, findPost, findPosts } from './blog/fs';
import { Post, PostCollection, Series, SeriesCollection, Tag, TagCollection } from './blog/collection';

import { SeriesMeta } from './blog/series';
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

export const getBlog = async () => {
  const allFiles = await findPosts();
  const allPosts = await Promise.all(allFiles.map(readPost));

  return new Blog(allPosts);
};

export const getPost = async (year: string, month: string, day: string, slug: string) => {
  const file = await findPost(year, month, day, slug);
  const blog = await getBlog();
  let post = null;
  for (const p of blog) {
    if (p.webPath === file.webPath) {
      post = p;
      break;
    }
  }

  return { blog, post: post! };
};

const readPost = async (file: AbstractPostFile): Promise<Post> => {
  const content = await file.read();
  const meta = readPostMeta(content, file.webPath);

  return new Post(file, meta.meta, meta.content);
};

export class Blog extends PostCollection {
  private readonly _tags: TagCollection;
  private readonly _series: SeriesCollection;

  constructor(posts: readonly Post[]) {
    const sortedPosts = _.orderBy(posts, (post) => post.date, 'desc');
    const seriesBuilder = new Map<string, Post[]>();
    const series = new Map<string, SeriesMeta>();
    const tagsBuilder = new Map<string, Post[]>();
    const tags = new Map<string, TagMeta>();

    for (const post of sortedPosts) {
      if (post.series) {
        append(seriesBuilder, post.series.id, post);
        series.set(post.series.id, post.series);
      }

      for (const tag of post.tags) {
        append(tagsBuilder, tag.id, post);
        tags.set(tag.id, tag);
      }
    }

    super(sortedPosts);
    this._series = new SeriesCollection(
      [...series.values()].map((meta) => new Series(meta, PostCollection.from(seriesBuilder.get(meta.id)!))),
    );
    this._tags = new TagCollection(
      [...tags.values()].map((meta) => new Tag(meta, PostCollection.from(tagsBuilder.get(meta.id)!))),
    );
  }

  get tags(): TagCollection {
    return this._tags;
  }

  get series(): SeriesCollection {
    return this._series;
  }
}
