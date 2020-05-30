import { AbstractPostFile, slugify } from './fs';
import { PostMeta, ProcessResult, process } from './process';

import { DateTime } from 'luxon';
import { ReactNode } from 'react';
import { SeriesMeta } from './series';
import { TagMeta } from './tags';
import _ from 'lodash';

export class Post {
  private readonly _meta: PostMeta;
  private readonly _file: AbstractPostFile;
  private _processed: Promise<ProcessResult> | string;

  constructor(file: AbstractPostFile, meta: PostMeta, content: string) {
    this._file = file;
    this._meta = meta;
    this._processed = content;
  }

  get fullPath(): string {
    return this._file.fullPath;
  }

  get relPath(): string {
    return this._file.relPath;
  }

  get webPath(): string {
    return this._file.webPath;
  }

  get title(): string {
    return this._meta.title;
  }

  get date(): DateTime {
    return this._meta.date;
  }

  get tags(): readonly TagMeta[] {
    return this._meta.tags;
  }

  get series(): SeriesMeta | null {
    return this._meta.series;
  }

  get commentsIssue(): number | null {
    return this._meta.commentsIssue;
  }

  private get processed(): Promise<ProcessResult> {
    if (typeof this._processed === 'string') {
      this._processed = process(this._processed);
    }

    return this._processed;
  }

  get excerptLong(): Promise<string> {
    return this.processed.then((p) => p.excerptLong);
  }

  get excerptShort(): Promise<string> {
    return this.processed.then((p) => p.excerptShort);
  }

  get content(): Promise<string> {
    return this.processed.then((p) => p.content);
  }
}

const perPage = 10;

export class PostCollection implements Iterable<Post> {
  private readonly _posts: readonly Post[];

  constructor(posts: readonly Post[] | PostCollection) {
    this._posts = Array.isArray(posts) ? posts : (posts as PostCollection)._posts;
  }

  [Symbol.iterator](): Iterator<Post> {
    return this._posts[Symbol.iterator]();
  }

  static from(posts: readonly Post[]): PostCollection {
    return new PostCollection(posts);
  }

  get pages(): number {
    return Math.max(1, Math.ceil(this._posts.length / perPage));
  }

  page(n: number): readonly Post[] {
    const pages = this.pages;
    if (n < 0) throw new Error(`n < 0`);
    if (n >= pages) throw new Error(`n >= ${pages}`);

    const start = n * perPage;
    const end = Math.min(start + perPage, this._posts.length);
    return this._posts.slice(start, end);
  }
}

export class Tag extends PostCollection {
  private readonly _meta: TagMeta;

  constructor(meta: TagMeta, posts: PostCollection) {
    super(posts);

    this._meta = meta;
  }

  get name(): string {
    return this._meta.name;
  }

  get slug(): string {
    return this._meta.slug;
  }

  get webPath(): string {
    return this._meta.webPath;
  }
}

export class TagCollection implements Iterable<Tag> {
  private readonly _tags: readonly Tag[];

  constructor(tags: readonly Tag[]) {
    this._tags = tags;
  }

  [Symbol.iterator](): Iterator<Tag> {
    return this._tags[Symbol.iterator]();
  }

  byName(name: string): Tag | null {
    return this._tags.find((tag) => tag.name === name) ?? null;
  }

  bySlug(slug: string): Tag | null {
    return this._tags.find((tag) => tag.slug === slug) ?? null;
  }
}

export class Series extends PostCollection {
  private readonly _meta: SeriesMeta;

  constructor(meta: SeriesMeta, posts: PostCollection) {
    super(posts);

    this._meta = meta;
  }

  get name(): string {
    return this._meta.name;
  }

  get slug(): string {
    return this._meta.slug;
  }

  get webPath(): string {
    return this._meta.webPath;
  }
}

export class SeriesCollection implements Iterable<Series> {
  private readonly _series: readonly Series[];

  constructor(series: readonly Series[]) {
    this._series = series;
  }

  [Symbol.iterator](): Iterator<Series> {
    return this._series[Symbol.iterator]();
  }

  byName(name: string): Series | null {
    return this._series.find((tag) => tag.name === name) ?? null;
  }

  bySlug(slug: string): Series | null {
    return this._series.find((tag) => tag.slug === slug) ?? null;
  }
}
