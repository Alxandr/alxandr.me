import { PostList, getStaticPostListProps } from '@/components/page';

import { GetStaticProps } from 'next';
import type { PostListStaticProps } from '@/components/page';
import { getBlog } from '@/lib/blog';

export const getStaticProps: GetStaticProps<PostListStaticProps> = async () => {
  try {
    const blog = await getBlog({
      includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
    });
    const props = await getStaticPostListProps(blog, blog, '/', null);
    if (!props) throw new Error(`not found for some reason`);
    if (typeof props === 'string') throw new Error(`redirect to: ${props}`);

    return {
      props,
    };
  } catch (e) {
    console.error((e && (e as any).stack) || e);
    throw e;
  }
};

const titleFn = (page: number) => (page === 1 ? [] : [`Page ${page}`]);

const Home = (props: PostListStaticProps) => {
  return (
    <PostList
      {...props}
      title={titleFn}
      description="Expected Exceptions - a blog about code, Software, and things that interest me"
      canonicalPath=""
    />
  );
};

export default Home;
