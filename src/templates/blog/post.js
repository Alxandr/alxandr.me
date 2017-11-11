import Comments from '../../components/comments';
import DateTime from '../../components/date';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';
import RootLayout from '../../components/layout/root';
import Tags from '../../components/tags';
import graphql from 'graphql';
import styles from './post.module.styl';

const SeriesInfo = ({ series, className }) => {
  if (!series) return null;
  if (series.posts.length === 0) return null;

  const posts = series.posts.map(post => (
    <li key={post.path}>
      <Link to={`${post.path}#content`}>{post.title}</Link>
    </li>
  ));

  return (
    <section className={className}>
      <h4>Posts in series</h4>
      <ul>{posts}</ul>
    </section>
  );
};

SeriesInfo.propTypes = {
  series: PropTypes.shape({
    name: PropTypes.string.isRequired,
    posts: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
      }).isRequired,
    ).isRequired,
  }),

  className: PropTypes.string,
};

const BlogPostTemplate = ({ data }) => {
  const { blogPost: post, site } = data;

  return (
    <RootLayout meta={site.siteMetadata}>
      <a name="content" className={styles.anchor} />
      <article
        className={styles.root}
        itemProp="blogPost"
        itemScope
        itemType="http://schema.org/BlogPosting"
        itemID={`${site.siteMetadata.siteUrl}${post.path}`}
      >
        <Helmet title={post.title} />
        <h1 className={styles.title} itemProp="headline">
          {post.title}
        </h1>
        <div className={styles.meta}>
          <DateTime
            date={post.date}
            className={styles.date}
            itemProp="datePublished"
          />
          <Tags tags={post.tags} className={styles.tags} itemProp="keywords" />
        </div>
        <SeriesInfo series={post.series} />
        <section
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.html }}
          itemProp="articleBody"
        />
        <Comments comments={post.comments} url={post.commentsUrl} />
      </article>
    </RootLayout>
  );
};

BlogPostTemplate.propTypes = {
  data: PropTypes.shape({
    blogPost: PropTypes.shape({
      date: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      html: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          path: PropTypes.string.isRequired,
        }).isRequired,
      ).isRequired,
      series: PropTypes.shape({
        name: PropTypes.string.isRequired,
        posts: PropTypes.arrayOf(
          PropTypes.shape({
            title: PropTypes.string.isRequired,
            path: PropTypes.string.isRequired,
          }).isRequired,
        ).isRequired,
      }),

      commentsUrl: PropTypes.string.isRequired,

      comments: PropTypes.arrayOf(
        PropTypes.shape({
          author: PropTypes.shape({
            name: PropTypes.string.isRequired,
            avatar: PropTypes.string,
          }).isRequired,
          id: PropTypes.string.isRequired,
          created: PropTypes.string.isRequired,
          updated: PropTypes.string.isRequired,
          link: PropTypes.string.isRequired,
          html: PropTypes.string.isRequired,
        }).isRequired,
      ).isRequired,
    }).isRequired,

    site: PropTypes.shape({
      siteMetadata: PropTypes.shape({
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string.isRequired,
        siteUrl: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    blogPost(path: { eq: $path }) {
      html
      title
      date
      path
      tags {
        name
        path
      }
      series {
        name
        posts {
          title
          path
        }
      }
      commentsUrl
      comments {
        author {
          name
          avatar
        }
        id
        created
        updated
        link
        html
      }
    }
    site {
      siteMetadata {
        title
        subtitle
        siteUrl
      }
    }
  }
`;
