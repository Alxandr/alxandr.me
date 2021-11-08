import { DateTime } from 'luxon';
import { SeriesMeta } from './series';
import { TagMeta } from './tags';
import downgradeHeaders from './downgrade-headers';
import extractText from './extract-text';
import footnotes from 'remark-footnotes';
import frontMatter from 'gray-matter';
import highlight from '../highlighting/highlight';
import markdown from 'remark-parse';
//import prismHighlight from '@mapbox/rehype-prism';
import { prune } from './prune';
import rehype2html from 'rehype-stringify';
import remark2rehype from 'remark-rehype';
import { unified } from 'unified';

const processor = unified()
  .use(markdown)
  .use(footnotes)
  .use(extractText)
  .use(remark2rehype)
  .use(downgradeHeaders)
  .use(highlight)
  .use(rehype2html)
  .freeze();

export const process = async (text: string) => {
  const result = await processor.process(text);
  const content = result.value as string;
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

export const readPostMeta = (text: string, file: string, draft: boolean) => {
  const parsed = frontMatter(text);
  return {
    meta: PostMeta.create(parsed.data, file, draft),
    content: parsed.content,
  };
};

type Meta = {
  readonly title: string;
  readonly subTitle: string | null;
  readonly date: DateTime;
  readonly tags: readonly TagMeta[];
  readonly series: SeriesMeta | null;
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

  get series(): SeriesMeta | null {
    return this._data.series;
  }

  get commentsIssue(): number | null {
    return this._data.issue;
  }

  static create(data: any, file: string, draft: boolean): PostMeta {
    const today = () => {
      const now = new Date();
      return DateTime.fromObject({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      });
    };

    const requiredString = (name: string, value: unknown) => {
      if (typeof value !== 'string' || value.length === 0) throw new Error(`${name} is required in file ${file}`);
      return value;
    };

    const requiredDate = (name: string, value: unknown, draft: boolean) => {
      if (!value && draft) return today();
      if (value instanceof Date) value = value.toISOString();
      if (typeof value !== 'string' || value.length === 0)
        throw new Error(`${name} is required in file ${file}, got ${value}`);
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
    const date = requiredDate('date', data.date, draft);
    const tags = optionalStringArray('tags', data.tags).map(TagMeta.create);
    const seriesName = optionalString('series', data.series);
    const issue = optionalNumber('issue', data.issue);

    const series = seriesName === null ? null : SeriesMeta.create(seriesName);

    return new PostMeta({ title, subTitle, date, tags, series, issue });
  }
}
