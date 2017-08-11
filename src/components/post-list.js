import DateTime from './date';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';
import Styled from '../utils/styled';
import Tags from './tags';

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

const Entry = ({ post, classes, site }) =>
  <article
    className={classes.post}
    key={post.id}
    itemProp="blogPosts"
    itemScope
    itemType="http://schema.org/BlogPosting"
    itemID={`${site.siteMetadata.siteUrl}${post.path}`}
  >
    <h2 className={classes.postTitle} itemProp="headline">
      <Link to={post.path} className={classes.postTitleLink} itemProp="url">
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
      <Tags tags={post.tags} className={classes.postTags} itemProp="keywords" />
      {' - '}
      <Link to={`${post.path}#comments`} className={classes.commentLink}>
        <span itemProp="commentCount">{post.commentCount}</span>{' '}
        {post.commentCount === 1 ? 'comment' : 'comments'}
      </Link>
    </div>
  </article>;

Entry.propTypes = {
  post: PropTypes.shape({
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

  classes: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,

  site: PropTypes.shape({
    siteMetadata: PropTypes.shape({
      siteUrl: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

const PostList = ({ posts, site }) =>
  <Styled styles={styleSheet}>
    {classes => {
      const postNodes = [];
      let first = true;
      for (const post of posts) {
        if (!first) {
          postNodes.push(<hr key={`devider-before-${post.id}`} />);
        }
        first = false;
        postNodes.push(
          <Entry post={post} site={site} classes={classes} key={post.id} />,
        );
      }

      return (
        <section className={classes.root}>
          {postNodes}
        </section>
      );
    }}
  </Styled>;

PostList.propTypes = {
  posts: PropTypes.arrayOf(Entry.propTypes.post).isRequired,
  site: Entry.propTypes.site,
};

export default PostList;
