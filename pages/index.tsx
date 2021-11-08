import { GetStaticProps } from 'next';
import { PostList } from '@/components/page/post-list/post-list';
import { getBlog } from '@/lib/blog';

export const getStaticProps: GetStaticProps<PostList.StaticProps> = async () => {
  try {
    debugger;
    const blog = await getBlog({
      includeDrafts: process.env.INCLUDE_DRAFTS === 'true',
    });
    const props = await PostList.getStaticProps(blog, blog, '/', null);
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

const Home = (props: PostList.StaticProps) => {
  return (
    <PostList
      {...props}
      page={1}
      totalPages={1}
      posts={[]}
      title={titleFn}
      description="Expected Exceptions - a blog about code, Software, and things that interest me"
      canonicalPath=""
    />
  );
};

export default Home;
