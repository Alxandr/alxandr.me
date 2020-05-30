import { GetStaticPaths, GetStaticProps } from 'next';
import { getBlog, getPost } from '@lib/blog';

import { BlogPost } from '@components/page/post/post';
import { PageLayout } from '@layout/page';

type Query = {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly slug: string;
};

export const getStaticPaths: GetStaticPaths<Query> = async () => {
  const posts = await getBlog({
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
  });
  const paths = [...posts].map((p) => `/${p.webPath}`);
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<BlogPost.Props, Query> = async (ctx) => {
  const { year, month, day, slug } = ctx.params!;
  const { post, blog } = await getPost(year, month, day, slug, {
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
  });
  return { props: await BlogPost.getStaticProps(post, blog) };
};

export default (props: BlogPost.Props) => <BlogPost {...props} />;
