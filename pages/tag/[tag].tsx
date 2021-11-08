import { GetStaticPaths, GetStaticProps } from 'next';
import { PostList, PostListStaticProps, getStaticPostListProps } from '@/components/page';

import { getBlog } from '@/lib/blog';
import { useCallback } from 'react';

type Query = {
  tag: string;
};

export const getStaticPaths: GetStaticPaths<Query> = async () => {
  const posts = await getBlog({
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
  });
  const paths = [...posts.tags].map((tag) => `/${tag.webPath}`);
  return { paths, fallback: false };
};

interface Props extends PostListStaticProps {
  readonly tagName: string;
  readonly path: string;
}

export const getStaticProps: GetStaticProps<Props, Query> = async (ctx) => {
  const { tag: tagSlug } = ctx.params!;
  const blog = await getBlog({
    includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
  });
  const tag = blog.tags.bySlug(tagSlug);
  if (!tag) throw new Error(`not found`);
  const props = await getStaticPostListProps(tag, blog, `/${tag.webPath}`, null);
  if (!props) throw new Error(`not found for some reason`);
  if (typeof props === 'string') throw new Error(`redirect to: ${props}`);

  return {
    props: {
      ...props,
      tagName: tag.name,
      path: tag.webPath,
    },
  };
};

const Home = ({ tagName, path, ...props }: Props) => {
  const titleFn = useCallback(
    (page: number) => (page === 1 ? [`Tag: ${tagName}`] : [`Tag: ${tagName}`, `Page ${page}`]),
    [tagName],
  );

  return (
    <PostList
      {...props}
      title={titleFn}
      description={`Tag: ${tagName} | Expected Exceptions - a blog about code, Software, and things that interest me`}
      canonicalPath={path}
    />
  );
};

export default Home;
