import DateTime from '../../components/date';
import Helmet from 'react-helmet';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';
import RootLayout from '../../components/layout/root';
import Tags from '../../components/tags';
import graphql from 'graphql';
import styles from './list.module.styl';

const navType = PropTypes.shape({
  path: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
});

const NavLink = ({ link }) => {
  if (!link) return null;

  return <Link to={link.path}>{link.name}</Link>;
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
  const posts = postNodes.map((post, index, array) => {
    let divider = null;
    if (index < array.length - 1) {
      divider = <hr />;
    }

    return (
      <article
        className={styles.post}
        key={post.id}
        itemProp="blogPosts"
        itemScope
        itemType="http://schema.org/BlogPosting"
        itemID={`${site.siteMetadata.siteUrl}${post.path}`}
      >
        <h2 className={styles.postTitle} itemProp="headline">
          <Link
            to={`${post.path}#content`}
            className={styles.postTitleLink}
            itemProp="url"
          >
            {post.title}
          </Link>
        </h2>
        <p className={styles.excerpt} itemProp="description">
          {post.excerpt}
        </p>
        <div className={styles.postMeta}>
          <DateTime
            date={post.date}
            className={styles.postDate}
            itemProp="datePublished"
          />
          <Tags
            tags={post.tags}
            className={styles.postTags}
            itemProp="keywords"
          />
          {' - '}
          <Link to={`${post.path}#comments`} className={styles.commentLink}>
            <span itemProp="commentCount">{post.commentCount}</span>{' '}
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
      <nav className={styles.paginate}>
        <NavLink link={pathContext.prev} />
        <NavLink link={pathContext.next} />
      </nav>
    );
  }

  return (
    <RootLayout meta={site.siteMetadata}>
      <main className={className}>
        <Helmet title={title || null} />
        {children}
        {posts}
        {nav}
      </main>
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
