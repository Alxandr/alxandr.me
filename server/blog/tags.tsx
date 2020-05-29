import { PostCollection } from './collection';
import { slugify } from './fs';

type Meta = {
  readonly name: string;
  // readonly subTitle: string | null;
  readonly slug: string;
};

export class TagMeta {
  private readonly _data: Meta;

  private constructor(data: Meta) {
    this._data = data;
  }

  get id(): string {
    return this._data.slug;
  }

  get slug(): string {
    return this._data.slug;
  }

  get name(): string {
    return this._data.name;
  }

  get webPath(): string {
    return `tag/${this._data.slug}`;
  }

  static create(name: string): TagMeta {
    const slug = slugify(name);

    return new TagMeta({ name, slug });
  }
}
