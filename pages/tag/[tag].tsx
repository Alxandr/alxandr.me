import { GetStaticPaths, GetStaticProps } from 'next';

import { PostList } from '@components/page';
import { getPosts } from '@server/blog';
import { useCallback } from 'react';

type Query = {
  tag: string;
};

export const getStaticPaths: GetStaticPaths<Query> = async () => {
  const posts = await getPosts();
  const paths = [...posts.tags].map((tag) => `/${tag.webPath}`);
  return { paths, fallback: false };
};

interface Props extends PostList.Props {
  readonly tagName: string;
}

export const getStaticProps: GetStaticProps<Props, Query> = async (ctx) => {
  const { tag: tagSlug } = ctx.params!;
  const posts = await getPosts();
  const tag = posts.tags.bySlug(tagSlug);
  if (!tag) throw new Error(`not found`);
  const props = await PostList.getStaticProps(tag, `/${tag.webPath}`, null);
  if (!props) throw new Error(`not found for some reason`);
  if (typeof props === 'string') throw new Error(`redirect to: ${props}`);

  return {
    props: {
      ...props,
      tagName: tag.name,
    },
  };
};

const Home = ({ tagName, ...props }: Props) => {
  const titleFn = useCallback((page: number) => (page === 1 ? [tagName] : [tagName, `Page ${page}`]), [tagName]);
  return <PostList {...props} title={titleFn} />;
};

export default Home;
