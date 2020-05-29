import { DateTime } from 'luxon';
import { TagMeta } from './tags';
import downgradeHeaders from './downgrade-headers';
import extractText from './extract-text';
import footnotes from 'remark-footnotes';
import frontMatter from 'gray-matter';
import markdown from 'remark-parse';
import prismHighlight from '@mapbox/rehype-prism';
import { prune } from './prune';
import rehype2html from 'rehype-stringify';
import remark2rehype from 'remark-rehype';
import unified from 'unified';

const processor = unified()
  .use(markdown)
  .use(footnotes)
  .use(extractText)
  .use(remark2rehype)
  .use(downgradeHeaders)
  .use(prismHighlight)
  .use(rehype2html)
  .freeze();

export const process = async (text: string) => {
  const result = await processor.process(text);
  const content = result.contents as string;
  const outputText: string = (result.data as any).text;
  const excerptLong = prune(outputText, 550);
  const excerptShort = prune(outputText, 250);

  return { content, excerptLong, excerptShort } as ProcessResult;
};

export type ProcessResult = {
  readonly content: string;
  readonly excerptLong: string;
  readonly excerptShort: string;
};

export const readPostMeta = (text: string, file: string) => {
  const parsed = frontMatter(text);
  return {
    meta: PostMeta.create(parsed.data, file),
    content: parsed.content,
  };
};

type Meta = {
  readonly title: string;
  readonly subTitle: string | null;
  readonly date: DateTime;
  readonly tags: readonly TagMeta[];
  readonly series: string | null;
  readonly issue: number | null;
};

export class PostMeta {
  private readonly _data: Meta;

  private constructor(data: Meta) {
    this._data = data;
  }

  get title(): string {
    return this._data.title;
  }

  get date(): DateTime {
    return this._data.date;
  }

  get tags(): readonly TagMeta[] {
    return this._data.tags;
  }

  get series(): string | null {
    return this._data.series;
  }

  get commentsIssue(): number | null {
    return this._data.issue;
  }

  static create(data: any, file: string): PostMeta {
    const requiredString = (name: string, value: unknown) => {
      if (typeof value !== 'string' || value.length === 0) throw new Error(`${name} is required in file ${file}`);
      return value;
    };

    const requiredDate = (name: string, value: unknown) => {
      if (typeof value !== 'string' || value.length === 0) throw new Error(`${name} is required in file ${file}`);
      const date = DateTime.fromISO(value, { zone: 'utc', locale: 'en-US' });
      const { invalidExplanation } = date;
      if (invalidExplanation) throw new Error(`Bad date in ${name}: ${invalidExplanation} file ${file}`);
      return date;
    };

    const optionalNumber = (name: string, value: unknown) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10);
      if (!value) return null;

      throw new Error(`Invalid ${value}: ${name} file ${file}`);
    };

    const optionalString = (name: string, value: unknown) => {
      if (typeof value === 'string' && value.length > 0) return value;
      if (!value) return null;

      throw new Error(`Invalid ${value}: ${name} file ${file}`);
    };

    const optionalStringArray = (name: string, value: unknown) => {
      if (typeof value === 'string' && value.length > 0) return [value];
      if (!value) return [];
      if (Array.isArray(value)) return value as string[];

      throw new Error(`Invalid ${value}: ${name} file ${file}`);
    };

    const title = requiredString('title', data.title);
    const subTitle = optionalString('subTitle', data.subTitle);
    const date = requiredDate('date', data.date);
    const tags = optionalStringArray('tags', data.tags).map(TagMeta.create);
    const series = optionalString('series', data.series);
    const issue = optionalNumber('issue', data.issue);

    return new PostMeta({ title, subTitle, date, tags, series, issue });
  }
}
