import { Blog, Post } from '@lib/blog';
import { PostMeta, SeriesInfo } from './series';

import { DateTime } from 'luxon';
import { NextSeo } from 'next-seo';
import { PageLayout } from '@layout/page';
import { SeriesMeta } from '@lib/blog/series';
import { Tags } from '@components/tags';
import _ from 'lodash';
import styles from './post.module.css';

type TagMeta = {
  readonly name: string;
  readonly path: string;
};

type PostData = {
  readonly title: string;
  readonly date: string;
  readonly path: string;
  readonly excerpt: string;
  readonly tags: readonly TagMeta[];
  readonly content: string;
  readonly series: null | readonly PostMeta[];
  readonly draft: boolean;
};

type StaticProps = {
  post: PostData;
};

const getStaticProps = async (post: Post, blog: Blog): Promise<StaticProps> => {
  const series = (series: SeriesMeta | null) => {
    if (!series) return null;
    const posts = blog.series.bySlug(series.slug)!;
    const reversed = _.reverse([...posts]);

    // We ignore series with only 1 entry
    if (reversed.length < 2) return null;

    return reversed.map((p) => ({
      title: p.title,
      path: p.webPath,
    }));
  };

  return {
    post: {
      title: post.title,
      date: post.date.toFormat('yyyy-MM-dd'),
      path: post.webPath,
      tags: post.tags.map((t) => ({ name: t.name, path: t.webPath })),
      excerpt: await post.excerptLong,
      content: await post.content,
      series: series(post.series),
      draft: post.draft,
    },
  };
};

export const BlogPost = ({ post }: StaticProps) => (
  <PageLayout title={[post.title]} description={post.excerpt} canonicalPath={post.path}>
    <NextSeo
      openGraph={{
        type: 'article',
        article: {
          authors: ['Aleksander Heintz'],
          section: 'Technology',
          tags: post.tags.map((t) => t.name),
          publishedTime: post.date,
        },
      }}
    />
    <article
      className={styles.post}
      itemProp="blogPost"
      itemScope
      itemType="http://schema.org/BlogPosting"
      itemID={`https://alxandr.me/${post.path}`}
    >
      <h2 className={styles.title} itemProp="headline">
        {post.title}
        {!post.draft ? null : ' (draft)'}
      </h2>
      <div className={styles.meta}>
        <time dateTime={post.date} className={styles.date} itemProp="datePublished">
          {DateTime.fromISO(post.date, { locale: 'en-US' }).toLocaleString(DateTime.DATE_MED)}
        </time>
        <Tags tags={post.tags} className={styles.tags} itemProp="keywords" />
      </div>
      <SeriesInfo posts={post.series} current={post.path} />
      <section className={styles.content} dangerouslySetInnerHTML={{ __html: post.content }} itemProp="articleBody" />
    </article>
  </PageLayout>
);

BlogPost.getStaticProps = getStaticProps;

export namespace BlogPost {
  export type Props = StaticProps;
}
