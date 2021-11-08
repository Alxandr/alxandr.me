import { DateTime } from 'luxon';
import { F_OK } from 'constants';
import _slugify from 'slugify';
import { promises as fs } from 'fs';
import path from 'path';

const segmentsRegex = /^(\d{4})-(\d{2})-(\d{2})-(.*)\.md$/;
export const postsDirectory = path.resolve(process.cwd(), 'posts');

export const postWebPath = (date: DateTime, slug: string) => `${date.toFormat('yyyy/MM/dd')}/${slug}`;

export const findPosts = async (includeDrafts: boolean) => {
  const ret: PostFile[] = [];
  const files = await fs.readdir(postsDirectory);
  for (const file of files) {
    const fullPath = path.resolve(postsDirectory, file);
    const segments = segmentsRegex.exec(file);
    if (!segments) throw new Error(`File ${file} does not match regex ${segmentsRegex}`);

    const year = parseInt(segments[1], 10);
    const month = parseInt(segments[2], 10);
    const day = parseInt(segments[3], 10);
    const date = DateTime.fromObject({ year, month, day }, { locale: 'en-US' });
    if (date.invalidExplanation) throw new Error(`Invalid date: ${date.invalidExplanation}`);

    const slug = segments[4];
    const webPath = postWebPath(date, slug);

    ret.push(new PostFile(fullPath, webPath, date));
  }

  // if (includeDrafts) {
  //   const now = new Date();
  //   const today = DateTime.fromObject({
  //     year: now.getFullYear(),
  //     month: now.getMonth() + 1,
  //     day: now.getDate(),
  //   });
  //   const drafts = await findDrafts();
  //   for (const draft of drafts) {
  //     const date = draft.date ?? today;
  //     const webPath = postWebPath(date, draft.slug);

  //     ret.push(new PostFile(draft.fullPath, webPath, date, true));
  //   }
  // }

  return ret;
};

export const findPost = async (year: string, month: string, day: string, slug: string, includeDrafts: boolean) => {
  const expected = path.resolve(postsDirectory, `${year}-${month}-${day}-${slug}.md`);
  try {
    await fs.access(expected, F_OK);
    const date = DateTime.fromObject(
      {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        day: parseInt(day, 10),
      },
      {
        locale: 'en-US',
      },
    );
    return new PostFile(expected, postWebPath(date, slug), date);
  } catch (e) {
    // if (includeDrafts) {
    //   const draft = await findDraftPost(slug);
    //   if (draft) {
    //     const date =
    //       draft.date ??
    //       DateTime.fromObject({
    //         year: new Date().getFullYear(),
    //         month: new Date().getMonth() + 1,
    //         day: new Date().getDate(),
    //       });
    //     return new PostFile(draft.fullPath, postWebPath(date, draft.slug), date);
    //   }
    // }
    throw new Error(`File: ${expected} does not exist`);
  }
};

// const findDraftPost = async (slug: string) => {
//   const drafts = await findDrafts();
//   return drafts.find((d) => d.slug === slug);
// };

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

  abstract get isDraft(): boolean;

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
  private readonly _draft: boolean;

  constructor(fullPath: string, webPath: string, date: DateTime, isDraft: boolean = false) {
    super(fullPath, webPath);

    this._date = date;
    this._draft = isDraft;
  }

  get date(): DateTime {
    return this._date;
  }

  get isDraft(): boolean {
    return this._draft;
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

// export const findDrafts = async () => {
//   const ret: PostDraftFile[] = [];
//   const files = await glob('*.md', { cwd: draftsDirectory });
//   for (const file of files) {
//     const fullPath = path.resolve(draftsDirectory, file);
//     const content = await fs.readFile(fullPath, 'utf-8');
//     const parsed = frontMatter(content);
//     const date = parsed.data.date ? DateTime.fromISO(parsed.data.date, { locale: 'en-US' }) : null;
//     if (date && date.invalidExplanation) throw new Error(`Failed to parse date: ${date.invalidExplanation}`);

//     const slug = slugify(parsed.data.title);

//     ret.push(new PostDraftFile(fullPath, `drafts/${slug}`, slug, date));
//   }

//   return ret;
// };

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
