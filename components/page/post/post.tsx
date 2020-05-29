import { PageLayout } from '@layout/page';
import { Post } from '@server/blog';
import { ReactNode } from 'react';
import styles from './post.module.css';

type TagMeta = {
  readonly name: string;
  readonly path: string;
};

type PostData = {
  readonly title: string;
  readonly date: string;
  readonly path: string;
  readonly tags: TagMeta[];
  readonly content: string;
};

type StaticProps = {
  post: PostData;
};

const getStaticProps = async (post: Post): Promise<StaticProps> => {
  return {
    post: {
      title: post.title,
      date: post.date.toFormat('yyyy-MM-dd'),
      path: post.webPath,
      tags: post.tags.map((t) => ({ name: t.name, path: t.webPath })),
      content: await post.content,
    },
  };
};

export const BlogPost = ({ post }: StaticProps) => (
  <PageLayout title={[post.title]}>
    <h2>{post.title}</h2>
    <div dangerouslySetInnerHTML={{ __html: post.content }}></div>
  </PageLayout>
);

BlogPost.getStaticProps = getStaticProps;

export namespace BlogPost {
  export type Props = StaticProps;
}
