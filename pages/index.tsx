import { GetStaticPaths, GetStaticProps } from 'next';

import { PostList } from '@components/page';
import { getPosts } from '@server/blog';

export const getStaticProps: GetStaticProps<PostList.Props> = async () => {
  const posts = await getPosts();
  const props = await PostList.getStaticProps(posts, '/', null);
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
