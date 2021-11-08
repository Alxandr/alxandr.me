import { Blog, PostCollection } from '@/lib/blog';

import { DateTime } from 'luxon';
import Link from 'next/link';
import { PageLayout } from '@/layout/page';
import { Tags } from '@/components/tags';
import classNames from 'classnames';
import styles from './post-list.module.css';
import { useMemo } from 'react';

type TagMeta = {
  readonly name: string;
  readonly path: string;
};

type SeriesMeta = {
  readonly name: string;
  readonly path: string;
};

type PostMeta = {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly path: string;
  readonly excerptLong: string;
  readonly excerptShort: string;
  readonly tags: TagMeta[];
  readonly series: SeriesMeta | null;
  readonly draft: boolean;
};

type PostListStaticProps = {
  page: number;
  totalPages: number;
  posts: PostMeta[];
};

const getStaticProps = async (
  posts: PostCollection,
  blog: Blog,
  listRootPath: string,
  pagePathParam: string | null,
): Promise<PostListStaticProps | string | null> => {
  let page = 1;
  if (pagePathParam) {
    page = parseInt(pagePathParam, 10);
    // we also redirect to canonical if page = 1
    if (page < 2 || posts.pages === 1) return listRootPath;
    if (page > posts.pages) return `${listRootPath}/${posts.pages}`;
  }

  const series = (series: import('@/lib/blog/series').SeriesMeta | null): SeriesMeta | null => {
    if (!series) return null;
    return { name: series.name, path: series.webPath };
  };

  return {
    page,
    totalPages: posts.pages,
    posts: await Promise.all(
      posts.page(page - 1).map(async (p) => ({
        id: p.webPath,
        title: p.title,
        date: p.date.toFormat('yyyy-MM-dd'),
        path: p.webPath,
        excerptLong: await p.excerptLong,
        excerptShort: await p.excerptShort,
        tags: p.tags.map((t) => ({ name: t.name, path: t.webPath })),
        series: series(p.series),
        draft: p.draft,
      })),
    ),
  };
};

//type Props = StaticProps & { title: (page: number) => readonly string[] };
interface PostListProps extends PostListStaticProps {
  title: (page: number) => readonly string[];
  description: string;
  canonicalPath: string;
}

export const PostList = ({ posts, page, title: titleProp, description, canonicalPath }: PostListProps) => {
  const postNodes = useMemo(
    () =>
      posts.map((post) => (
        <article
          key={post.id}
          className={styles.post}
          itemProp="blogPosts"
          itemScope
          itemType="http://schema.org/BlogPosting"
          itemID={`https://alxandr.me/${post.path}`}
        >
          <h2 className={styles.postTitle} itemProp="headline">
            <Link href="/[year]/[month]/[day]/[slug]" as={`/${post.path}`} scroll={false}>
              <a href={`/${post.path}`} className={styles.postTitleLink}>
                {post.title}
                {!post.draft ? null : ' (draft)'}
              </a>
            </Link>
          </h2>
          <p className={classNames(styles.excerpt, styles.long)} itemProp="description">
            {post.excerptLong}
          </p>
          <p className={classNames(styles.excerpt, styles.short)}>{post.excerptShort}</p>
          <div className={styles.postMeta}>
            <time dateTime={post.date} className={styles.postDate} itemProp="datePublished">
              {DateTime.fromISO(post.date, { locale: 'en-US' }).toLocaleString(DateTime.DATE_MED)}
            </time>
            {' · '}
            <Tags tags={post.tags} className={styles.postTags} itemProp="keywords" />
          </div>
        </article>
      )),
    [posts],
  );
  const title = useMemo(() => titleProp(page), [page, titleProp]);

  return (
    <PageLayout title={title} description={description} canonicalPath={canonicalPath}>
      {postNodes}
    </PageLayout>
  );
};

PostList.getStaticProps = getStaticProps;

export namespace PostList {
  export type StaticProps = PostListStaticProps;
  export type Props = PostListProps;
}

// export const PostList = () => <h1>Hello</h1>;
// PostList.getStaticProps = () => Promise.resolve({});
