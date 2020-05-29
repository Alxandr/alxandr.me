import { GetStaticPaths, GetStaticProps } from 'next';
import { getPost, getPosts } from '@server/blog';

import { BlogPost } from '@components/page/post/post';
import { PageLayout } from '@layout/page';

type Query = {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly slug: string;
};

export const getStaticPaths: GetStaticPaths<Query> = async () => {
  const posts = await getPosts();
  const paths = [...posts].map((p) => `/${p.webPath}`);
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<BlogPost.Props, Query> = async (ctx) => {
  const { year, month, day, slug } = ctx.params!;
  const post = await getPost(year, month, day, slug);
  return { props: await BlogPost.getStaticProps(post) };
};

export default (props: BlogPost.Props) => <BlogPost {...props} />;
