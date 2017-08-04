import Comments from '../../components/comments';
import DateTime from '../../components/date';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';
import RootLayout from '../../components/layout/root';
import Styled from '../../utils/styled';
import Tags from '../../components/tags';
import graphql from 'graphql';

const styleSheet = {
  root: {},
  content: {},
  title: {},
  date: {
    display: 'block',
    margin: '-10px 0 10px',
    color: '#9a9a9a',
  },
  tags: {
    display: 'block',
  },
};

const SeriesInfo = ({ series, className }) => {
  if (!series) return null;
  if (series.posts.length === 0) return null;

  const posts = series.posts.map(post =>
    <li key={post.path}>
      <Link to={post.path}>
        {post.title}
      </Link>
    </li>,
  );

  return (
    <section className={className}>
      <h4>Posts in series</h4>
      <ul>
        {posts}
      </ul>
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
      <Styled styles={styleSheet}>
        {classes => {
          return (
            <article
              className={classes.root}
              itemProp="blogPost"
              itemScope
              itemType="http://schema.org/BlogPosting"
              itemID={`${site.siteMetadata.siteUrl}${post.path}`}
            >
              <Helmet title={post.title} />
              <h1 className={classes.title} itemProp="headline">
                {post.title}
              </h1>
              <div className={classes.meta}>
                <DateTime
                  date={post.date}
                  className={classes.date}
                  itemProp="datePublished"
                />
                <Tags
                  tags={post.tags}
                  className={classes.tags}
                  itemProp="keywords"
                />
              </div>
              <SeriesInfo series={post.series} />
              <section
                className={classes.content}
                dangerouslySetInnerHTML={{ __html: post.html }}
                itemProp="articleBody"
              />
              <Comments comments={post.comments} url={post.commentsUrl} />
            </article>
          );
        }}
      </Styled>
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
