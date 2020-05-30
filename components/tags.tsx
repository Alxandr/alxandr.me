import React, { ReactNode, memo, useMemo } from 'react';

import Link from 'next/link';
import { PropsForTag } from './utils';

interface TagMeta {
  readonly name: string;
  readonly path: string;
}

interface Props extends PropsForTag<'span', false> {
  readonly tags: readonly TagMeta[];
}

export const Tags = memo(function Tags({ tags, ...rest }: Props) {
  const tagNodes = useMemo(() => {
    const ret: ReactNode[] = [];
    let first = true;

    for (const tag of tags) {
      if (first) first = false;
      else ret.push(', ');

      ret.push(
        <Link key={tag.path} href="/tag/[tag]" as={`/${tag.path}`} scroll={false}>
          <a href={`/${tag.path}`}>{tag.name}</a>
        </Link>,
      );
    }

    return Object.freeze(ret);
  }, [tags]);

  return tagNodes.length === 0 ? null : <span {...rest}>{tagNodes}</span>;
});
