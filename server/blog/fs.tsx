import { DateTime } from 'luxon';
import { F_OK } from 'constants';
import _slugify from 'slugify';
import frontMatter from 'gray-matter';
import { promises as fs } from 'fs';
import glob from 'globby';
import path from 'path';

const segmentsRegex = /^(\d{4})\/(\d{2})\/(\d{2})\/(.*)\.md$/;
export const postsDirectory = path.resolve(process.cwd(), 'posts');
export const draftsDirectory = path.resolve(postsDirectory, 'drafts');

export const postWebPath = (date: DateTime, slug: string) => `${date.toFormat('yyyy/MM/dd')}/${slug}`;

export const findPosts = async () => {
  const ret: PostFile[] = [];
  const files = await glob('*/*/*/*.md', { cwd: postsDirectory });
  for (const file of files) {
    const fullPath = path.resolve(postsDirectory, file);
    const segments = segmentsRegex.exec(file);
    if (!segments) throw new Error(`File ${file} does not match regex ${segmentsRegex}`);

    const year = parseInt(segments[1], 10);
    const month = parseInt(segments[2], 10);
    const day = parseInt(segments[3], 10);
    const date = DateTime.fromObject({ year, month, day, locale: 'en-US' });
    if (date.invalidExplanation) throw new Error(`Invalid date: ${date.invalidExplanation}`);

    const slug = segments[4];
    const webPath = postWebPath(date, slug);

    ret.push(new PostFile(fullPath, webPath, date));
  }

  return ret;
};

export const findPost = async (year: string, month: string, day: string, slug: string) => {
  const expected = path.resolve(postsDirectory, year, month, day, slug + '.md');
  try {
    await fs.access(expected, F_OK);
    const date = DateTime.fromObject({
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      locale: 'en-US',
    });
    return new PostFile(expected, postWebPath(date, slug), date);
  } catch (e) {
    throw new Error(`File: ${expected} does not exist`);
  }
};

export abstract class AbstractPostFile {
  private readonly _fullPath: string;
  // without leading slash
  private readonly _webPath: string;

  constructor(file: string, path: string) {
    this._fullPath = file;
    this._webPath = path;
  }

  get fullPath(): string {
    return this._fullPath;
  }

  get relPath(): string {
    return path.relative(postsDirectory, this._fullPath);
  }

  get webPath(): string {
    return this._webPath;
  }

  read(): Promise<string> {
    return fs.readFile(this.fullPath, 'utf-8');
  }
}

export interface IPostFile {
  readonly file: string;
  readonly isDraft: boolean;
}

class PostFile extends AbstractPostFile {
  private readonly _date: DateTime;

  constructor(fullPath: string, webPath: string, date: DateTime) {
    super(fullPath, webPath);

    this._date = date;
  }

  get date(): DateTime {
    return this._date;
  }

  get isDraft(): boolean {
    return false;
  }
}

export const slugify = (() => {
  let configured = false;

  return (text: string) => {
    if (!configured) {
      _slugify.extend({ '#': 'sharp' });
      configured = true;
    }

    const slug = _slugify(text, { lower: true, remove: /[*+~.,()'"!:@]/g });
    //console.log({ text, slug });
    return slug;
  };
})();

export const findDrafts = async () => {
  const ret: PostDraftFile[] = [];
  const files = await glob('*.md', { cwd: draftsDirectory });
  for (const file of files) {
    const fullPath = path.resolve(draftsDirectory, file);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = frontMatter(content);
    const date = parsed.data.date ? DateTime.fromISO(parsed.data.date, { locale: 'en-US' }) : null;
    if (date && date.invalidExplanation) throw new Error(`Failed to parse date: ${date.invalidExplanation}`);

    const slug = slugify(parsed.data.title);

    ret.push(new PostDraftFile(fullPath, `drafts/${slug}`, slug, date));
  }

  return ret;
};

class PostDraftFile extends AbstractPostFile {
  private readonly _slug: string;
  private readonly _date: DateTime | null;

  constructor(file: string, path: string, slug: string, date: DateTime | null) {
    super(file, path);

    this._slug = slug;
    this._date = date;
  }

  get slug(): string {
    return this._slug;
  }

  get date(): DateTime | null {
    return this._date;
  }

  get isDraft(): boolean {
    return true;
  }

  get releaseWebPath(): string | null {
    const { slug, date } = this;
    if (date === null) return null;

    return postWebPath(date, slug);
  }
}
