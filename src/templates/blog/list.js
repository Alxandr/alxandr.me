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
  postTitle: {
    marginTop: 0,
    marginBottom: '.2em',
    fontSize: '1.5rem',
    lineHeight: '1.3em',
  },

  postTitleLink: {
    color: '#333',
    textDecoration: 'none',
    fontWeight: 100,
    cursor: 'pointer',
  },

  excerpt: {
    margin: 0,
    fontSize: '.9rem',
    color: '#999',
  },

  postMeta: {
    margin: '.7em 0 0',
    fontSize: '.9rem',
    color: '#c7c7c7',
  },

  postDate: {
    margin: '-10px 0 10px',
    marginRight: '.5em',
    color: '#c7c7c7',
    display: 'inline',
    fontSize: '.8rem',
  },

  postTags: {
    fontSize: '.8rem',
    display: 'inline',
  },

  commentLink: {
    color: '#c7c7c7',
  },
};

const navType = PropTypes.shape({
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
});

const NavLink = ({ link }) => {
  if (!link) return null;

  return (
    <Link to={link.path}>
      {link.name}
    </Link>
  );
};

NavLink.propTypes = {
  link: navType,
};

const BlogListTemplate = ({
  data,
  pathContext,
  children,
  className,
  title,
}) => {
  const { allBlogPost: { edges }, site } = data;
  const postNodes = edges.map(({ node: post }) => post);

  return (
    <RootLayout meta={site.siteMetadata}>
      <Styled styles={styleSheet}>
        {classes => {
          const posts = postNodes.map((post, index, array) => {
            let divider = null;
            if (index < array.length - 1) {
              divider = <hr />;
            }

            return (
              <article
                className={classes.post}
                key={post.id}
                itemProp="blogPosts"
                itemScope
                itemType="http://schema.org/BlogPosting"
                itemID={`${site.siteMetadata.siteUrl}${post.path}`}
              >
                <h2 className={classes.postTitle} itemProp="headline">
                  <Link
                    to={post.path}
                    className={classes.postTitleLink}
                    itemProp="url"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className={classes.excerpt} itemProp="description">
                  {post.excerpt}
                </p>
                <div className={classes.postMeta}>
                  <DateTime
                    date={post.date}
                    className={classes.postDate}
                    itemProp="datePublished"
                  />
                  <Tags
                    tags={post.tags}
                    className={classes.postTags}
                    itemProp="keywords"
                  />
                  {' - '}
                  <Link
                    to={`${post.path}#comments`}
                    className={classes.commentLink}
                  >
                    <span itemProp="commentCount">
                      {post.commentCount}
                    </span>{' '}
                    {post.commentCount === 1 ? 'comment' : 'comments'}
                  </Link>
                </div>
                {divider}
              </article>
            );
          });

          let nav = null;
          if (pathContext.prev || pathContext.next) {
            nav = (
              <nav className={classes.paginate}>
                <NavLink link={pathContext.prev} />
                <NavLink link={pathContext.next} />
              </nav>
            );
          }

          return (
            <main className={className}>
              <Helmet title={title || null} />
              {children}
              {posts}
              {nav}
            </main>
          );
        }}
      </Styled>
    </RootLayout>
  );
};

export const dataShape = {
  allBlogPost: PropTypes.shape({
    edges: PropTypes.arrayOf(
      PropTypes.shape({
        node: PropTypes.shape({
          id: PropTypes.string.isRequired,
          date: PropTypes.string.isRequired,
          path: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired,
          excerpt: PropTypes.string.isRequired,
          commentCount: PropTypes.number.isRequired,
          tags: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string.isRequired,
              path: PropTypes.string.isRequired,
            }).isRequired,
          ).isRequired,
        }).isRequired,
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

  title: PropTypes.string,
};

export const pathContextShape = {
  prev: navType,
  next: navType,
};

BlogListTemplate.propTypes = {
  data: PropTypes.shape(dataShape).isRequired,
  pathContext: PropTypes.shape(pathContextShape).isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string,
};

export default BlogListTemplate;

export const pageQuery = graphql`
  query AllBlogPosts($limit: Int!, $skip: Int!) {
    allBlogPost(
      skip: $skip
      limit: $limit
      sort: { order: DESC, fields: [date] }
    ) {
      edges {
        node {
          id
          title
          excerpt(pruneLength: 250)
          date
          path
          commentCount
          tags {
            name
            path
          }
        }
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
