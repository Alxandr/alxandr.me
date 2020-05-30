import { slugify } from './fs';

type Meta = {
  readonly name: string;
  readonly slug: string;
};

export class SeriesMeta {
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
    return `series/${this._data.slug}`;
  }

  static create(name: string): SeriesMeta {
    const slug = slugify(name);

    return new SeriesMeta({ name, slug });
  }
}
