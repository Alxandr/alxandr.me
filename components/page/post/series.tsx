import Link from 'next/link';
import { PropsForTag } from '@components/utils';

export type PostMeta = {
  readonly title: string;
  readonly path: string;
};

interface Props extends PropsForTag<'section', false> {
  readonly posts: null | readonly PostMeta[];
  readonly current: string;
}

export const SeriesInfo = ({ posts, current, ...rest }: Props) => {
  if (posts === null) return null;

  const postNodes = posts.map((p) => (
    <li key={p.path}>
      <Link href="/[year]/[month]/[day]/[slug]" as={`/${p.path}`}>
        <a href={`/${p.path}`}>{p.title}</a>
      </Link>
      {current !== p.path ? null : ' (this one)'}
    </li>
  ));

  return (
    <section {...rest}>
      <h4>Posts in series</h4>
      <ul>{postNodes}</ul>
    </section>
  );
};
