import DateTime from './date';
import PropTypes from 'prop-types';
import React from 'react';
import Styled from '../utils/styled';

const styles = {
  root: {},

  comment: {
    display: 'grid',
    gridTemplateColumns: '50px auto',
    gridTemplateRows: 'auto auto auto',
    gridTemplateAreas: `
      "icon author"
      "icon time  "
      "body body  "
    `.trim(),
  },

  image: {
    width: 44,
    height: 44,
    margin: 0,
    gridArea: 'icon',
  },

  author: {
    gridArea: 'author',
    marginTop: 0,
    marginBottom: 0,
  },

  created: {
    gridArea: 'time',
    color: '#9a9a9a',
  },

  body: {
    gridArea: 'body',
  },

  commentTitle: {
    marginBottom: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  commentHr: {
    marginTop: 0,
  },

  leaveCommentLink: {
    fontSize: '1.1rem',
  },

  hidden: {
    display: 'none',
  },

  authorLink: {
    color: '#454441',
  },
};

const commentShape = {
  id: PropTypes.string.isRequired,
  author: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
  created: PropTypes.string.isRequired,
  updated: PropTypes.string,
  link: PropTypes.string.isRequired,
  html: PropTypes.string.isRequired,
};

const Comment = ({ id, classes, author, created, updated, link, html }) =>
  <div
    className={classes.comment}
    itemProp="comment"
    itemScope
    itemID={link}
    itemType="http://schema.org/Comment"
  >
    <img
      id={`${id}/img`}
      src={`${author.avatar}&s=88`}
      className={classes.image}
      itemProp="image"
    />
    <h5
      className={classes.author}
      itemProp="author"
      itemScope
      itemType="http://schema.org/Person"
      itemRef={`${id}/img`}
      itemID={author.url}
    >
      <a href={author.url} itemProp="url" className={classes.authorLink}>
        <span itemProp="name">
          {author.name}
        </span>
      </a>
    </h5>
    <span className={classes.created}>
      <a href={link}>
        <DateTime date={created} itemProp="dateCreated" />
        <DateTime
          date={updated}
          itemProp="dateModified"
          className={classes.hidden}
        />
      </a>
      {updated !== created && ' (updated)'}
    </span>
    <div
      className={classes.body}
      dangerouslySetInnerHTML={{ __html: html }}
      itemProp="text"
    />
  </div>;

Comment.propTypes = {
  ...commentShape,

  classes: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
};

const Comments = ({ comments, url }) =>
  <Styled styles={styles}>
    {classes => {
      const children = [
        <hr key="comments-top-hr" className={classes.commentHr} />,
      ];

      for (let i = 0; i < comments.length; i++) {
        const { author, id, created, updated, link, html } = comments[i];

        if (i > 0) {
          children.push(<hr key={`before-${id}`} />);
        }

        children.push(
          <Comment
            classes={classes}
            author={author}
            key={id}
            created={created}
            updated={updated}
            link={link}
            html={html}
            id={id}
          />,
        );
      }

      return (
        <section className={classes.root}>
          <h2 className={classes.commentTitle}>
            <span>Comments</span>
            <a href={url} className={classes.leaveCommentLink}>
              Leave a comment
            </a>
          </h2>
          <a name="comments" />

          {children}
        </section>
      );
    }}
  </Styled>;

Comments.propTypes = {
  comments: PropTypes.arrayOf(
    PropTypes.shape({
      ...commentShape,
    }).isRequired,
  ).isRequired,

  url: PropTypes.string.isRequired,
};

export default Comments;
