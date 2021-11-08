import { Post as BlogPost, getStaticPostProps } from '@/components/page';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getBlog, getPost } from '@/lib/blog';

import type { PostStaticProps } from '@/components/page';

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

export const getStaticProps: GetStaticProps<PostStaticProps, Query> = async (ctx) => {
  const { year, month, day, slug } = ctx.params!;
  const { post, blog } = await getPost(year, month, day, slug, {
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
  });
  return { props: await getStaticPostProps(post, blog) };
};

const Post = (props: PostStaticProps) => <BlogPost {...props} />;
export default Post;
