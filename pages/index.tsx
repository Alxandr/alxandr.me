import { GetStaticPaths, GetStaticProps } from 'next';

import { PostList } from '@components/page';
import { getBlog } from '@lib/blog';

export const getStaticProps: GetStaticProps<PostList.Props> = async () => {
  const blog = await getBlog({
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
  });
  const props = await PostList.getStaticProps(blog, blog, '/', null);
  if (!props) throw new Error(`not found for some reason`);
  if (typeof props === 'string') throw new Error(`redirect to: ${props}`);

  return {
    props,
  };
};

const titleFn = (page: number) => (page === 1 ? [] : [`Page ${page}`]);

const Home = (props: PostList.Props) => {
  return <PostList {...props} title={titleFn} />;
};

export default Home;
